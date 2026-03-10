import type { Calendar } from "@/types";
import { createClient } from "@/lib/supabase/server";

export async function getPersonalCalendar(): Promise<Calendar | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("calendars")
    .select("*")
    .eq("owner_user_id", user.id)
    .eq("is_personal", true)
    .single();

  if (error || !data) return null;
  return data as Calendar;
}

/** Gets personal calendar, creating it if missing (fallback when DB trigger did not run). */
export async function getOrCreatePersonalCalendar(): Promise<Calendar | null> {
  const calendar = await getPersonalCalendar();
  if (calendar) return calendar;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: created, error } = await supabase
    .from("calendars")
    .insert({
      owner_user_id: user.id,
      name: "My Calendar",
      is_personal: true,
    })
    .select()
    .single();

  if (error || !created) return null;
  return created as Calendar;
}
