import { test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createFakeSupabase } from './fakeSupabase.js'

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
let db

const fake = createFakeSupabase((q) => {
  if (q.table === 'matches' && q.op === 'update') { db.updates.push(q.payload); return { error: null } }
  if (q.table === 'matches' && q.op === 'delete') { db.deletedMatches += 1; return { error: null } }
  if (q.table === 'swipes' && q.op === 'delete') { db.deletedSwipes.push(q.filters); return { error: null } }
  if (q.table === 'messages') return { data: [{ media_path: 'm1/a.jpg' }], error: null }
  if (q.table === 'matches') return { data: db.due, error: null }
  return { data: null, error: null }
})
mock.module('../src/config/supabase.js', { namedExports: { supabase: fake.client, createAuthClient: () => fake.client } })
mock.module('../src/services/push.js', { namedExports: { notifyUser: (...a) => db.pushes.push(a) } })
mock.module('../src/services/chatMedia.js', { namedExports: { removeMedia: (p) => db.removed.push(...p) } })
mock.module('../src/services/calls.js', { namedExports: { endCallsForMatches: () => {} } })
const { markOpened, keepChat, isExpired, timerFor, expireMatch, EXPIRY_MS } = await import('../src/services/chatExpiry.js')

const emitted = []
const io = { to: (room) => ({ emit: (ev, data) => emitted.push([room, ev, data]) }), in: () => ({ socketsLeave() {} }) }
const match = (extra = {}) => ({
  id: 'm1', user1_id: A, user2_id: B, status: 'matched',
  user1_opened_at: null, user2_opened_at: null, expires_at: null,
  user1_keeps: false, user2_keeps: false, expiry_warned_at: null, ...extra,
})

beforeEach(() => {
  db = { updates: [], deletedMatches: 0, deletedSwipes: [], pushes: [], removed: [], due: [] }
  emitted.length = 0
})

test('the clock only starts once both people have opened the chat', async () => {
  const first = await markOpened(match(), A, io)
  assert.equal(first.expires_at, null)
  assert.ok(first.user1_opened_at)

  const before = Date.now()
  const second = await markOpened(first, B, io)
  const expires = new Date(second.expires_at).getTime()
  assert.ok(expires >= before + EXPIRY_MS - 1000 && expires <= Date.now() + EXPIRY_MS)
  assert.equal(emitted.at(-1)[1], 'match_updated')

  // Opening it again changes nothing
  db.updates.length = 0
  await markOpened(second, A, io)
  assert.equal(db.updates.length, 0)
})

test('both tapping Keep chat stops the clock for good', async () => {
  const m = match({ user1_opened_at: 'x', user2_opened_at: 'y', expires_at: new Date(Date.now() + 1000).toISOString() })
  const one = await keepChat(m, A, io)
  assert.ok(one.expires_at)
  assert.deepEqual(db.pushes.at(-1).slice(0, 2), [B, 'keep'])
  assert.deepEqual(timerFor(one, B), { expiresAt: one.expires_at, started: true, kept: false, iKeep: false, theyKeep: true })

  const both = await keepChat(one, B, io)
  assert.equal(both.expires_at, null)
  assert.equal(isExpired({ ...both, expires_at: new Date(0).toISOString() }), false)
  assert.equal(timerFor(both, A).kept, true)
})

test('when time is up, the match, messages, files and both swipes go', async () => {
  const m = match({ expires_at: new Date(Date.now() - 1).toISOString() })
  assert.equal(isExpired(m), true)
  await expireMatch(m, io)
  assert.equal(db.deletedMatches, 1)
  assert.equal(db.deletedSwipes.length, 1)
  assert.deepEqual(db.removed, ['m1/a.jpg'])
  assert.deepEqual(emitted.at(-1), ['m1', 'match_ended', { matchId: 'm1', reason: 'expired' }])
})

test('older matches without the new columns never expire', () => {
  assert.equal(isExpired({ id: 'x', user1_id: A, user2_id: B }), false)
  assert.equal(timerFor({ id: 'x', user1_id: A, user2_id: B }, A), null)
})
