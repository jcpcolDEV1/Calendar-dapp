"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import {
  checkNotificationStatus,
  registerPushSubscription,
  requestNotificationPermission,
  syncSubscriptionToServer,
} from "@/lib/push-subscription";
import {
  isPushBannerDismissed,
  setPushBannerDismissed,
} from "@/lib/notification-banner-storage";
import { toast } from "sonner";

/**
 * STEP 3: Proactive push permission on /app (browser still requires a user click).
 * Does not replace UserMenu — same underlying APIs.
 */
export function NotificationPermissionBanner() {
  const [supported, setSupported] = useState(false);
  const [vapidOk, setVapidOk] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const evaluateVisibility = useCallback(async () => {
    if (typeof window === "undefined") return;

    const ok =
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setSupported(ok);

    const vapid = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
    setVapidOk(vapid);

    if (!ok || !vapid) {
      setVisible(false);
      setHydrated(true);
      return;
    }

    const { permission, hasSubscription } = await checkNotificationStatus();

    if (permission === "denied") {
      setVisible(false);
      setHydrated(true);
      return;
    }

    if (permission === "granted") {
      await syncSubscriptionToServer();
      setVisible(false);
      setHydrated(true);
      return;
    }

    // default
    if (hasSubscription) {
      setVisible(false);
      setHydrated(true);
      return;
    }
    if (isPushBannerDismissed()) {
      setVisible(false);
      setHydrated(true);
      return;
    }

    setVisible(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    void evaluateVisibility();
  }, [evaluateVisibility]);

  async function handleActivate() {
    setLoading(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === "granted") {
        await registerPushSubscription();
        setVisible(false);
        toast.success("Notificaciones activadas");
      } else if (permission === "denied") {
        setVisible(false);
        toast.error("Permiso denegado. Puedes cambiarlo en los ajustes del navegador.");
      } else {
        toast.info("Puedes activar las notificaciones más tarde desde el menú de usuario");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo activar las notificaciones"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    setPushBannerDismissed();
    setVisible(false);
  }

  if (!hydrated || !visible) return null;

  return (
    <div
      className="shrink-0 border-b border-amber-200/80 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/40 px-4 py-3"
      role="region"
      aria-label="Activar notificaciones"
      data-testid="notification-permission-banner"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3 min-w-0">
          <Bell
            className="h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5"
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Activa notificaciones para recibir recordatorios de tus tareas
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Te avisaremos cuando llegue la hora de cada recordatorio. Solo se
              usa con tu permiso.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 sm:pl-4">
          <button
            type="button"
            onClick={handleActivate}
            disabled={loading}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
            data-testid="notification-permission-banner-activate"
          >
            {loading ? "Activando…" : "Activar notificaciones"}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={loading}
            className="rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-amber-100/80 dark:hover:bg-slate-800 disabled:opacity-50"
            data-testid="notification-permission-banner-dismiss"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
