import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildProfile, seedEmail, CITIES } from '../scripts/seed/profiles.js'
import { placeholderPng } from '../scripts/seed/placeholderPhoto.js'
import { updateProfileBody } from '../src/validation/schemas.js'
import { ageFromDob } from '../src/utils/age.js'

const today = new Date('2026-11-25T12:00:00Z')
const all = Array.from({ length: 50 }, (_, k) => buildProfile(k + 1, { cities: CITIES, today }))

test('every seed profile passes the same checks as a real profile update', () => {
  for (const p of all) {
    const { age, is_active, ...body } = p
    const result = updateProfileBody.safeParse(body)
    assert.ok(result.success, `${p.username}: ${JSON.stringify(result.error?.issues)}`)
  }
})

test('seed people are 18 or over and their age matches their date of birth', () => {
  for (const p of all) {
    assert.ok(ageFromDob(p.date_of_birth, today) >= 18, p.username)
    assert.equal(p.age, ageFromDob(p.date_of_birth, today))
  }
})

test('usernames and emails are unique, profiles are finished, cities are spread', () => {
  assert.equal(new Set(all.map(p => p.username)).size, 50)
  assert.equal(new Set(all.map((_, k) => seedEmail(k + 1, 'example.com'))).size, 50)
  assert.ok(all.every(p => p.onboarding_complete))
  assert.equal(new Set(all.map(p => p.city)).size, CITIES.length)
})

test('same index gives the same person', () => {
  assert.deepEqual(buildProfile(7, { cities: CITIES, today }), all[6])
})

test('placeholder photo is a PNG', () => {
  const png = placeholderPng(3)
  assert.deepEqual([...png.subarray(1, 4)], [0x50, 0x4e, 0x47])
})

test('every city has both men and women', () => {
  for (const { city } of CITIES) {
    const here = all.filter(p => p.city === city)
    assert.ok(here.some(p => p.gender === 'male') && here.some(p => p.gender === 'female'), city)
  }
})
