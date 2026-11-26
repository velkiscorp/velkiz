import { supabase } from './supabase'
import { isNativeApp } from './native'

// Sign in with Apple, in the iPhone app only. Apple's own sheet appears,
// people can pick "Hide My Email", and Supabase checks Apple's signed token.

export const canUseApple = () => isNativeApp()

const randomNonce = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

const sha256 = async (text) => {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('')
}

// Resolves { authorizationCode } once signed in, or null if they cancelled.
// The nonce stops a stolen Apple token being replayed: Apple signs the
// hashed one, Supabase checks it against the original.
export const signInWithApple = async () => {
  const { SignInWithApple } = await import('@capacitor-community/apple-sign-in')
  const nonce = randomNonce()
  let result
  try {
    result = await SignInWithApple.authorize({
      clientId: 'com.velkiz.app',
      redirectURI: 'https://velkiz.com',
      scopes: 'email',
      nonce: await sha256(nonce),
    })
  } catch (err) {
    // 1001 is Apple's "the person closed the sheet"
    if (/1001|cancel/i.test(`${err?.code} ${err?.message}`)) return null
    throw err
  }

  const { identityToken, authorizationCode } = result.response
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken, nonce })
  if (error) throw error
  return { authorizationCode }
}

// True when this login has no password (signed up with Apple)
export const isAppleOnlyAccount = (user) => {
  const providers = (user?.identities || []).map(i => i.provider)
  if (providers.length) return !providers.includes('email')
  return user?.app_metadata?.provider === 'apple'
}
