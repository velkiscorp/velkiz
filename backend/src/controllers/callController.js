import { callsEnabled } from '../services/livekit.js'
import { startCall, acceptCall, declineCall, hangUp, CallError } from '../services/calls.js'

const handle = (label, fn) => async (req, res) => {
  try {
    await fn(req, res)
  } catch (err) {
    if (err instanceof CallError) return res.status(err.status).json({ error: err.message })
    console.error(`${label} error:`, err)
    res.status(500).json({ error: 'Something went wrong with the call' })
  }
}

// GET /api/calls/config - lets the app hide the call buttons until calls are set up
export const getConfig = (req, res) => res.json({ enabled: callsEnabled() })

// POST /api/calls/match/:matchId  { video }
export const start = handle('Start call', async (req, res) => {
  const result = await startCall({
    matchId: req.params.matchId,
    callerId: req.user.id,
    video: !!req.body?.video,
    io: req.app.get('io'),
  })
  res.status(201).json(result)
})

// POST /api/calls/:callId/accept
export const accept = handle('Accept call', async (req, res) => {
  res.json(acceptCall({ callId: req.params.callId, userId: req.user.id, io: req.app.get('io') }))
})

// POST /api/calls/:callId/decline
export const decline = handle('Decline call', async (req, res) => {
  declineCall({ callId: req.params.callId, userId: req.user.id, io: req.app.get('io') })
  res.json({ ok: true })
})

// POST /api/calls/:callId/end
export const end = handle('End call', async (req, res) => {
  hangUp({ callId: req.params.callId, userId: req.user.id, io: req.app.get('io') })
  res.json({ ok: true })
})
