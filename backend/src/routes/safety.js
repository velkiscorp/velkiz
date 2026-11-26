import express from 'express'
import { block, unblock, listBlocks, report } from '../controllers/safetyController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { safetyLimiter } from '../middleware/rateLimits.js'
import { blockBody, reportBody, userIdParams } from '../validation/schemas.js'

const router = express.Router()

router.get('/blocks', requireAuth, listBlocks)
router.post('/block', requireAuth, safetyLimiter, validate({ body: blockBody }), block)
router.delete('/block/:userId', requireAuth, safetyLimiter, validate({ params: userIdParams }), unblock)
router.post('/report', requireAuth, safetyLimiter, validate({ body: reportBody }), report)

export default router
