import { supabase, createAuthClient } from '../config/supabase.js'
import { deleteAccountData } from '../services/deleteAccount.js'

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

// Where the links in signup emails send people back to
const callbackUrl = () => `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/auth/callback`

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
      options: { emailRedirectTo: callbackUrl() }
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

// DELETE /api/auth/me - permanently delete your account and everything in it
export const deleteAccount = async (req, res) => {
  try {
    // Check the password on a throwaway client so the shared one keeps the service key
    const { error: pwError } = await createAuthClient().auth.signInWithPassword({
      email: req.user.email,
      password: req.body.password,
    })
    if (pwError) {
      // 403, not 401: a 401 makes the app think the session expired
      return res.status(403).json({ error: 'Wrong password' })
    }

    await deleteAccountData(req.user.id, req.app.get('io'))
    res.json({ deleted: true })
  } catch (error) {
    console.error('Delete account error:', error, error.cause)
    res.status(500).json({ error: "Couldn't delete your account. Please try again." })
  }
}
