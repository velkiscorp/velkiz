import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { authApi } from '@/api/auth'
import { useState } from 'react'

export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || 'your email'
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleResend = async () => {
    setResending(true)
    try {
      await authApi.signup(email, '________') // triggers resend
    } catch (e) {}
    setResent(true)
    setResending(false)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="text-5xl">📬</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Check your inbox</h1>
          <p className="text-muted-foreground text-sm">
            We sent a verification link to <span className="text-foreground font-medium">{email}</span>
          </p>
          <p className="text-muted-foreground text-sm">
            Click the link in the email to activate your account. Check your spam folder if you don't see it.
          </p>
        </div>

        <div className="space-y-3">
          {resent ? (
            <p className="text-sm text-green-400">Email resent successfully</p>
          ) : (
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Resending...' : 'Resend email'}
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Back to sign in
          </Button>
        </div>
      </div>
    </div>
  )
}