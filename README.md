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
```

Tests run against `http://localhost:3001`. The dev server starts automatically if not running.

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
- **Authentication > URL Configuration**: Add your URLs to Site URL and Redirect URLs:
  - `http://localhost:3000` (dev)
  - `http://localhost:3000/update-password` (forgot password flow)
  - Your production URL (e.g. `https://your-app.vercel.app`)
  - `https://your-app.vercel.app/update-password` (forgot password flow)

## Project structure

```
app/
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

## Architecture

- **calendars**: One per user (personal); structure supports future shared calendars
- **entries**: Belong to calendars; RLS ensures users only access their own data
- **Protected routes**: Middleware redirects unauthenticated users from `/app/*`

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

---
