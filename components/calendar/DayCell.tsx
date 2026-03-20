"use client";

import { format } from "date-fns";

import type { Entry } from "@/types";
import { formatEntryDisplay } from "@/lib/format-entry-display";

interface DayCellProps {
  date: Date;
  entries: Entry[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isCurrentWeek: boolean;
  onClick: () => void;
  /** Softer panels over a custom photo background */
  translucentCells?: boolean;
}

function sortTasksForPreview(tasks: Entry[]): Entry[] {
  return [...tasks].sort((a, b) => {
    const aTime = a.time ?? "";
    const bTime = b.time ?? "";
    if (aTime && bTime) return aTime.localeCompare(bTime);
    if (aTime) return -1;
    if (bTime) return 1;
    return 0;
  });
}

export function DayCell({
  date,
  entries,
  isCurrentMonth,
  isToday,
  isCurrentWeek,
  onClick,
  translucentCells = false,
}: DayCellProps) {
  const tasks = entries.filter((e) => e.entry_type === "task");
  const sortedTasks = sortTasksForPreview(tasks);
  const previewTasks = sortedTasks.slice(0, 3);
  const remainingCount = sortedTasks.length - 3;

  const dateKey = format(date, "yyyy-MM-dd");

  const glass = translucentCells;
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`day-cell-${dateKey}`}
      className={`
        min-h-[80px] sm:min-h-[100px] p-2 text-left border-b border-r
        ${glass ? "border-slate-200/80 dark:border-slate-700/80 backdrop-blur-[2px]" : "border-slate-200 dark:border-slate-800"}
        transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
        ${
          glass
            ? !isCurrentMonth
              ? "bg-slate-200/40 dark:bg-slate-950/55 text-slate-500 dark:text-slate-400 hover:bg-slate-200/55 dark:hover:bg-slate-900/65"
              : isToday
                ? "bg-blue-200/55 dark:bg-blue-950/40 ring-1 ring-blue-500/35 hover:bg-blue-200/70 dark:hover:bg-blue-950/50"
                : isCurrentWeek
                  ? "bg-blue-50/45 dark:bg-blue-950/25 hover:bg-blue-100/55 dark:hover:bg-blue-950/40"
                  : "bg-white/60 dark:bg-slate-900/60 hover:bg-white/80 dark:hover:bg-slate-800/70"
            : `
        hover:bg-slate-50 dark:hover:bg-slate-800/50
        ${!isCurrentMonth ? "bg-slate-50/50 dark:bg-slate-900/50 text-slate-400" : ""}
        ${isCurrentMonth && isCurrentWeek && !isToday ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}
        ${isToday ? "bg-blue-50 dark:bg-blue-900/20" : ""}
      `
        }
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

      {previewTasks.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {previewTasks.map((task) => (
            <div
              key={task.id}
              className="text-xs text-slate-600 dark:text-slate-400 truncate"
              title={task.title}
            >
              {formatEntryDisplay(task)}
              {(task.reminder_offset_minutes ?? task.reminder_at) && " 🔔"}
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="text-xs text-slate-500 dark:text-slate-500">
              +{remainingCount} more
            </div>
          )}
        </div>
      )}
    </button>
  );
}
