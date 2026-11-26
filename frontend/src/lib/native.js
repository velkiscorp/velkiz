import { Capacitor } from '@capacitor/core'

// True inside the iPhone app, false in a normal browser
export const isNativeApp = () => Capacitor.isNativePlatform()

// Native-only setup: light status bar text over the app, hide the splash
// once React has drawn the first screen. Plugins load only in the app, so the
// website doesn't download them.
export const setupNativeApp = async () => {
  if (!isNativeApp()) return
  const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
  ])
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
  SplashScreen.hide().catch(() => {})
  handleAppLinks()
}

// Email links (verify your email, reset your password) point at velkiz.com,
// and iOS opens them in the app. Reload the app at that same path, so the
// sign-in code in the link is read exactly as it is on a normal page load.
const LINK_PATHS = /^\/(auth\/|reset-password)/
const HANDLED_KEY = 'velkiz_handled_link'

const openLink = (url) => {
  try {
    const link = new URL(url)
    if (!LINK_PATHS.test(link.pathname)) return
    // The launch link stays the same after the reload; only follow it once
    if (sessionStorage.getItem(HANDLED_KEY) === url) return
    sessionStorage.setItem(HANDLED_KEY, url)
    window.location.replace(link.pathname + link.search + link.hash)
  } catch {
    // Not a link we understand, ignore it
  }
}

const handleAppLinks = async () => {
  const { App } = await import('@capacitor/app')
  App.addListener('appUrlOpen', ({ url }) => openLink(url))
  // Opened from a link while the app wasn't running
  const launch = await App.getLaunchUrl().catch(() => null)
  if (launch?.url) openLink(launch.url)
}

// Screenshots come out blank in the app (the PrivacyScreen plugin, set up in
// capacitor.config.json), and the app switcher shows the splash instead of
// the screen. This tells you when someone tried. Returns an unsubscribe.
export const onScreenshot = (callback) => {
  if (!isNativeApp()) return () => {}
  let handle = null
  let cancelled = false
  import('@capacitor-community/privacy-screen').then(({ PrivacyScreen }) =>
    PrivacyScreen.addListener('screenshotTaken', callback)
  ).then((h) => {
    if (cancelled) h.remove()
    else handle = h
  }).catch(() => {})
  return () => { cancelled = true; handle?.remove() }
}
