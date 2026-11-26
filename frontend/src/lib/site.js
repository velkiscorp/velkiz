import { isNativeApp } from './native'

// The public website (velkiz.com). Email links (verify, password reset) point
// here; on an iPhone with Velkiz installed, iOS opens them in the app instead
// (universal links, see public/.well-known/apple-app-site-association).
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://velkiz.com').replace(/\/$/, '')

// Fill in once the app is live. Empty shows "Coming soon".
export const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL || ''
export const PLAY_STORE_URL = import.meta.env.VITE_PLAY_STORE_URL || ''

// Velkiz itself only runs inside the phone app, where screenshots are blocked.
// In a browser people get the website instead. While developing (npm run dev)
// the full app still runs in the browser so you can test it.
export const runsFullApp = () =>
  isNativeApp() || import.meta.env.DEV || import.meta.env.VITE_ALLOW_WEB_APP === 'true'
