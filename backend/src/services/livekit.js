import crypto from 'node:crypto'

// Voice and video calls run through LiveKit (livekit.io). Media goes through
// LiveKit's servers instead of phone to phone, so neither person ever sees the
// other's IP address. Our server only hands out short-lived room tokens.
//
// Set these on the server (LiveKit Cloud > project > Settings > Keys):
//   LIVEKIT_URL=wss://your-project.livekit.cloud
//   LIVEKIT_API_KEY=API...
//   LIVEKIT_API_SECRET=...
// Without them, calling is turned off and the app hides the call buttons.

export const livekitConfig = () => {
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) return null
  return { url: LIVEKIT_URL, apiKey: LIVEKIT_API_KEY, apiSecret: LIVEKIT_API_SECRET }
}

export const callsEnabled = () => !!livekitConfig()

// LiveKit tokens are plain HS256 JWTs, so no extra package is needed
const signJwt = (payload, secret) => {
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  const unsigned = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}`
  const sig = crypto.createHmac('sha256', secret).update(unsigned).digest('base64url')
  return `${unsigned}.${sig}`
}

// A token that lets one person join one call room. It only has to be valid
// long enough to connect: LiveKit keeps connected people signed in itself.
export const roomToken = (cfg, { room, identity, ttlSeconds = 10 * 60 }) => {
  const now = Math.floor(Date.now() / 1000)
  return signJwt({
    iss: cfg.apiKey,
    sub: identity,
    jti: `${identity}-${now}`,
    nbf: now - 10,
    exp: now + ttlSeconds,
    video: {
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      // Calls carry only audio and video, never chat or files
      canPublishData: false,
    },
  }, cfg.apiSecret)
}

// Close a room so nobody can stay in it or rejoin after the call ends.
// Never throws: the call is over for us either way.
export const deleteRoom = async (cfg, room) => {
  try {
    const now = Math.floor(Date.now() / 1000)
    const token = signJwt({ iss: cfg.apiKey, nbf: now - 10, exp: now + 60, video: { roomCreate: true } }, cfg.apiSecret)
    const host = cfg.url.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:').replace(/\/$/, '')
    const res = await fetch(`${host}/twirp/livekit.RoomService/DeleteRoom`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ room }),
      signal: AbortSignal.timeout(10_000),
    })
    // 404 just means LiveKit already closed the empty room
    if (!res.ok && res.status !== 404) console.error('LiveKit delete room failed:', res.status)
  } catch (err) {
    console.error('LiveKit delete room error:', err?.message || err)
  }
}

export const _test = { signJwt }
