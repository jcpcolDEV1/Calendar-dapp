"use client";

import { format } from "date-fns";

import type { Entry } from "@/types";

interface DayCellProps {
  date: Date;
  entries: Entry[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onClick: () => void;
}

export function DayCell({
  date,
  entries,
  isCurrentMonth,
  isToday,
  onClick,
}: DayCellProps) {
  const tasks = entries.filter((e) => e.entry_type === "task");
  const notes = entries.filter((e) => e.entry_type === "note");
  const completedTasks = tasks.filter((e) => e.is_completed).length;
  const pendingTasks = tasks.length - completedTasks;

  const dateKey = format(date, "yyyy-MM-dd");

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`day-cell-${dateKey}`}
      className={`
        min-h-[80px] sm:min-h-[100px] p-2 text-left border-b border-r border-slate-200 dark:border-slate-800
        hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
        ${!isCurrentMonth ? "bg-slate-50/50 dark:bg-slate-900/50 text-slate-400" : ""}
      `}
    >
      <span
        className={`
          inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium
          ${isToday ? "bg-blue-600 text-white" : ""}
          ${!isToday && isCurrentMonth ? "text-slate-900 dark:text-slate-100" : ""}
        `}
      >
        {format(date, "d")}
      </span>

      {entries.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-0.5">
          {pendingTasks > 0 && (
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"
              title={`${pendingTasks} task(s)`}
            />
          )}
          {completedTasks > 0 && (
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"
              title={`${completedTasks} completed`}
            />
          )}
          {notes.length > 0 && (
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"
              title={`${notes.length} note(s)`}
            />
          )}
        </div>
      )}
    </button>
  );
}
