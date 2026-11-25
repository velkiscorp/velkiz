import { supabase } from '../config/supabase.js'

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
