import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Password-reset links sign the user in. Remember that this session came from
// a reset link *before* the Supabase client reads the URL and strips the hash,
// so the app can force the user to set a new password before anything else.
export const RECOVERY_FLAG = 'velvet_password_recovery'

const markRecovery = () => {
  try { sessionStorage.setItem(RECOVERY_FLAG, '1') } catch {}
}

const urlLooksLikeRecovery = () => {
  const { search, hash } = window.location
  return /(^|[?&#])type=recovery(&|$)/.test(search) || /(^|[#&])type=recovery(&|$)/.test(hash)
}

if (urlLooksLikeRecovery()) markRecovery()

export const isRecoverySession = () => {
  try { return sessionStorage.getItem(RECOVERY_FLAG) === '1' } catch { return false }
}

export const clearRecovery = () => {
  try { sessionStorage.removeItem(RECOVERY_FLAG) } catch {}
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Backup in case the reset link landed on a URL without type=recovery
// (for example Supabase falling back to the Site URL)
supabase.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    markRecovery()
    if (window.location.pathname !== '/reset-password') {
      window.location.replace('/reset-password')
    }
  }
})
