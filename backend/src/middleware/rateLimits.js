import { rateLimit, ipKeyGenerator } from 'express-rate-limit'

const json = (message) => ({ error: message })

// Limit by logged-in user when we know who it is, otherwise by IP
const byUserOrIp = (req) => req.user?.id ?? ipKeyGenerator(req.ip)

const base = { standardHeaders: 'draft-7', legacyHeaders: false }

// Whole API, per IP: a backstop against floods and scraping
export const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: json('Too many requests, please slow down'),
})

// Account creation, per IP: stops bot account farms
export const signupLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: json('Too many sign-ups from this network, try again later'),
})

// Verification email resends, per IP: each one sends a real email, so keep
// it low to protect our sending reputation and people's inboxes
export const resendLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: json('Too many emails requested, try again later'),
})

// Per user (use after requireAuth)
export const swipeLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 60,
  keyGenerator: byUserOrIp,
  message: json('You are swiping too fast, take a breath'),
})

export const messageLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator: byUserOrIp,
  message: json('You are sending messages too fast'),
})

export const profileWriteLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 20,
  keyGenerator: byUserOrIp,
  message: json('Too many profile updates, try again in a minute'),
})

// Photo loads, per user. Kept apart from apiLimiter because one Discover
// session loads lots of images; this still stops someone scraping everyone.
export const photoLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 300,
  keyGenerator: byUserOrIp,
  message: json('Too many photos loaded, try again in a minute'),
})

// Reports and blocks, per user: enough for real use, stops someone spamming
// the moderation queue
export const safetyLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: byUserOrIp,
  message: json('Too many reports or blocks, try again later'),
})
