import { test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { createFakeSupabase } from './fakeSupabase.js'

const ME = '11111111-1111-4111-8111-111111111111'
const THEM = '22222222-2222-4222-8222-222222222222'
const STRANGER = '33333333-3333-4333-8333-333333333333'
const MATCH = '44444444-4444-4444-8444-444444444444'
let db

const fake = createFakeSupabase((q) => {
  if (q.table === 'matches' && q.single) return { data: db.match, error: null }
  if (q.table === 'blocked_users') return { data: db.blocked ? [{ id: 'b' }] : [], error: null }
  if (q.table === 'messages' && q.op === 'insert') { db.logged.push(q.payload); return { data: { id: 'msg', ...q.payload }, error: null } }
  return { data: null, error: null }
})
mock.module('../src/config/supabase.js', { namedExports: { supabase: fake.client, createAuthClient: () => fake.client } })
mock.module('../src/services/push.js', { namedExports: { notifyUser: (...args) => { db.pushes.push(args) } } })

process.env.LIVEKIT_URL = 'wss://velkiz-test.livekit.cloud'
process.env.LIVEKIT_API_KEY = 'APItest'
process.env.LIVEKIT_API_SECRET = 'secret-for-tests'
const realFetch = globalThis.fetch
globalThis.fetch = async (url, opts) => { db.deleted.push(JSON.parse(opts.body).room); return { ok: true, status: 200 } }

const { startCall, acceptCall, declineCall, hangUp, endCallsForMatches, CallError, _test } = await import('../src/services/calls.js')
const { roomToken } = await import('../src/services/livekit.js')

const emitted = []
const io = { to: (room) => ({ emit: (ev, data) => emitted.push([room, ev, data]) }) }
const events = (name) => emitted.filter(e => e[1] === name)
const tick = () => new Promise(r => setImmediate(r))

beforeEach(() => {
  _test.reset()
  db = { match: { id: MATCH, user1_id: ME, user2_id: THEM, status: 'matched' }, blocked: false, logged: [], pushes: [], deleted: [] }
  emitted.length = 0
})

test.after(() => { globalThis.fetch = realFetch; _test.reset() })

const decode = (jwt) => JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString())

test('LiveKit tokens are signed for one room and one person, and cannot send data', () => {
  const token = roomToken({ apiKey: 'APItest', apiSecret: 'secret-for-tests' }, { room: 'call_x', identity: ME })
  const [h, p, sig] = token.split('.')
  const expected = crypto.createHmac('sha256', 'secret-for-tests').update(`${h}.${p}`).digest('base64url')
  assert.equal(sig, expected)
  const claims = decode(token)
  assert.equal(claims.iss, 'APItest')
  assert.equal(claims.sub, ME)
  assert.deepEqual(claims.video, { room: 'call_x', roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: false })
  assert.ok(claims.exp - claims.nbf <= 11 * 60)
})

test('calling a match rings only them, with nothing about the caller', async () => {
  const r = await startCall({ matchId: MATCH, callerId: ME, video: true, io })
  assert.equal(r.call.state, 'ringing')
  assert.equal(r.url, 'wss://velkiz-test.livekit.cloud')
  assert.equal(decode(r.token).video.room, `call_${r.call.id}`)
  const ring = events('call_incoming')
  assert.equal(ring.length, 1)
  assert.equal(ring[0][0], `user:${THEM}`)
  assert.deepEqual(Object.keys(ring[0][2]).sort(), ['calleeId', 'callerId', 'id', 'matchId', 'state', 'video'])
  assert.deepEqual(db.pushes[0].slice(0, 2), [THEM, 'call'])
})

test("you can't call someone you're not matched with, or someone blocked", async () => {
  db.match = null
  await assert.rejects(startCall({ matchId: MATCH, callerId: STRANGER, io }), (e) => e instanceof CallError && e.status === 404)
  db.match = { id: MATCH, user1_id: ME, user2_id: THEM, status: 'unmatched' }
  await assert.rejects(startCall({ matchId: MATCH, callerId: ME, io }), (e) => e.status === 404)
  db.match = { id: MATCH, user1_id: ME, user2_id: THEM, status: 'matched' }
  db.blocked = true
  await assert.rejects(startCall({ matchId: MATCH, callerId: ME, io }), (e) => e.status === 404)
  assert.equal(events('call_incoming').length, 0)
})

