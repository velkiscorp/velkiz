import { supabase } from '../config/supabase.js'
import { endCallsForMatches } from './calls.js'

// One place for "are these people blocked from each other?".
// A block works both ways: if either person blocked the other, they never see,
// swipe on, match with, or open each other's profile.

// All user ids this user has blocked or been blocked by
export const getBlockedUserIds = async (userId) => {
  const { data, error } = await supabase
    .from('blocked_users')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)

  if (error) throw error

  return new Set((data || []).map(b =>
    b.blocker_id === userId ? b.blocked_id : b.blocker_id
  ))
}

// True if either user has blocked the other
export const isBlockedBetween = async (userA, userB) => {
  const { data, error } = await supabase
    .from('blocked_users')
    .select('id')
    .or(
      `and(blocker_id.eq.${userA},blocked_id.eq.${userB}),` +
      `and(blocker_id.eq.${userB},blocked_id.eq.${userA})`
    )
    .limit(1)

  if (error) throw error
  return (data?.length || 0) > 0
}

// Block someone: ends any match between the two (both see the chat close)
// and records the block. Safe to call twice.
export const blockUser = async (blockerId, blockedId, io) => {
  const { data: matches, error: findErr } = await supabase
    .from('matches')
    .select('id')
    .or(
      `and(user1_id.eq.${blockerId},user2_id.eq.${blockedId}),` +
      `and(user1_id.eq.${blockedId},user2_id.eq.${blockerId})`
    )
    .eq('status', 'matched')
  if (findErr) throw findErr

  const matchIds = (matches || []).map(m => m.id)
  if (matchIds.length > 0) {
    const { error: endErr } = await supabase
      .from('matches')
      .update({ status: 'unmatched' })
      .in('id', matchIds)
    if (endErr) throw endErr
  }

  const { error: blockErr } = await supabase
    .from('blocked_users')
    .upsert(
      { blocker_id: blockerId, blocked_id: blockedId },
      { onConflict: 'blocker_id,blocked_id' }
    )
  if (blockErr) throw blockErr

  endCallsForMatches(matchIds, io)
  for (const id of matchIds) {
    io?.to(id).emit('match_ended', { matchId: id })
    io?.in(id).socketsLeave(id)
  }
}
