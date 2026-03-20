/**
 * Convert VAPID public key from URL-safe base64 to Uint8Array for pushManager.subscribe
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushSubscription(): Promise<boolean> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    console.warn("VAPID public key not configured");
    return false;
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications not supported");
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(existingSubscription.toJSON()),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to save subscription");
    }
    return true;
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save subscription");
  }
  return true;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  return Notification.requestPermission();
}

/**
 * Sync existing browser push subscription to server (DB).
 * Call on app load to ensure subscriptions in the browser are saved to push_subscriptions.
 * Runs silently - no permission request, no user feedback.
 */
export async function syncSubscriptionToServer(): Promise<void> {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();
    if (!existingSubscription) return;

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(existingSubscription.toJSON()),
    });
    if (!res.ok) {
      console.warn("Push subscription sync failed:", await res.text());
    }
  } catch {
    // Silent - sync is best-effort
  }
}

export async function checkNotificationStatus(): Promise<{
  permission: NotificationPermission;
  hasSubscription: boolean;
}> {
  const permission: NotificationPermission =
    "Notification" in window ? Notification.permission : "denied";
  let hasSubscription = false;
  if (
    permission === "granted" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  ) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      hasSubscription = !!sub;
    } catch {
      // ignore
    }
  }
  return { permission, hasSubscription };
}

/** Current browser push subscription URL, if any (for targeted test send). */
export async function getPushSubscriptionEndpoint(): Promise<string | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    return sub?.endpoint ?? null;
  } catch {
    return null;
  }
}
