"use client";

import { format, isToday, isTomorrow } from "date-fns";
import { Calendar, Plus } from "lucide-react";
import type { Entry } from "@/types";

interface UpcomingTasksProps {
  tasks: Entry[];
  reminders: Entry[];
  onAddTask: () => void;
  onTaskClick: (date: Date) => void;
  translucent?: boolean;
}

export function UpcomingTasks({
  tasks,
  reminders,
  onAddTask,
  onTaskClick,
  translucent = false,
}: UpcomingTasksProps) {
  const todayTasks = tasks.filter((e) => isToday(new Date(e.date)));
  const tomorrowTasks = tasks.filter((e) => isTomorrow(new Date(e.date)));
  const laterTasks = tasks.filter(
    (e) => !isToday(new Date(e.date)) && !isTomorrow(new Date(e.date))
  );

  function TaskItem({ entry }: { entry: Entry }) {
    const d = new Date(entry.date);
    return (
      <button
        type="button"
        onClick={() => onTaskClick(d)}
        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
      >
        <span
          className={`block font-medium text-sm ${
            entry.is_completed ? "line-through text-slate-500" : "text-slate-900 dark:text-white"
          }`}
        >
          {entry.title}
        </span>
        <span className="text-xs text-slate-500">
          {isToday(d) ? "Today" : isTomorrow(d) ? "Tomorrow" : format(d, "MMM d")}
          {entry.time && ` · ${entry.time.slice(0, 5)}`}
        </span>
      </button>
    );
  }

  return (
    <aside
      className={`hidden lg:flex w-64 flex-shrink-0 border-l flex-col ${
        translucent
          ? "border-slate-200/70 dark:border-slate-700/70 bg-slate-50/75 dark:bg-slate-900/75 backdrop-blur-md"
          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
      }`}
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Upcoming
        </h3>
        <button
          onClick={onAddTask}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Quick add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {todayTasks.length > 0 && (
          <section>
            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Today
            </h4>
            <div className="space-y-0.5">
              {todayTasks.map((e) => (
                <TaskItem key={e.id} entry={e} />
              ))}
            </div>
          </section>
        )}

        {tomorrowTasks.length > 0 && (
          <section>
            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Tomorrow
            </h4>
            <div className="space-y-0.5">
              {tomorrowTasks.map((e) => (
                <TaskItem key={e.id} entry={e} />
              ))}
            </div>
          </section>
        )}

        {laterTasks.length > 0 && (
          <section>
            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Later
            </h4>
            <div className="space-y-0.5">
              {laterTasks.slice(0, 5).map((e) => (
                <TaskItem key={e.id} entry={e} />
              ))}
            </div>
          </section>
        )}

        {reminders.length > 0 && (
          <section>
            <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Reminders
            </h4>
            <div className="space-y-0.5">
              {reminders.slice(0, 5).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onTaskClick(new Date(e.date))}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="block font-medium text-sm text-slate-900 dark:text-white">
                    {e.title}
                  </span>
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    {format(new Date(e.reminder_at!), "MMM d, h:mm a")}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {tasks.length === 0 && reminders.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
            No upcoming tasks
          </p>
        )}
      </div>
    </aside>
  );
}
