"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { DayCell } from "./DayCell";
import type { Entry } from "@/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarGridProps {
  currentMonth: Date;
  entriesByDate: Record<string, Entry[]>;
  onDayClick: (date: Date) => void;
}

export function CalendarGrid({
  currentMonth,
  entriesByDate,
  onDayClick,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="p-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 auto-rows-fr min-h-0">
        {days.map((date) => {
          const dateKey = format(date, "yyyy-MM-dd");
          const entries = entriesByDate[dateKey] ?? [];
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isCurrentDay = isToday(date);

          return (
            <DayCell
              key={dateKey}
              date={date}
              entries={entries}
              isCurrentMonth={isCurrentMonth}
              isToday={isCurrentDay}
              onClick={() => onDayClick(date)}
            />
          );
        })}
      </div>
    </div>
  );
}
