"use client";

import { format } from "date-fns";
import { Check, FileText, Pencil, Trash2 } from "lucide-react";
import type { Entry } from "@/types";
import { updateEntryAction, deleteEntryAction } from "@/app/actions/entries";
import { toast } from "sonner";

interface EntryCardProps {
  entry: Entry;
  onEdit: (entry: Entry) => void;
  onRefresh: () => void;
}

export function EntryCard({ entry, onEdit, onRefresh }: EntryCardProps) {
  async function handleToggleComplete() {
    try {
      await updateEntryAction(entry.id, { is_completed: !entry.is_completed });
      toast.success(entry.is_completed ? "Task reopened" : "Task completed");
      onRefresh();
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteEntryAction(entry.id);
      toast.success("Entry deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete");
    }
  }

  const borderColor = entry.color || "transparent";

  return (
    <div
      data-testid="entry-card"
      className={`
        group flex items-start gap-3 p-3 rounded-lg border-l-4
        bg-slate-50 dark:bg-slate-800/50
        border-slate-200 dark:border-slate-700
        ${entry.is_completed ? "opacity-70" : ""}
      `}
      style={{ borderLeftColor: borderColor || undefined }}
    >
      {entry.entry_type === "task" && (
        <button
          onClick={handleToggleComplete}
          className={`
            mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
            transition-colors
            ${
              entry.is_completed
                ? "bg-green-500 border-green-500 text-white"
                : "border-slate-400 hover:border-green-500"
            }
          `}
          aria-label={entry.is_completed ? "Mark incomplete" : "Mark complete"}
        >
          {entry.is_completed && <Check className="h-3 w-3" />}
        </button>
      )}

      {entry.entry_type === "note" && (
        <FileText className="h-5 w-5 flex-shrink-0 text-slate-400 mt-0.5" />
      )}

      <div className="flex-1 min-w-0">
        <h4
          className={`font-medium text-slate-900 dark:text-white ${
            entry.is_completed ? "line-through text-slate-500" : ""
          }`}
        >
          {entry.title}
        </h4>
        {entry.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
            {entry.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-1">
          {entry.time && (
            <span className="text-xs text-slate-500">
              {entry.time.slice(0, 5)}
            </span>
          )}
          {entry.priority !== "medium" && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                entry.priority === "high"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              {entry.priority}
            </span>
          )}
          {entry.label && (
            <span className="text-xs text-slate-500">{entry.label}</span>
          )}
          {entry.reminder_at && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Reminder: {format(new Date(entry.reminder_at), "MMM d, h:mm a")}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(entry)}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
