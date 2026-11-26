import crypto from 'node:crypto'

// Sign in with Apple: when someone deletes their account, Apple asks apps to
// revoke the Apple sign-in too (App Store guideline 5.1.1(v)), so Velkiz
// disappears from their Apple ID's "Sign in with Apple" list.
//
// Needs a Sign in with Apple key (developer.apple.com > Keys > Sign in with
// Apple). Without these settings, deletion still works, it just skips this.
//   APPLE_SIGNIN_KEY_ID, APPLE_SIGNIN_KEY (the .p8), APPLE_TEAM_ID,
//   APPLE_CLIENT_ID (defaults to com.velkiz.app)

const config = () => {
  const { APPLE_SIGNIN_KEY_ID, APPLE_SIGNIN_KEY, APPLE_TEAM_ID, APNS_TEAM_ID } = process.env
  const teamId = APPLE_TEAM_ID || APNS_TEAM_ID
  if (!APPLE_SIGNIN_KEY_ID || !APPLE_SIGNIN_KEY || !teamId) return null
  return {
    keyId: APPLE_SIGNIN_KEY_ID,
    key: APPLE_SIGNIN_KEY.replace(/\\n/g, '\n'),
    teamId,
    clientId: process.env.APPLE_CLIENT_ID || 'com.velkiz.app',
  }
}

// Apple's "client secret" is a short-lived token we sign with the key
export const clientSecret = (cfg, now = Math.floor(Date.now() / 1000)) => {
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const unsigned = `${b64({ alg: 'ES256', kid: cfg.keyId })}.${b64({
    iss: cfg.teamId, iat: now, exp: now + 300, aud: 'https://appleid.apple.com', sub: cfg.clientId,
  })}`
  const signature = crypto.sign('sha256', Buffer.from(unsigned), { key: cfg.key, dsaEncoding: 'ieee-p1363' })
  return `${unsigned}.${signature.toString('base64url')}`
}

const post = (path, params) => fetch(`https://appleid.apple.com${path}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(params),
  signal: AbortSignal.timeout(10_000),
})

// authorizationCode comes from a fresh Apple sign-in in the app (it's only
// valid for 5 minutes). Never throws: deleting the account matters more.
export const revokeAppleSignIn = async (authorizationCode) => {
  const cfg = config()
  if (!cfg || !authorizationCode) return false
  try {
    const secret = clientSecret(cfg)
    const tokenRes = await post('/auth/token', {
      client_id: cfg.clientId, client_secret: secret, code: authorizationCode, grant_type: 'authorization_code',
    })
    const tokens = await tokenRes.json().catch(() => ({}))
    const token = tokens.refresh_token || tokens.access_token
    if (!tokenRes.ok || !token) {
      console.error('Apple token exchange failed:', tokenRes.status, tokens.error)
      return false
    }
    const revokeRes = await post('/auth/revoke', {
      client_id: cfg.clientId, client_secret: secret, token,
      token_type_hint: tokens.refresh_token ? 'refresh_token' : 'access_token',
    })
    if (!revokeRes.ok) console.error('Apple revoke failed:', revokeRes.status)
    return revokeRes.ok
  } catch (err) {
    console.error('Apple revoke error:', err.message)
    return false
  }
}
