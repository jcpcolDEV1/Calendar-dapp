-- Add reminder offset and sent tracking
ALTER TABLE public.entries
ADD COLUMN IF NOT EXISTS reminder_offset_minutes INTEGER;

ALTER TABLE public.entries
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
