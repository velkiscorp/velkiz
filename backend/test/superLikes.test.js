import { test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createFakeSupabase } from './fakeSupabase.js'

const ME = '11111111-1111-4111-8111-111111111111'
const THEM = '22222222-2222-4222-8222-222222222222'
let db

const fake = createFakeSupabase((q) => {
  if (q.rpc === 'use_super_like') return { data: db.available.shift() ?? null, error: null }
  if (q.rpc === 'refund_super_like') { db.refunds.push(q.args.p_kind); return { data: null, error: null } }
  if (q.rpc === 'add_super_like_purchase') {
    const isNew = !db.seen.has(q.args.p_transaction)
    db.seen.add(q.args.p_transaction)
    if (isNew) db.added.push(q.args)
    return { data: isNew, error: null }
  }
  if (q.rpc === 'refund_super_like_purchase') return { data: true, error: null }
  const { table, op } = q
  if (table === 'profiles') return { data: { user_id: THEM, username: 'them', photos: [] }, error: null }
  if (table === 'blocked_users') return { data: [], error: null }
  if (table === 'super_like_balances') return { data: db.balance, error: null }
  if (table === 'swipes' && op === 'insert') {
    return db.alreadySwiped ? { data: null, error: { code: '23505' } } : { data: { id: 's1', ...q.payload }, error: null }
  }
  return { data: null, error: null }
})
mock.module('../src/config/supabase.js', { namedExports: { supabase: fake.client, createAuthClient: () => fake.client } })
const { createSwipe } = await import('../src/controllers/swipeController.js')
const { revenuecatWebhook } = await import('../src/controllers/superLikeController.js')
const { packSize, getBalance } = await import('../src/services/superLikes.js')

const respond = () => {
  const r = { status: 200, json: null }
  r.res = { status(s) { r.status = s; return this }, json(j) { r.json = j; return this } }
  return r
}
const swipe = async (direction) => {
  const r = respond()
  await createSwipe({ user: { id: ME }, body: { targetId: THEM, direction } }, r.res)
  return r
}
const webhook = async (event, auth = 'Bearer s3cret') => {
  const r = respond()
  await revenuecatWebhook({ headers: { authorization: auth }, body: { event } }, r.res)
  return r
}

beforeEach(() => {
  process.env.REVENUECAT_WEBHOOK_SECRET = 's3cret'
  db = { available: [], refunds: [], seen: new Set(), added: [], balance: null, alreadySwiped: false }
})

test('a Super Like with one available goes through', async () => {
  db.available = ['free']
  const r = await swipe('super')
  assert.equal(r.status, 201)
})

test('a Super Like with none left is refused with a clear code', async () => {
  const r = await swipe('super')
  assert.equal(r.status, 402)
  assert.equal(r.json.code, 'NO_SUPER_LIKES')
})

test('a normal like never spends a Super Like', async () => {
  const before = fake.calls.filter(c => c.rpc === 'use_super_like').length
  const r = await swipe('right')
  assert.equal(r.status, 201)
  assert.equal(fake.calls.filter(c => c.rpc === 'use_super_like').length, before)
})

test('a Super Like on someone already swiped is given back', async () => {
  db.available = ['purchased']
  db.alreadySwiped = true
  const r = await swipe('super')
  assert.equal(r.status, 400)
  assert.deepEqual(db.refunds, ['purchased'])
})

test('pack size comes from the product id', () => {
  assert.equal(packSize('velkiz_superlikes_5'), 5)
  assert.equal(packSize('velkiz_superlikes_15'), 15)
  assert.equal(packSize('velkiz_plus_monthly'), null)
  assert.equal(packSize('velkiz_superlikes_5000'), null)
})

test('balance: free one is back after 24 hours', async () => {
  db.balance = { purchased: 3, free_used_at: new Date(Date.now() - 25 * 3600e3).toISOString() }
  assert.deepEqual(await getBalance(ME), { freeAvailable: true, nextFreeAt: null, purchased: 3, total: 4 })
  db.balance = { purchased: 0, free_used_at: new Date().toISOString() }
  const b = await getBalance(ME)
  assert.equal(b.freeAvailable, false)
  assert.equal(b.total, 0)
  assert.ok(b.nextFreeAt)
})

test('webhook without the secret is refused', async () => {
  const r = await webhook({ type: 'NON_RENEWING_PURCHASE' }, 'Bearer wrong')
  assert.equal(r.status, 401)
  const r2 = await webhook({ type: 'NON_RENEWING_PURCHASE' }, null)
  assert.equal(r2.status, 401)
})

test('webhook adds a purchase once, even if sent twice', async () => {
  const event = { type: 'NON_RENEWING_PURCHASE', app_user_id: ME, product_id: 'velkiz_superlikes_5', transaction_id: 't1', store: 'APP_STORE' }
  const first = await webhook(event)
  const again = await webhook(event)
  assert.equal(first.json.added, true)
  assert.equal(again.json.added, false)
  assert.equal(db.added.length, 1)
  assert.equal(db.added[0].p_quantity, 5)
})

test('webhook skips purchases it cannot place', async () => {
  const r = await webhook({ type: 'NON_RENEWING_PURCHASE', app_user_id: '$RCAnonymousID:abc', product_id: 'velkiz_superlikes_5', transaction_id: 't2' })
  assert.equal(r.json.skipped, true)
  assert.equal(db.added.length, 0)
})

test('webhook takes back a refunded pack', async () => {
  const r = await webhook({ type: 'CANCELLATION', app_user_id: ME, product_id: 'velkiz_superlikes_5', transaction_id: 't1' })
  assert.equal(r.json.refunded, true)
})
