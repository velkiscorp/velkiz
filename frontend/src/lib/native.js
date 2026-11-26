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
