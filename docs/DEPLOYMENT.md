# Deployment Guide

## Prerequisites

- Supabase project
- Vercel account (or other Next.js host)
- Git repository

## 1. Supabase Setup

### Create project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. New project → choose org, name, password, region
3. Wait for project to be ready

### Run schema

1. **SQL Editor** → New query
2. Paste contents of `supabase/schema.sql`
3. Run

### Configure Auth

1. **Authentication** → **Providers** → Email: ensure enabled
2. **Authentication** → **URL Configuration**:
   - **Site URL**: `https://your-app.vercel.app` (or your production URL)
   - **Redirect URLs**: Add `https://your-app.vercel.app/**`

### Get API keys

1. **Settings** → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Vercel Deployment

### From GitHub

1. Push code to GitHub
2. [vercel.com/new](https://vercel.com/new) → Import repository
3. Framework: Next.js (auto-detected)
4. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
5. Deploy

### From CLI

```bash
npm i -g vercel
vercel
# Follow prompts, add env vars when asked
```

## 3. Post-deployment

1. Update Supabase **Site URL** and **Redirect URLs** with your actual Vercel URL
2. Test signup, login, and calendar flows
3. (Optional) Set up custom domain in Vercel

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Redirect loop | Check Supabase redirect URLs include your domain |
| "Invalid API key" | Verify env vars are set in Vercel |
| RLS blocks queries | Ensure user is authenticated; check RLS policies |
| No calendar on signup | Run `handle_new_user` trigger from schema |
