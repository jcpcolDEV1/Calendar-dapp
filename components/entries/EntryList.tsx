"use client";

import type { Entry } from "@/types";
import { EntryCard } from "./EntryCard";

interface EntryListProps {
  entries: Entry[];
  onEdit: (entry: Entry) => void;
  onRefresh: () => void;
}

export function EntryList({ entries, onEdit, onRefresh }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-center text-slate-500 dark:text-slate-400 py-8">
        No entries for this day
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          onEdit={onEdit}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
