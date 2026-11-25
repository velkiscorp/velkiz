import { test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createFakeSupabase, filterValue } from './fakeSupabase.js'

// Pretend database: who has which photos, and who blocked whom
const ME = '11111111-1111-1111-1111-111111111111'
const OTHER = '22222222-2222-2222-2222-222222222222'
const PREFIX = 'https://test.supabase.co/storage/v1/object/public/photos/'
let db

const fake = createFakeSupabase((q) => {
  if (q.table === 'profiles') {
    const id = filterValue(q, 'eq', 'user_id')
    const p = db.profiles.find(p => p.user_id === id) || null
    return { data: q.single ? p : (p ? [p] : []), error: null }
  }
  if (q.table === 'blocked_users') return { data: db.blocked ? [{ id: 'b' }] : [], error: null }
  return { data: null, error: null }
})
mock.module('../src/config/supabase.js', { namedExports: { supabase: fake.client, createAuthClient: () => fake.client } })
const { canViewPhoto, photoAllowedForUser } = await import('../src/services/photos.js')

beforeEach(() => {
  db = {
    blocked: false,
    profiles: [{ user_id: OTHER, onboarding_complete: true, photos: [{ url: `${PREFIX}${OTHER}/a.jpg` }], photo_url: null }],
  }
})

test('you can always see your own uploads, even unsaved ones', async () => {
  assert.equal(await canViewPhoto(ME, `${ME}/new.jpg`), true)
})

test('you can see a photo that is on someone\'s finished profile', async () => {
  assert.equal(await canViewPhoto(ME, `${OTHER}/a.jpg`), true)
})

test('blocked either way: no photos', async () => {
  db.blocked = true
  assert.equal(await canViewPhoto(ME, `${OTHER}/a.jpg`), false)
})

test('a photo they removed from their profile is no longer visible', async () => {
  assert.equal(await canViewPhoto(ME, `${OTHER}/removed.jpg`), false)
})

test('profiles that haven\'t finished onboarding don\'t share photos', async () => {
  db.profiles[0].onboarding_complete = false
  assert.equal(await canViewPhoto(ME, `${OTHER}/a.jpg`), false)
})

test('you can\'t put someone else\'s photo on your profile', () => {
  assert.equal(photoAllowedForUser(`${PREFIX}${OTHER}/a.jpg`, ME, null), false)
  assert.equal(photoAllowedForUser(`${PREFIX}${ME}/mine.jpg`, ME, null), true)
  assert.equal(photoAllowedForUser('https://evil.example/x.jpg', ME, null), false)
})
