import { isNativeApp } from './native'
import { notificationsApi } from '@/api/notifications'

// Push notifications in the iPhone app. In a browser every function here
// does nothing, so callers don't need to check.

const TOKEN_KEY = 'velkiz_push_token'
const ASKED_KEY = 'velkiz_push_prompt_dismissed_at'
const ASK_AGAIN_DAYS = 7

// Never return a Capacitor plugin from an async function or await it: the
// plugin answers to any method name, including "then", so the await waits on
// the phone forever. Return the module and take the plugin out after.
const pushModule = () => import('@capacitor/push-notifications')

const store = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch {} },
  remove: (k) => { try { localStorage.removeItem(k) } catch {} },
}

// 'granted' | 'denied' | 'prompt' | 'unsupported'
export const getPushPermission = async () => {
  if (!isNativeApp()) return 'unsupported'
  try {
    const { receive } = await (await pushModule()).PushNotifications.checkPermissions()
    return receive === 'granted' ? 'granted' : receive === 'denied' ? 'denied' : 'prompt'
  } catch {
    return 'unsupported'
  }
}

let listenersReady = false

// Listen once for Apple's token (sent to our server) and for taps on a
// notification (open the chat or the matches list).
const setupListeners = async (navigate) => {
  if (listenersReady) return
  listenersReady = true
  const { PushNotifications: push } = await pushModule()
  await push.addListener('registration', async ({ value }) => {
    store.set(TOKEN_KEY, value)
    try { await notificationsApi.registerDevice(value) } catch (e) { console.error('Push register failed', e) }
  })
  await push.addListener('registrationError', (e) => console.error('Push registration error', e))
  await push.addListener('pushNotificationActionPerformed', ({ notification }) => {
    const data = notification?.data || {}
    if (data.kind === 'message' && data.matchId) navigate(`/Chat?matchId=${data.matchId}`)
    else if (data.kind === 'superlike') navigate('/Matches')
    else navigate('/Messages')
  })
}

// Signed in: if notifications are already allowed, make sure the server has
// this phone's current token (it can change).
export const startPush = async (navigate) => {
  if (!isNativeApp()) return
  await setupListeners(navigate)
  if (await getPushPermission() === 'granted') (await pushModule()).PushNotifications.register()
}

// Shows Apple's "Allow notifications?" popup. Resolves the new permission.
export const enablePush = async (navigate) => {
  if (!isNativeApp()) return 'unsupported'
  await setupListeners(navigate)
  const { PushNotifications: push } = await pushModule()
  const { receive } = await push.requestPermissions()
  if (receive === 'granted') await push.register()
  return receive === 'granted' ? 'granted' : 'denied'
}

// Signing out: this phone stops getting that account's notifications
export const stopPush = async () => {
  const token = store.get(TOKEN_KEY)
  if (!token) return
  try { await notificationsApi.unregisterDevice(token) } catch {}
  store.remove(TOKEN_KEY)
}

// Our own "Turn on notifications?" sheet comes before Apple's popup, because
// Apple only lets an app ask once. "Not now" waits a week before asking again.
export const shouldOfferPush = async () => {
  if (await getPushPermission() !== 'prompt') return false
  const dismissed = Number(store.get(ASKED_KEY) || 0)
  return Date.now() - dismissed > ASK_AGAIN_DAYS * 24 * 60 * 60 * 1000
}

export const dismissPushOffer = () => store.set(ASKED_KEY, String(Date.now()))
