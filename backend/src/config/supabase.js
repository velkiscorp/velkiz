import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials in .env file (SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY)')
}

const noSession = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
}

// Shared service-role client used for all database and admin calls.
// Never call signIn*/signUp/setSession on this client: supabase-js keeps the
// resulting session in memory and then sends that user's token instead of the
// service key on later database requests, so RLS would apply as that user.
export const supabase = createClient(supabaseUrl, supabaseServiceKey, noSession)

// Fresh, throwaway anon client for user sign-in. Create one per request so a
// user's session never lives on a shared client.
export const createAuthClient = () => createClient(supabaseUrl, supabaseAnonKey, noSession)
