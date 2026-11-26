import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profiles.js'
import swipeRoutes from './routes/swipes.js'
import matchRoutes from './routes/matches.js'
import messageRoutes from './routes/messages.js'
import photoRoutes from './routes/photos.js'
import safetyRoutes from './routes/safety.js'
import notificationRoutes from './routes/notifications.js'
import { errorHandler } from './middleware/errorHandler.js'
import { supabase } from './config/supabase.js'
import { apiLimiter } from './middleware/rateLimits.js'
import { uuid } from './validation/schemas.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)

// This API's data changes constantly (matches, messages, etc) - ETags just
// enable the browser to silently serve stale cached responses via 304s
// instead of hitting the server, which is never what we want here
app.disable('etag')

// Behind a proxy (Railway, Render, ...) set TRUST_PROXY=1 so rate limits see
// each visitor's real IP instead of the proxy's
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1)

const isProduction = process.env.NODE_ENV === 'production'

// The app only runs inside the iPhone app (Capacitor serves it from
// capacitor://localhost). FRONTEND_URL is for running it in a browser while
// developing; leave it unset in production so no website can call the API.
const allowedOrigins = [
  'capacitor://localhost',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(isProduction ? [] : ['http://localhost:5173']),
]

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  },
  // Clients only ever send "join_match" with an id, so nothing big is needed
  maxHttpBufferSize: 10_000,
})

// Make io reachable from controllers via req.app.get('io')
app.set('io', io)

// Middleware
// Security headers (no sniffing, no framing, HSTS, ...). This server only
// returns JSON and photos, so the strictest content policy is fine.
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))
app.use(express.json({ limit: '50kb' }))
// Photos have their own per-user limit (see routes/photos.js)
app.use('/api', (req, res, next) => req.path.startsWith('/photos/') ? next() : apiLimiter(req, res, next))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/swipes', swipeRoutes)
app.use('/api/matches', matchRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/photos', photoRoutes)
app.use('/api/safety', safetyRoutes)
app.use('/api/notifications', notificationRoutes)

// Health check - lets you confirm the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// Anything else under /api is an unknown route
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))

// Catch-all error handler - must come after all routes
app.use(errorHandler)

// Reject socket connections that don't present a valid Supabase token
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('No token provided'))
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return next(new Error('Invalid or expired token'))
    socket.userId = user.id
    next()
  } catch (err) {
    next(new Error('Auth check failed'))
  }
})


// Real time chat via WebSockets
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // User joins a chat room keyed to their match ID - only if they're actually
  // part of that match, so a guessed/known matchId can't be used to snoop
  // Joining is cheap for the client and costs us a database read, so cap it
  let joins = 0
  const resetJoins = setInterval(() => { joins = 0 }, 60_000)

  socket.on('join_match', async (matchId) => {
    try {
      if (!uuid.safeParse(matchId).success) {
        socket.emit('join_error', { matchId: null, error: 'Invalid match' })
        return
      }
      if (++joins > 60) {
        socket.emit('join_error', { matchId, error: 'Too many requests' })
        return
      }
      const { data: match } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, status')
        .eq('id', matchId)
        .or(`user1_id.eq.${socket.userId},user2_id.eq.${socket.userId}`)
        .single()

      if (!match || match.status === 'unmatched') {
        socket.emit('join_error', { matchId, error: 'Not authorized for this match' })
        return
      }

      socket.join(matchId)
      console.log(`Socket ${socket.id} joined match room: ${matchId}`)
    } catch (err) {
      socket.emit('join_error', { matchId, error: 'Failed to join match' })
    }
  })

  // Note: there's no "send_message" listener anymore - sending still goes
  // through POST /api/messages/:matchId (keeps the phone filter, membership
  // check, and DB write in one place). This socket is push-only: messageController
  // emits to the room after a successful save, see sendMessage().

  socket.on('disconnect', () => {
    clearInterval(resetJoins)
    console.log('User disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})