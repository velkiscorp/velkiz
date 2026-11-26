import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as S from '../src/validation/schemas.js'

const PHOTO = 'https://test.supabase.co/storage/v1/object/public/photos/'
const ok = (schema, value) => schema.safeParse(value).success

test('signup: email is trimmed and lowercased, password needs 8+ characters', () => {
  assert.deepEqual(S.signupBody.parse({ email: ' Mel@Example.COM ', password: '12345678', acceptedTerms: true }),
    { email: 'mel@example.com', password: '12345678', acceptedTerms: true })
  assert.equal(ok(S.signupBody, { email: 'not-an-email', password: '12345678', acceptedTerms: true }), false)
  assert.equal(ok(S.signupBody, { email: 'a@b.com', password: 'short', acceptedTerms: true }), false)
})

test('signing up needs the Terms and 18+ box ticked', () => {
  assert.equal(ok(S.signupBody, { email: 'a@b.com', password: '12345678' }), false)
  assert.equal(ok(S.signupBody, { email: 'a@b.com', password: '12345678', acceptedTerms: false }), false)
})

test('usernames are lowercased and only allow a-z 0-9 _ .', () => {
  assert.equal(S.username.parse('MEL_1'), 'mel_1')
  for (const bad of ['ab', 'has space', 'emoji😀', 'x'.repeat(25), 'dash-name']) {
    assert.equal(ok(S.username, bad), false, bad)
  }
})

test('date of birth must be a real YYYY-MM-DD date', () => {
  assert.equal(ok(S.dateOfBirth, '2000-01-31'), true)
  for (const bad of ['2000-02-30', '2000-13-01', '31-01-2000', '2000/01/31']) {
    assert.equal(ok(S.dateOfBirth, bad), false, bad)
  }
})

test('profile updates drop unknown fields and the old age field', () => {
  const parsed = S.updateProfileBody.parse({ bio: 'hi', age: 12, is_admin: true })
  assert.deepEqual(parsed, { bio: 'hi' })
})

test('photos must come from our own storage, max 4', () => {
  assert.equal(ok(S.updateProfileBody, { photos: [{ url: PHOTO + 'u/a.jpg' }] }), true)
  assert.equal(ok(S.updateProfileBody, { photos: [{ url: 'https://evil.example/a.jpg' }] }), false)
  const five = Array.from({ length: 5 }, (_, i) => ({ url: `${PHOTO}u/${i}.jpg` }))
  assert.equal(ok(S.updateProfileBody, { photos: five }), false)
})

test('swipes need a real user id and a known direction', () => {
  const id = '3f2b8c1e-9a4d-4e2b-8f1a-2c3d4e5f6a7b'
  assert.equal(ok(S.swipeBody, { targetId: id, direction: 'right' }), true)
  assert.equal(ok(S.swipeBody, { targetId: id, direction: 'sideways' }), false)
  assert.equal(ok(S.swipeBody, { targetId: 'nope', direction: 'left' }), false)
})

test('messages are trimmed, not empty, at most 2000 characters', () => {
  assert.equal(S.sendMessageBody.parse({ content: '  hi  ' }).content, 'hi')
  assert.equal(ok(S.sendMessageBody, { content: '   ' }), false)
  assert.equal(ok(S.sendMessageBody, { content: 'x'.repeat(2001) }), false)
})

test('Discover paging has safe defaults and limits', () => {
  assert.deepEqual(S.discoverQuery.parse({}), { limit: 20, offset: 0 })
  assert.equal(ok(S.discoverQuery, { limit: '500' }), false)
})

test('deleting an account needs a password', () => {
  assert.equal(ok(S.deleteAccountBody, { password: '' }), false)
  assert.equal(ok(S.deleteAccountBody, { password: 'x' }), true)
  assert.equal(ok(S.deleteAccountBody, {}), true)
})

test('height is 120-230 cm or empty, couple is a yes/no', () => {
  assert.equal(ok(S.updateProfileBody, { height_cm: 175, is_couple: true }), true)
  assert.equal(ok(S.updateProfileBody, { height_cm: null }), true)
  assert.equal(ok(S.updateProfileBody, { height_cm: 90 }), false)
  assert.equal(ok(S.updateProfileBody, { height_cm: 175.5 }), false)
})

test('looking for uses the new options; the old "dating" is gone', () => {
  for (const v of ['long_term', 'short_term', 'casual', 'online', 'friends', 'open']) {
    assert.equal(ok(S.updateProfileBody, { looking_for: v }), true, v)
  }
  assert.equal(ok(S.updateProfileBody, { looking_for: 'dating' }), false)
})
