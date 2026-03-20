-- IANA timezone for interpreting entry time + reminder (e.g. Europe/Madrid).
-- NULL = legacy rows; computeReminderAt falls back to UTC for those.
ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS time_zone TEXT;
