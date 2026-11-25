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

export const signUp = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (error) {
      console.error('Signup error:', error)
      if (error.message.includes('already registered')) {
        return res.status(400).json({ error: 'Email already in use' })
      }
      return res.status(500).json({ error: 'Failed to create account' })
    }

    // Sign in on a throwaway anon client, not the shared service-role client
    const { data: signInData, error: signInError } = await createAuthClient().auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      return res.status(500).json({ error: 'Account created but login failed' })
    }

    res.status(201).json({
      session: signInData.session,
      user: signInData.user
    })

  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Signup failed' })
  }
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
