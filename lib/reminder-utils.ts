import { DateTime } from "luxon";

/** Legacy rows without time_zone use UTC (matches previous server Date behavior). */
export const DEFAULT_REMINDER_TIMEZONE = "UTC";

/** Preset reminder options: value in minutes, label for display */
export const REMINDER_OPTIONS = [
  { value: null, label: "No recordar" },
  { value: 10, label: "10 min antes" },
  { value: 30, label: "30 min antes" },
  { value: 60, label: "1 hora antes" },
  { value: 120, label: "2 horas antes" },
  { value: 1440, label: "1 día antes" },
] as const;

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
  const timeStr = time.trim().slice(0, 5);
  if (timeStr.length < 5) return null;

  const parts = date.split("-").map((p) => Number(p));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;

  const hm = timeStr.split(":");
  if (hm.length < 2) return null;
  const hh = Number(hm[0]);
  const mm = Number(hm[1]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;

  const zone = resolveZone(timeZone);
  let dt = DateTime.fromObject(
    {
      year: y,
      month: m,
      day: d,
      hour: hh,
      minute: mm,
      second: 0,
      millisecond: 0,
    },
    { zone }
  );
  if (!dt.isValid) return null;

  dt = dt.minus({ minutes: offsetMinutes });
  return dt.toUTC().toISO();
}
