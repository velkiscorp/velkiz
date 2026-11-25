import express from 'express'
import { getMyMatches, unmatch, blockUser, getLikesReceived } from '../controllers/matchController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { matchIdParams } from '../validation/schemas.js'

const router = express.Router()

router.get('/', requireAuth, getMyMatches)
router.get('/likes', requireAuth, getLikesReceived)
router.patch('/:matchId/unmatch', requireAuth, validate({ params: matchIdParams }), unmatch)
router.patch('/:matchId/block', requireAuth, validate({ params: matchIdParams }), blockUser)

export default router
