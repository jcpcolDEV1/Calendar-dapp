-- Custom calendar background image (Supabase Storage path + overlay opacity)

ALTER TABLE public.calendars
  ADD COLUMN IF NOT EXISTS background_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS background_overlay_opacity SMALLINT NOT NULL DEFAULT 72
    CHECK (background_overlay_opacity >= 0 AND background_overlay_opacity <= 95);

COMMENT ON COLUMN public.calendars.background_storage_path IS 'Path inside bucket calendar_backgrounds, e.g. {user_id}/calendar-bg.webp';
COMMENT ON COLUMN public.calendars.background_overlay_opacity IS '0-95: opacity of light/dark scrim over image for readability';

-- Storage bucket (public read so background-image URL works without signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('calendar_backgrounds', 'calendar_backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Policies: users only read/write objects under folder named with their user id
DROP POLICY IF EXISTS "calendar_bg_select_public" ON storage.objects;
DROP POLICY IF EXISTS "calendar_bg_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "calendar_bg_update_own" ON storage.objects;
DROP POLICY IF EXISTS "calendar_bg_delete_own" ON storage.objects;

CREATE POLICY "calendar_bg_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'calendar_backgrounds');

CREATE POLICY "calendar_bg_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'calendar_backgrounds'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY "calendar_bg_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'calendar_backgrounds'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY "calendar_bg_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'calendar_backgrounds'
    AND split_part(name, '/', 1) = auth.uid()::text
  );
