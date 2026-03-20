"use client";

import { useState, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import { format } from "date-fns";
import { Bell, Check, FileText, Pencil, Trash2 } from "lucide-react";
import type { Entry } from "@/types";
import { updateEntryAction, deleteEntryAction } from "@/app/actions/entries";
import { formatEntryDisplay } from "@/lib/format-entry-display";
import {
  formatReminderOffset,
  offsetMinutesFromReminderWallTime,
  reminderWallFromOffset,
} from "@/lib/reminder-utils";
import { ReminderDateTimeFields } from "@/components/entries/ReminderDateTimeFields";
import { getClientIanaTimeZone } from "@/lib/client-timezone";
import { toast } from "sonner";

function toHHMM(t: string | null): string {
  if (!t) return "";
  return t.trim().slice(0, 5);
}

/** Returns true if end is invalid (earlier than or equal to start when both exist) */
function isEndTimeInvalid(start: string, end: string): boolean {
  if (!start || !end) return false;
  return end <= start;
}

interface EntryCardProps {
  entry: Entry;
  onEdit: (entry: Entry) => void;
  onRefresh: () => void;
}

type ReminderSaveOverride = { kind: "offset"; minutes: number };

export function EntryCard({ entry, onEdit, onRefresh }: EntryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(entry.title);
  const [editTime, setEditTime] = useState(toHHMM(entry.time));
  const [editEndTime, setEditEndTime] = useState(toHHMM(entry.end_time ?? null));
  const initialWall = (() => {
    const tz = entry.time_zone?.trim() || getClientIanaTimeZone();
    const t = toHHMM(entry.time);
    const off = entry.reminder_offset_minutes;
    if (!off || off <= 0 || t.length < 5) return { d: "", t: "" };
    const w = reminderWallFromOffset(entry.date, t, off, tz);
    return { d: w?.date ?? "", t: w?.time ?? "" };
  })();
  const [editRemDate, setEditRemDate] = useState(initialWall.d);
  const [editRemTime, setEditRemTime] = useState(initialWall.t);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditValue(entry.title);
      setEditTime(toHHMM(entry.time));
      setEditEndTime(toHHMM(entry.end_time ?? null));
      const tz = entry.time_zone?.trim() || getClientIanaTimeZone();
      const tt = toHHMM(entry.time);
      const off = entry.reminder_offset_minutes;
      if (off && off > 0 && tt.length >= 5) {
        const w = reminderWallFromOffset(entry.date, tt, off, tz);
        setEditRemDate(w?.date ?? "");
        setEditRemTime(w?.time ?? "");
      } else {
        setEditRemDate("");
        setEditRemTime("");
      }
      setTimeError(null);
      setReminderError(null);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [
    isEditing,
    entry.title,
    entry.time,
    entry.end_time,
    entry.reminder_offset_minutes,
    entry.date,
    entry.time_zone,
  ]);

  async function handleToggleComplete() {
    try {
      await updateEntryAction(entry.id, { is_completed: !entry.is_completed });
      toast.success(entry.is_completed ? "Task reopened" : "Task completed");
      onRefresh();
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteEntryAction(entry.id);
      toast.success("Entry deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function handleInlineSave(override?: ReminderSaveOverride) {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setIsEditing(false);
      setEditValue(entry.title);
      setEditTime(toHHMM(entry.time));
      setEditEndTime(toHHMM(entry.end_time ?? null));
      const tz = entry.time_zone?.trim() || getClientIanaTimeZone();
      const tt = toHHMM(entry.time);
      const off = entry.reminder_offset_minutes;
      if (off && off > 0 && tt.length >= 5) {
        const w = reminderWallFromOffset(entry.date, tt, off, tz);
        setEditRemDate(w?.date ?? "");
        setEditRemTime(w?.time ?? "");
      } else {
        setEditRemDate("");
        setEditRemTime("");
      }
      setTimeError(null);
      setReminderError(null);
      return;
    }
    const newTime = editTime.trim() || null;
    const newEndTime = editEndTime.trim() || null;
    const tz = entry.time_zone?.trim() || getClientIanaTimeZone();

    let newReminderOffset: number | null;
    if (override?.kind === "offset") {
      newReminderOffset =
        newTime && override.minutes > 0 ? override.minutes : null;
    } else if (!newTime || !editRemDate.trim() || !editRemTime.trim()) {
      newReminderOffset = null;
    } else {
      const r = offsetMinutesFromReminderWallTime(
        entry.date,
        newTime,
        editRemDate,
        editRemTime,
        tz
      );
      if (!r.ok) {
        setReminderError(r.error);
        return;
      }
      setReminderError(null);
      newReminderOffset = r.minutes;
    }

    if (newEndTime && newTime && isEndTimeInvalid(newTime, newEndTime)) {
      setTimeError("La hora de fin debe ser posterior a la de inicio");
      return;
    }
    setTimeError(null);

    const titleChanged = trimmed !== entry.title;
    const timeChanged = newTime !== toHHMM(entry.time);
    const endTimeChanged = newEndTime !== toHHMM(entry.end_time ?? null);
    const reminderChanged =
      newReminderOffset !== (entry.reminder_offset_minutes ?? null);
    if (!titleChanged && !timeChanged && !endTimeChanged && !reminderChanged) {
      setIsEditing(false);
      return;
    }
    try {
      await updateEntryAction(entry.id, {
        title: trimmed,
        time: newTime,
        end_time: newEndTime,
        reminder_offset_minutes: newReminderOffset,
        date: entry.date,
        time_zone: entry.time_zone?.trim() || getClientIanaTimeZone(),
      });
      toast.success("Tarea actualizada");
      setIsEditing(false);
      onRefresh();
    } catch {
      toast.error("Error al actualizar");
    }
  }

  function handleInlineCancel() {
    setIsEditing(false);
    setEditValue(entry.title);
    setEditTime(toHHMM(entry.time));
    setEditEndTime(toHHMM(entry.end_time ?? null));
    const tz = entry.time_zone?.trim() || getClientIanaTimeZone();
    const tt = toHHMM(entry.time);
    const off = entry.reminder_offset_minutes;
    if (off && off > 0 && tt.length >= 5) {
      const w = reminderWallFromOffset(entry.date, tt, off, tz);
      setEditRemDate(w?.date ?? "");
      setEditRemTime(w?.time ?? "");
    } else {
      setEditRemDate("");
      setEditRemTime("");
    }
    setTimeError(null);
    setReminderError(null);
  }

  const borderColor = entry.color || "transparent";

  return (
    <div
      data-testid="entry-card"
      className={`
        group flex items-start gap-3 p-3 rounded-lg border-l-4
        bg-slate-50 dark:bg-slate-800/50
        border-slate-200 dark:border-slate-700
        ${entry.is_completed ? "opacity-70" : ""}
      `}
      style={{ borderLeftColor: borderColor || undefined }}
    >
      {entry.entry_type === "task" && (
        <button
          onClick={handleToggleComplete}
          className={`
            mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
            transition-colors
            ${
              entry.is_completed
                ? "bg-green-500 border-green-500 text-white"
                : "border-slate-400 hover:border-green-500"
            }
          `}
          aria-label={entry.is_completed ? "Mark incomplete" : "Mark complete"}
        >
          {entry.is_completed && <Check className="h-3 w-3" />}
        </button>
      )}

      {entry.entry_type === "note" && (
        <FileText className="h-5 w-5 flex-shrink-0 text-slate-400 mt-0.5" />
      )}

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div
            className="entry-card-inline-edit space-y-2"
            data-testid="entry-card-inline-edit"
          >
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInlineSave();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  handleInlineCancel();
                }
              }}
              onBlur={() => void handleInlineSave()}
              className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
              data-testid="entry-card-inline-input"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => {
                    setEditTime(e.target.value);
                    setTimeError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleInlineSave();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      handleInlineCancel();
                    }
                  }}
                  onBlur={() => void handleInlineSave()}
                  className={`px-2 py-1 rounded border text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    timeError
                      ? "border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  } text-slate-900 dark:text-white`}
                  data-testid="entry-card-time-input"
                />
                <span className="text-slate-400 text-sm">–</span>
                <input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => {
                    setEditEndTime(e.target.value);
                    setTimeError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleInlineSave();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      handleInlineCancel();
                    }
                  }}
                  onBlur={() => void handleInlineSave()}
                  className={`px-2 py-1 rounded border text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    timeError
                      ? "border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                  } text-slate-900 dark:text-white`}
                  data-testid="entry-card-end-time-input"
                />
              </div>
              {timeError && (
                <p
                  className="text-xs text-red-600 dark:text-red-400"
                  data-testid="entry-card-time-error"
                >
                  {timeError}
                </p>
              )}
              {reminderError && (
                <p
                  className="text-xs text-red-600 dark:text-red-400"
                  data-testid="entry-card-reminder-error"
                >
                  {reminderError}
                </p>
              )}
              <ReminderDateTimeFields
                compact
                hasTime={Boolean(editTime?.trim())}
                eventDate={entry.date}
                eventTime={editTime.trim().slice(0, 5)}
                timeZone={entry.time_zone?.trim() || getClientIanaTimeZone()}
                reminderDate={editRemDate}
                reminderTime={editRemTime}
                onReminderDateChange={(v) => {
                  setEditRemDate(v);
                  setReminderError(null);
                }}
                onReminderTimeChange={(v) => {
                  setEditRemTime(v);
                  setReminderError(null);
                }}
                onFieldKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleInlineSave();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    handleInlineCancel();
                  }
                }}
                onFieldBlur={() => void handleInlineSave()}
                onPresetMinutes={(mins) => {
                  const z = entry.time_zone?.trim() || getClientIanaTimeZone();
                  const w = reminderWallFromOffset(
                    entry.date,
                    editTime,
                    mins,
                    z
                  );
                  if (!w) return;
                  flushSync(() => {
                    setEditRemDate(w.date);
                    setEditRemTime(w.time);
                    setReminderError(null);
                  });
                  void handleInlineSave({ kind: "offset", minutes: mins });
                }}
                onClearReminder={() => {
                  flushSync(() => {
                    setEditRemDate("");
                    setEditRemTime("");
                    setReminderError(null);
                  });
                  void handleInlineSave({ kind: "offset", minutes: 0 });
                }}
                zoneHint={
                  entry.time_zone?.trim() || getClientIanaTimeZone()
                }
                data-testid="entry-card-reminder-datetime"
              />
            </div>
          </div>
        ) : (
          <h4
            onClick={() => setIsEditing(true)}
            className={`font-medium text-slate-900 dark:text-white cursor-text select-text flex items-center gap-1.5 ${
              entry.is_completed ? "line-through text-slate-500" : ""
            }`}
            data-testid="entry-card-title"
          >
            {formatEntryDisplay(entry)}
            {(entry.reminder_offset_minutes ?? entry.reminder_at) && (
              <span
                title={
                  entry.reminder_offset_minutes
                    ? formatReminderOffset(entry.reminder_offset_minutes)
                    : undefined
                }
              >
                <Bell className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
              </span>
            )}
          </h4>
        )}
        {!isEditing && entry.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
            {entry.description}
          </p>
        )}
        {!isEditing && (
        <div className="flex flex-wrap gap-2 mt-1">
          {entry.priority !== "medium" && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                entry.priority === "high"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              {entry.priority}
            </span>
          )}
          {entry.label && (
            <span className="text-xs text-slate-500">{entry.label}</span>
          )}
          {(entry.reminder_offset_minutes ?? entry.reminder_at) && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {entry.reminder_offset_minutes
                ? formatReminderOffset(entry.reminder_offset_minutes)
                : `Reminder: ${format(new Date(entry.reminder_at!), "MMM d, h:mm a")}`}
            </span>
          )}
        </div>
        )}
      </div>

      <div className={`flex gap-1 transition-opacity ${isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        <button
          onClick={() => onEdit(entry)}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
