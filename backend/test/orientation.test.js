import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gendersWantedBy, wantsToSeeFilter, applyOrientationFilter } from '../src/services/orientation.js'
import { discoverQuery } from '../src/validation/schemas.js'

const recorder = () => {
  const calls = []
  const q = new Proxy({}, { get: (_, op) => (...args) => { calls.push([op, ...args]); return q } })
  return { q, calls }
}

// Mimics what the "or" filter means, to check it against sample people
const matches = (filter, p) => filter.split(/,(?![^()]*\))/).some(clause => {
  const parts = clause.replace(/^and\((.*)\)$/, '$1').split(',')
  return parts.every(part => {
    const [col, op, val] = part.split('.')
    return op === 'is' ? p[col] == null : p[col] === val
  })
})

const ALL = ['male', 'female', 'non_binary', 'other']

test('who each orientation sees by default', () => {
  assert.deepEqual(gendersWantedBy('male', 'heterosexual'), ['female'])
  assert.deepEqual(gendersWantedBy('female', 'heterosexual'), ['male'])
  assert.deepEqual(gendersWantedBy('male', 'gay'), ['male'])
  assert.deepEqual(gendersWantedBy('female', 'lesbian'), ['female'])
  assert.deepEqual(gendersWantedBy('female', 'bisexual'), ALL)
  assert.deepEqual(gendersWantedBy('non_binary', 'pansexual'), ALL)
  assert.deepEqual(gendersWantedBy(null, null), ALL)
})

test('a straight man sees straight and bi women, not lesbians or men', () => {
  const { q, calls } = recorder()
  applyOrientationFilter(q, { gender: 'male', orientation: 'heterosexual' })
  assert.deepEqual(calls[0], ['in', 'gender', ['female']])
  const [op, filter] = calls[1]
  assert.equal(op, 'or')
  assert.ok(matches(filter, { gender: 'female', orientation: 'heterosexual' }))
  assert.ok(matches(filter, { gender: 'female', orientation: 'bisexual' }))
  assert.ok(!matches(filter, { gender: 'female', orientation: 'lesbian' }))
  assert.ok(!matches(filter, { gender: 'male', orientation: 'heterosexual' }))
})

test('a straight woman and a straight man see each other', () => {
  const woman = { gender: 'female', orientation: 'heterosexual' }
  const man = { gender: 'male', orientation: 'heterosexual' }
  assert.ok(matches(wantsToSeeFilter('female'), man))
  assert.ok(matches(wantsToSeeFilter('male'), woman))
})

test('a gay man sees gay and bi men, never straight men', () => {
  const f = wantsToSeeFilter('male')
  assert.ok(matches(f, { gender: 'male', orientation: 'gay' }))
  assert.ok(matches(f, { gender: 'male', orientation: 'bisexual' }))
  assert.ok(!matches(f, { gender: 'male', orientation: 'heterosexual' }))
})

test('people with no orientation set still show up for everyone', () => {
  assert.ok(matches(wantsToSeeFilter('male'), { gender: 'female', orientation: null }))
})

test('picking "Show me" overrides the orientation default, but stays two-way', () => {
  const { q, calls } = recorder()
  applyOrientationFilter(q, { gender: 'male', orientation: 'heterosexual' }, ['male', 'female'])
  assert.deepEqual(calls[0], ['in', 'gender', ['male', 'female']])
  assert.equal(calls[1][0], 'or')
})

test('bi with no "Show me" adds no gender limit', () => {
  const { q, calls } = recorder()
  applyOrientationFilter(q, { gender: 'female', orientation: 'bisexual' })
  assert.deepEqual(calls.map(c => c[0]), ['or'])
})

test('showMe is read from the URL and checked', () => {
  assert.deepEqual(discoverQuery.parse({ showMe: 'male,female' }).showMe, ['male', 'female'])
  assert.equal(discoverQuery.safeParse({ showMe: 'robots' }).success, false)
})
