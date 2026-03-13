-- Calendar App - Supabase Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Calendar',
  is_personal BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id UUID NOT NULL REFERENCES public.calendars(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  entry_type TEXT NOT NULL CHECK (entry_type IN ('note', 'task')),
  date DATE NOT NULL,
  time TIME,
  end_time TIME,
  reminder_at TIMESTAMPTZ,
  reminder_offset_minutes INTEGER,
  reminder_sent_at TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  label TEXT DEFAULT '',
  color TEXT DEFAULT '',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  recurrence_type TEXT NOT NULL DEFAULT 'none' CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_calendars_owner ON public.calendars(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_entries_calendar_date ON public.entries(calendar_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_reminder ON public.entries(reminder_at) WHERE reminder_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_entries_calendar ON public.entries(calendar_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_calendars_updated_at ON public.calendars;
CREATE TRIGGER set_calendars_updated_at
  BEFORE UPDATE ON public.calendars
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_entries_updated_at ON public.entries;
CREATE TRIGGER set_entries_updated_at
  BEFORE UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Calendars: users can only access their own calendars
CREATE POLICY "Users can view own calendars"
  ON public.calendars FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert own calendars"
  ON public.calendars FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own calendars"
  ON public.calendars FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete own calendars"
  ON public.calendars FOR DELETE
  USING (auth.uid() = owner_user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Entries: users can only access entries in calendars they own
CREATE POLICY "Users can view entries in own calendars"
  ON public.entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.calendars c
      WHERE c.id = entries.calendar_id AND c.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert entries in own calendars"
  ON public.entries FOR INSERT
  WITH CHECK (
    auth.uid() = created_by_user_id
    AND EXISTS (
      SELECT 1 FROM public.calendars c
      WHERE c.id = entries.calendar_id AND c.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update entries in own calendars"
  ON public.entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.calendars c
      WHERE c.id = entries.calendar_id AND c.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calendars c
      WHERE c.id = entries.calendar_id AND c.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete entries in own calendars"
  ON public.entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.calendars c
      WHERE c.id = entries.calendar_id AND c.owner_user_id = auth.uid()
    )
  );

-- ============================================
-- AUTO-CREATE PERSONAL CALENDAR ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.calendars (owner_user_id, name, is_personal)
  VALUES (NEW.id, 'My Calendar', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
