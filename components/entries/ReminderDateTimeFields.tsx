"use client";

import {
  REMINDER_PRESET_MINUTES,
  reminderWallFromOffset,
} from "@/lib/reminder-utils";

export interface ReminderDateTimeFieldsProps {
  hasTime: boolean;
  eventDate: string;
  eventTime: string;
  /** IANA zone used to interpret reminder date/time (device or saved entry) */
  timeZone: string;
  reminderDate: string;
  reminderTime: string;
  onReminderDateChange: (v: string) => void;
  onReminderTimeChange: (v: string) => void;
  compact?: boolean;
  onFieldKeyDown?: (e: React.KeyboardEvent) => void;
  onFieldBlur?: () => void;
  /**
   * If set, preset buttons only notify parent (e.g. inline save + flushSync).
   * Otherwise presets fill date/time via reminderWallFromOffset.
   */
  onPresetMinutes?: (minutes: number) => void;
  onClearReminder?: () => void;
  /** e.g. "Europe/Madrid" for transparency */
  zoneHint?: string;
  "data-testid"?: string;
}

export function ReminderDateTimeFields({
  hasTime,
  eventDate,
  eventTime,
  timeZone,
  reminderDate,
  reminderTime,
  onReminderDateChange,
  onReminderTimeChange,
  compact = false,
  onFieldKeyDown,
  onFieldBlur,
  onPresetMinutes,
  onClearReminder,
  zoneHint,
  "data-testid": dataTestId,
}: ReminderDateTimeFieldsProps) {
  function applyPreset(mins: number) {
    if (onPresetMinutes) {
      onPresetMinutes(mins);
      return;
    }
    const w = reminderWallFromOffset(
      eventDate,
      eventTime,
      mins,
      timeZone
    );
    if (w) {
      onReminderDateChange(w.date);
      onReminderTimeChange(w.time);
    }
  }

  function clearReminder() {
    if (onClearReminder) {
      onClearReminder();
      return;
    }
    onReminderDateChange("");
    onReminderTimeChange("");
  }

  if (!hasTime) {
    return (
      <p
        className={
          compact
            ? "text-xs text-slate-500 dark:text-slate-400"
            : "text-sm text-slate-500 dark:text-slate-400"
        }
      >
        Los recordatorios requieren una hora
      </p>
    );
  }

  const inputCls = compact
    ? "w-full min-w-0 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    : "w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500";

  const presetBtnCls = compact
    ? "px-2 py-0.5 text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
    : "px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300";

  const clearCls = compact
    ? "text-xs text-slate-600 dark:text-slate-400 hover:underline"
    : "text-sm text-slate-600 dark:text-slate-400 hover:underline";

  return (
    <div className="space-y-2" data-testid={dataTestId}>
      {zoneHint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Hora local ({zoneHint})
        </p>
      ) : null}
      <div
        className={`grid gap-2 ${compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}
      >
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">
            Fecha del recordatorio
          </label>
          <input
            type="date"
            value={reminderDate}
            onChange={(e) => onReminderDateChange(e.target.value)}
            onKeyDown={onFieldKeyDown}
            onBlur={onFieldBlur}
            className={inputCls}
            aria-label="Fecha del recordatorio"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">
            Hora del recordatorio
          </label>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => onReminderTimeChange(e.target.value)}
            onKeyDown={onFieldKeyDown}
            onBlur={onFieldBlur}
            className={inputCls}
            aria-label="Hora del recordatorio"
          />
        </div>
      </div>

      <div>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Atajos
        </span>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {REMINDER_PRESET_MINUTES.map(({ minutes: m, label }) => (
            <button
              key={m}
              type="button"
              onClick={() => applyPreset(m)}
              className={presetBtnCls}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button type="button" onClick={clearReminder} className={clearCls}>
        Sin recordatorio
      </button>
    </div>
  );
}
