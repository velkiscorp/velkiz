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
    return { data: mine === undefined || mine === db.senderOfMsg ? [{ id: MSG, media_path: db.mediaPath ?? null }] : [], error: null }
  }
  if (q.table === 'messages' && q.op === 'update') { db.updates.push(q); return { data: db.claimable ? [{ id: MSG }] : [], error: null } }
  if (q.table === 'messages' && q.op === 'select' && q.single) return { data: db.original, error: null }
  if (q.table === 'messages' && q.op === 'insert') { db.inserted.push(q.payload); return { data: { id: 'new', ...q.payload }, error: null } }
  return { data: null, error: null }
})
mock.module('../src/config/supabase.js', { namedExports: { supabase: fake.client, createAuthClient: () => fake.client } })
mock.module('../src/services/push.js', { namedExports: { notifyUser: () => {} } })
const storage = { uploaded: [], removed: [] }
fake.client.storage = { from: () => ({
  upload: async (path, buf, opts) => { storage.uploaded.push([path, opts.contentType]); return { error: null } },
  download: async () => ({ data: new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xe0])]), error: null }),
  remove: async (paths) => { storage.removed.push(...paths); return { error: null } },
}) }
const { unsendMessage, clearChat, sendMessage, sendMedia, getMedia } = await import('../src/controllers/messageController.js')
const { looksLike, kindForType, baseType } = await import('../src/services/chatMedia.js')

const emitted = []
const io = { to: (room) => ({ emit: (ev, data) => emitted.push([room, ev, data]) }) }
const call = async (handler, params, body = {}, extra = {}) => {
  let status = 200, json
  let sent = null
  const res = { status(s) { status = s; return this }, json(j) { json = j; return this }, set() { return this }, send(b) { sent = b; return this } }
  await handler({ user: { id: ME }, params, body, app: { get: () => io }, get: () => extra.type, validatedQuery: extra.query || {} }, res)
  return { status, json, sent }
}

beforeEach(() => {
  db = { match: { id: MATCH, user1_id: ME, user2_id: THEM, status: 'matched' }, senderOfMsg: ME, deletes: [], inserted: [], updates: [], claimable: true, original: { id: MSG } }
  emitted.length = 0
  storage.uploaded.length = 0
  storage.removed.length = 0
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

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0])
const M4A = Buffer.concat([Buffer.from([0, 0, 0, 0x20]), Buffer.from('ftypM4A '), Buffer.alloc(8)])

test('files are checked by their first bytes, not just their name', () => {
  assert.equal(kindForType(baseType('audio/mp4;codecs=mp4a.40.2')), 'audio')
  assert.equal(kindForType('application/pdf'), null)
  assert.ok(looksLike('image/jpeg', JPEG))
  assert.ok(looksLike('audio/mp4', M4A))
  assert.ok(!looksLike('image/png', JPEG))
  assert.ok(!looksLike('image/jpeg', Buffer.from('<html><script>alert(1)</script>')))
})

test('a photo is stored privately under the match and sent to the chat', async () => {
  const r = await call(sendMedia, { matchId: MATCH }, JPEG, { type: 'image/jpeg' })
  assert.equal(r.status, 201)
  assert.equal(storage.uploaded.length, 1)
  assert.match(storage.uploaded[0][0], new RegExp(`^${MATCH}/[0-9a-f-]{36}\\.jpg$`))
  assert.equal(db.inserted[0].kind, 'image')
  assert.equal(db.inserted[0].content, 'Photo')
  assert.equal(emitted[0][1], 'receive_message')
})

test('a voice message keeps its length', async () => {
  const r = await call(sendMedia, { matchId: MATCH }, M4A, { type: 'audio/mp4', query: { duration: 7.5 } })
  assert.equal(r.status, 201)
  assert.equal(db.inserted[0].kind, 'audio')
  assert.equal(db.inserted[0].media_duration, 7.5)
})

test('fake or unknown files are refused, and nothing is uploaded', async () => {
  assert.equal((await call(sendMedia, { matchId: MATCH }, Buffer.from('not really a jpeg at all'), { type: 'image/jpeg' })).status, 400)
  assert.equal((await call(sendMedia, { matchId: MATCH }, JPEG, { type: 'application/pdf' })).status, 400)
  db.match = null
  assert.equal((await call(sendMedia, { matchId: MATCH }, JPEG, { type: 'image/jpeg' })).status, 404)
  assert.equal(storage.uploaded.length, 0)
})

test('unsending a photo deletes the file too', async () => {
  db.mediaPath = `${MATCH}/x.jpg`
  await call(unsendMessage, { matchId: MATCH, messageId: MSG })
  assert.deepEqual(storage.removed, [`${MATCH}/x.jpg`])
})

test('photos and videos are view-once unless you keep them; voice messages never are', async () => {
  await call(sendMedia, { matchId: MATCH }, JPEG, { type: 'image/jpeg' })
  assert.equal(db.inserted[0].view_once, true)
  await call(sendMedia, { matchId: MATCH }, JPEG, { type: 'image/jpeg', query: { keep: 'true' } })
  assert.equal(db.inserted[1].view_once, undefined)
  await call(sendMedia, { matchId: MATCH }, M4A, { type: 'audio/mp4' })
  assert.equal(db.inserted[2].view_once, undefined)
})

const viewOncePhoto = (extra = {}) => ({ id: MSG, match_id: MATCH, sender_id: THEM, kind: 'image', media_type: 'image/jpeg', media_path: `${MATCH}/v.jpg`, view_once: true, viewed_at: null, ...extra })

test('a view-once photo opens once for the other person, then the file is deleted', async () => {
  db.original = viewOncePhoto()
  const r = await call(getMedia, { matchId: MATCH, messageId: MSG })
  assert.ok(r.sent)
  assert.equal(db.updates[0].payload.media_path, null)
  assert.ok(db.updates[0].payload.viewed_at)
  assert.deepEqual(storage.removed, [`${MATCH}/v.jpg`])
  assert.equal(emitted[0][1], 'message_viewed')
})

test('a view-once photo already opened is gone, and the sender cannot open it', async () => {
  db.original = viewOncePhoto({ viewed_at: new Date().toISOString(), media_path: null })
  assert.equal((await call(getMedia, { matchId: MATCH, messageId: MSG })).status, 410)
  db.original = viewOncePhoto({ sender_id: ME })
  assert.equal((await call(getMedia, { matchId: MATCH, messageId: MSG })).status, 403)
  // Two opens at once: the one that loses the claim gets nothing
  db.original = viewOncePhoto()
  db.claimable = false
  const r = await call(getMedia, { matchId: MATCH, messageId: MSG })
  assert.equal(r.status, 410)
  assert.equal(r.sent, null)
  assert.equal(storage.removed.length, 0)
})
