import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isRecoverySession } from '@/lib/supabase'
import apiClient from '@/api/client'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      // Supabase puts the token in the URL hash after email verification
      // We need to wait a moment for Supabase to process it
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) throw error

      if (!session) {
        // Try exchanging the code from URL if session isn't ready yet
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        if (accessToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) throw sessionError

          if (type === 'recovery' || isRecoverySession()) {
            navigate('/reset-password', { replace: true })
            return
          }

          await handlePostAuth()
          return
        }

        setError('Verification failed. Please try again.')
        return
      }

      // Password recovery: by now the Supabase client has already read and
      // cleared the URL hash, so rely on the flag set in lib/supabase.js
      if (isRecoverySession()) {
        navigate('/reset-password', { replace: true })
        return
      }

      await handlePostAuth()

    } catch (err) {
      console.error('Callback error:', err)
      setError('Something went wrong. Please try signing in.')
    }
  }

  const handlePostAuth = async () => {
    try {
      await apiClient.post('/api/auth/create-profile')
    } catch (e) {}

    try {
      const response = await apiClient.get('/api/auth/me')
      if (response.profile?.onboarding_complete) {
        navigate('/Discover')
      } else {
        navigate('/Onboarding')
      }
    } catch (e) {
      navigate('/Onboarding')
    }
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background px-6">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="text-gold underline text-sm"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Verifying your account...</p>
      </div>
    </div>
  )
}