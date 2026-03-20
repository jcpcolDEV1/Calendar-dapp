# Calendar - Personal Planner

A minimal, production-ready personal calendar web application for managing notes, tasks, and reminders.

## Features

- **Authentication**: Email/password signup, login, logout, forgot password with session persistence
- **Monthly calendar view**: Navigate months, jump to today
- **Entries**: Create notes and tasks with title, description, date, time, reminders, priority, labels, and colors
- **Task completion**: Mark tasks as done with visual feedback
- **Upcoming tasks sidebar**: Tasks due today, tomorrow, and later; upcoming reminders
- **Search & filters**: Search by text; filter by type, priority, completed status
- **Dark mode**: Toggle in user menu
- **Responsive**: Mobile-friendly layout

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, PostgreSQL, Row Level Security)
- **Deployment**: Vercel (frontend), Supabase (backend)

## Setup

### 1. Clone and install

```bash
cd Calendar
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project
2. In **Settings > API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Run database schema

1. In Supabase Dashboard, open **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Run the script

This creates:
- `calendars` and `entries` tables
- Row Level Security policies
- Trigger to auto-create a personal calendar for each new user

**Custom calendar background (optional):** run `supabase/migrations/20250309000000_calendar_background.sql` in the SQL Editor if your project was created before this feature. It adds `background_storage_path` / `background_overlay_opacity` on `calendars` and creates the `calendar_backgrounds` storage bucket with policies.

### 4. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase URL and anon key.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. E2E tests (optional)

```bash
npx playwright install chromium   # First time only
npm run test:e2e                  # All tests
npm run test:e2e tests/calendar-flows.spec.ts   # Calendar flows only
npm run test:e2e:notifications    # Notification banner (mocked browser APIs)
```

Playwright uses `http://localhost:3002` and can start `next dev` automatically (`playwright.config.ts`).  
**Notification banner tests** (`tests/notification-banner.spec.ts`) mock `Notification`, `navigator.serviceWorker`, and `PushManager`, and stub `POST /api/push/subscribe`, so no real permission dialog or push backend is required. The config sets a fallback `NEXT_PUBLIC_VAPID_PUBLIC_KEY` when Playwright starts the dev server so the banner can render.

If a dev server is **already** running on port 3002 **without** that env (`reuseExistingServer`), those tests may not see the banner—stop that process or run with `CI=1` so Playwright starts a fresh server.

## Deployment

### Vercel (frontend)

1. Push your code to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Supabase (backend)

Your Supabase project is already hosted. Ensure:

- **Authentication > Providers**: Email is enabled
- **Authentication > URL Configuration**:
  - **Site URL**: your real production URL (e.g. `https://your-app.vercel.app`). Must match a live Vercel deployment — old preview URLs like `https://your-app-xxxxx.vercel.app` that no longer exist cause `DEPLOYMENT_NOT_FOUND` when users open the email link.
  - **Redirect URLs** (allow list — add every origin you use):
    - `http://localhost:3000/**` (or `http://localhost:3000/auth/callback`, etc.)
    - `https://your-app.vercel.app/auth/callback` (email confirmation after signup)
    - `https://your-app.vercel.app/update-password` (forgot password)
    - Optional: `https://*.vercel.app/auth/callback` if your Supabase plan supports wildcards (preview deployments).

The app sends **`emailRedirectTo`** = `{origin}/auth/callback` on signup. In production, set **`NEXT_PUBLIC_APP_URL`** in Vercel (e.g. `https://your-app.vercel.app`) so confirmation links never use a deleted preview hostname. Localhost always uses the current browser origin. See [docs/SUPABASE_AUTH_URLS.md](docs/SUPABASE_AUTH_URLS.md) for a full checklist.

## Project structure

```
app/
  auth/callback/           # Email confirmation (PKCE) — set in Supabase Redirect URLs
  (auth)/login, signup, forgot-password, update-password  # Auth pages
  (dashboard)/app/         # Protected calendar dashboard
  actions/                 # Server actions (entries, auth, data)
components/
  calendar/                # Calendar grid, day cells, dashboard
  entries/                 # Entry form, card, list, day panel
  layout/                  # Header, user menu
  sidebar/                 # Upcoming tasks
lib/supabase/              # Supabase client (browser, server, middleware)
services/                  # Server-side data access
types/                     # TypeScript types
supabase/schema.sql        # Database schema
```

## Reminder timezones

`entries.time_zone` stores the IANA timezone from the browser (e.g. `Europe/Madrid`) when you save an entry. `reminder_at` is computed in UTC so push reminders match the user’s local wall clock.

- **New databases**: `supabase/schema.sql` includes `time_zone`.
- **Existing Supabase projects**: run `supabase/migrations/20250320000000_add_entries_time_zone.sql` in the SQL Editor.
- Rows with `time_zone` NULL (legacy) still use **UTC** when backfilling `reminder_at` (same as the previous server-only `Date` behavior). Re-save an entry from the app to store your timezone.

## Architecture

- **calendars**: One per user (personal); structure supports future shared calendars
- **entries**: Belong to calendars; RLS ensures users only access their own data
- **Protected routes**: Middleware redirects unauthenticated users from `/app/*`

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

---
