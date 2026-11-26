import { supabase } from '../config/supabase.js'
import { blockUser } from '../services/blocks.js'

// Report and block from anywhere: Discover, Likes, a profile, a chat.
// Blocking works both ways and ends any match (see services/blocks.js).

const targetExists = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return !!data
}

// POST /api/safety/block { userId }
export const block = async (req, res) => {
  try {
    const me = req.user.id
    const { userId } = req.body
    if (userId === me) return res.status(400).json({ error: "You can't block yourself" })
    if (!await targetExists(userId)) return res.status(404).json({ error: 'User not found' })

    await blockUser(me, userId, req.app.get('io'))
    res.json({ message: 'User blocked' })
  } catch (error) {
    console.error('Block error:', error)
    res.status(500).json({ error: 'Failed to block user' })
  }
}

// DELETE /api/safety/block/:userId
// Unblocking only lifts your own block. An ended match stays ended.
export const unblock = async (req, res) => {
  try {
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', req.user.id)
      .eq('blocked_id', req.params.userId)
    if (error) throw error
    res.json({ message: 'User unblocked' })
  } catch (error) {
    console.error('Unblock error:', error)
    res.status(500).json({ error: 'Failed to unblock user' })
  }
}

// GET /api/safety/blocks: the people you blocked (username only, no photos,
// since a block means you don't see them any more)
export const listBlocks = async (req, res) => {
  try {
    const { data: blocks, error } = await supabase
      .from('blocked_users')
      .select('blocked_id, created_at')
      .eq('blocker_id', req.user.id)
      .order('created_at', { ascending: false })
    if (error) throw error

    const ids = (blocks || []).map(b => b.blocked_id)
    let names = new Map()
    if (ids.length > 0) {
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', ids)
      if (pErr) throw pErr
      names = new Map((profiles || []).map(p => [p.user_id, p.username]))
    }

    res.json({
      blocked: (blocks || []).map(b => ({
        id: b.blocked_id,
        username: names.get(b.blocked_id) ?? null,
        blocked_at: b.created_at,
      })),
    })
  } catch (error) {
    console.error('List blocks error:', error)
    res.status(500).json({ error: 'Failed to load blocked people' })
  }
}

// POST /api/safety/report { userId, reason, details?, matchId?, alsoBlock? }
export const report = async (req, res) => {
  try {
    const me = req.user.id
    const { userId, reason, details, matchId, alsoBlock } = req.body
    if (userId === me) return res.status(400).json({ error: "You can't report yourself" })
    if (!await targetExists(userId)) return res.status(404).json({ error: 'User not found' })

    // Only attach a chat that's really between the two of you
    let reportMatchId = null
    if (matchId) {
      const { data: match, error: mErr } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id')
        .eq('id', matchId)
        .maybeSingle()
      if (mErr) throw mErr
      const pair = match && [match.user1_id, match.user2_id]
      if (pair && pair.includes(me) && pair.includes(userId)) reportMatchId = match.id
    }

    const { error } = await supabase.from('reports').insert({
      reporter_id: me,
      reported_id: userId,
      reason,
      details: details || null,
      match_id: reportMatchId,
    })
    if (error) throw error

    if (alsoBlock) await blockUser(me, userId, req.app.get('io'))

    res.status(201).json({ message: 'Report sent', blocked: !!alsoBlock })
  } catch (error) {
    console.error('Report error:', error)
    res.status(500).json({ error: 'Failed to send report' })
  }
}
