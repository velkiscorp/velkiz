import { supabase, createAuthClient } from '../config/supabase.js'
import { deleteAccountData } from '../services/deleteAccount.js'
import { revokeAppleSignIn } from '../services/appleSignIn.js'

const generateUsername = () => {
  const adjectives = ['ghost', 'shadow', 'cosmic', 'silent', 'wild', 'mystic', 'neon', 'dark', 'lucky', 'brave']
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const randomNum = Math.floor(Math.random() * 9000) + 1000
  return `${randomAdj}_${randomNum}`
}

export const getMe = async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle()

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
      },
      profile: profile || null,
      isOnboarded: profile?.onboarding_complete || false
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' })
  }
}

export const createProfile = async (req, res) => {
  try {
    const userId = req.user.id

    // Check if profile already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      return res.json({ message: 'Profile already exists' })
    }

    const username = generateUsername()

    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        username,
        onboarding_complete: false,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Create profile error:', error)
      return res.status(500).json({ error: 'Failed to create profile' })
    }

    res.status(201).json({ profile })
  } catch (error) {
    console.error('Create profile error:', error)
    res.status(500).json({ error: 'Failed to create profile' })
  }
}

// Bump when the Terms or Privacy Policy change in a way people must agree to again
const TERMS_VERSION = '2026-11-26'

// Where the links in signup emails send people back to
// Where email links go. SITE_URL is the website (https://velkiz.com); on an
// iPhone with the app installed, iOS opens these links in the app.
const callbackUrl = () => `${(process.env.SITE_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/auth/callback`

// Signup sends a verification email (when "Confirm email" is on in Supabase).
// The account can't sign in until the link in that email is clicked.
// The reply is the same whether or not the email already has an account,
// so nobody can use signup to find out who is on Velkiz.
export const signUp = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    // Throwaway anon client, never the shared service-role client
    const { data, error } = await createAuthClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callbackUrl(),
        // Proof they agreed to the Terms and Privacy Policy, and when
        data: { terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION },
      }
    })

    if (error) {
      console.error('Signup error:', error.message)
      if (error.code === 'user_already_exists' || /already registered/i.test(error.message)) {
        return res.status(400).json({ error: 'Email already in use' })
      }
      if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
        return res.status(429).json({ error: 'Too many sign-ups right now, try again in a bit' })
      }
      return res.status(500).json({ error: 'Failed to create account' })
    }

    // "Confirm email" is off in Supabase: signed in straight away
    if (data.session) {
      return res.status(201).json({ session: data.session, user: data.user })
    }

    res.status(201).json({ needsVerification: true })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Signup failed' })
  }
}

// Sends the verification email again. Always answers the same way.
export const resendVerification = async (req, res) => {
  try {
    const { error } = await createAuthClient().auth.resend({
      type: 'signup',
      email: req.body.email,
      options: { emailRedirectTo: callbackUrl() }
    })
    if (error) console.error('Resend verification error:', error.message)
  } catch (error) {
    console.error('Resend verification error:', error)
  }
  res.json({ success: true })
}

export const updateLastSeen = async (req, res) => {
  try {
    await supabase
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('user_id', req.user.id)

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' })
  }
}

// Signed in with Apple (no password): people prove it's them by signing in
// with Apple again right before deleting, so the session must be this fresh
const REAUTH_WINDOW_MS = 10 * 60 * 1000

const hasPassword = (user) =>
  (user.identities || []).some(i => i.provider === 'email') || user.app_metadata?.provider === 'email'

// DELETE /api/auth/me - permanently delete your account and everything in it
export const deleteAccount = async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(req.user.id)
    if (userError || !user) throw userError || new Error('User not found')

    if (hasPassword(user)) {
      if (!req.body.password) return res.status(403).json({ error: 'Enter your password', code: 'PASSWORD_REQUIRED' })
      // Check the password on a throwaway client so the shared one keeps the service key
      const { error: pwError } = await createAuthClient().auth.signInWithPassword({
        email: user.email,
        password: req.body.password,
      })
      if (pwError) {
        // 403, not 401: a 401 makes the app think the session expired
        return res.status(403).json({ error: 'Wrong password' })
      }
    } else {
      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0
      if (Date.now() - lastSignIn > REAUTH_WINDOW_MS) {
        return res.status(403).json({ error: 'Please sign in with Apple again to confirm', code: 'REAUTH_REQUIRED' })
      }
    }

    await deleteAccountData(req.user.id, req.app.get('io'))
    // After the data is gone: also remove Velkiz from their Apple ID
    if (req.body.appleAuthorizationCode) await revokeAppleSignIn(req.body.appleAuthorizationCode)
    res.json({ deleted: true })
  } catch (error) {
    console.error('Delete account error:', error, error?.cause)
    res.status(500).json({ error: "Couldn't delete your account. Please try again." })
  }
}

// POST /api/auth/accept-terms - Sign in with Apple skips our signup form, so
// the "I'm 18+ and agree to the Terms" is recorded here instead
export const acceptTerms = async (req, res) => {
  try {
    const { data: { user }, error } = await supabase.auth.admin.getUserById(req.user.id)
    if (error || !user) throw error || new Error('User not found')
    const meta = user.user_metadata || {}
    if (meta.terms_version !== TERMS_VERSION) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(req.user.id, {
        user_metadata: { ...meta, terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION },
      })
      if (updateError) throw updateError
    }
    res.json({ accepted: true })
  } catch (error) {
    console.error('Accept terms error:', error)
    res.status(500).json({ error: 'Something went wrong, please try again' })
  }
}
