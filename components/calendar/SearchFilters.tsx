"use client";

import { Search, Filter } from "lucide-react";
import type { EntryType, Priority } from "@/types";

interface SearchFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  entryType: EntryType | "";
  onEntryTypeChange: (v: EntryType | "") => void;
  priority: Priority | "";
  onPriorityChange: (v: Priority | "") => void;
  isCompleted: boolean | null;
  onIsCompletedChange: (v: boolean | null) => void;
  /** Softer bar over custom calendar background */
  translucent?: boolean;
}

export function SearchFilters({
  search,
  onSearchChange,
  entryType,
  onEntryTypeChange,
  priority,
  onPriorityChange,
  isCompleted,
  onIsCompletedChange,
  translucent = false,
}: SearchFiltersProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 p-3 border-b ${
        translucent
          ? "border-slate-200/70 dark:border-slate-700/70 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      }`}
    >
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search entries..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-slate-500" />
        <select
          value={entryType}
          onChange={(e) => onEntryTypeChange(e.target.value as EntryType | "")}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
        >
          <option value="">All types</option>
          <option value="note">Note</option>
          <option value="task">Task</option>
        </select>
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as Priority | "")}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select
          value={isCompleted === null ? "" : String(isCompleted)}
          onChange={(e) => {
            const v = e.target.value;
            onIsCompletedChange(
              v === "" ? null : v === "true"
            );
          }}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
        >
          <option value="">All status</option>
          <option value="false">Pending</option>
          <option value="true">Completed</option>
        </select>
      </div>
    </div>
  );
}
