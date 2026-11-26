import { Link } from 'react-router-dom'
import { Smartphone } from 'lucide-react'

// An email link (verify, reset password) opened in a browser instead of the
// app. On an iPhone with Velkiz installed, iOS opens these in the app; this
// page is for everything else, like opening the email on a laptop.
export default function OpenInApp() {
  const isReset = /type=recovery/.test(window.location.search + window.location.hash)
    || window.location.pathname === '/reset-password'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm text-center space-y-4">
        <Smartphone className="w-10 h-10 text-gold mx-auto" />
        <h1 className="text-2xl font-serif italic text-silk">Open this on your phone</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isReset
            ? 'To reset your password, open the email on the iPhone that has Velkiz installed and tap the link there.'
            : 'To confirm your email, open the email on the iPhone that has Velkiz installed and tap the link there.'}
        </p>
        <p className="text-xs text-muted-foreground">
          If the link opens Safari instead of the app, press and hold it and choose Open in Velkiz.
        </p>
        <Link to="/" className="inline-block text-sm text-gold hover:underline pt-2">Go to velkiz.com</Link>
      </div>
    </div>
  )
}
