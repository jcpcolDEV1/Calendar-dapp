"use client";

import { useState, useMemo } from "react";
import type { Entry, EntryType, Priority } from "@/types";
import { ENTRY_TYPES, PRIORITIES, COLOR_OPTIONS } from "@/lib/constants";
import {
  offsetMinutesFromReminderWallTime,
  reminderWallFromOffset,
} from "@/lib/reminder-utils";
import { ReminderDateTimeFields } from "@/components/entries/ReminderDateTimeFields";
import { ReminderPushCallout } from "@/components/notifications/ReminderPushCallout";
import { getClientIanaTimeZone } from "@/lib/client-timezone";
import { toast } from "sonner";

interface EntryFormProps {
  date: string;
  calendarId: string;
  entry?: Entry | null;
  onSave: (data: EntryFormData) => Promise<void>;
  onCancel: () => void;
}

export interface EntryFormData {
  title: string;
  description: string;
  entry_type: EntryType;
  date: string;
  time: string | null;
  reminder_offset_minutes: number | null;
  /** IANA timezone from browser for correct reminder_at */
  time_zone: string;
  priority: Priority;
  label: string;
  color: string;
  is_completed?: boolean;
}

export function EntryForm({
  date,
  calendarId,
  entry,
  onSave,
  onCancel,
}: EntryFormProps) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [entryType, setEntryType] = useState<EntryType>(entry?.entry_type ?? "task");
  const [formDate, setFormDate] = useState(entry?.date ?? date);
  const [time, setTime] = useState(
    entry?.time ? entry.time.slice(0, 5) : ""
  );
  const initialWall = (() => {
    const tz = entry?.time_zone?.trim() || getClientIanaTimeZone();
    const evD = entry?.date ?? date;
    const evT = entry?.time ? entry.time.slice(0, 5) : "";
    const off = entry?.reminder_offset_minutes;
    if (!off || off <= 0 || evT.length < 5) return { d: "", t: "" };
    const w = reminderWallFromOffset(evD, evT, off, tz);
    return { d: w?.date ?? "", t: w?.time ?? "" };
  })();
  const [reminderDate, setReminderDate] = useState(initialWall.d);
  const [reminderTime, setReminderTime] = useState(initialWall.t);
  const [priority, setPriority] = useState<Priority>(entry?.priority ?? "medium");
  const [label, setLabel] = useState(entry?.label ?? "");
  const [color, setColor] = useState(entry?.color ?? "");
  const [isCompleted, setIsCompleted] = useState(entry?.is_completed ?? false);
  const [loading, setLoading] = useState(false);

  const hasValidReminder = useMemo(() => {
    const timeVal = time?.trim() || null;
    if (!timeVal || timeVal.length < 5) return false;
    if (!reminderDate.trim() || !reminderTime.trim()) return false;
    const tz = getClientIanaTimeZone();
    const r = offsetMinutesFromReminderWallTime(
      formDate,
      timeVal.slice(0, 5),
      reminderDate,
      reminderTime,
      tz
    );
    return r.ok;
  }, [time, reminderDate, reminderTime, formDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const tz = getClientIanaTimeZone();
      const timeVal = time?.trim() || null;
      let reminder_offset_minutes: number | null = null;
      if (timeVal) {
        if (!reminderDate.trim() || !reminderTime.trim()) {
          reminder_offset_minutes = null;
        } else {
          const r = offsetMinutesFromReminderWallTime(
            formDate,
            timeVal,
            reminderDate,
            reminderTime,
            tz
          );
          if (!r.ok) {
            toast.error(r.error);
            return;
          }
          reminder_offset_minutes = r.minutes;
        }
      }

      await onSave({
        title: title.trim(),
        description: description.trim(),
        entry_type: entryType,
        date: formDate,
        time: time || null,
        reminder_offset_minutes,
        time_zone: tz,
        priority,
        label: label.trim(),
        color: color || "",
        is_completed: entryType === "task" ? isCompleted : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          placeholder="Entry title"
          autoFocus
          data-testid="entry-form-title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Add details..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Type
        </label>
        <select
          value={entryType}
          onChange={(e) => setEntryType(e.target.value as EntryType)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          {ENTRY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Date
          </label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Time (optional)
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Reminder (optional)
        </label>
        <ReminderDateTimeFields
          hasTime={Boolean(time?.trim())}
          eventDate={formDate}
          eventTime={time.trim().slice(0, 5)}
          timeZone={getClientIanaTimeZone()}
          reminderDate={reminderDate}
          reminderTime={reminderTime}
          onReminderDateChange={setReminderDate}
          onReminderTimeChange={setReminderTime}
          zoneHint={getClientIanaTimeZone()}
        />
        <ReminderPushCallout show={hasValidReminder} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Priority
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Label
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Work, Personal"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Color
        </label>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setColor("")}
            className={`w-8 h-8 rounded-full border-2 ${
              !color ? "border-blue-600" : "border-transparent"
            }`}
            title="No color"
          />
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 ${
                color === c ? "border-slate-900 dark:border-white" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {entryType === "task" && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => setIsCompleted(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Mark as completed
          </span>
        </label>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          data-testid="entry-form-submit"
        >
          {loading ? "Saving..." : entry ? "Update" : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
