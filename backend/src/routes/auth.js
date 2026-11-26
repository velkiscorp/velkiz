import express from 'express'
import { getMe, createProfile, updateLastSeen, signUp, resendVerification, deleteAccount, acceptTerms } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { signupLimiter, resendLimiter, profileWriteLimiter } from '../middleware/rateLimits.js'
import { signupBody, resendVerificationBody, deleteAccountBody, acceptTermsBody } from '../validation/schemas.js'

const router = express.Router()

// Public routes
router.post('/signup', signupLimiter, validate({ body: signupBody }), signUp)
router.post('/resend-verification', resendLimiter, validate({ body: resendVerificationBody }), resendVerification)

// Protected routes
router.get('/me', requireAuth, getMe)
router.post('/create-profile', requireAuth, profileWriteLimiter, createProfile)
router.post('/last-seen', requireAuth, updateLastSeen)
router.post('/accept-terms', requireAuth, profileWriteLimiter, validate({ body: acceptTermsBody }), acceptTerms)
router.delete('/me', requireAuth, profileWriteLimiter, validate({ body: deleteAccountBody }), deleteAccount)

export default router
