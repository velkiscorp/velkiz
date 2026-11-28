import { supabase } from '../config/supabase.js'
import { notifyUser } from './push.js'
import { removeMedia } from './chatMedia.js'
import { endCallsForMatches } from './calls.js'

// Disappearing chats. A chat's 36 hours start once both people have opened
// it. If both tap "Keep chat" it stays for good. Otherwise, when time runs
// out, the match, its messages and files, and both swipes are deleted, so
// the two can come across each other in Discover again.

export const EXPIRY_MS = 36 * 60 * 60 * 1000
export const WARN_BEFORE_MS = 3 * 60 * 60 * 1000
const SWEEP_EVERY_MS = 60 * 1000

// The columns only exist once the disappearing_chats SQL has run
export const supportsExpiry = (match) => !!match && 'expires_at' in match

const side = (match, userId) => (match.user1_id === userId ? 'user1' : 'user2')
const otherId = (match, userId) => (match.user1_id === userId ? match.user2_id : match.user1_id)

export const isKept = (match) => !!(match.user1_keeps && match.user2_keeps)

export const isExpired = (match, now = Date.now()) =>
  supportsExpiry(match) && !!match.expires_at && !isKept(match) && new Date(match.expires_at).getTime() <= now

// What the app shows about the timer, from one person's side
export const timerFor = (match, userId) => {
  if (!supportsExpiry(match)) return null
  const me = side(match, userId)
  const them = me === 'user1' ? 'user2' : 'user1'
  return {
    expiresAt: isKept(match) ? null : match.expires_at,
    started: !!match.expires_at || isKept(match),
    kept: isKept(match),
    iKeep: !!match[`${me}_keeps`],
    theyKeep: !!match[`${them}_keeps`],
  }
}

const emitUpdate = (io, match, extra = {}) => {
  io?.to(match.id).emit('match_updated', {
    matchId: match.id,
    expiresAt: isKept(match) ? null : match.expires_at,
    user1Keeps: match.user1_keeps,
    user2Keeps: match.user2_keeps,
    user1Id: match.user1_id,
    ...extra,
  })
}

// Someone opened the chat. The second person opening it starts the clock.
export const markOpened = async (match, userId, io) => {
  if (!supportsExpiry(match)) return match
  const col = `${side(match, userId)}_opened_at`
  if (match[col]) return match
  const now = new Date()
  const updated = { ...match, [col]: now.toISOString() }
  const both = updated.user1_opened_at && updated.user2_opened_at
  if (both && !updated.expires_at && !isKept(updated)) {
    updated.expires_at = new Date(now.getTime() + EXPIRY_MS).toISOString()
  }
  const changes = { [col]: updated[col], ...(updated.expires_at !== match.expires_at ? { expires_at: updated.expires_at } : {}) }
  const { error } = await supabase.from('matches').update(changes).eq('id', match.id)
  if (error) {
    console.error('Mark opened error:', error.message)
    return match
  }
  if (changes.expires_at) emitUpdate(io, updated)
  return updated
}

// "Keep chat": once both have tapped it, the chat stays
export const keepChat = async (match, userId, io) => {
  const me = side(match, userId)
  const updated = { ...match, [`${me}_keeps`]: true }
  const changes = { [`${me}_keeps`]: true }
  if (isKept(updated)) {
    updated.expires_at = null
    changes.expires_at = null
  }
  const { error } = await supabase.from('matches').update(changes).eq('id', match.id)
  if (error) throw error
  emitUpdate(io, updated)
  if (!isKept(updated)) notifyUser(otherId(match, userId), 'keep', { matchId: match.id })
  else notifyUser(otherId(match, userId), 'kept', { matchId: match.id })
  return updated
}

// Time's up: delete everything between the two and let them meet again
export const expireMatch = async (match, io) => {
  const { data: files } = await supabase
    .from('messages')
    .select('media_path')
    .eq('match_id', match.id)
    .not('media_path', 'is', null)

  const a = match.user1_id
  const b = match.user2_id
  await supabase
    .from('swipes')
    .delete()
    .or(`and(swiper_id.eq.${a},target_id.eq.${b}),and(swiper_id.eq.${b},target_id.eq.${a})`)

  // Messages go with the match (on delete cascade)
  const { error } = await supabase.from('matches').delete().eq('id', match.id)
  if (error) {
    console.error('Expire match error:', error.message)
    return false
  }

  removeMedia((Array.isArray(files) ? files : []).map(f => f.media_path))
  endCallsForMatches([match.id], io)
  io?.to(match.id).emit('match_ended', { matchId: match.id, reason: 'expired' })
  io?.in?.(match.id)?.socketsLeave?.(match.id)
  return true
}

// Expire what's due and warn about what's nearly due. Never throws.
export const sweep = async (io, now = Date.now()) => {
  try {
    const { data: due, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'matched')
      .lte('expires_at', new Date(now).toISOString())
      .limit(200)
    if (error) return // the SQL hasn't run yet
    for (const match of due || []) {
      if (isExpired(match, now)) await expireMatch(match, io)
    }

    const { data: soon } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'matched')
      .is('expiry_warned_at', null)
      .lte('expires_at', new Date(now + WARN_BEFORE_MS).toISOString())
      .limit(200)
    for (const match of soon || []) {
      if (isKept(match) || !match.expires_at) continue
      await supabase.from('matches').update({ expiry_warned_at: new Date(now).toISOString() }).eq('id', match.id)
      notifyUser(match.user1_id, 'expiring', { matchId: match.id })
      notifyUser(match.user2_id, 'expiring', { matchId: match.id })
    }
  } catch (err) {
    console.error('Chat expiry sweep error:', err?.message || err)
  }
}

export const startExpirySweep = (io) => {
  const timer = setInterval(() => sweep(io), SWEEP_EVERY_MS)
  timer.unref?.()
  return timer
}
