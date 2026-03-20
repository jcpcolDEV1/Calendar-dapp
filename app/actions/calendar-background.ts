"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateCalendarBackgroundSettings(
  calendarId: string,
  payload: { storagePath: string | null; overlayOpacity: number }
): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  if (
    payload.overlayOpacity < 0 ||
    payload.overlayOpacity > 95 ||
    !Number.isFinite(payload.overlayOpacity)
  ) {
    return { error: "Opacidad no válida (0–95)" };
  }

  const { error } = await supabase
    .from("calendars")
    .update({
      background_storage_path: payload.storagePath,
      background_overlay_opacity: Math.round(payload.overlayOpacity),
    })
    .eq("id", calendarId)
    .eq("owner_user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/app");
  return { ok: true };
}
