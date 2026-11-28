import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeInterests, withOldNames } from '../src/utils/interests.js'

test('old explicit tags map to softer names without duplicates', () => {
  assert.deepEqual(normalizeInterests(['Sexting', 'BDSM', 'Submissive', 'Music']), ['Flirting', 'Bold', 'Music'])
})

test('filter on a new name also matches profiles that still store old names', () => {
  const names = withOldNames(['Bold'])
  for (const n of ['Bold', 'BDSM', 'Kink Friendly', 'Submissive']) assert.ok(names.includes(n))
})

test('non-array input passes through', () => {
  assert.equal(normalizeInterests(undefined), undefined)
})
