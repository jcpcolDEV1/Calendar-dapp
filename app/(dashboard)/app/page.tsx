import { redirect } from "next/navigation";
import {
  getPersonalCalendar,
} from "@/services/calendars";
import {
  getEntriesByDateRange,
  getUpcomingTasks,
  getUpcomingReminders,
} from "@/services/entries";
import { getUser } from "@/services/auth";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { CalendarDashboard } from "@/components/calendar/CalendarDashboard";

export default async function AppPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const calendar = await getPersonalCalendar();
  if (!calendar) redirect("/login");

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [entries, upcomingTasks, reminders] = await Promise.all([
    getEntriesByDateRange(
      calendar.id,
      format(monthStart, "yyyy-MM-dd"),
      format(monthEnd, "yyyy-MM-dd")
    ),
    getUpcomingTasks(calendar.id),
    getUpcomingReminders(calendar.id),
  ]);

  return (
    <CalendarDashboard
      calendar={calendar}
      initialEntries={entries}
      initialUpcomingTasks={upcomingTasks}
      initialReminders={reminders}
      userEmail={user.email ?? undefined}
    />
  );
}
