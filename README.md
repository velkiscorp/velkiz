# Velkiz

Anonymous dating app by Velvet. React + Vite frontend, Express + Socket.io backend, Supabase for auth, database and storage.

## Run it locally

**Backend** (`backend/.env`):

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<service role key>   # server only, never in the frontend
SUPABASE_ANON_KEY=<anon key>
# Where email links (verify, reset password) point. On an iPhone with the
# app installed they open in the app. Locally use http://localhost:5173
SITE_URL=https://velkiz.com
# Only for running the app in a browser while developing; leave unset in production
FRONTEND_URL=http://localhost:5173
NODE_ENV=production   # on the live server
PORT=3000
# Super Like purchases: the secret you put in RevenueCat's webhook settings
# REVENUECAT_WEBHOOK_SECRET=<long random password>
# TRUST_PROXY=1   # set when deployed behind a proxy (Railway, Render, ...)
# Push notifications to the iPhone app (optional; skipped when missing).
# Make the key at developer.apple.com > Certificates, IDs & Profiles > Keys.
# APNS_KEY_ID=ABC123DEFG
# APNS_TEAM_ID=XYZ987TEAM
# APNS_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
# APNS_BUNDLE_ID=com.velkiz.app
# APNS_PRODUCTION=true   # for TestFlight and App Store builds
```

```
cd backend && npm install && npm run dev
```

**Frontend** (`frontend/.env`):

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_API_URL=http://localhost:3000
```

```
cd frontend && npm install && npm run dev
```

## iPhone app

See `frontend/IOS.md` for building the iPhone app in Xcode and uploading it.

## Tests

```
cd backend && npm test
```

Covers the risky rules: 18+ from date of birth, input checks, who can see photos, one match per pair (including two people swiping at the same moment), blocking, and what a profile is allowed to show. Tests use a fake database, so they never touch Supabase. They also run automatically on every pull request (`.github/workflows/checks.yml`), together with the frontend lint and build.

## Database

- `supabase/schema.sql` is the full current database. On a brand-new Supabase project, run it once to set everything up.
- `supabase/migrations/` holds each change as a dated file. To change the database, add a new file there, run it in the Supabase SQL editor, and update `schema.sql` to match.

## How things fit

- All data goes through the backend (`/api/...`), which checks the login and validates input (`backend/src/validation/schemas.js`).
- Photos sit in a private bucket and only load through `/api/photos/...`, which checks who's asking.
- Ages come from the date of birth on the server. Usernames are lowercase.
- Report and block work from any profile (Discover, Likes, chat). Reports land in the `reports` table; review open ones with `select * from reports where status = 'open' order by created_at;` and set `status` to `reviewed`, `actioned` or `dismissed`. Apple expects reports to be acted on within 24 hours.
- Gender is set once at onboarding and can't be changed after.
- Discover shows people by orientation by default, both ways: a straight man sees women who'd want to see a man (straight, bi or pan women), a gay man sees gay or bi men, and so on (`backend/src/services/orientation.js`). "Show me" in Filters picks the genders instead; the other person's orientation still has to fit.

## Test accounts

`cd backend && npm run seed` creates 50 test accounts with finished profiles and placeholder photos, spread across 8 cities (London, Manchester, New York, Los Angeles, Toronto, Berlin, Mumbai, Sydney). It uses the service key in `backend/.env`, so the accounts are already verified, no emails are sent and signup limits don't apply.

- Sign in as `seed01@example.com` to `seed50@example.com`, password `velkiz-seed-2026` (set `SEED_PASSWORD` in `backend/.env` to change it before seeding; `SEED_EMAIL_DOMAIN` changes the email domain).
- `npm run seed -- --count 10` makes fewer. Running it again skips accounts that already exist.
- `npm run seed -- --reset` deletes every seed account and everything attached to it. Only accounts the seed made are touched.
- Don't run it against the live project once real people are using it.

## Email (signup verification, password reset)

Supabase sends these through Resend (custom SMTP), from `no-reply@support.velkiz.com` (Resend domain: `support.velkiz.com`).

- Supabase > Authentication > Sign In / Providers > Email: **Confirm email** on. Signup then sends a verification link and the account can't sign in until it's clicked.
- Authentication > Emails > SMTP Settings: host `smtp.resend.com`, port `465`, username `resend`, password = Resend API key.

Report emails come from the backend itself, also through Resend. On Render, set:
- `RESEND_API_KEY`: a Resend API key with sending access (can be the same key).
- `REPORTS_EMAIL` (optional): where new reports go. Defaults to `support@velkiz.com`.
- `EMAIL_FROM` (optional): defaults to `Velkiz <no-reply@support.velkiz.com>`.

Without `RESEND_API_KEY`, reports are still saved but no emails are sent.
- Authentication > Emails > Templates: paste `supabase/email-templates/confirm-signup.html` and `reset-password.html` (subject line is at the top of each file).
- Authentication > URL Configuration: Site URL is the live app, and `<site>/auth/callback` plus `<site>/reset-password` are allowed redirect URLs.
- `SITE_URL` in `backend/.env` decides where verification links send people back to (see `frontend/IOS.md`, "Email links open the app").
