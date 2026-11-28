import { test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createFakeSupabase, filterValue } from './fakeSupabase.js'

const ME = '11111111-1111-4111-8111-111111111111'
const THEM = '22222222-2222-4222-8222-222222222222'
const MATCH = '44444444-4444-4444-8444-444444444444'
const MSG = '55555555-5555-4555-8555-555555555555'
let db

const fake = createFakeSupabase((q) => {
  if (q.table === 'matches') return { data: db.match, error: null }
  if (q.table === 'messages' && q.op === 'delete') {
    db.deletes.push(q.filters)
    const mine = filterValue(q, 'eq', 'sender_id')
    return { data: mine === undefined || mine === db.senderOfMsg ? [{ id: MSG }] : [], error: null }
  }
  if (q.table === 'messages' && q.op === 'select' && q.single) return { data: db.original, error: null }
  if (q.table === 'messages' && q.op === 'insert') { db.inserted.push(q.payload); return { data: { id: 'new', ...q.payload }, error: null } }
  return { data: null, error: null }
})
mock.module('../src/config/supabase.js', { namedExports: { supabase: fake.client, createAuthClient: () => fake.client } })
mock.module('../src/services/push.js', { namedExports: { notifyUser: () => {} } })
const { unsendMessage, clearChat, sendMessage } = await import('../src/controllers/messageController.js')

const emitted = []
const io = { to: (room) => ({ emit: (ev, data) => emitted.push([room, ev, data]) }) }
const call = async (handler, params, body = {}) => {
  let status = 200, json
  const res = { status(s) { status = s; return this }, json(j) { json = j; return this } }
  await handler({ user: { id: ME }, params, body, app: { get: () => io } }, res)
  return { status, json }
}

beforeEach(() => {
  db = { match: { id: MATCH, user1_id: ME, user2_id: THEM, status: 'matched' }, senderOfMsg: ME, deletes: [], inserted: [], original: { id: MSG } }
  emitted.length = 0
})

test('unsending your own message removes it for both of you', async () => {
  const r = await call(unsendMessage, { matchId: MATCH, messageId: MSG })
  assert.equal(r.status, 200)
  assert.equal(filterValue({ filters: db.deletes[0] }, 'eq', 'sender_id'), ME)
  assert.deepEqual(emitted, [[MATCH, 'message_deleted', { matchId: MATCH, messageId: MSG }]])
})

test("you can't unsend someone else's message", async () => {
  db.senderOfMsg = THEM
  const r = await call(unsendMessage, { matchId: MATCH, messageId: MSG })
  assert.equal(r.status, 404)
  assert.equal(emitted.length, 0)
})

test('deleting the chat clears it for both, but only in a match you are in', async () => {
  const r = await call(clearChat, { matchId: MATCH })
  assert.equal(r.status, 200)
  assert.deepEqual(emitted, [[MATCH, 'chat_cleared', { matchId: MATCH }]])
  db.match = null
  assert.equal((await call(clearChat, { matchId: MATCH })).status, 404)
  db.match = { id: MATCH, user1_id: ME, user2_id: THEM, status: 'unmatched' }
  assert.equal((await call(clearChat, { matchId: MATCH })).status, 404)
})

test('a reply has to point at a message in the same chat', async () => {
  const ok = await call(sendMessage, { matchId: MATCH }, { content: 'yes!', replyToId: MSG })
  assert.equal(ok.status, 201)
  assert.equal(db.inserted[0].reply_to_id, MSG)
  db.original = null
  const bad = await call(sendMessage, { matchId: MATCH }, { content: 'yes!', replyToId: MSG })
  assert.equal(bad.status, 400)
})
