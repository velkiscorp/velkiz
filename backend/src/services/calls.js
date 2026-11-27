import crypto from 'node:crypto'
import { supabase } from '../config/supabase.js'
import { livekitConfig, roomToken, deleteRoom } from './livekit.js'
import { notifyUser } from './push.js'

// Calls between two matched people. Ringing, answering and hanging up go over
// the app's socket (each signed-in phone sits in a "user:<id>" room); the
// audio and video go through LiveKit.
//
// Calls are kept in memory. That's fine on one server: a restart only drops
// calls that are ringing or in progress, and LiveKit hangs those up anyway
// when the room empties.

export const RING_TIMEOUT_MS = 40_000

const calls = new Map() // callId -> call

export const userRoom = (userId) => `user:${userId}`

const roomName = (call) => `call_${call.id}`

const findCallFor = (userId) => {
  for (const call of calls.values()) {
    if (call.callerId === userId || call.calleeId === userId) return call
  }
  return null
}

export const getCall = (callId) => calls.get(callId) || null

const publicCall = (call) => ({
  id: call.id,
  matchId: call.matchId,
  video: call.video,
  state: call.state,
  callerId: call.callerId,
  calleeId: call.calleeId,
})

const tokenFor = (call, userId) => {
  const cfg = livekitConfig()
  return { url: cfg.url, token: roomToken(cfg, { room: roomName(call), identity: userId }) }
}

// A short line in the chat, like "Video call · 3:12" or "Missed voice call".
// Needs the call-messages SQL; until it has run, the line is simply skipped.
const logToChat = async (call, reason, io) => {
  try {
    const type = call.video ? 'video call' : 'voice call'
    let content
    if (call.answeredAt) {
      const secs = Math.max(1, Math.round((Date.now() - call.answeredAt) / 1000))
      const mm = Math.floor(secs / 60)
      const ss = String(secs % 60).padStart(2, '0')
      content = `${type[0].toUpperCase()}${type.slice(1)} · ${mm}:${ss}`
    } else if (reason === 'declined') {
      content = `Declined ${type}`
    } else {
      content = `Missed ${type}`
    }
    const { data: message, error } = await supabase
      .from('messages')
      .insert({ match_id: call.matchId, sender_id: call.callerId, content, kind: 'call' })
      .select()
      .single()
    if (error) return
    io?.to(call.matchId).emit('receive_message', message)
  } catch {}
}

// End a call for everyone. reason: ended | declined | missed | cancelled | busy | blocked
export const endCall = (call, reason, io) => {
  if (!calls.has(call.id)) return
  calls.delete(call.id)
  clearTimeout(call.ringTimer)
  const payload = { callId: call.id, matchId: call.matchId, reason }
  io?.to(userRoom(call.callerId)).emit('call_ended', payload)
  io?.to(userRoom(call.calleeId)).emit('call_ended', payload)
  const cfg = livekitConfig()
  if (cfg) deleteRoom(cfg, roomName(call))
  if (reason === 'missed' || reason === 'cancelled') notifyUser(call.calleeId, 'missedcall', { matchId: call.matchId })
  if (reason !== 'blocked') logToChat(call, reason, io)
}

// Hang up any call on these matches (used when someone unmatches or blocks)
export const endCallsForMatches = (matchIds, io) => {
  const ids = new Set(matchIds)
  for (const call of [...calls.values()]) {
    if (ids.has(call.matchId)) endCall(call, 'blocked', io)
  }
}

export class CallError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

// Start ringing the other person in this match
export const startCall = async ({ matchId, callerId, video, io }) => {
  if (!livekitConfig()) throw new CallError(503, 'Calls are not available yet')

  const { data: match } = await supabase
    .from('matches')
    .select('id, user1_id, user2_id, status')
    .eq('id', matchId)
    .or(`user1_id.eq.${callerId},user2_id.eq.${callerId}`)
    .single()
  if (!match || match.status !== 'matched') throw new CallError(404, 'Match not found')

  const calleeId = match.user1_id === callerId ? match.user2_id : match.user1_id

  // Unmatching or blocking also ends the match, but check blocks anyway in
  // case a stale match row survived
  const { data: blocks } = await supabase
    .from('blocked_users')
    .select('id')
    .or(`and(blocker_id.eq.${callerId},blocked_id.eq.${calleeId}),and(blocker_id.eq.${calleeId},blocked_id.eq.${callerId})`)
    .limit(1)
  if (blocks?.length) throw new CallError(404, 'Match not found')

  const mine = findCallFor(callerId)
  if (mine) {
    // A call you started a moment ago with the same person: reuse it
    if (mine.matchId === matchId && mine.callerId === callerId && mine.state === 'ringing') {
      return { call: publicCall(mine), ...tokenFor(mine, callerId) }
    }
    throw new CallError(409, 'You are already in a call')
  }
  if (findCallFor(calleeId)) throw new CallError(409, 'They are on another call')

  const call = {
    id: crypto.randomUUID(),
    matchId,
    callerId,
    calleeId,
    video: !!video,
    state: 'ringing',
    createdAt: Date.now(),
    answeredAt: null,
  }
  calls.set(call.id, call)
  call.ringTimer = setTimeout(() => endCall(call, 'missed', io), RING_TIMEOUT_MS)
  call.ringTimer.unref?.()

  // The other person's app finds who's calling in its own matches list, so
  // nothing about the caller is sent here
  io?.to(userRoom(calleeId)).emit('call_incoming', publicCall(call))
  notifyUser(calleeId, 'call', { matchId, callId: call.id })

  return { call: publicCall(call), ...tokenFor(call, callerId) }
}

const requireCall = (callId, userId) => {
  const call = calls.get(callId)
  if (!call || (call.callerId !== userId && call.calleeId !== userId)) {
    throw new CallError(404, 'This call has ended')
  }
  return call
}

export const acceptCall = ({ callId, userId, io }) => {
  const call = requireCall(callId, userId)
  if (call.calleeId !== userId) throw new CallError(403, 'Only the person being called can answer')
  if (call.state !== 'ringing') throw new CallError(409, 'This call was already answered')
  call.state = 'active'
  call.answeredAt = Date.now()
  clearTimeout(call.ringTimer)
  io?.to(userRoom(call.callerId)).emit('call_accepted', publicCall(call))
  // Other phones signed in as the same person stop ringing
  io?.to(userRoom(call.calleeId)).emit('call_answered_elsewhere', { callId: call.id })
  return { call: publicCall(call), ...tokenFor(call, userId) }
}

export const declineCall = ({ callId, userId, io }) => {
  const call = requireCall(callId, userId)
  if (call.calleeId !== userId || call.state !== 'ringing') throw new CallError(409, 'This call cannot be declined')
  endCall(call, 'declined', io)
}

export const hangUp = ({ callId, userId, io }) => {
  const call = calls.get(callId)
  // Already over: nothing to do, and that's fine
  if (!call || (call.callerId !== userId && call.calleeId !== userId)) return
  const reason = call.state === 'ringing' && call.callerId === userId ? 'cancelled' : 'ended'
  endCall(call, reason, io)
}

export const _test = { calls, reset: () => { for (const c of calls.values()) clearTimeout(c.ringTimer); calls.clear() } }
