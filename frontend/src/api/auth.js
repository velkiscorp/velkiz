import { supabase } from '@/lib/supabase'
import apiClient from './client'
import { SITE_URL } from '@/lib/site'
import { isNativeApp } from '@/lib/native'

export const authApi = {
  // Signup goes through our backend. Usually it sends a verification email
  // and returns no session; the link in the email signs the person in.
  signup: async (email, password, acceptedTerms) => {
    const response = await apiClient.post('/api/auth/signup', { email, password, acceptedTerms })
    
    // Set the session in Supabase client
    if (response.session) {
      await supabase.auth.setSession({
        access_token: response.session.access_token,
        refresh_token: response.session.refresh_token
      })
    }
    
    return response
  },

  resendVerification: async (email) => {
    await apiClient.post('/api/auth/resend-verification', { email })
  },

  // Login still uses Supabase directly
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  // Permanently deletes the account on the server (needs the password again),
  // then clears the local session. The login no longer exists after this.
  deleteAccount: async (password) => {
    await apiClient.delete('/api/auth/me', { data: { password } })
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // In the app the link must go to the website (iOS then opens it in
      // the app); capacitor://localhost can't be opened from an email
      redirectTo: `${isNativeApp() ? SITE_URL : window.location.origin}/auth/callback?type=recovery`
    })
    if (error) throw error
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  },

  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  logout: async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  },

  isAuthenticated: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  }
}