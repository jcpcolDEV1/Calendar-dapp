/**
 * Client-only: IANA timezone from the browser (e.g. Europe/Madrid).
 * Use when saving entries so reminder_at matches the user's wall clock.
 */
export function getClientIanaTimeZone(): string {
  if (typeof window === "undefined") return "UTC";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
