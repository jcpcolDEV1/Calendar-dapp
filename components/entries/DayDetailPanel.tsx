"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { X, Plus } from "lucide-react";
import type { Entry } from "@/types";
import { EntryList } from "./EntryList";
import { QuickTaskInput } from "./QuickTaskInput";
import { EntryForm, type EntryFormData } from "./EntryForm";
import { createEntryAction, updateEntryAction } from "@/app/actions/entries";
import { toast } from "sonner";

interface DayDetailPanelProps {
  date: Date;
  calendarId: string;
  entries: Entry[];
  openWithNewEntry?: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function DayDetailPanel({
  date,
  calendarId,
  entries,
  openWithNewEntry = false,
  onClose,
  onRefresh,
}: DayDetailPanelProps) {
  const [showForm, setShowForm] = useState(openWithNewEntry);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  useEffect(() => {
    setShowForm(openWithNewEntry);
  }, [openWithNewEntry]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  async function handleSave(data: EntryFormData) {
    try {
      if (editingEntry) {
        await updateEntryAction(editingEntry.id, {
          title: data.title,
          description: data.description,
          entry_type: data.entry_type,
          date: data.date,
          time: data.time,
          reminder_offset_minutes: data.reminder_offset_minutes,
          time_zone: data.time_zone,
          priority: data.priority,
          label: data.label,
          color: data.color,
          is_completed: data.is_completed,
        });
        toast.success("Entry updated");
      } else {
        await createEntryAction({
          calendar_id: calendarId,
          title: data.title,
          description: data.description,
          entry_type: data.entry_type,
          date: data.date,
          time: data.time,
          reminder_offset_minutes: data.reminder_offset_minutes,
          time_zone: data.time_zone,
          priority: data.priority,
          label: data.label,
          color: data.color,
          is_completed: data.is_completed,
          recurrence_type: "none",
        });
        toast.success("Entry created");
      }
      setShowForm(false);
      setEditingEntry(null);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
      throw err;
    }
  }

  const dateStr = format(date, "yyyy-MM-dd");

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md sm:max-w-lg h-full bg-white dark:bg-slate-900 shadow-xl flex flex-col animate-slide-in-right"
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-panel-title"
        data-testid="day-detail-panel"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 id="day-panel-title" className="text-lg font-semibold">
            {format(date, "EEEE, MMMM d, yyyy")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {showForm || editingEntry ? (
            <EntryForm
              date={dateStr}
              calendarId={calendarId}
              entry={editingEntry}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingEntry(null);
              }}
            />
          ) : (
            <>
              <EntryList
                entries={entries}
                onEdit={setEditingEntry}
                onRefresh={onRefresh}
              />

              <QuickTaskInput
                calendarId={calendarId}
                date={dateStr}
                onRefresh={onRefresh}
              />

              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                data-testid="day-panel-add-entry"
              >
                <Plus className="h-4 w-4" />
                Añadir con más opciones
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
