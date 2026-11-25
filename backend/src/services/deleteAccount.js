import { supabase } from '../config/supabase.js'
import { pathForUrl } from './photos.js'

// Permanently removes everything Velvet holds about a user, then their login.
// Order matters: data first, the login last, so a failure part way leaves
// the account still able to sign in and try again instead of orphaned data.
export const deleteAccountData = async (userId, io) => {
  const fail = (step, error) => {
    const err = new Error(`Delete account failed at ${step}`)
    err.cause = error
    throw err
  }

  // 1. Photos in storage: their own folder, plus older uploads on their profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('photos, photo_url')
    .eq('user_id', userId)
    .maybeSingle()

  const paths = new Set()
  for (const url of [...(profile?.photos || []).map(p => p?.url), profile?.photo_url]) {
    const path = pathForUrl(url)
    if (path) paths.add(path)
  }
  const { data: files } = await supabase.storage.from('photos').list(userId, { limit: 1000 })
  for (const f of files || []) paths.add(`${userId}/${f.name}`)

  if (paths.size > 0) {
    const { error } = await supabase.storage.from('photos').remove([...paths])
    if (error) fail('photos', error)
  }

  // 2. Matches and their messages. Tell anyone in an open chat it's over.
  const { data: matches, error: matchErr } = await supabase
    .from('matches')
    .select('id')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
  if (matchErr) fail('matches lookup', matchErr)

  const matchIds = (matches || []).map(m => m.id)
  if (matchIds.length > 0) {
    const { error: msgErr } = await supabase.from('messages').delete().in('match_id', matchIds)
    if (msgErr) fail('messages', msgErr)
    const { error: delMatchErr } = await supabase.from('matches').delete().in('id', matchIds)
    if (delMatchErr) fail('matches', delMatchErr)
    for (const id of matchIds) {
      io?.to(id).emit('match_ended', { matchId: id })
      io?.in(id).socketsLeave(id)
    }
  }

  // 3. Anything else that points at them (also covers messages they sent
  //    in a match that somehow wasn't found above)
  const steps = [
    ['messages sent', supabase.from('messages').delete().eq('sender_id', userId)],
    ['swipes', supabase.from('swipes').delete().or(`swiper_id.eq.${userId},target_id.eq.${userId}`)],
    ['blocks', supabase.from('blocked_users').delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)],
    ['profile', supabase.from('profiles').delete().eq('user_id', userId)],
  ]
  for (const [step, query] of steps) {
    const { error } = await query
    if (error) fail(step, error)
  }

  // 4. Their login
  const { error: authErr } = await supabase.auth.admin.deleteUser(userId)
  if (authErr) fail('login', authErr)
}
