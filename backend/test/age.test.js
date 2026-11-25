import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ageFromDob, profileAge } from '../src/utils/age.js'

const now = new Date('2026-11-24T12:00:00Z')

test('18th birthday today counts as 18', () => {
  assert.equal(ageFromDob('2008-11-24', now), 18)
})

test('one day before the 18th birthday is still 17', () => {
  assert.equal(ageFromDob('2008-11-25', now), 17)
})

test('leap-day birthdays work', () => {
  assert.equal(ageFromDob('2000-02-29', now), 26)
})

test('missing or broken dates give null', () => {
  assert.equal(ageFromDob(null, now), null)
  assert.equal(ageFromDob('nope', now), null)
})

test('profiles use date of birth first, then the old age column', () => {
  assert.equal(profileAge({ date_of_birth: '2000-01-01', age: 99 }) >= 26, true)
  assert.equal(profileAge({ age: 30 }), 30)
  assert.equal(profileAge({}), null)
})
