import { test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createFakeSupabase } from './fakeSupabase.js'

const ME = '11111111-1111-1111-1111-111111111111'
const THEM = '22222222-2222-2222-2222-222222222222'
let db

const fake = createFakeSupabase((q) => {
  if (q.rpc === 'use_super_like') return { data: 'free', error: null }
  const { table, op } = q
  if (table === 'profiles') return { data: { user_id: THEM, username: 'them', photos: [] }, error: null }
  if (table === 'blocked_users') return { data: db.blocked ? [{ id: 'b' }] : [], error: null }
  if (table === 'swipes' && op === 'insert') {
    return db.alreadySwiped
      ? { data: null, error: { code: '23505' } }
      : { data: { id: 's1', ...q.payload }, error: null }
  }
  // The Super Like notes between the two, oldest first
  if (table === 'swipes' && q.filters.some(f => f[0] === 'not')) return { data: db.notes || [], error: null }
  if (table === 'swipes') return { data: db.theyLikedMe ? { id: 's0', direction: 'right' } : null, error: null }
  if (table === 'messages' && op === 'insert') { (db.posted ||= []).push(q.payload); return { data: { id: 'msg', ...q.payload }, error: null } }
  if (table === 'matches' && op === 'insert') {
    db.matchInserts += 1
    // Someone else created the match a moment ago: the database rule refuses
    if (db.raceLost) { db.matches.push({ id: 'm-first', status: 'matched' }); return { data: null, error: { code: '23505' } } }
    const m = { id: 'm-new', status: 'matched' }
    db.matches.push(m)
    return { data: m, error: null }
  }
  if (table === 'matches') return { data: db.matches.slice(0, 1), error: null }
  return { data: null, error: null }
})
mock.module('../src/config/supabase.js', { namedExports: { supabase: fake.client, createAuthClient: () => fake.client } })
const { createSwipe } = await import('../src/controllers/swipeController.js')

const call = async (body) => {
  let status = 200, json
  const res = { status(s) { status = s; return this }, json(j) { json = j; return this } }
  await createSwipe({ user: { id: ME }, body }, res)
  return { status, json }
}

beforeEach(() => {
  db = { blocked: false, alreadySwiped: false, theyLikedMe: false, raceLost: false, matches: [], matchInserts: 0 }
})

test('liking someone who hasn\'t liked you back is just a swipe', async () => {
  const r = await call({ targetId: THEM, direction: 'right' })
  assert.equal(r.status, 201)
  assert.equal(r.json.matched, false)
})

test('liking someone who liked you makes a match', async () => {
  db.theyLikedMe = true
  const r = await call({ targetId: THEM, direction: 'right' })
  assert.equal(r.json.matched, true)
  assert.equal(r.json.match.id, 'm-new')
  assert.equal(r.json.match.matchedWith.id, THEM)
})

test('both swiping at the same moment still ends with one match, and both see it', async () => {
  db.theyLikedMe = true
  db.raceLost = true
  const r = await call({ targetId: THEM, direction: 'right' })
  assert.equal(r.json.matched, true)
  assert.equal(r.json.match.id, 'm-first')
})

test('an existing match is reused, never duplicated', async () => {
  db.theyLikedMe = true
  db.matches.push({ id: 'm-old', status: 'matched' })
  const r = await call({ targetId: THEM, direction: 'super' })
  assert.equal(r.json.match.id, 'm-old')
  assert.equal(db.matchInserts, 0)
})

test('an ended match stays ended', async () => {
  db.theyLikedMe = true
  db.matches.push({ id: 'm-old', status: 'unmatched' })
  const r = await call({ targetId: THEM, direction: 'right' })
  assert.equal(r.json.matched, false)
})

test('passing never makes a match', async () => {
  db.theyLikedMe = true
  const r = await call({ targetId: THEM, direction: 'left' })
  assert.equal(r.json.matched, false)
  assert.equal(db.matchInserts, 0)
})

test('blocked users look like they don\'t exist', async () => {
  db.blocked = true
  const r = await call({ targetId: THEM, direction: 'right' })
  assert.equal(r.status, 404)
})

test('you can\'t swipe yourself or swipe twice', async () => {
  assert.equal((await call({ targetId: ME, direction: 'right' })).status, 400)
  db.alreadySwiped = true
  assert.equal((await call({ targetId: THEM, direction: 'right' })).status, 400)
})

test('a Super Like note becomes the first chat message when they match', async () => {
  db.theyLikedMe = true
  db.notes = [{ swiper_id: THEM, message: 'love your playlist', created_at: '2026-11-27T10:00:00Z' }]
  const r = await call({ targetId: THEM, direction: 'right' })
  assert.equal(r.json.matched, true)
  assert.deepEqual(db.posted, [{ match_id: 'm-new', sender_id: THEM, content: 'love your playlist', is_filtered: false }])
})

test('a Super Like keeps its note', async () => {
  const r = await call({ targetId: THEM, direction: 'super', message: 'hi there' })
  assert.equal(r.status, 201)
  assert.equal(r.json.swipe.message, 'hi there')
})
