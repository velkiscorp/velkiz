import { toPublicProfile } from '../serializers/profile.js'
import { supabase } from '../config/supabase.js'
import { getBlockedUserIds } from '../services/blocks.js'

// GET ALL MY MATCHES
export const getMyMatches = async (req, res) => {
  try {
    const userId = req.user.id

    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id,
        status,
        matched_at,
        user1_id,
        user2_id
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'matched')
      .order('matched_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Failed to get matches' })
    }

    // Hide matches with anyone blocked either way (blocking also unmatches,
    // this is a safety net for older rows)
    const blocked = await getBlockedUserIds(userId)
    const visibleMatches = matches.filter(m =>
      !blocked.has(m.user1_id === userId ? m.user2_id : m.user1_id)
    )

    const otherId = (m) => (m.user1_id === userId ? m.user2_id : m.user1_id)

    // Everyone's profile in one query instead of one per match
    const otherIds = visibleMatches.map(otherId)
    const { data: profileRows } = otherIds.length
      ? await supabase.from('profiles').select('*').in('user_id', otherIds)
      : { data: [] }
    const profilesById = new Map((profileRows || []).map(p => [p.user_id, p]))

    const enrichedMatches = await Promise.all(
      visibleMatches.map(async (match) => {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at, sender_id, read_at')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        return {
          id: match.id,
          matchedAt: match.matched_at,
          matchedWith: toPublicProfile(profilesById.get(otherId(match)), { level: 'match' })
            || { id: otherId(match), username: null, photos: [] },
          lastMessage: lastMessage || null,
          hasUnread: !!lastMessage && lastMessage.sender_id !== userId && !lastMessage.read_at
        }
      })
    )

    // Most recent activity first: a new message moves the chat to the top,
    // and matches with no messages yet sort by when they matched
    const activityTime = (m) => new Date(m.lastMessage?.created_at || m.matchedAt).getTime()
    enrichedMatches.sort((a, b) => activityTime(b) - activityTime(a))

    res.json({ matches: enrichedMatches })

  } catch (error) {
    console.error('Get matches error:', error)
    res.status(500).json({ error: 'Failed to get matches' })
  }
}

// UNMATCH
export const unmatch = async (req, res) => {
  try {
    const { matchId } = req.params
    const userId = req.user.id

    // Verify user is part of this match
    const { data: match } = await supabase
      .from('matches')
      .select('id, user1_id, user2_id')
      .eq('id', matchId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single()

    if (!match) {
      return res.status(404).json({ error: 'Match not found' })
    }

    const { error } = await supabase
      .from('matches')
      .update({ status: 'unmatched' })
      .eq('id', matchId)

    if (error) {
      return res.status(500).json({ error: 'Failed to unmatch' })
    }

    // Tell anyone still in this chat that it's over, and close the room
    const io = req.app.get('io')
    io?.to(matchId).emit('match_ended', { matchId })
    io?.in(matchId).socketsLeave(matchId)

    res.json({ message: 'Unmatched successfully' })

  } catch (error) {
    res.status(500).json({ error: 'Failed to unmatch' })
  }
}

export const getLikesReceived = async (req, res) => {
  try {
    const userId = req.user.id

    // Get all right/super swipes targeting me
    const { data: inbound, error } = await supabase
      .from('swipes')
      .select('swiper_id, direction, created_at')
      .eq('target_id', userId)
      .in('direction', ['right', 'super'])

    if (error) {
      return res.status(500).json({ error: 'Failed to get likes' })
    }

    // Get swipes I've already made so we can exclude them
    const { data: mySwipes } = await supabase
      .from('swipes')
      .select('target_id')
      .eq('swiper_id', userId)

    const alreadySwiped = new Set(mySwipes?.map(s => s.target_id) || [])
    const blocked = await getBlockedUserIds(userId)

    // Filter to only unresponded likes, never from blocked users
    const unrespondedLikers = inbound
      .filter(s => !alreadySwiped.has(s.swiper_id) && !blocked.has(s.swiper_id))
      .map(s => s.swiper_id)

    if (unrespondedLikers.length === 0) {
      return res.json({ likes: [] })
    }

    // Get their profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', unrespondedLikers)

    const likes = (profiles || []).map(p => toPublicProfile(p))

    res.json({ likes })

  } catch (error) {
    console.error('Get likes error:', error)
    res.status(500).json({ error: 'Failed to get likes' })
  }
}

// BLOCK
export const blockUser = async (req, res) => {
  try {
    const { matchId } = req.params
    const userId = req.user.id

    const { data: match } = await supabase
      .from('matches')
      .select('id, user1_id, user2_id')
      .eq('id', matchId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single()

    if (!match) {
      return res.status(404).json({ error: 'Match not found' })
    }

    const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id

    const { error: unmatchError } = await supabase
      .from('matches')
      .update({ status: 'unmatched' })
      .eq('id', matchId)

    if (unmatchError) {
      return res.status(500).json({ error: 'Failed to block user' })
    }

    const { error: blockError } = await supabase
      .from('blocked_users')
      .upsert(
        { blocker_id: userId, blocked_id: otherUserId },
        { onConflict: 'blocker_id,blocked_id' }
      )
    
    if (blockError) {
      return res.status(500).json({ error: 'Failed to block user' })
    }

    const io = req.app.get('io')
    io?.to(matchId).emit('match_ended', { matchId })
    io?.in(matchId).socketsLeave(matchId)

    res.json({ message: 'User blocked' })
  } catch (error) {
    console.error('Block user error:', error)
    res.status(500).json({ error: 'Failed to block user' })
  }
}
