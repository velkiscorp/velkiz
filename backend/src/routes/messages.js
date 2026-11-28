import express from 'express'
import { getMessages, sendMessage, reportScreenshot, unsendMessage, clearChat, sendMedia, getMedia } from '../controllers/messageController.js'
import { ALL_TYPES, MEDIA } from '../services/chatMedia.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { messageLimiter, mediaLimiter, photoLimiter } from '../middleware/rateLimits.js'
import { matchIdParams, messageIdParams, sendMessageBody, sendMediaQuery } from '../validation/schemas.js'

const router = express.Router()

// Raw file bodies, only for the media route, only for the types we accept
const biggest = Math.max(...Object.values(MEDIA).map(m => m.max))
const rawMedia = express.raw({ type: (req) => ALL_TYPES.includes(String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase()), limit: biggest })

router.get('/:matchId', requireAuth, validate({ params: matchIdParams }), getMessages)
router.post('/:matchId', requireAuth, messageLimiter, validate({ params: matchIdParams, body: sendMessageBody }), sendMessage)
router.post('/:matchId/media', requireAuth, mediaLimiter, validate({ params: matchIdParams, query: sendMediaQuery }), rawMedia, sendMedia)
router.get('/:matchId/media/:messageId', requireAuth, photoLimiter, validate({ params: messageIdParams }), getMedia)
router.delete('/:matchId', requireAuth, messageLimiter, validate({ params: matchIdParams }), clearChat)
router.delete('/:matchId/:messageId', requireAuth, messageLimiter, validate({ params: messageIdParams }), unsendMessage)
router.post('/:matchId/screenshot', requireAuth, messageLimiter, validate({ params: matchIdParams }), reportScreenshot)

export default router
