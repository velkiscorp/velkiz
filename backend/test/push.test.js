import { test, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { EventEmitter } from 'node:events'
import { createFakeSupabase } from './fakeSupabase.js'

const USER = '11111111-1111-4111-8111-111111111111'
let db, sent

const fake = createFakeSupabase((q) => {
  if (q.table === 'profiles') return { data: db.prefs, error: null }
  if (q.table === 'device_tokens' && q.op === 'delete') { db.deleted.push(...q.filters.find(f => f[0] === 'in')[2]); return { error: null } }
  if (q.table === 'device_tokens') return { data: db.devices, error: null }
  return { data: null, error: null }
})
mock.module('../src/config/supabase.js', { namedExports: { supabase: fake.client, createAuthClient: () => fake.client } })

// A stand-in for Apple: records each request, answers from db.apple
const fakeSession = () => {
  const s = new EventEmitter()
  s.unref = () => {}
  s.request = (headers) => {
    const req = new EventEmitter()
    req.setEncoding = () => {}
    req.setTimeout = () => {}
    req.close = () => {}
    req.end = (body) => {
      const token = headers[':path'].split('/').pop()
      sent.push({ token, headers, body: JSON.parse(body) })
      const answer = db.apple[token] || { status: 200 }
      setImmediate(() => {
        req.emit('response', { ':status': answer.status })
        if (answer.reason) req.emit('data', JSON.stringify({ reason: answer.reason }))
        req.emit('end')
      })
    }
    return req
  }
  return s
}
mock.module('node:http2', { defaultExport: { connect: fakeSession }, namedExports: { connect: fakeSession } })

const { notifyUser, MESSAGES } = await import('../src/services/push.js')

const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })
const configure = () => {
  process.env.APNS_KEY_ID = 'KEY123'
  process.env.APNS_TEAM_ID = 'TEAM123'
  process.env.APNS_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' })
}

beforeEach(() => {
  db = { prefs: { notify_matches: true, notify_messages: true }, devices: [{ token: 'aa'.repeat(32) }], deleted: [], apple: {} }
  sent = []
  configure()
})

test('without Apple keys nothing is sent', async () => {
  delete process.env.APNS_KEY
  await notifyUser(USER, 'message')
  assert.equal(sent.length, 0)
})

test('a new message sends a notification with no name or text in it', async () => {
  await notifyUser(USER, 'message', { matchId: 'm1' })
  assert.equal(sent.length, 1)
  assert.deepEqual(sent[0].body.aps.alert, MESSAGES.message)
  assert.equal(sent[0].body.matchId, 'm1')
  assert.equal(sent[0].headers['apns-topic'], 'com.velkiz.app')
  assert.match(sent[0].headers.authorization, /^bearer [\w-]+\.[\w-]+\.[\w-]+$/)
})

test('turning off message notifications stops them, matches still come', async () => {
  db.prefs = { notify_matches: true, notify_messages: false }
  await notifyUser(USER, 'message')
  assert.equal(sent.length, 0)
  db.prefs = { notify_matches: true }
  await notifyUser(USER, 'match')
  assert.equal(sent.length, 1)
})

test('phones Apple says are gone are forgotten', async () => {
  const live = 'aa'.repeat(32), gone = 'bb'.repeat(32), bad = 'cc'.repeat(32)
  db.devices = [{ token: live }, { token: gone }, { token: bad }]
  db.apple = { [gone]: { status: 410, reason: 'Unregistered' }, [bad]: { status: 400, reason: 'BadDeviceToken' } }
  await notifyUser(USER, 'match')
  assert.equal(sent.length, 3)
  assert.deepEqual(db.deleted.sort(), [bad, gone].sort())
})
