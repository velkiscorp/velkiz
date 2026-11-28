import express from 'express'
import { getMessages, sendMessage, reportScreenshot, unsendMessage, clearChat } from '../controllers/messageController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { messageLimiter } from '../middleware/rateLimits.js'
import { matchIdParams, messageIdParams, sendMessageBody } from '../validation/schemas.js'

const router = express.Router()

router.get('/:matchId', requireAuth, validate({ params: matchIdParams }), getMessages)
router.post('/:matchId', requireAuth, messageLimiter, validate({ params: matchIdParams, body: sendMessageBody }), sendMessage)
router.delete('/:matchId', requireAuth, messageLimiter, validate({ params: matchIdParams }), clearChat)
router.delete('/:matchId/:messageId', requireAuth, messageLimiter, validate({ params: messageIdParams }), unsendMessage)
router.post('/:matchId/screenshot', requireAuth, messageLimiter, validate({ params: matchIdParams }), reportScreenshot)

export default router
