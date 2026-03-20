/**
 * Public URL for an object in the `calendar_backgrounds` bucket.
 * Pass `cacheBust` (e.g. `calendars.updated_at`) so the browser refetches after replace/remove;
 * the object path stays the same with upsert, so without this the old image can stick in cache.
 */
export function getCalendarBackgroundPublicUrl(
  storagePath: string | null | undefined,
  cacheBust?: string | null
): string | null {
  if (!storagePath?.trim()) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  const url = `${base}/storage/v1/object/public/calendar_backgrounds/${storagePath}`;
  if (cacheBust?.trim()) {
    const v = encodeURIComponent(cacheBust.trim());
    return `${url}?v=${v}`;
  }
  return url;
}

export const CALENDAR_BACKGROUND_BUCKET = "calendar_backgrounds" as const;
