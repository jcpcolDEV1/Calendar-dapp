"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  format,
} from "date-fns";
import type { Calendar, Entry, EntryType, Priority } from "@/types";
import { Header } from "@/components/layout/Header";
import { ServiceWorkerRegistration } from "@/components/notifications/ServiceWorkerRegistration";
import { CalendarGrid } from "./CalendarGrid";
import { DayDetailPanel } from "@/components/entries/DayDetailPanel";
import { UpcomingTasks } from "@/components/sidebar/UpcomingTasks";
import {
  getEntriesByDateAction,
  getEntriesByDateRangeAction,
  getUpcomingTasksAction,
  getUpcomingRemindersAction,
} from "@/app/actions/data";
import { SearchFilters } from "./SearchFilters";

interface CalendarDashboardProps {
  calendar: Calendar;
  initialEntries: Entry[];
  initialUpcomingTasks: Entry[];
  initialReminders: Entry[];
  userEmail?: string;
}

export function CalendarDashboard({
  calendar,
  initialEntries,
  initialUpcomingTasks,
  initialReminders,
  userEmail,
}: CalendarDashboardProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayEntries, setDayEntries] = useState<Entry[]>([]);
  const [openWithNewEntry, setOpenWithNewEntry] = useState(false);
  const [entries, setEntries] = useState(initialEntries);
  const [upcomingTasks, setUpcomingTasks] = useState(initialUpcomingTasks);
  const [reminders, setReminders] = useState(initialReminders);
  const [loadingDay, setLoadingDay] = useState(false);
  const [search, setSearch] = useState("");
  const [filterEntryType, setFilterEntryType] = useState<EntryType | "">("");
  const [filterPriority, setFilterPriority] = useState<Priority | "">("");
  const [filterCompleted, setFilterCompleted] = useState<boolean | null>(null);

  const filteredEntries = entries.filter((e) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !e.title.toLowerCase().includes(q) &&
        !(e.description?.toLowerCase().includes(q))
      )
        return false;
    }
    if (filterEntryType && e.entry_type !== filterEntryType) return false;
    if (filterPriority && e.priority !== filterPriority) return false;
    if (filterCompleted !== null && e.is_completed !== filterCompleted)
      return false;
    return true;
  });

  const entriesByDate = filteredEntries.reduce<Record<string, Entry[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  const refreshData = useCallback(async () => {
    router.refresh();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const [newEntries, newTasks, newReminders] = await Promise.all([
      getEntriesByDateRangeAction(
        calendar.id,
        format(monthStart, "yyyy-MM-dd"),
        format(monthEnd, "yyyy-MM-dd")
      ),
      getUpcomingTasksAction(calendar.id),
      getUpcomingRemindersAction(calendar.id),
    ]);

    setEntries(newEntries);
    setUpcomingTasks(newTasks);
    setReminders(newReminders);
  }, [calendar.id, currentMonth, router]);

  // Refetch entries when month changes
  useEffect(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    getEntriesByDateRangeAction(
      calendar.id,
      format(monthStart, "yyyy-MM-dd"),
      format(monthEnd, "yyyy-MM-dd")
    ).then(setEntries);
  }, [calendar.id, currentMonth]);

  const handleDayClick = useCallback(
    async (date: Date) => {
      setSelectedDate(date);
      setLoadingDay(true);
      try {
        const dayEntriesData = await getEntriesByDateAction(
          calendar.id,
          format(date, "yyyy-MM-dd")
        );
        setDayEntries(dayEntriesData);
      } catch {
        setDayEntries([]);
      } finally {
        setLoadingDay(false);
      }
    },
    [calendar.id]
  );

  const handleClosePanel = useCallback(() => {
    setSelectedDate(null);
    setOpenWithNewEntry(false);
    refreshData();
  }, [refreshData]);

  const handleAddTask = useCallback(async () => {
    setOpenWithNewEntry(true);
    setSelectedDate(new Date());
    setDayEntries([]);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <ServiceWorkerRegistration />
      <Header
        currentMonth={currentMonth}
        onPrevMonth={() => setCurrentMonth((m) => subMonths(m, 1))}
        onNextMonth={() => setCurrentMonth((m) => addMonths(m, 1))}
        onToday={() => setCurrentMonth(new Date())}
        userEmail={userEmail}
      />

      <div className="flex flex-1 min-h-0">
        <main className="flex-1 min-w-0 overflow-auto flex flex-col">
          <SearchFilters
            search={search}
            onSearchChange={setSearch}
            entryType={filterEntryType}
            onEntryTypeChange={setFilterEntryType}
            priority={filterPriority}
            onPriorityChange={setFilterPriority}
            isCompleted={filterCompleted}
            onIsCompletedChange={setFilterCompleted}
          />
          <CalendarGrid
            currentMonth={currentMonth}
            entriesByDate={entriesByDate}
            onDayClick={handleDayClick}
          />
        </main>

        <UpcomingTasks
          tasks={upcomingTasks}
          reminders={reminders}
          onAddTask={handleAddTask}
          onTaskClick={handleDayClick}
        />

        {/* Mobile quick add FAB */}
        <button
          onClick={handleAddTask}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 flex items-center justify-center z-40"
          aria-label="Add entry"
        >
          <span className="text-2xl font-light">+</span>
        </button>
      </div>

      {selectedDate && (
        <DayDetailPanel
          date={selectedDate}
          calendarId={calendar.id}
          entries={loadingDay ? [] : dayEntries}
          openWithNewEntry={openWithNewEntry}
          onClose={handleClosePanel}
          onRefresh={() => handleDayClick(selectedDate)}
        />
      )}
    </div>
  );
}