test('only the person called can answer, and both get the same room', async () => {
  const { call, token } = await startCall({ matchId: MATCH, callerId: ME, io })
  assert.throws(() => acceptCall({ callId: call.id, userId: ME, io }), (e) => e.status === 403)
  assert.throws(() => acceptCall({ callId: call.id, userId: STRANGER, io }), (e) => e.status === 404)
  const answer = acceptCall({ callId: call.id, userId: THEM, io })
  assert.equal(answer.call.state, 'active')
  assert.equal(decode(answer.token).video.room, decode(token).video.room)
  assert.equal(decode(answer.token).sub, THEM)
  assert.equal(events('call_accepted')[0][0], `user:${ME}`)
})

test('a second call while busy is refused', async () => {
  await startCall({ matchId: MATCH, callerId: ME, io })
  const other = '55555555-5555-4555-8555-555555555555'
  db.match = { id: other, user1_id: STRANGER, user2_id: THEM, status: 'matched' }
  await assert.rejects(startCall({ matchId: other, callerId: STRANGER, io }), (e) => e.status === 409)
})

test('declining ends it for both, closes the room and logs it in the chat', async () => {
  const { call } = await startCall({ matchId: MATCH, callerId: ME, video: true, io })
  declineCall({ callId: call.id, userId: THEM, io })
  await tick()
  const ended = events('call_ended')
  assert.deepEqual(ended.map(e => e[0]).sort(), [`user:${ME}`, `user:${THEM}`].sort())
  assert.equal(ended[0][2].reason, 'declined')
  assert.deepEqual(db.deleted, [`call_${call.id}`])
  assert.equal(db.logged[0].kind, 'call')
  assert.equal(db.logged[0].content, 'Declined video call')
})

test('hanging up after talking logs how long it lasted', async () => {
  const { call } = await startCall({ matchId: MATCH, callerId: ME, io })
  acceptCall({ callId: call.id, userId: THEM, io })
  hangUp({ callId: call.id, userId: THEM, io })
  await tick()
  assert.equal(events('call_ended')[0][2].reason, 'ended')
  assert.match(db.logged[0].content, /^Voice call · 0:0\d$/)
  // Hanging up twice is harmless
  hangUp({ callId: call.id, userId: ME, io })
  assert.equal(events('call_ended').length, 2)
})

test('caller hanging up before an answer is a missed call for the other person', async () => {
  const { call } = await startCall({ matchId: MATCH, callerId: ME, io })
  hangUp({ callId: call.id, userId: ME, io })
  await tick()
  assert.equal(events('call_ended')[0][2].reason, 'cancelled')
  assert.equal(db.logged[0].content, 'Missed voice call')
  assert.deepEqual(db.pushes.at(-1).slice(0, 2), [THEM, 'missedcall'])
})

test('unmatching or blocking hangs up straight away, without a chat line', async () => {
  const { call } = await startCall({ matchId: MATCH, callerId: ME, video: true, io })
  acceptCall({ callId: call.id, userId: THEM, io })
  endCallsForMatches([MATCH], io)
  await tick()
  assert.equal(events('call_ended')[0][2].reason, 'blocked')
  assert.equal(db.logged.length, 0)
  assert.throws(() => acceptCall({ callId: call.id, userId: THEM, io }), (e) => e.status === 404)
})

test('calls are off until LiveKit is set up', async () => {
  const key = process.env.LIVEKIT_API_KEY
  delete process.env.LIVEKIT_API_KEY
  try {
    await assert.rejects(startCall({ matchId: MATCH, callerId: ME, io }), (e) => e.status === 503)
  } finally {
    process.env.LIVEKIT_API_KEY = key
  }
})
