import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createFakeSupabase } from './fakeSupabase.js'

let stored = null
const fake = createFakeSupabase((q) => {
  if (q.table === 'profiles' && q.op === 'select') return { data: stored, error: null }
  if (q.table === 'profiles' && q.op === 'upsert') return { data: { ...stored, ...q.payload }, error: null }
  return { data: null, error: null }
})
mock.module('../src/config/supabase.js', { namedExports: { supabase: fake.client, createAuthClient: () => fake.client } })
const { updateMyProfile } = await import('../src/controllers/profileController.js')

const call = async (body) => {
  const res = { statusCode: 200, body: null, status(c) { this.statusCode = c; return this }, json(b) { this.body = b; return this } }
  await updateMyProfile({ user: { id: '11111111-1111-1111-1111-111111111111' }, body }, res)
  return res
}

test('gender can be set the first time', async () => {
  stored = { gender: null }
  const res = await call({ gender: 'female' })
  assert.equal(res.statusCode, 200)
})

test("gender can't be changed once set", async () => {
  stored = { gender: 'male' }
  const res = await call({ gender: 'female' })
  assert.equal(res.statusCode, 400)
  assert.match(res.body.error, /Gender can't be changed/)
})

test('sending the same gender again is fine', async () => {
  stored = { gender: 'male' }
  assert.equal((await call({ gender: 'male', bio: 'hi' })).statusCode, 200)
})

test('orientation can still be changed', async () => {
  stored = { gender: 'male', orientation: 'heterosexual' }
  assert.equal((await call({ orientation: 'bisexual' })).statusCode, 200)
})
