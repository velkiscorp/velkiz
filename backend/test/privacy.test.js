import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toPublicProfile } from '../src/serializers/profile.js'
import { fuzzyLocation, roundForStorage } from '../src/utils/anonymize.js'
import { containsPhoneNumber } from '../src/utils/phone.js'

const row = {
  user_id: 'u1', username: 'mel', show_age: true, date_of_birth: '2000-01-01',
  email: 'mel@example.com', phone: '+13125550199', gender: 'female', orientation: 'bisexual',
  prompt1: 'p', city: 'Chicago', country: 'US', location_lat: 41.8781, location_lng: -87.6298,
  updated_at: '2026-11-24', photos: [{ url: 'x' }],
}

test('public profiles never include email, phone, birth date or exact location', () => {
  for (const level of ['card', 'match']) {
    const p = toPublicProfile(row, { level })
    for (const field of ['email', 'phone', 'date_of_birth', 'location_lat', 'location_lng', 'user_id']) {
      assert.equal(field in p, false, `${level} leaks ${field}`)
    }
    assert.equal(p.id, 'u1')
  }
})

test('gender, orientation, prompts and last seen are for matches only', () => {
  const card = toPublicProfile(row)
  const match = toPublicProfile(row, { level: 'match' })
  for (const field of ['gender', 'orientation', 'prompt1', 'last_seen']) {
    assert.equal(field in card, false, `card shows ${field}`)
    assert.ok(field in match, `match misses ${field}`)
  }
})

test('age is hidden when show_age is off', () => {
  assert.equal(toPublicProfile({ ...row, show_age: false }).age, null)
})

test('rough location is the same every time (no averaging it back)', () => {
  const a = fuzzyLocation(41.8781, -87.6298)
  const b = fuzzyLocation(41.8781, -87.6298)
  assert.deepEqual(a, b)
  assert.notEqual(a.lat, 41.8781)
})

test('stored location is rounded to about 1 km', () => {
  assert.equal(roundForStorage(41.878113), 41.88)
  assert.equal(roundForStorage(null), null)
})

test('phone numbers in chat are detected', () => {
  for (const t of ['call +1 (312) 555-0199', '312.555.0199', 'text me 07700 900123']) {
    assert.equal(containsPhoneNumber(t), true, t)
  }
  for (const t of ['see you at 7', 'my room is 1204', 'hi']) {
    assert.equal(containsPhoneNumber(t), false, t)
  }
})

test('height and the couple tag show on cards', () => {
  const p = toPublicProfile({ ...row, height_cm: 175, is_couple: true })
  assert.equal(p.height_cm, 175)
  assert.equal(p.is_couple, true)
  assert.equal(toPublicProfile(row).is_couple, false)
})

test('"hide my city" hides the city name from everyone else', () => {
  for (const level of ['card', 'match']) {
    const p = toPublicProfile({ ...row, hide_city: true }, { level })
    assert.equal(p.city, null)
    assert.equal(p.country, 'US')
  }
  assert.equal(toPublicProfile(row).city, 'Chicago')
})
