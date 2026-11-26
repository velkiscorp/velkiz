import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import PageNotFound from './lib/PageNotFound'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { isRecoverySession } from '@/lib/supabase'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import AuthCallback from './pages/AuthCallback'
import ResetPassword from './pages/ResetPassword'
import Onboarding from './pages/Onboarding'
import Discover from './pages/Discover'
import Matches from './pages/Matches'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import MyProfile from './pages/MyProfile'
import Settings from './pages/Settings'
import BlockedPeople from './pages/BlockedPeople'
import LegalPage from './pages/LegalPage'

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth()

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<LegalPage doc="privacy" />} />
        <Route path="/terms" element={<LegalPage doc="terms" />} />
        <Route path="/guidelines" element={<LegalPage doc="guidelines" />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Signed in from a password-reset link: the only thing allowed is setting a
  // new password. Every other route goes back to the reset screen.
  if (isRecoverySession()) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/reset-password" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Discover" replace />} />
      <Route path="/login" element={<Navigate to="/Discover" replace />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/Onboarding" element={<Onboarding />} />
      <Route path="/Settings" element={<Settings />} />
      <Route path="/Settings/blocked" element={<BlockedPeople />} />
      <Route path="/privacy" element={<LegalPage doc="privacy" />} />
      <Route path="/terms" element={<LegalPage doc="terms" />} />
      <Route path="/guidelines" element={<LegalPage doc="guidelines" />} />
      <Route path="/Chat" element={<Chat />} />
      <Route element={<AppLayout />}>
        <Route path="/Discover" element={<Discover />} />
        <Route path="/Matches" element={<Matches />} />
        <Route path="/Messages" element={<Messages />} />
        <Route path="/MyProfile" element={<MyProfile />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App