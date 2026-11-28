import { supabase } from '../config/supabase.js'
import { notifyUser } from '../services/push.js'
import { isBlockedBetween } from '../services/blocks.js'
import { toPublicProfile } from '../serializers/profile.js'
import { useSuperLike, refundSuperLike, getBalance } from '../services/superLikes.js'
import { containsPhoneNumber } from '../utils/phone.js'

// One match per pair of people. The database has a unique rule on the pair
// (matches_one_per_pair), so if both people swipe at the same moment, the
// second insert fails with 23505 and we just use the match the first one made.
const findMatch = async (a, b) => {
  const { data } = await supabase
    .from('matches')
    .select('id, status')
    .or(`and(user1_id.eq.${a},user2_id.eq.${b}),and(user1_id.eq.${b},user2_id.eq.${a})`)
    .order('matched_at', { ascending: true })
    .limit(1)
  return data?.[0] || null
}

const findOrCreateMatch = async (swiperId, targetId) => {
  const existing = await findMatch(swiperId, targetId)
  if (existing) return existing

  const { data: match, error } = await supabase
    .from('matches')
    .insert({
      user1_id: swiperId,
      user2_id: targetId,
      status: 'matched',
      matched_at: new Date().toISOString(),
    })
    .select('id, status')
    .single()

  if (!error && match) return { ...match, created: true }
  if (error?.code === '23505') return findMatch(swiperId, targetId)

  console.error('Match creation error:', error)
  return null
}

// A new match starts with any Super Like notes the two sent each other,
// as if each had sent it in the chat
// Never throws: a missing note must not stop the match.
const postSuperLikeNotes = async (matchId, a, b, io) => {
  try {
    await postNotes(matchId, a, b, io)
  } catch (err) {
    console.error('Super Like note error:', err?.message || err)
  }
}

const postNotes = async (matchId, a, b, io) => {
  const { data: notes } = await supabase
    .from('swipes')
    .select('swiper_id, message, created_at')
    .or(`and(swiper_id.eq.${a},target_id.eq.${b}),and(swiper_id.eq.${b},target_id.eq.${a})`)
    .eq('direction', 'super')
    .not('message', 'is', null)
    .order('created_at', { ascending: true })
  for (const note of Array.isArray(notes) ? notes : []) {
    const { data: message } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: note.swiper_id,
        content: note.message,
        is_filtered: containsPhoneNumber(note.message),
      })
      .select()
      .single()
    if (message) io?.to(matchId).emit('receive_message', message)
  }
}

const matchPayload = async (matchId, targetId) => {
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', targetId)
    .maybeSingle()

  return {
    id: matchId,
    matchedWith: toPublicProfile(targetProfile, { level: 'match' }) || { id: targetId, username: null, photos: [] },
  }
}

export const createSwipe = async (req, res) => {
  try {
    const swiperId = req.user.id
    const { targetId, direction } = req.body
    const message = direction === 'super' && req.body.message ? req.body.message : null

    // Validate direction
    if (!['left', 'right', 'super'].includes(direction)) {
      return res.status(400).json({ error: 'Invalid swipe direction' })
    }

    // Can't swipe yourself
    if (swiperId === targetId) {
      return res.status(400).json({ error: 'Cannot swipe yourself' })
    }

    // Check target user exists
    const { data: targetProfile } = await supabase
  .from('profiles')
  .select('user_id')
  .eq('user_id', targetId)
  .maybeSingle()

if (!targetProfile) {
  return res.status(404).json({ error: 'User not found' })
}

    // Blocked either way: act as if the user doesn't exist
    if (await isBlockedBetween(swiperId, targetId)) {
      return res.status(404).json({ error: 'User not found' })
    }

    // A Super Like costs one: the free daily one first, then bought ones
    let spent = null
    if (direction === 'super') {
      spent = await useSuperLike(swiperId)
      if (!spent) {
        return res.status(402).json({
          error: "You're out of Super Likes",
          code: 'NO_SUPER_LIKES',
          superLikes: await getBalance(swiperId),
        })
      }
    }

    // Record the swipe
    const { data: swipe, error: swipeError } = await supabase
      .from('swipes')
      .insert({
        swiper_id: swiperId,
        target_id: targetId,
        direction,
        ...(message ? { message } : {}),
      })
      .select()
      .single()

    if (swipeError) {
      if (spent) await refundSuperLike(swiperId, spent)
      // unique constraint means already swiped
      if (swipeError.code === '23505') {
        return res.status(400).json({ error: 'Already swiped this user' })
      }
      return res.status(500).json({ error: 'Failed to record swipe' })
    }

    // If swiped right or super, check if they also swiped right on us
    if (direction === 'right' || direction === 'super') {
      const { data: theirSwipe } = await supabase
        .from('swipes')
        .select('id, direction')
        .eq('swiper_id', targetId)
        .eq('target_id', swiperId)
        .in('direction', ['right', 'super'])
        .maybeSingle()

      // It's a match
      if (theirSwipe) {
        const match = await findOrCreateMatch(swiperId, targetId)
        if (!match) {
          // The swipe is saved; just don't announce a match we couldn't save
          return res.status(201).json({ swipe, matched: false })
        }
        if (match.status === 'matched') {
          if (match.created) await postSuperLikeNotes(match.id, swiperId, targetId, req.app?.get?.('io'))
          // Tell the other person (they liked first, so they're not looking)
          notifyUser(targetId, 'match', { matchId: match.id })
          return res.status(201).json({
            swipe,
            matched: true,
            match: await matchPayload(match.id, targetId),
          })
        }
        // An ended match (unmatched/blocked) stays ended
      }
    }

    // Let them know someone is very interested (no names, see push.js)
    if (direction === 'super') notifyUser(targetId, 'superlike')

    // No match, just return the swipe
    res.status(201).json({
      swipe,
      matched: false
    })

  } catch (error) {
    console.error('Swipe error:', error)
    res.status(500).json({ error: 'Swipe failed' })
  }
}

// GET SWIPE HISTORY
export const getMySwipes = async (req, res) => {
  try {
    const { data: swipes, error } = await supabase
      .from('swipes')
      .select('id, target_id, direction, created_at')
      .eq('swiper_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Failed to get swipes' })
    }

    res.json({ swipes })

  } catch (error) {
    res.status(500).json({ error: 'Failed to get swipes' })
  }
}


// UNDO A SWIPE
// Removes my swipe on targetId so they can show up in Discover again.
// Not allowed once that swipe turned into a match.
export const undoSwipe = async (req, res) => {
  try {
    const swiperId = req.user.id
    const { targetId } = req.params

    const { data: match } = await supabase
      .from('matches')
      .select('id')
      .or(
        `and(user1_id.eq.${swiperId},user2_id.eq.${targetId}),` +
        `and(user1_id.eq.${targetId},user2_id.eq.${swiperId})`
      )
      .limit(1)

    if (match?.length) {
      return res.status(409).json({ error: "You've already matched, so this can't be undone" })
    }

    const { data: deleted, error } = await supabase
      .from('swipes')
      .delete()
      .eq('swiper_id', swiperId)
      .eq('target_id', targetId)
      .select('id')

    if (error) {
      return res.status(500).json({ error: 'Failed to undo swipe' })
    }
    if (!deleted?.length) {
      return res.status(404).json({ error: 'Nothing to undo' })
    }

    res.json({ undone: true })
  } catch (error) {
    console.error('Undo swipe error:', error)
    res.status(500).json({ error: 'Failed to undo swipe' })
  }
}
