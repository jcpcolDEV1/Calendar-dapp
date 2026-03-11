/**
 * Parses quick task input to extract optional time and title.
 * Examples:
 *   "9:00 reunión con Juan" → { time: "09:00", title: "reunión con Juan" }
 *   "15:30 llamar a Pedro" → { time: "15:30", title: "llamar a Pedro" }
 *   "9am lunch" → { time: "09:00", title: "lunch" }
 *   "2:30pm meeting" → { time: "14:30", title: "meeting" }
 *   "comprar comida" → { time: null, title: "comprar comida" }
 */
export function parseTaskInput(
  text: string
): { title: string; time: string | null } {
  const trimmed = text.trim();
  if (!trimmed) return { title: "", time: null };

  // Match time at start: 9:00, 15:30, 9:30am, 2:30pm
  const time24Match = trimmed.match(/^(\d{1,2}):(\d{2})\s+(.+)$/);
  if (time24Match) {
    const [, h, m, rest] = time24Match;
    const hour = parseInt(h!, 10);
    const min = parseInt(m!, 10);
    if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
      return {
        title: rest!.trim(),
        time: `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
      };
    }
  }

  // Match 12h format: 9am, 2pm, 9:30am, 2:30pm
  const time12Match = trimmed.match(
    /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s+(.+)$/i
  );
  if (time12Match) {
    const [, h, m, period, rest] = time12Match;
    let hour = parseInt(h!, 10);
    const min = m ? parseInt(m, 10) : 0;
    if (hour >= 1 && hour <= 12 && min >= 0 && min <= 59) {
      if (period!.toLowerCase() === "pm" && hour !== 12) hour += 12;
      if (period!.toLowerCase() === "am" && hour === 12) hour = 0;
      return {
        title: rest!.trim(),
        time: `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
      };
    }
  }

  return { title: trimmed, time: null };
}
