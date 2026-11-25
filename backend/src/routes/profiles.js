import express from 'express'
import {
  getProfiles,
  getMyProfile,
  updateMyProfile,
  getProfileById
} from '../controllers/profileController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { profileWriteLimiter } from '../middleware/rateLimits.js'
import { discoverQuery, updateProfileBody, idParams } from '../validation/schemas.js'

const router = express.Router()

// All profile routes are protected
router.get('/', requireAuth, validate({ query: discoverQuery }), getProfiles)
router.get('/me', requireAuth, getMyProfile)
router.put('/me', requireAuth, profileWriteLimiter, validate({ body: updateProfileBody }), updateMyProfile)
router.get('/:id', requireAuth, validate({ params: idParams }), getProfileById)

export default router
