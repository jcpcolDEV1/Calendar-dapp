"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import {
  checkNotificationStatus,
  registerPushSubscription,
  requestNotificationPermission,
} from "@/lib/push-subscription";
import { toast } from "sonner";

interface ReminderPushCalloutProps {
  /** True when the form has a valid reminder (same as non-null reminder_offset_minutes on save). */
  show: boolean;
}

/**
 * Contextual nudge when the user configures a reminder but this browser has no local push.
 */
export function ReminderPushCallout({ show }: ReminderPushCalloutProps) {
  const [supported, setSupported] = useState(false);
  const [vapidOk, setVapidOk] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    const ok =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setSupported(ok);
    setVapidOk(Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY));
    if (!ok) {
      setHydrated(true);
      return;
    }
    const s = await checkNotificationStatus();
    setPermission(s.permission);
    setHasSubscription(s.hasSubscription);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!show) return;
    void refresh();
  }, [show, refresh]);

  if (!show || !hydrated || !supported || !vapidOk) return null;

  const localPushReady = permission === "granted" && hasSubscription;
  if (localPushReady) return null;

  if (permission === "denied") {
    return (
      <div
        className="mt-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs text-slate-600 dark:text-slate-400"
        data-testid="reminder-push-callout-blocked"
      >
        Este recordatorio solo llegará a los dispositivos donde hayas activado
        notificaciones. En este navegador están bloqueadas; cámbialo en la
        configuración del sitio si quieres recibirlo aquí.
      </div>
    );
  }

  return (
    <div
      className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/90 dark:border-amber-900/50 dark:bg-amber-950/30 px-3 py-3"
      data-testid="reminder-push-callout"
    >
      <div className="flex gap-2 min-w-0">
        <Bell
          className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5"
          aria-hidden
        />
        <div className="min-w-0 space-y-2">
          <p className="text-sm text-slate-800 dark:text-slate-200">
            Para recibir este recordatorio aquí, activa notificaciones en este
            dispositivo. Si no, solo llegará donde ya las tengas activadas.
          </p>
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              try {
                const perm = await requestNotificationPermission();
                if (perm === "granted") {
                  await registerPushSubscription();
                  await refresh();
                  toast.success(
                    "Notificaciones activadas en este dispositivo"
                  );
                } else if (perm === "denied") {
                  setPermission("denied");
                  toast.error(
                    "Permiso denegado. Puedes cambiarlo en los ajustes del navegador."
                  );
                } else {
                  toast.info("Puedes activarlas más tarde desde el menú de usuario");
                }
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "No se pudieron activar las notificaciones"
                );
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            data-testid="reminder-push-callout-activate"
          >
            {loading ? "Activando…" : "Activar en este dispositivo"}
          </button>
        </div>
      </div>
    </div>
  );
}
