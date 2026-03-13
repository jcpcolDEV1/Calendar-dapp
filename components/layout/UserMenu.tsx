"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, LogOut, User } from "lucide-react";
import {
  checkNotificationStatus,
  registerPushSubscription,
  requestNotificationPermission,
} from "@/lib/push-subscription";
import { toast } from "sonner";

interface UserMenuProps {
  userEmail?: string | null;
  onSignOut: () => void;
}

export function UserMenu({ userEmail, onSignOut }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotificationsSupported(
      "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window
    );
  }, []);

  useEffect(() => {
    if (!notificationsSupported) return;
    checkNotificationStatus().then(({ hasSubscription: sub }) =>
      setHasSubscription(sub)
    );
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
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {userEmail ?? "User"}
            </p>
          </div>
          {notificationsSupported && (
            hasSubscription ? (
              <div
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 dark:text-slate-400"
                data-testid="user-menu-notifications-active"
              >
                <Bell className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                Notificaciones activadas
              </div>
            ) : (
              <button
                onClick={async () => {
                  setNotificationsLoading(true);
                  try {
                    const permission = await requestNotificationPermission();
                    if (permission === "granted") {
                      await registerPushSubscription();
                      setHasSubscription(true);
                      toast.success("Notificaciones activadas");
                      setOpen(false);
                    } else if (permission === "denied") {
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
                <Bell className="h-4 w-4" />
                {notificationsLoading ? "Activando..." : "Activar notificaciones"}
              </button>
            )
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
