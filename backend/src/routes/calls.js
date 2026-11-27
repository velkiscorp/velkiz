import express from 'express'
import { getConfig, start, accept, decline, end } from '../controllers/callController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { callLimiter } from '../middleware/rateLimits.js'
import { matchIdParams, callIdParams, startCallBody } from '../validation/schemas.js'

const router = express.Router()

router.get('/config', requireAuth, getConfig)
router.post('/match/:matchId', requireAuth, callLimiter, validate({ params: matchIdParams, body: startCallBody }), start)
router.post('/:callId/accept', requireAuth, callLimiter, validate({ params: callIdParams }), accept)
router.post('/:callId/decline', requireAuth, callLimiter, validate({ params: callIdParams }), decline)
router.post('/:callId/end', requireAuth, validate({ params: callIdParams }), end)

export default router
