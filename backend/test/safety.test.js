import { test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createFakeSupabase, filterValue } from './fakeSupabase.js'

const ME = '11111111-1111-4111-8111-111111111111'
const THEM = '22222222-2222-4222-8222-222222222222'
const STRANGER = '33333333-3333-3333-3333-333333333333'
let db

const fake = createFakeSupabase((q) => {
  const { table, op } = q
  if (table === 'profiles') return { data: db.targetExists ? { user_id: THEM } : null, error: null }
  if (table === 'matches' && op === 'update') { db.ended.push(...q.filters.find(f => f[0] === 'in')[2]); return { error: null } }
  if (table === 'matches' && q.single) return { data: db.match, error: null }
  if (table === 'matches') return { data: db.activeMatches, error: null }
  if (table === 'blocked_users' && op === 'upsert') { db.blocks.push(q.payload); return { error: null } }
  if (table === 'reports' && op === 'insert') { db.reports.push(q.payload); return { error: null } }
  return { data: null, error: null }
})
mock.module('../src/config/supabase.js', { namedExports: { supabase: fake.client, createAuthClient: () => fake.client } })
const { block, report } = await import('../src/controllers/safetyController.js')
const { reportBody } = await import('../src/validation/schemas.js')

const emitted = []
const io = { to: (room) => ({ emit: (ev) => emitted.push([room, ev]) }), in: () => ({ socketsLeave() {} }) }
const call = async (handler, body) => {
  let status = 200, json
  const res = { status(s) { status = s; return this }, json(j) { json = j; return this } }
  await handler({ user: { id: ME }, body, app: { get: () => io } }, res)
  return { status, json }
}

beforeEach(() => {
  db = { targetExists: true, match: null, activeMatches: [], ended: [], blocks: [], reports: [] }
  emitted.length = 0
})

test('blocking someone you matched with ends the chat for both and records the block', async () => {
  db.activeMatches = [{ id: 'm1' }]
  const r = await call(block, { userId: THEM })
  assert.equal(r.status, 200)
  assert.deepEqual(db.ended, ['m1'])
  assert.deepEqual(db.blocks, [{ blocker_id: ME, blocked_id: THEM }])
  assert.deepEqual(emitted, [['m1', 'match_ended']])
})

test('you can block someone from Discover without a match', async () => {
  const r = await call(block, { userId: THEM })
  assert.equal(r.status, 200)
  assert.equal(db.ended.length, 0)
  assert.equal(db.blocks.length, 1)
})

test("you can't block or report yourself", async () => {
  assert.equal((await call(block, { userId: ME })).status, 400)
  assert.equal((await call(report, { userId: ME, reason: 'other', alsoBlock: true })).status, 400)
})

test('blocking or reporting someone who does not exist is a 404', async () => {
  db.targetExists = false
  assert.equal((await call(block, { userId: THEM })).status, 404)
  assert.equal((await call(report, { userId: THEM, reason: 'spam_or_scam', alsoBlock: true })).status, 404)
})

test('a report is saved and blocks the person by default', async () => {
  const body = reportBody.parse({ userId: THEM, reason: 'harassment', details: 'rude' })
  const r = await call(report, body)
  assert.equal(r.status, 201)
  assert.equal(r.json.blocked, true)
  assert.equal(db.reports[0].reporter_id, ME)
  assert.equal(db.reports[0].reported_id, THEM)
  assert.equal(db.reports[0].reason, 'harassment')
  assert.equal(db.blocks.length, 1)
})

test('a report can skip the block', async () => {
  const r = await call(report, reportBody.parse({ userId: THEM, reason: 'fake_profile', alsoBlock: false }))
  assert.equal(r.status, 201)
  assert.equal(db.blocks.length, 0)
})

test('a report only links a chat that is really between the two people', async () => {
  db.match = { id: 'm1', user1_id: THEM, user2_id: STRANGER }
  await call(report, reportBody.parse({ userId: THEM, reason: 'other', matchId: '44444444-4444-4444-8444-444444444444' }))
  assert.equal(db.reports[0].match_id, null)

  db.match = { id: 'm2', user1_id: THEM, user2_id: ME }
  await call(report, reportBody.parse({ userId: THEM, reason: 'other', matchId: '44444444-4444-4444-8444-444444444444' }))
  assert.equal(db.reports[1].match_id, 'm2')
})

test('report reasons are a fixed list and notes are capped', () => {
  assert.equal(reportBody.safeParse({ userId: THEM, reason: 'made_up' }).success, false)
  assert.equal(reportBody.safeParse({ userId: THEM, reason: 'other', details: 'x'.repeat(1001) }).success, false)
})

test('a report emails the moderators and sends the reporter a receipt', async () => {
  const sent = []
  const realFetch = globalThis.fetch
  process.env.RESEND_API_KEY = 'test-key'
  globalThis.fetch = async (url, opts) => { sent.push({ url, body: JSON.parse(opts.body) }); return { ok: true } }
  try {
    let status
    const res = { status(s) { status = s; return this }, json() { return this } }
    await report({ user: { id: ME, email: 'me@example.com' }, body: { userId: THEM, reason: 'harassment', details: 'rude' }, app: { get: () => io } }, res)
    assert.equal(status, 201)
    await new Promise(r => setTimeout(r, 20))
    assert.equal(sent.length, 2)
    assert.ok(sent.every(s => s.url === 'https://api.resend.com/emails'))
    assert.deepEqual(sent[0].body.to, ['support@velkiz.com'])
    assert.match(sent[0].body.text, /harassment/)
    assert.deepEqual(sent[1].body.to, ['me@example.com'])
    // The receipt never names the person reported
    assert.doesNotMatch(sent[1].body.text, new RegExp(THEM))
  } finally {
    globalThis.fetch = realFetch
    delete process.env.RESEND_API_KEY
  }
})
