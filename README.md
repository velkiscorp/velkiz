# Velkis

Anonymous dating app by Velvet. React + Vite frontend, Express + Socket.io backend, Supabase for auth, database and storage.

## Run it locally

**Backend** (`backend/.env`):

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<service role key>   # server only, never in the frontend
SUPABASE_ANON_KEY=<anon key>
FRONTEND_URL=http://localhost:5173
PORT=3000
# TRUST_PROXY=1   # set when deployed behind a proxy (Railway, Render, ...)
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
