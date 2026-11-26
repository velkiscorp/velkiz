# Velkiz iPhone app

The iPhone app is the same React app wrapped with [Capacitor](https://capacitorjs.com). The Xcode project lives in `frontend/ios/`.

## Build without a Mac (GitHub Actions)

A Mac in the cloud builds the app and uploads it to TestFlight. Run it from GitHub: **Actions > iPhone build to TestFlight > Run workflow**, type the version (e.g. `1.0.0`). The build number goes up by itself each run. Each run takes about 20 minutes of macOS time (on a private repo GitHub counts macOS minutes at 10x, so the free 2,000 minutes cover roughly 8 builds a month).

One-time setup:

1. **Create the app in App Store Connect**: appstoreconnect.apple.com > Apps > **+** > New App. Platform iOS, name Velkiz, bundle ID `com.velkiz.app` (if it isn't in the list, first add it at developer.apple.com > Identifiers > **+** > App IDs), SKU `velkiz`.
2. **Make an API key**: App Store Connect > Users and Access > **Integrations** > App Store Connect API > Team Keys > **+**. Name "GitHub build", access **Admin** (needed so the build can create signing certificates). Download the `.p8` file (only once) and note the **Key ID** and the **Issuer ID** shown above the list.
3. **Find your Team ID**: developer.apple.com > Account > Membership details.
4. **Add GitHub secrets**: repo **Settings > Secrets and variables > Actions > New repository secret**, one each:

   | Secret | Value |
   | --- | --- |
   | `APPLE_TEAM_ID` | Team ID |
   | `ASC_KEY_ID` | API key ID |
   | `ASC_ISSUER_ID` | Issuer ID |
   | `ASC_KEY_P8` | The whole text of the `.p8` file, including the BEGIN/END lines |
   | `VITE_API_URL` | Live backend, e.g. `https://api.velkiz.com` |
   | `VITE_SUPABASE_URL` | Same as in `frontend/.env` |
   | `VITE_SUPABASE_ANON_KEY` | Same as in `frontend/.env` |
   | `VITE_REVENUECAT_IOS_KEY` | RevenueCat public iOS key, `appl_...` (see Super Likes below) |

5. Run the workflow. When it's green, the build appears in App Store Connect > TestFlight after Apple processes it. Add yourselves as internal testers and install with the **TestFlight** app on your iPhones.

If it fails, open the run and read the red step; the most common causes are a missing secret or an API key without Admin access.

## Build with a Mac (optional)

1. In `frontend/.env`, point the app at the live backend over HTTPS, e.g.
   `VITE_API_URL=https://api.velkiz.com`. The app can't reach `localhost` on your Mac from a phone.
2. `cd frontend && npm install && npm run ios` opens Xcode. After changing web code, `npm run ios:sync`.
3. In Xcode, select the **App** target > **Signing & Capabilities**, pick your team, then Run on a simulator or a plugged-in iPhone.

## The website

velkiz.com only shows a landing page (download buttons, Privacy, Terms, Guidelines, contact). The app itself only runs inside the iPhone app, where screenshots are blocked. `npm run dev` still runs the full app in a browser for testing.

- Host the `frontend` build (`npm run build`, the `dist` folder) on velkiz.com, e.g. on Vercel, Netlify or Cloudflare Pages, with every unknown path falling back to `index.html`.
- Once the app is live, set `VITE_APP_STORE_URL` on the website's hosting to the App Store link and rebuild, so the button works.
- On the backend, leave `FRONTEND_URL` unset in production: only the iPhone app may call the API.

### Email links open the app

Verify-email and reset-password emails link to `https://velkiz.com/auth/...`. On an iPhone with Velkiz installed, iOS opens those links in the app (universal links). For that:

1. `frontend/public/.well-known/apple-app-site-association` has your Team ID (2R7CDWDFGY). Deploy the website. Check that `https://velkiz.com/.well-known/apple-app-site-association` shows the file.
2. Backend: set `SITE_URL=https://velkiz.com`.
3. Supabase > Authentication > URL Configuration: Site URL `https://velkiz.com`, and add `https://velkiz.com/auth/callback` to Redirect URLs.

Opened anywhere else (a laptop), the link shows "Open this on your phone".

## Super Likes (in-app purchase)

Everyone gets one free Super Like every 24 hours. More are sold in packs through Apple, using [RevenueCat](https://www.revenuecat.com) (free until $2,500 a month in revenue). The server only adds Super Likes when RevenueCat confirms the payment, so the app can't fake a purchase.

1. **Paid Apps agreement**: App Store Connect > Business: accept the Paid Apps agreement and add bank and tax details. No purchase works without this.
2. **Products**: App Store Connect > your app > Monetization > **In-App Purchases** > **+**, type **Consumable**. Make one per pack. The product ID must end in the pack size:
   - `velkiz_superlikes_5`
   - `velkiz_superlikes_15`
   - `velkiz_superlikes_30`
   Give each a price, a display name ("5 Super Likes"), a description, and a review screenshot (a screenshot of the Super Likes sheet is fine).
3. **RevenueCat**: sign up, create a project, add an **App Store** app with bundle ID `com.velkiz.app`. It asks for an In-App Purchase key: App Store Connect > Users and Access > Integrations > **In-App Purchase** > **+**, download the `.p8`, upload it to RevenueCat.
4. In RevenueCat > **Products**, import the three products. Then **Offerings**: make one named `default`, mark it current, and add one package per product.
5. RevenueCat > API keys: copy the **public iOS key** (`appl_...`) into the GitHub secret `VITE_REVENUECAT_IOS_KEY`.
6. RevenueCat > Integrations > **Webhooks** > Add: URL `https://<your backend>/api/purchases/revenuecat`, and in **Authorization header value** put a long random password. Put the same value in the backend as `REVENUECAT_WEBHOOK_SECRET`.
7. Run `supabase/migrations/2026-11-26_super_likes.sql` in Supabase.
8. Test in TestFlight: purchases there are free (sandbox) and still go through the webhook.

Without these, Super Likes still work: everyone gets their free one, and the sheet says packs aren't available.

## Sign in with Apple

The login screen in the app shows **Continue with Apple** above the email form. People can pick "Hide My Email". Apple accounts have no password, so deleting the account asks them to confirm with Apple instead.

1. developer.apple.com > Identifiers > `com.velkiz.app`: **Sign In with Apple** ticked (Enable as a primary App ID).
2. **Supabase** > Authentication > Sign In / Providers > **Apple**: turn it on. In **Client IDs** put `com.velkiz.app`. Leave the secret key empty (only needed for signing in on a website). Save.
3. **Email sources** (so "Hide My Email" users get our emails): developer.apple.com > Services > **Sign in with Apple for Email Communication** > Configure. Add the domains `support.velkiz.com` and `velkiz.com`, and the address `support@velkiz.com`.
4. **Revoke on delete** (Apple asks apps to remove themselves from the person's Apple ID when they delete their account): developer.apple.com > **Keys** > **+**, name "Velkiz Sign in with Apple", tick **Sign in with Apple** > Configure > primary App ID `com.velkiz.app` > Save > Continue > Register > download the `.p8`. On the backend (Render) add:
   - `APPLE_SIGNIN_KEY_ID` = that key's ID
   - `APPLE_SIGNIN_KEY` = the whole `.p8` text
   - `APPLE_TEAM_ID` = `2R7CDWDFGY`

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
4. Push Notifications is turned on in `App/App.entitlements`; the cloud build enables it on the App ID by itself.
5. Run `supabase/migrations/2026-11-26_push_notifications.sql` in Supabase.

Notifications never contain names or message text, only "You have a new match", "You have a new message" or "Someone Super Liked you", so a lock screen gives nothing away. People choose matches and/or messages in Settings.

## Privacy protection

- **Screenshots and screen recordings come out blank** in the app (`@capacitor-community/privacy-screen`, set in `capacitor.config.json`). iOS doesn't let apps fully stop the screenshot button, so this is the strongest option available.
- **Screenshot alerts:** screenshotting a chat adds a "took a screenshot" line for both people and notifies the other person. Needs `supabase/migrations/2026-11-26_screenshot_alerts.sql`.
- **App switcher** shows the splash screen instead of the last screen.
- Long-press "Save image" and right-click saving are turned off on photos.
