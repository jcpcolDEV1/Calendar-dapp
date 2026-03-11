"use client";

import { useState } from "react";
import { createEntryAction } from "@/app/actions/entries";
import { toast } from "sonner";

interface QuickTaskInputProps {
  calendarId: string;
  date: string;
  onRefresh: () => void;
  disabled?: boolean;
}

export function QuickTaskInput({
  calendarId,
  date,
  onRefresh,
  disabled = false,
}: QuickTaskInputProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const title = value.trim();
    if (!title || loading) return;

    setLoading(true);
    try {
      await createEntryAction({
        calendar_id: calendarId,
        title,
        entry_type: "task",
        date,
        time: null,
        recurrence_type: "none",
      });
      setValue("");
      toast.success("Tarea creada");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Escribe una tarea..."
      disabled={disabled || loading}
      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
      data-testid="quick-task-input"
      aria-label="Añadir tarea rápida"
    />
  );
}
