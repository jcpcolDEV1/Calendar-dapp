# Calendar App - Architecture & Design

## 1. Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel (Frontend)                         │
│  Next.js App Router │ React │ TypeScript │ Tailwind CSS          │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS / REST
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase (Backend)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Auth Service │  │  PostgreSQL  │  │ Row Level Security   │   │
│  │ (JWT tokens) │  │  (Database)  │  │ (Data isolation)     │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

- **Separation of concerns**: UI components, business logic, data access, and utilities are in separate layers
- **Future-ready**: Schema supports multiple calendars, sharing, and role-based access
- **Security-first**: RLS enforces data isolation; never trust frontend alone
- **Scalable**: Stateless frontend; Supabase handles scaling

---

## 2. Database Schema

### Entity Relationship

```
users (Supabase Auth)
  │
  └── calendars (1:many - user owns calendars)
        │
        └── entries (many:1 - entries belong to calendar)
```

### Tables

#### `calendars`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| owner_user_id | uuid | References auth.users |
| name | text | Calendar name |
| is_personal | boolean | True for default personal calendar |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Future-ready**: `is_personal` and structure allow adding shared calendars with a `calendar_members` table later.

#### `entries`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| calendar_id | uuid | FK → calendars |
| created_by_user_id | uuid | FK → auth.users |
| title | text | |
| description | text | |
| entry_type | text | 'note' \| 'task' |
| date | date | |
| time | time | nullable |
| reminder_at | timestamptz | nullable |
| priority | text | 'low' \| 'medium' \| 'high' |
| label | text | |
| color | text | |
| is_completed | boolean | |
| recurrence_type | text | 'none' \| 'daily' \| 'weekly' \| 'monthly' \| 'yearly' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Row Level Security (RLS)

- **calendars**: Users can only SELECT/INSERT/UPDATE/DELETE calendars where `owner_user_id = auth.uid()`
- **entries**: Users can only access entries where the calendar's `owner_user_id = auth.uid()`

---

## 3. Component Structure

```
app/
├── (auth)/                    # Auth layout group
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (dashboard)/                # Protected layout group
│   └── app/
│       ├── layout.tsx          # Dashboard layout (header, sidebar)
│       └── page.tsx            # Calendar view
├── layout.tsx                  # Root layout
├── page.tsx                    # Landing page
└── globals.css

components/
├── ui/                         # Reusable UI primitives
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── ...
├── calendar/
│   ├── CalendarGrid.tsx        # Monthly grid
│   ├── DayCell.tsx            # Single day cell
│   └── MonthNavigation.tsx    # Prev/Next/Today
├── entries/
│   ├── DayDetailPanel.tsx     # Modal/panel for day
│   ├── EntryForm.tsx          # Create/edit form
│   ├── EntryCard.tsx          # Single entry display
│   └── EntryList.tsx          # List of entries
├── sidebar/
│   └── UpcomingTasks.tsx      # Tasks due today/tomorrow
└── layout/
    ├── Header.tsx
    └── UserMenu.tsx

lib/
├── supabase/
│   ├── client.ts              # Browser client
│   ├── server.ts              # Server client
│   └── middleware.ts          # Auth middleware
├── utils.ts
└── constants.ts

services/
├── auth.ts                    # Auth helpers
├── calendars.ts               # Calendar CRUD
└── entries.ts                 # Entry CRUD

hooks/
├── useAuth.ts
├── useCalendar.ts
├── useEntries.ts
└── useUpcomingTasks.ts

types/
└── index.ts                   # Shared types
```

---

## 4. Data Flow

### Authentication Flow
1. User visits `/` → sees landing
2. User clicks Login/Signup → `/login` or `/signup`
3. Supabase Auth handles credentials → JWT stored in cookies
4. Middleware checks JWT on `/app/*` routes → redirects to `/login` if unauthenticated
5. Dashboard loads → fetches user's calendar and entries

### Calendar Data Flow
1. User lands on `/app` → `useCalendar` fetches current month's entries
2. Calendar grid renders → each `DayCell` shows entry count indicators
3. User clicks day → `DayDetailPanel` opens with `useEntries(date)` for that day
4. User creates/edits entry → `entries.create()` or `entries.update()` → optimistic UI → Supabase mutation
5. Real-time: Supabase subscription (optional) or refetch on mutation success

### Entry CRUD Flow
```
Create: EntryForm submit → entries.create() → Supabase insert → RLS validates → refetch
Update: EntryCard edit → EntryForm → entries.update() → Supabase update → RLS validates → refetch
Delete: EntryCard delete → entries.delete() → Supabase delete → RLS validates → refetch
```

---

## 5. Security Model

- **Auth**: Supabase Auth with email/password; session in httpOnly cookies (via @supabase/ssr)
- **RLS**: All data access filtered by `auth.uid()`; no user can access another user's data
- **API**: No custom API routes; direct Supabase client from server components or server actions
- **Validation**: Zod schemas for form validation; Supabase enforces DB constraints

---

## 6. Future Extensibility

| Feature | Preparation |
|---------|-------------|
| Multiple calendars | `calendars` table already supports multiple per user |
| Shared calendars | Add `calendar_members(calendar_id, user_id, role)` table |
| Role permissions | Add `role` to `calendar_members` (owner, editor, viewer) |
| Real-time sync | Supabase Realtime on `entries` table |
