"use server";

import { createClient } from "@/lib/supabase/server";
import type { EntryInsert, EntryUpdate } from "@/types";

export async function createEntryAction(
  entry: Omit<EntryInsert, "created_by_user_id">
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

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

  const { data, error } = await supabase
    .from("entries")
    .update(updates)
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
