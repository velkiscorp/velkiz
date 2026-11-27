import http2 from 'node:http2'
import crypto from 'node:crypto'
import { supabase } from '../config/supabase.js'

// Push notifications to iPhones through Apple (APNs), with no extra packages.
//
// Set these in backend/.env (from developer.apple.com > Keys, with "Apple Push
// Notifications service" ticked):
//   APNS_KEY_ID=ABC123DEFG
//   APNS_TEAM_ID=XYZ987TEAM
//   APNS_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"  (the .p8 file)
//   APNS_BUNDLE_ID=com.velkiz.app
//   APNS_PRODUCTION=true   (leave out while testing from Xcode)
// Without them, notifications are simply skipped.
//
// Anonymity: notifications never include names or message text, because
// they show on the lock screen where anyone nearby can read them.

export const MESSAGES = {
  match: { title: 'Velkiz', body: 'You have a new match' },
  message: { title: 'Velkiz', body: 'You have a new message' },
  screenshot: { title: 'Velkiz', body: 'A match took a screenshot of your chat' },
  superlike: { title: 'Velkiz', body: 'Someone Super Liked you' },
  call: { title: 'Velkiz', body: 'A match is calling you' },
  missedcall: { title: 'Velkiz', body: 'You missed a call from a match' },
}

const config = () => {
  const { APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY, APNS_BUNDLE_ID } = process.env
  if (!APNS_KEY_ID || !APNS_TEAM_ID || !APNS_KEY) return null
  return {
    keyId: APNS_KEY_ID,
    teamId: APNS_TEAM_ID,
    key: APNS_KEY.replace(/\\n/g, '\n'),
    bundleId: APNS_BUNDLE_ID || 'com.velkiz.app',
    host: process.env.APNS_PRODUCTION === 'true' ? 'https://api.push.apple.com' : 'https://api.sandbox.push.apple.com',
  }
}

// Apple wants a signed token, reused for up to an hour (we renew every 50 min)
let cachedJwt = null
const providerToken = (cfg) => {
  const now = Math.floor(Date.now() / 1000)
  if (cachedJwt && now - cachedJwt.iat < 50 * 60) return cachedJwt.token
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const unsigned = `${b64({ alg: 'ES256', kid: cfg.keyId })}.${b64({ iss: cfg.teamId, iat: now })}`
  const signature = crypto.sign('sha256', Buffer.from(unsigned), { key: cfg.key, dsaEncoding: 'ieee-p1363' })
  cachedJwt = { iat: now, token: `${unsigned}.${signature.toString('base64url')}` }
  return cachedJwt.token
}

let session = null
const getSession = (host) => {
  if (session && !session.closed && !session.destroyed) return session
  session = http2.connect(host)
  session.on('error', () => { session = null })
  session.on('goaway', () => { session = null })
  // Don't keep the process alive just for this connection
  session.unref()
  return session
}

// Send one notification to one phone. Resolves { status, reason }.
const sendToDevice = (cfg, token, payload) => new Promise((resolve) => {
  try {
    const req = getSession(cfg.host).request({
      ':method': 'POST',
      ':path': `/3/device/${token}`,
      authorization: `bearer ${providerToken(cfg)}`,
      'apns-topic': cfg.bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
    })
    let status = 0
    let body = ''
    req.setEncoding('utf8')
    req.on('response', (headers) => { status = headers[':status'] })
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      let reason = null
      try { reason = body ? JSON.parse(body).reason : null } catch {}
      resolve({ status, reason })
    })
    req.on('error', (err) => resolve({ status: 0, reason: err.message }))
    req.setTimeout(10000, () => { req.close(); resolve({ status: 0, reason: 'timeout' }) })
    req.end(JSON.stringify(payload))
  } catch (err) {
    resolve({ status: 0, reason: err.message })
  }
})

// Apple says this phone token is dead: stop using it
const isDeadToken = ({ status, reason }) =>
  status === 410 || reason === 'BadDeviceToken' || reason === 'Unregistered' || reason === 'DeviceTokenNotForTopic'

const PREF = { match: 'notify_matches', message: 'notify_messages', screenshot: 'notify_messages', superlike: 'notify_matches', call: 'notify_messages', missedcall: 'notify_messages' }

// Notify a user about a new match or message, if they allow it.
// Never throws: a failed notification must not fail the swipe or message.
export const notifyUser = async (userId, kind, data = {}) => {
  try {
    const cfg = config()
    if (!cfg) return

    const { data: profile } = await supabase
      .from('profiles')
      .select(PREF[kind])
      .eq('user_id', userId)
      .maybeSingle()
    if (profile && profile[PREF[kind]] === false) return

    const { data: devices } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId)
    if (!devices?.length) return

    const payload = {
      aps: { alert: MESSAGES[kind], sound: 'default', 'thread-id': kind },
      // The app opens the right screen when the notification is tapped
      kind,
      ...data,
    }

    const results = await Promise.all(devices.map(d => sendToDevice(cfg, d.token, payload)))
    const dead = devices.filter((d, i) => isDeadToken(results[i])).map(d => d.token)
    if (dead.length) await supabase.from('device_tokens').delete().in('token', dead)
  } catch (err) {
    console.error('Push notification error:', err?.message || err)
  }
}

export const _test = { isDeadToken, config }
