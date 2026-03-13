export type EntryType = "note" | "task";
export type Priority = "low" | "medium" | "high";
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface Calendar {
  id: string;
  owner_user_id: string;
  name: string;
  is_personal: boolean;
  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: string;
  calendar_id: string;
  created_by_user_id: string;
  title: string;
  description: string;
  entry_type: EntryType;
  date: string;
  time: string | null;
  end_time: string | null;
  reminder_at: string | null;
  reminder_offset_minutes: number | null;
  reminder_sent_at: string | null;
  priority: Priority;
  label: string;
  color: string;
  is_completed: boolean;
  recurrence_type: RecurrenceType;
  created_at: string;
  updated_at: string;
}

export interface EntryInsert {
  calendar_id: string;
  created_by_user_id: string;
  title: string;
  description?: string;
  entry_type: EntryType;
  date: string;
  time?: string | null;
  end_time?: string | null;
  reminder_at?: string | null;
  reminder_offset_minutes?: number | null;
  reminder_sent_at?: string | null;
  priority?: Priority;
  label?: string;
  color?: string;
  is_completed?: boolean;
  recurrence_type?: RecurrenceType;
}

export interface EntryUpdate {
  title?: string;
  description?: string;
  entry_type?: EntryType;
  date?: string;
  time?: string | null;
  end_time?: string | null;
  reminder_at?: string | null;
  reminder_offset_minutes?: number | null;
  reminder_sent_at?: string | null;
  priority?: Priority;
  label?: string;
  color?: string;
  is_completed?: boolean;
  recurrence_type?: RecurrenceType;
}

export interface EntryFilters {
  search?: string;
  entry_type?: EntryType;
  priority?: Priority;
  is_completed?: boolean;
}
