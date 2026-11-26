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
