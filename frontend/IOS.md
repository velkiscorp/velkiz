# Velkiz iPhone app

The iPhone app is the same React app wrapped with [Capacitor](https://capacitorjs.com). The Xcode project lives in `frontend/ios/`.

## What you need

- A Mac with Xcode 16 or newer
- An Apple Developer account (Apple Developer Program, $99 a year)
- Node 22+

## Build and run

1. In `frontend/.env`, point the app at the live backend over HTTPS, e.g.
   `VITE_API_URL=https://api.velkiz.com`. The app can't reach `localhost` on your Mac from a phone.
2. On the backend, set `FRONTEND_URL` to the website address. The iPhone app's origin
   (`capacitor://localhost`) is always allowed.
3. Build and open Xcode:
   ```
   cd frontend
   npm install
   npm run ios
   ```
   After changing web code, `npm run ios:sync` copies the new build into the Xcode project.
4. In Xcode, select the **App** target > **Signing & Capabilities**, pick your team. The bundle ID is `com.velkiz.app`
   (change it in `capacitor.config.json` and the target settings if you registered a different one).
5. Pick a simulator or your plugged-in iPhone and press Run.

## Upload to App Store Connect

1. In Xcode, set the version (**General > Identity**). Bump **Build** for every upload.
2. Choose **Any iOS Device (arm64)**, then **Product > Archive**.
3. In the Organizer window, **Distribute App > App Store Connect > Upload**.
4. The build shows up in App Store Connect > TestFlight after processing (about 15 minutes).

## What's set up

- App icon and splash screen (sources in `frontend/resources/`).
- iPhone only, portrait only, dark mode.
- Spacing for the notch and home bar (`pt-safe` / `pb-safe` in `src/index.css`).
- Permission wording for photos and camera in `ios/App/App/Info.plist`.
- `ITSAppUsesNonExemptEncryption = false`, so no export compliance question on each upload (the app only uses standard HTTPS).
- Apple's privacy manifest, `ios/App/App/PrivacyInfo.xcprivacy`. It must match the privacy labels you fill in on App Store Connect.

## Push notifications

1. developer.apple.com > Certificates, IDs & Profiles > **Identifiers**: open `com.velkiz.app`, tick **Push Notifications**, save.
2. **Keys** > **+**: name it "Velkiz push", tick **Apple Push Notifications service (APNs)**, download the `.p8` file (you can only download it once). Note the **Key ID** and your **Team ID** (top right of the page).
3. Put them in the backend's environment (`APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_KEY`, `APNS_BUNDLE_ID`, and `APNS_PRODUCTION=true` for TestFlight and App Store builds). See the main README.
4. In Xcode > **Signing & Capabilities**, check **Push Notifications** is listed (it comes from `App/App.entitlements`).
5. Run `supabase/migrations/2026-11-26_push_notifications.sql` in Supabase.

Notifications never contain names or message text, only "You have a new match" or "You have a new message", so a lock screen gives nothing away. People choose matches and/or messages in Settings.

## Privacy protection

- **Screenshots and screen recordings come out blank** in the app (`@capacitor-community/privacy-screen`, set in `capacitor.config.json`). iOS doesn't let apps fully stop the screenshot button, so this is the strongest option available.
- **Screenshot alerts:** screenshotting a chat adds a "took a screenshot" line for both people and notifies the other person. Needs `supabase/migrations/2026-11-26_screenshot_alerts.sql`.
- **App switcher** shows the splash screen instead of the last screen.
- **Watermarks:** photos carry a faint repeating `@username` of whoever is looking, on the website and in the app, so a photo of the screen taken with another phone shows who leaked it.
- Long-press "Save image" and right-click saving are turned off on photos.
