import { DateTime } from "luxon";

/** Legacy rows without time_zone use UTC (matches previous server Date behavior). */
export const DEFAULT_REMINDER_TIMEZONE = "UTC";

/** Max offset (~366 days) — keeps DB and UX sane */
export const MAX_REMINDER_OFFSET_MINUTES = 366 * 24 * 60;

/**
 * Quick preset buttons (minutes before event). Only fill d/h/m inputs in UI.
 */
export const REMINDER_PRESET_MINUTES = [
  { minutes: 10, label: "10 min antes" },
  { minutes: 30, label: "30 min antes" },
  { minutes: 60, label: "1 h antes" },
  { minutes: 120, label: "2 h antes" },
  { minutes: 1440, label: "1 día antes" },
] as const;

export function offsetMinutesToParts(total: number | null | undefined): {
  days: number;
  hours: number;
  minutes: number;
} {
  if (total == null || total <= 0 || !Number.isFinite(total)) {
    return { days: 0, hours: 0, minutes: 0 };
  }
  const capped = Math.min(Math.floor(total), MAX_REMINDER_OFFSET_MINUTES);
  const days = Math.floor(capped / 1440);
  const rem = capped % 1440;
  const hours = Math.floor(rem / 60);
  const minutes = rem % 60;
  return { days, hours, minutes };
}

function clampInt(n: unknown, min: number, max: number): number {
  const v = Math.floor(Number(n));
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
}

/** Returns total minutes; clamps parts to valid ranges and global max. */
export function partsToOffsetMinutes(
  days: number,
  hours: number,
  minutes: number
): number {
  const d = clampInt(days, 0, Math.floor(MAX_REMINDER_OFFSET_MINUTES / 1440));
  const h = clampInt(hours, 0, 23);
  const m = clampInt(minutes, 0, 59);
  let total = d * 1440 + h * 60 + m;
  if (total > MAX_REMINDER_OFFSET_MINUTES) {
    total = MAX_REMINDER_OFFSET_MINUTES;
  }
  return total;
}

/** Format offset for display, e.g. "2h antes", "30 min antes" */
export function formatReminderOffset(minutes: number): string {
  if (minutes < 60) return `${minutes} min antes`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h antes`;
  return `${Math.round(minutes / 1440)} día antes`;
}

function resolveZone(iana: string | null | undefined): string {
  if (!iana || typeof iana !== "string" || !iana.trim()) {
    return DEFAULT_REMINDER_TIMEZONE;
  }
  const z = iana.trim();
  return DateTime.now().setZone(z).isValid ? z : DEFAULT_REMINDER_TIMEZONE;
}

/** Wall-clock instant from YYYY-MM-DD + HH:mm in the given IANA zone. */
export function wallDateTimeInZone(
  dateStr: string,
  timeStr: string,
  timeZone?: string | null
): DateTime | null {
  const timePart = timeStr.trim().slice(0, 5);
  if (timePart.length < 5) return null;
  const parts = dateStr.split("-").map((p) => Number(p));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, mo, d] = parts;
  const hm = timePart.split(":");
  if (hm.length < 2) return null;
  const hh = Number(hm[0]);
  const mm = Number(hm[1]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const zone = resolveZone(timeZone);
  const dt = DateTime.fromObject(
    {
      year: y,
      month: mo,
      day: d,
      hour: hh,
      minute: mm,
      second: 0,
      millisecond: 0,
    },
    { zone }
  );
  return dt.isValid ? dt : null;
}

/**
 * Reminder date/time (wall) = event start in zone minus offset.
 * Used to pre-fill UI from stored reminder_offset_minutes.
 */
export function reminderWallFromOffset(
  eventDate: string,
  eventTime: string,
  offsetMinutes: number,
  timeZone?: string | null
): { date: string; time: string } | null {
  if (offsetMinutes <= 0) return null;
  const eventDt = wallDateTimeInZone(eventDate, eventTime, timeZone);
  if (!eventDt) return null;
  const rem = eventDt.minus({ minutes: offsetMinutes });
  return {
    date: rem.toFormat("yyyy-LL-dd"),
    time: rem.toFormat("HH:mm"),
  };
}

/**
 * Minutes between event start and reminder wall time (same IANA zone).
 * Reminder must be strictly before event start.
 */
export function offsetMinutesFromReminderWallTime(
  eventDate: string,
  eventTime: string,
  reminderDate: string,
  reminderTime: string,
  timeZone?: string | null
): { ok: true; minutes: number } | { ok: false; error: string } {
  const eventDt = wallDateTimeInZone(eventDate, eventTime, timeZone);
  const remDt = wallDateTimeInZone(reminderDate, reminderTime, timeZone);
  if (!eventDt || !remDt) {
    return { ok: false, error: "Fecha u hora no válida" };
  }
  const diff = eventDt.diff(remDt, "minutes").minutes;
  const rounded = Math.round(diff);
  if (rounded <= 0) {
    return {
      ok: false,
      error: "El recordatorio debe ser anterior al inicio del evento",
    };
  }
  if (rounded > MAX_REMINDER_OFFSET_MINUTES) {
    return {
      ok: false,
      error: `El recordatorio no puede ser más de ${Math.floor(MAX_REMINDER_OFFSET_MINUTES / 1440)} días antes del evento`,
    };
  }
  return { ok: true, minutes: rounded };
}

/**
 * Compute reminder_at (UTC ISO) from local wall date + time in IANA zone, minus offset.
 * @param date - YYYY-MM-DD
 * @param time - HH:mm or HH:mm:ss
 * @param offsetMinutes - minutes before event to remind
 * @param timeZone - IANA zone (e.g. Europe/Madrid); omit or invalid → UTC (legacy)
 */
export function computeReminderAt(
  date: string,
  time: string | null,
  offsetMinutes: number | null,
  timeZone?: string | null
): string | null {
  if (!time || offsetMinutes == null || offsetMinutes <= 0) return null;
  const eventDt = wallDateTimeInZone(date, time, timeZone);
  if (!eventDt) return null;
  const reminderInstant = eventDt.minus({ minutes: offsetMinutes });
  return reminderInstant.toUTC().toISO();
}
