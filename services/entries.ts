import type { Entry, EntryInsert, EntryUpdate, EntryFilters } from "@/types";
import { createClient } from "@/lib/supabase/server";

export async function getEntriesByDateRange(
  calendarId: string,
  startDate: string,
  endDate: string,
  filters?: EntryFilters
): Promise<Entry[]> {
  const supabase = await createClient();

  let query = supabase
    .from("entries")
    .select("*")
    .eq("calendar_id", calendarId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("time", { ascending: true, nullsFirst: false });

  if (filters?.entry_type) {
    query = query.eq("entry_type", filters.entry_type);
  }
  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters?.is_completed !== undefined) {
    query = query.eq("is_completed", filters.is_completed);
  }
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Entry[];
}

export async function getEntriesByDate(
  calendarId: string,
  date: string
): Promise<Entry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("calendar_id", calendarId)
    .eq("date", date)
    .order("time", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as Entry[];
}

export async function getUpcomingTasks(
  calendarId: string,
  limit = 20
): Promise<Entry[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("calendar_id", calendarId)
    .eq("entry_type", "task")
    .gte("date", today)
    .eq("is_completed", false)
    .order("date", { ascending: true })
    .order("time", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Entry[];
}

export async function getUpcomingReminders(
  calendarId: string,
  limit = 10
): Promise<Entry[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("calendar_id", calendarId)
    .eq("is_completed", false)
    .not("reminder_at", "is", null)
    .gte("reminder_at", now)
    .order("reminder_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Entry[];
}

export async function createEntry(entry: EntryInsert): Promise<Entry> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .insert({
      ...entry,
      description: entry.description ?? "",
      priority: entry.priority ?? "medium",
      label: entry.label ?? "",
      color: entry.color ?? "",
      is_completed: entry.is_completed ?? false,
      recurrence_type: entry.recurrence_type ?? "none",
    })
    .select()
    .single();

  if (error) throw error;
  return data as Entry;
}

export async function updateEntry(
  id: string,
  updates: EntryUpdate
): Promise<Entry> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entries")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Entry;
}

export async function deleteEntry(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}
