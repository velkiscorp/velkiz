import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createFakeSupabase } from './fakeSupabase.js'

const ME = '11111111-1111-4111-8111-111111111111'
const OLD_PASS = '22222222-2222-4222-8222-222222222222'
const NEW_PASS = '33333333-3333-4333-8333-333333333333'
const LIKED = '44444444-4444-4444-8444-444444444444'
const OPENED = '2026-11-28T10:00:00.000Z'

const fake = createFakeSupabase((q) => {
  const { table, single } = q
  if (table === 'profiles' && single) return { data: { user_id: ME, gender: 'male', orientation: 'bisexual', show_me: null }, error: null }
  if (table === 'swipes' && q.filters.some(f => f[1] === 'swiper_id')) {
    return { data: [
      { target_id: OLD_PASS, direction: 'left', created_at: '2026-11-27T10:00:00.000Z' },
      { target_id: NEW_PASS, direction: 'left', created_at: '2026-11-28T10:05:00.000Z' },
      { target_id: LIKED, direction: 'right', created_at: '2026-11-28T10:06:00.000Z' },
    ], error: null }
  }
  if (table === 'swipes') return { data: [], error: null }
  if (table === 'blocked_users') return { data: [], error: null }
  if (table === 'profiles') return { data: [{ user_id: NEW_PASS, username: 'n', photos: [] }], error: null }
  return { data: null, error: null }
})
mock.module('../src/config/supabase.js', { namedExports: { supabase: fake.client, createAuthClient: () => fake.client } })
const { getProfiles } = await import('../src/controllers/profileController.js')

const run = async (query) => {
  fake.calls.length = 0
  const r = { json: null }
  const res = { status() { return this }, json(j) { r.json = j; return this } }
  await getProfiles({ user: { id: ME }, validatedQuery: { limit: 20, offset: 0, ...query } }, res)
  const main = fake.calls.find(c => c.table === 'profiles' && !c.single && c.filters.some(f => f[0] === 'not' && f[1] === 'user_id'))
  const excluded = main.filters.find(f => f[0] === 'not' && f[1] === 'user_id')[3]
  return { json: r.json, excluded }
}

test('passes from this visit stay in the feed, marked as passed', async () => {
  const { json, excluded } = await run({ passedSince: OPENED })
  assert.ok(!excluded.includes(NEW_PASS))
  assert.ok(excluded.includes(OLD_PASS))
  assert.ok(excluded.includes(LIKED))
  assert.equal(json.profiles[0].passedByYou, true)
  assert.ok(json.serverTime)
})

test('without passedSince every swipe hides the person', async () => {
  const { excluded } = await run({})
  for (const id of [OLD_PASS, NEW_PASS, LIKED, ME]) assert.ok(excluded.includes(id))
})
