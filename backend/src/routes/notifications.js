import express from 'express'
import { registerDevice, unregisterDevice } from '../controllers/notificationController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { profileWriteLimiter } from '../middleware/rateLimits.js'
import { deviceBody, deviceTokenParams } from '../validation/schemas.js'

const router = express.Router()

router.post('/devices', requireAuth, profileWriteLimiter, validate({ body: deviceBody }), registerDevice)
router.delete('/devices/:token', requireAuth, profileWriteLimiter, validate({ params: deviceTokenParams }), unregisterDevice)

export default router
