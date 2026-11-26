import React, { createContext, useState, useContext, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import apiClient from '@/api/client'
import { queryClientInstance } from '@/lib/query-client'
import { stopPush } from '@/lib/push'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isLoadingPublicSettings] = useState(false)
  const [authError] = useState(null)

  useEffect(() => {
    initAuth()

    // Keep React state in step with Supabase: token refreshes update the
    // user, and a sign-out anywhere (another tab, an expired refresh token)
    // logs this tab out too
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setIsAuthenticated(false)
        queryClientInstance.clear()
      } else if ((event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session) {
        setUser(session.user)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const initAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setIsAuthenticated(false)
        setIsLoadingAuth(false)
        return
      }

      setUser(session.user)
      setIsAuthenticated(true)

      // Fetch profile
      try {
        const response = await apiClient.get('/api/auth/me')
        setProfile(response.profile)

        if (!response.profile) {
          await apiClient.post('/api/auth/create-profile')
          const updated = await apiClient.get('/api/auth/me')
          setProfile(updated.profile)
        }
      } catch (e) {
        console.error('Profile fetch failed:', e)
      }

    } catch (error) {
      console.error('Auth init failed:', error)
      setIsAuthenticated(false)
    } finally {
      setIsLoadingAuth(false)
    }
  }

  const logout = async () => {
    // Stop this phone getting the account's notifications (needs the login, so first)
    await stopPush()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setIsAuthenticated(false)
    // Wipe cached queries so switching accounts in the same tab doesn't
    // briefly show stale data left over from the previous session
    queryClientInstance.clear()
  }

  const navigateToLogin = () => {
    window.location.href = '/login'
  }

  const refreshProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const response = await apiClient.get('/api/auth/me')
        setProfile(response.profile)
      }
    } catch (error) {
      console.error('Refresh profile failed:', error)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      logout,
      navigateToLogin,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}