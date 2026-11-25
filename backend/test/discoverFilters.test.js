import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyDiscoverFilters } from '../src/services/discoverFilters.js'
import { distanceKm, boundingBox, roundedDistance } from '../src/utils/geo.js'
import { discoverQuery } from '../src/validation/schemas.js'

// Records every filter call so we can see what would be sent to the database
const recorder = () => {
  const calls = []
  const q = new Proxy({}, { get: (_, op) => (...args) => { calls.push([op, ...args]); return q } })
  return { q, calls }
}
const today = new Date('2026-11-24T12:00:00Z')

test('filters from the URL are read and checked', () => {
  const f = discoverQuery.parse({ lookingFor: 'long_term,casual', interests: 'Travel,Music', minAge: '25', maxDistanceKm: '50' })
  assert.deepEqual(f.lookingFor, ['long_term', 'casual'])
  assert.deepEqual(f.interests, ['Travel', 'Music'])
  assert.equal(f.minAge, 25)
  assert.equal(f.maxDistanceKm, 50)
  assert.equal(discoverQuery.safeParse({ lookingFor: 'dating' }).success, false)
  assert.equal(discoverQuery.safeParse({ minAge: '12' }).success, false)
})

test('no filters means no extra conditions', () => {
  const { q, calls } = recorder()
  applyDiscoverFilters(q, {}, null, today)
  assert.deepEqual(calls, [])
})

test('looking for, interests and height become database filters', () => {
  const { q, calls } = recorder()
  applyDiscoverFilters(q, { lookingFor: ['casual'], interests: ['Travel'], minHeight: 160, maxHeight: 190 }, null, today)
  assert.deepEqual(calls, [
    ['in', 'looking_for', ['casual']],
    ['overlaps', 'interests', ['Travel']],
    ['gte', 'height_cm', 160],
    ['lte', 'height_cm', 190],
  ])
})

test('age 25-30 means born between 1995-11-25 and 2001-11-24', () => {
  const { q, calls } = recorder()
  applyDiscoverFilters(q, { minAge: 25, maxAge: 30 }, null, today)
  const [op, expr] = calls[0]
  assert.equal(op, 'or')
  assert.match(expr, /date_of_birth\.lte\.2001-11-24/)
  assert.match(expr, /date_of_birth\.gt\.1995-11-24/)
  assert.match(expr, /date_of_birth\.is\.null,age\.gte\.25,age\.lte\.30/)
})

test('distance needs your own location, otherwise it is ignored', () => {
  const none = recorder()
  applyDiscoverFilters(none.q, { maxDistanceKm: 50 }, { country: 'US' }, today)
  assert.deepEqual(none.calls, [])

  const some = recorder()
  applyDiscoverFilters(some.q, { maxDistanceKm: 50 }, { location_lat: 41.88, location_lng: -87.63 }, today)
  assert.deepEqual(some.calls.map(c => c[1]), ['location_lat', 'location_lat', 'location_lng', 'location_lng'])
})

test('distance math is right (Chicago to Milwaukee is about 130 km)', () => {
  const km = distanceKm(41.8781, -87.6298, 43.0389, -87.9065)
  assert.ok(km > 125 && km < 135, String(km))
  const box = boundingBox(41.88, -87.63, 50)
  assert.ok(box.minLat < 41.88 && box.maxLat > 41.88)
})

test('cards never say 0 km', () => {
  assert.equal(roundedDistance(0.2), 1)
  assert.equal(roundedDistance(12.6), 13)
})
