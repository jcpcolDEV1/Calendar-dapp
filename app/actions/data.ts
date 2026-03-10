"use server";

import { createClient } from "@/lib/supabase/server";
import type { EntryFilters } from "@/types";

export async function getEntriesByDateRangeAction(
  calendarId: string,
  startDate: string,
  endDate: string,
  filters?: EntryFilters
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("entries")
    .select("*")
    .eq("calendar_id", calendarId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("time", { ascending: true, nullsFirst: false });

  if (filters?.entry_type) query = query.eq("entry_type", filters.entry_type);
  if (filters?.priority) query = query.eq("priority", filters.priority);
  if (filters?.is_completed !== undefined)
    query = query.eq("is_completed", filters.is_completed);
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data } = await query;
  return (data ?? []) as import("@/types").Entry[];
}

export async function getEntriesByDateAction(calendarId: string, date: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("entries")
    .select("*")
    .eq("calendar_id", calendarId)
    .eq("date", date)
    .order("time", { ascending: true, nullsFirst: false });

  return (data ?? []) as import("@/types").Entry[];
}

export async function getUpcomingTasksAction(calendarId: string, limit = 20) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("entries")
    .select("*")
    .eq("calendar_id", calendarId)
    .eq("entry_type", "task")
    .gte("date", today)
    .eq("is_completed", false)
    .order("date", { ascending: true })
    .order("time", { ascending: true, nullsFirst: false })
    .limit(limit);

  return (data ?? []) as import("@/types").Entry[];
}

export async function getUpcomingRemindersAction(calendarId: string, limit = 10) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const now = new Date().toISOString();
  const { data } = await supabase
    .from("entries")
    .select("*")
    .eq("calendar_id", calendarId)
    .not("reminder_at", "is", null)
    .gte("reminder_at", now)
    .order("reminder_at", { ascending: true })
    .limit(limit);

  return (data ?? []) as import("@/types").Entry[];
}
