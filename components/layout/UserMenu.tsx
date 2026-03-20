"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, LogOut, User } from "lucide-react";
import {
  checkNotificationStatus,
  getPushSubscriptionEndpoint,
  registerPushSubscription,
  requestNotificationPermission,
  syncSubscriptionToServer,
} from "@/lib/push-subscription";
import { toast } from "sonner";

interface UserMenuProps {
  userEmail?: string | null;
  onSignOut: () => void;
}

export function UserMenu({ userEmail, onSignOut }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [hasSubscription, setHasSubscription] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refreshPushState = useCallback(async () => {
    if (!notificationsSupported) return;
    const s = await checkNotificationStatus();
    setPermission(s.permission);
    setHasSubscription(s.hasSubscription);
  }, [notificationsSupported]);

  useEffect(() => {
    setNotificationsSupported(
      "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window
    );
  }, []);

  useEffect(() => {
    void refreshPushState();
  }, [refreshPushState]);

  // Sync existing browser subscription to DB on load (fixes orphaned subscriptions)
  useEffect(() => {
    if (!notificationsSupported) return;
    syncSubscriptionToServer();
  }, [notificationsSupported]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
        data-testid="user-menu-button"
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <span className="hidden sm:inline text-sm text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
          {userEmail ?? "Account"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {userEmail ?? "User"}
            </p>
          </div>
          {notificationsSupported && (
            <>
              {permission === "denied" && (
                <div
                  className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700"
                  data-testid="user-menu-notifications-blocked"
                >
                  Las notificaciones están bloqueadas en este navegador. Actívalas
                  en la configuración del sitio (icono del candado o del sitio en
                  la barra de direcciones).
                </div>
              )}
              {permission !== "denied" &&
                hasSubscription && (
                  <div className="space-y-1 border-b border-slate-200 dark:border-slate-700 pb-1">
                    <div
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 dark:text-slate-400"
                      data-testid="user-menu-notifications-active"
                    >
                      <Bell className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
                      <span>Notificaciones activas en este dispositivo</span>
                    </div>
                    <p className="px-3 text-[11px] text-slate-500 dark:text-slate-500 leading-snug">
                      La prueba se envía solo a este dispositivo.
                    </p>
                    <button
                      onClick={async () => {
                        setTestLoading(true);
                        try {
                          const endpoint = await getPushSubscriptionEndpoint();
                          if (!endpoint) {
                            toast.error(
                              "No hay suscripción en este navegador. Activa las notificaciones primero."
                            );
                            return;
                          }
                          const res = await fetch("/api/push/test", {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ endpoint }),
                          });
                          const data = await res.json();
                          if (data.error) {
                            toast.error(data.error);
                          } else if (data.sent > 0) {
                            toast.success(
                              "Enviada a este dispositivo. Minimiza la ventana para verla."
                            );
                          } else {
                            toast.error(
                              data.results?.[0]?.error ?? "No se pudo enviar"
                            );
                          }
                        } catch {
                          toast.error("Error al enviar prueba");
                        } finally {
                          setTestLoading(false);
                        }
                      }}
                      disabled={testLoading}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                      data-testid="user-menu-test-notification"
                    >
                      <Bell className="h-4 w-4 shrink-0" />
                      {testLoading ? "Enviando..." : "Probar notificación"}
                    </button>
                  </div>
                )}
              {permission !== "denied" && !hasSubscription && (
                <button
                  onClick={async () => {
                    setNotificationsLoading(true);
                    try {
                      const perm = await requestNotificationPermission();
                      if (perm === "granted") {
                        await registerPushSubscription();
                        setHasSubscription(true);
                        setPermission("granted");
                        toast.success(
                          "Notificaciones activadas en este dispositivo"
                        );
                        setOpen(false);
                      } else if (perm === "denied") {
                        setPermission("denied");
                        toast.error("Permiso denegado");
                      } else {
                        toast.info("Puedes activar las notificaciones más tarde");
                      }
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Error al activar"
                      );
                    } finally {
                      setNotificationsLoading(false);
                    }
                  }}
                  disabled={notificationsLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                  data-testid="user-menu-notifications"
                >
                  <Bell className="h-4 w-4 shrink-0" />
                  {notificationsLoading
                    ? "Activando..."
                    : "Activar notificaciones en este dispositivo"}
                </button>
              )}
            </>
          )}
          <button
            onClick={() => {
              onSignOut();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            data-testid="user-menu-signout"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
