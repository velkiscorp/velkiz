import express from 'express'
import { getPhoto } from '../controllers/photoController.js'
import { requireAuth } from '../middleware/auth.js'
import { photoLimiter } from '../middleware/rateLimits.js'

const router = express.Router()

// GET /api/photos/<storage path>, e.g. /api/photos/<userId>/<file>.jpg
router.get('/*path', requireAuth, photoLimiter, getPhoto)

export default router
