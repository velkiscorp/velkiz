import { Capacitor } from '@capacitor/core'

// True inside the iPhone app, false in a normal browser
export const isNativeApp = () => Capacitor.isNativePlatform()

// Native-only setup: light status bar text over the app, hide the splash
// once React has drawn the first screen. Plugins load only in the app, so the
// website doesn't download them.
export const setupNativeApp = async () => {
  if (!isNativeApp()) return
  const [{ StatusBar, Style }, { SplashScreen }, { Keyboard }] = await Promise.all([
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
    import('@capacitor/keyboard'),
  ])
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
  SplashScreen.hide().catch(() => {})
  // No "< > Done" bar above the keyboard, like other chat apps
  Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {})
  // The app shrinks to fit above the keyboard ("resize": "native" in
  // capacitor.config.json), so nothing needs to scroll. iOS still nudges the
  // page up to show the text box; put it back so headers stay where they are.
  Keyboard.addListener('keyboardDidShow', () => window.scrollTo(0, 0))
  // While it's up, the home-bar space at the bottom isn't needed (see .pb-safe)
  const root = document.documentElement
  Keyboard.addListener('keyboardWillShow', () => root.classList.add('keyboard-open'))
  Keyboard.addListener('keyboardWillHide', () => root.classList.remove('keyboard-open'))
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
