-- Add optional end_time column to entries
ALTER TABLE public.entries
ADD COLUMN IF NOT EXISTS end_time TIME;
