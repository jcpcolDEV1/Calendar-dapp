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

/**
 * Compute reminder_at from date + time - offset.
 * Returns ISO string or null if time or offset missing.
 */
export function computeReminderAt(
  date: string,
  time: string | null,
  offsetMinutes: number | null
): string | null {
  if (!time || offsetMinutes == null || offsetMinutes <= 0) return null;
  const timeStr = time.trim().slice(0, 5);
  if (timeStr.length < 5) return null;
  const d = new Date(`${date}T${timeStr}:00`);
  if (isNaN(d.getTime())) return null;
  d.setMinutes(d.getMinutes() - offsetMinutes);
  return d.toISOString();
}
