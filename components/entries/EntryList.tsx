"use client";

import type { Entry } from "@/types";
import { EntryCard } from "./EntryCard";

function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    const aTime = a.time ?? "";
    const bTime = b.time ?? "";
    if (aTime && bTime) return aTime.localeCompare(bTime);
    if (aTime) return -1;
    if (bTime) return 1;
    return 0;
  });
}

interface EntryListProps {
  entries: Entry[];
  onEdit: (entry: Entry) => void;
  onRefresh: () => void;
}

export function EntryList({ entries, onEdit, onRefresh }: EntryListProps) {
  const sorted = sortEntries(entries);

  if (sorted.length === 0) {
    return (
      <p className="text-center text-slate-500 dark:text-slate-400 py-8">
        No entries for this day
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((entry) => (
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
