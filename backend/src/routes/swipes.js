import express from 'express'
import { createSwipe, getMySwipes, undoSwipe } from '../controllers/swipeController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { swipeLimiter } from '../middleware/rateLimits.js'
import { swipeBody, targetIdParams } from '../validation/schemas.js'

const router = express.Router()

router.post('/', requireAuth, swipeLimiter, validate({ body: swipeBody }), createSwipe)
router.get('/mine', requireAuth, getMySwipes)
router.delete('/:targetId', requireAuth, swipeLimiter, validate({ params: targetIdParams }), undoSwipe)

export default router
