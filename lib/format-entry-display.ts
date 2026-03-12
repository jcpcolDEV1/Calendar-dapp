import type { Entry } from "@/types";

/** Normalize time string to HH:MM for display (handles HH:MM:SS from DB) */
function toHHMM(t: string | null): string | null {
  if (!t) return null;
  const trimmed = t.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 5);
}

/**
 * Format entry title line for display.
 * - Both times: "09:00–10:00 meeting"
 * - Start only: "09:00 meeting"
 * - No time: "• buy groceries"
 */
export function formatEntryDisplay(entry: Entry): string {
  const start = toHHMM(entry.time);
  const end = toHHMM(entry.end_time ?? null);

  if (start && end) {
    return `${start}–${end} ${entry.title}`;
  }
  if (start) {
    return `${start} ${entry.title}`;
  }
  return `• ${entry.title}`;
}
