import express from 'express'
import { getMySuperLikes, revenuecatWebhook } from '../controllers/superLikeController.js'
import { requireAuth } from '../middleware/auth.js'

export const superLikeRoutes = express.Router()
superLikeRoutes.get('/', requireAuth, getMySuperLikes)

// No login here: RevenueCat calls it, and proves who it is with a secret
export const purchaseRoutes = express.Router()
purchaseRoutes.post('/revenuecat', revenuecatWebhook)
