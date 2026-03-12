"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Check, FileText, Pencil, Trash2 } from "lucide-react";
import type { Entry } from "@/types";
import { updateEntryAction, deleteEntryAction } from "@/app/actions/entries";
import { formatEntryDisplay } from "@/lib/format-entry-display";
import { toast } from "sonner";

function toHHMM(t: string | null): string {
  if (!t) return "";
  return t.trim().slice(0, 5);
}

interface EntryCardProps {
  entry: Entry;
  onEdit: (entry: Entry) => void;
  onRefresh: () => void;
}

export function EntryCard({ entry, onEdit, onRefresh }: EntryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(entry.title);
  const [editTime, setEditTime] = useState(toHHMM(entry.time));
  const [editEndTime, setEditEndTime] = useState(toHHMM(entry.end_time ?? null));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditValue(entry.title);
      setEditTime(toHHMM(entry.time));
      setEditEndTime(toHHMM(entry.end_time ?? null));
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, entry.title, entry.time, entry.end_time]);

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

  async function handleInlineSave() {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setIsEditing(false);
      setEditValue(entry.title);
      setEditTime(toHHMM(entry.time));
      setEditEndTime(toHHMM(entry.end_time ?? null));
      return;
    }
    const newTime = editTime.trim() || null;
    const newEndTime = editEndTime.trim() || null;
    const titleChanged = trimmed !== entry.title;
    const timeChanged = newTime !== toHHMM(entry.time);
    const endTimeChanged = newEndTime !== toHHMM(entry.end_time ?? null);
    if (!titleChanged && !timeChanged && !endTimeChanged) {
      setIsEditing(false);
      return;
    }
    try {
      await updateEntryAction(entry.id, {
        title: trimmed,
        time: newTime,
        end_time: newEndTime,
      });
      toast.success("Tarea actualizada");
      setIsEditing(false);
      onRefresh();
    } catch {
      toast.error("Error al actualizar");
    }
  }

  function handleInlineCancel() {
    setIsEditing(false);
    setEditValue(entry.title);
    setEditTime(toHHMM(entry.time));
    setEditEndTime(toHHMM(entry.end_time ?? null));
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
        {isEditing ? (
          <div
            className="entry-card-inline-edit space-y-2"
            data-testid="entry-card-inline-edit"
          >
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInlineSave();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  handleInlineCancel();
                }
              }}
              onBlur={handleInlineSave}
              className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
              data-testid="entry-card-inline-input"
            />
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInlineSave();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    handleInlineCancel();
                  }
                }}
                onBlur={handleInlineSave}
                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                data-testid="entry-card-time-input"
              />
              <span className="text-slate-400 text-sm">–</span>
              <input
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInlineSave();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    handleInlineCancel();
                  }
                }}
                onBlur={handleInlineSave}
                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                data-testid="entry-card-end-time-input"
              />
            </div>
          </div>
        ) : (
          <h4
            onClick={() => setIsEditing(true)}
            className={`font-medium text-slate-900 dark:text-white cursor-text select-text ${
              entry.is_completed ? "line-through text-slate-500" : ""
            }`}
            data-testid="entry-card-title"
          >
            {formatEntryDisplay(entry)}
          </h4>
        )}
        {!isEditing && entry.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
            {entry.description}
          </p>
        )}
        {!isEditing && (
        <div className="flex flex-wrap gap-2 mt-1">
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
        )}
      </div>

      <div className={`flex gap-1 transition-opacity ${isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
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
