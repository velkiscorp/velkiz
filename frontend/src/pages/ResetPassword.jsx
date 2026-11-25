import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { supabase, clearRecovery } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const finishRecovery = async (to) => {
    clearRecovery()
    try { await supabase.auth.signOut({ scope: 'global' }) } catch {}
    // Full reload so AuthContext re-reads the (now empty) session
    window.location.replace(to)
  }

  const handleReset = async () => {
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')

    try {
      setLoading(true)
      setError(null)
      await authApi.updatePassword(password)
      // Sign out everywhere and make the user log in with the new password,
      // so the reset link alone never gives access to the app
      await finishRecovery('/login?reset=success')
    } catch (err) {
      setError('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">New password</h1>
          <p className="text-muted-foreground text-sm">Choose a strong password for your account</p>
        </div>

        <div className="space-y-3">
          <Input
            type="password"
            placeholder="New password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12"
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleReset()}
            className="h-12"
          />
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <Button
            className="w-full h-12"
            onClick={handleReset}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Set new password'}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => finishRecovery('/login')}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}