"use server";

import { createClient } from "@/lib/supabase/server";
import type { EntryInsert, EntryUpdate } from "@/types";
import { computeReminderAt } from "@/lib/reminder-utils";

function withComputedReminder<T extends { date: string; time?: string | null; reminder_offset_minutes?: number | null }>(
  data: T
): T & { reminder_at: string | null } {
  const date = data.date;
  const time = data.time ?? null;
  const offset = data.reminder_offset_minutes ?? null;
  const reminder_at =
    time && offset != null && offset > 0
      ? computeReminderAt(date, time, offset)
      : null;
  return { ...data, reminder_at };
}

export async function createEntryAction(
  entry: Omit<EntryInsert, "created_by_user_id">
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const withReminder = withComputedReminder({
    ...entry,
    date: entry.date,
    time: entry.time ?? null,
    reminder_offset_minutes: entry.reminder_offset_minutes ?? null,
  });

  const { data, error } = await supabase
    .from("entries")
    .insert({
      ...entry,
      created_by_user_id: user.id,
      description: entry.description ?? "",
      priority: entry.priority ?? "medium",
      label: entry.label ?? "",
      color: entry.color ?? "",
      is_completed: entry.is_completed ?? false,
      recurrence_type: entry.recurrence_type ?? "none",
      reminder_at: withReminder.reminder_at,
      reminder_offset_minutes: entry.reminder_offset_minutes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEntryAction(id: string, updates: EntryUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const date = updates.date;
  const time = updates.time ?? undefined;
  const offset = updates.reminder_offset_minutes;
  let finalUpdates = { ...updates };
  if (date && (time !== undefined || offset !== undefined)) {
    const effectiveTime = time ?? null;
    const effectiveOffset = offset ?? null;
    const reminder_at =
      effectiveTime && effectiveOffset != null && effectiveOffset > 0
        ? computeReminderAt(date, effectiveTime, effectiveOffset)
        : null;
    finalUpdates = {
      ...updates,
      reminder_at,
      reminder_offset_minutes: effectiveTime ? effectiveOffset : null,
    };
  } else if (updates.time === null || updates.reminder_offset_minutes === null) {
    finalUpdates = {
      ...updates,
      reminder_at: null,
      reminder_offset_minutes: null,
    };
  }

  const { data, error } = await supabase
    .from("entries")
    .update(finalUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEntryAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}
