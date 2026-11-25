import axios from 'axios'
import { supabase } from '@/lib/supabase'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// The Supabase session is the only source of truth for the login token.
// getSession() returns a fresh token and refreshes it when it is about to
// expire, so API calls keep working past the 1-hour token lifetime.
export const getAccessToken = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

// Older builds kept a copy of the token here; it went stale after an hour
try { localStorage.removeItem('auth_token'); localStorage.removeItem('user_id') } catch {}

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config

    // A 401 can mean the token expired between refreshes: refresh once and retry
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true
      const { data, error: refreshError } = await supabase.auth.refreshSession()
      if (!refreshError && data.session) {
        original.headers.Authorization = `Bearer ${data.session.access_token}`
        return apiClient(original)
      }

      // Refresh failed: the session is really over
      await supabase.auth.signOut().catch(() => {})
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default apiClient
