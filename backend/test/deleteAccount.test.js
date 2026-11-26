import { test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const ME = '11111111-1111-4111-8111-111111111111'
let state

const supabase = {
  auth: {
    admin: {
      getUserById: async () => ({ data: { user: state.user }, error: null }),
      updateUserById: async (id, attrs) => { state.updated = attrs; return { error: null } },
    },
  },
}
const createAuthClient = () => ({
  auth: { signInWithPassword: async ({ password }) => ({ error: password === 'right' ? null : { message: 'bad' } }) },
})
mock.module('../src/config/supabase.js', { namedExports: { supabase, createAuthClient } })
mock.module('../src/services/deleteAccount.js', { namedExports: { deleteAccountData: async () => { state.deleted = true } } })
mock.module('../src/services/appleSignIn.js', { namedExports: { revokeAppleSignIn: async (code) => { state.revoked = code; return true } } })
const { deleteAccount, acceptTerms } = await import('../src/controllers/authController.js')

const call = async (fn, body = {}) => {
  const r = { status: 200 }
  const res = { status(s) { r.status = s; return this }, json(j) { r.json = j; return this } }
  await fn({ user: { id: ME }, body, app: { get: () => null } }, res)
  return r
}

const emailUser = { id: ME, email: 'a@b.co', identities: [{ provider: 'email' }], last_sign_in_at: new Date().toISOString() }
const appleUser = (minutesAgo) => ({
  id: ME, email: 'x@privaterelay.appleid.com', identities: [{ provider: 'apple' }], app_metadata: { provider: 'apple' },
  last_sign_in_at: new Date(Date.now() - minutesAgo * 60e3).toISOString(),
})

beforeEach(() => { state = { user: null, deleted: false, revoked: null, updated: null } })

test('email accounts need the right password', async () => {
  state.user = emailUser
  assert.equal((await call(deleteAccount, {})).json.code, 'PASSWORD_REQUIRED')
  assert.equal((await call(deleteAccount, { password: 'wrong' })).status, 403)
  assert.equal(state.deleted, false)
  assert.equal((await call(deleteAccount, { password: 'right' })).json.deleted, true)
  assert.equal(state.deleted, true)
})

test('Apple accounts must have just signed in with Apple again', async () => {
  state.user = appleUser(30)
  const r = await call(deleteAccount, {})
  assert.equal(r.json.code, 'REAUTH_REQUIRED')
  assert.equal(state.deleted, false)
})

test('Apple accounts delete after a fresh sign-in, and Apple sign-in is revoked', async () => {
  state.user = appleUser(1)
  const r = await call(deleteAccount, { appleAuthorizationCode: 'code123' })
  assert.equal(r.json.deleted, true)
  assert.equal(state.deleted, true)
  assert.equal(state.revoked, 'code123')
})

test('accepting the Terms is recorded once per version', async () => {
  state.user = { id: ME, user_metadata: {} }
  await call(acceptTerms, { acceptedTerms: true })
  assert.ok(state.updated.user_metadata.terms_accepted_at)
  state.updated = null
  state.user = { id: ME, user_metadata: { terms_version: '2026-11-26' } }
  await call(acceptTerms, { acceptedTerms: true })
  assert.equal(state.updated, null)
})
