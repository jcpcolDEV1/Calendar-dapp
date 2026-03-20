"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  CALENDAR_BACKGROUND_BUCKET,
} from "@/lib/calendar-background-url";
import { resizeImageForCalendarBackground } from "@/lib/resize-calendar-background";
import { updateCalendarBackgroundSettings } from "@/app/actions/calendar-background";
import { toast } from "sonner";

export interface CalendarBackgroundMenuProps {
  calendarId: string;
  storagePath: string | null;
  overlayOpacity: number;
}

export function UserMenuCalendarBackground({
  calendarId,
  storagePath: initialPath,
  overlayOpacity: initialOpacity,
}: CalendarBackgroundMenuProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState<string | null>(initialPath ?? null);
  const [opacity, setOpacity] = useState(initialOpacity);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    setPath(initialPath ?? null);
    setOpacity(initialOpacity);
  }, [initialPath, initialOpacity]);

  async function commitOpacity() {
    if (!path) return;
    if (opacity === initialOpacity) return;
    const res = await updateCalendarBackgroundSettings(calendarId, {
      storagePath: path,
      overlayOpacity: opacity,
    });
    if (res.error) {
      toast.error(res.error);
      return;
    }
    router.refresh();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Elige un archivo de imagen (JPEG, PNG o WebP).");
      return;
    }
    setUploading(true);
    try {
      const blob = await resizeImageForCalendarBackground(file);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión no válida");

      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      const objectPath = `${user.id}/calendar-bg.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(CALENDAR_BACKGROUND_BUCKET)
        .upload(objectPath, blob, {
          upsert: true,
          contentType: blob.type || "image/jpeg",
          // Short TTL: path is stable (upsert); URL cache-bust uses calendar.updated_at
          cacheControl: "120",
        });
      if (upErr) throw upErr;

      const res = await updateCalendarBackgroundSettings(calendarId, {
        storagePath: objectPath,
        overlayOpacity: opacity,
      });
      if (res.error) throw new Error(res.error);

      setPath(objectPath);
      toast.success("Fondo del calendario actualizado");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo subir la imagen"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!path) return;
    setRemoving(true);
    try {
      const supabase = createClient();
      const { error: rmErr } = await supabase.storage
        .from(CALENDAR_BACKGROUND_BUCKET)
        .remove([path]);
      if (rmErr) console.warn("Storage remove:", rmErr);

      const res = await updateCalendarBackgroundSettings(calendarId, {
        storagePath: null,
        overlayOpacity: 72,
      });
      if (res.error) throw new Error(res.error);

      setPath(null);
      setOpacity(72);
      toast.success("Fondo eliminado");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo quitar el fondo"
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 space-y-2">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <ImageIcon className="h-3.5 w-3.5" aria-hidden />
        Fondo del calendario
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
        data-testid="calendar-bg-file-input"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full text-left text-sm px-2 py-1.5 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
        data-testid="calendar-bg-upload"
      >
        {uploading ? "Subiendo…" : path ? "Cambiar imagen" : "Subir imagen de fondo"}
      </button>
      {path && (
        <>
          <label className="block text-[11px] text-slate-500 dark:text-slate-400">
            Legibilidad (velo sobre la foto): {opacity}%
          </label>
          <input
            type="range"
            min={40}
            max={90}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            onMouseUp={commitOpacity}
            onTouchEnd={commitOpacity}
            onKeyUp={(e) => {
              if (e.key === "Enter" || e.key === " ") commitOpacity();
            }}
            className="w-full h-2 accent-blue-600"
            aria-label="Opacidad del velo sobre el fondo"
            data-testid="calendar-bg-opacity"
          />
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={removing}
            className="w-full flex items-center gap-2 text-sm px-2 py-1.5 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
            data-testid="calendar-bg-remove"
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            {removing ? "Quitando…" : "Quitar fondo"}
          </button>
        </>
      )}
    </div>
  );
}
