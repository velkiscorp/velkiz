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
