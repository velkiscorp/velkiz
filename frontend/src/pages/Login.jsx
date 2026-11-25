import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, useReducedMotion } from 'framer-motion'

export default function Login() {
  const [mode, setMode] = useState('login') // login | signup | reset
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(() =>
    new URLSearchParams(window.location.search).get('reset') === 'success'
      ? 'Password updated. Sign in with your new password.'
      : new URLSearchParams(window.location.search).get('deleted') === '1'
        ? 'Your account and everything in it has been deleted.'
        : null
  )
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  const handleSubmit = async () => {
    if (!email.trim()) return setError('Please enter your email')
    if (mode !== 'reset' && !password.trim()) return setError('Please enter your password')
    if (mode !== 'reset' && password.length < 8) return setError('Password must be at least 8 characters')

    try {
      setLoading(true)
      setError(null)
      setMessage(null)

      if (mode === 'signup') {
        const result = await authApi.signup(email, password)
        if (result.session) {
          window.location.href = '/Onboarding'
        } else {
          navigate('/verify-email', { state: { email } })
        }
} else if (mode === 'login') {
        await authApi.login(email, password)
        window.location.href = '/Discover'

      } else if (mode === 'reset') {
        await authApi.resetPassword(email)
        // Always show same message regardless of whether email exists
        setMessage("If an account exists for this email, you'll receive a reset link shortly.")
      }
    } catch (err) {
      if (mode === 'login') {
        setError('Invalid email or password')
      } else if (mode === 'signup') {
        setError('Could not create account. Please try again.')
      } else {
        // For reset, never reveal if email exists
        setMessage("If an account exists for this email, you'll receive a reset link shortly.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-6 overflow-hidden">
      {/* A pool of low red light behind the form, slowly breathing */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-[30%] w-[38rem] h-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(346 75% 32% / 0.45), transparent 65%)' }}
        animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="relative w-full max-w-sm space-y-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="text-center space-y-3">
          <h1 className="text-6xl font-serif italic font-medium tracking-tight text-silk leading-none">Velkis</h1>
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold/60">by Velvet</p>
          <div className="mx-auto h-px w-16 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
          <p className="text-muted-foreground text-sm tracking-wide">
            {mode === 'login' && 'Desire, without a name'}
            {mode === 'signup' && 'Stay unknown until you choose not to'}
            {mode === 'reset' && 'Reset your password'}
          </p>
        </div>

        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-black/30 border-border focus-visible:ring-gold/50"
          />

          {mode !== 'reset' && (
            <Input
              type="password"
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="h-12 bg-black/30 border-border focus-visible:ring-gold/50"
            />
          )}

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          {message && <p className="text-sm text-green-400 text-center">{message}</p>}

          <Button
            className="w-full h-12 text-xs uppercase tracking-[0.25em] font-medium bg-gradient-to-b from-primary to-accent shadow-[0_0_40px_hsl(346_75%_36%/0.45)] hover:brightness-110 transition"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'One moment...' : mode === 'login' ? 'Enter' : mode === 'signup' ? 'Join Velkis' : 'Send reset link'}
          </Button>
        </div>

        <div className="space-y-2 text-center text-sm">
          {mode === 'login' && (
            <>
              <button
                onClick={() => { setMode('reset'); setError(null); setMessage(null) }}
                className="text-muted-foreground hover:text-foreground block w-full"
              >
                Forgot password?
              </button>
              <button
                onClick={() => { setMode('signup'); setError(null); setMessage(null) }}
                className="text-gold hover:underline underline-offset-4 block w-full"
              >
                Create an account
              </button>
            </>
          )}

          {mode === 'signup' && (
            <button
              onClick={() => { setMode('login'); setError(null); setMessage(null) }}
              className="text-muted-foreground hover:text-foreground"
            >
              Already have an account? Sign in
            </button>
          )}

          {mode === 'reset' && (
            <button
              onClick={() => { setMode('login'); setError(null); setMessage(null) }}
              className="text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </button>
          )}
        </div>

        {mode === 'signup' && (
          <p className="text-xs text-muted-foreground text-center">
            Your email is only used for verification. It is never shown to other users.
          </p>
        )}
      </motion.div>
    </div>
  )
}