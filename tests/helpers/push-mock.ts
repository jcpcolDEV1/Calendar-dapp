import type { Page } from "@playwright/test";

export type PushMockMode = "prompt" | "granted-with-sub" | "denied";

/**
 * Mocks Notification, serviceWorker + pushManager so E2E can run without real push
 * or native permission prompts. Call before navigating to /app.
 */
export async function installPushBrowserMock(
  page: Page,
  mode: PushMockMode
): Promise<void> {
  await page.addInitScript((m: PushMockMode) => {
    let notifPermission =
      m === "granted-with-sub"
        ? "granted"
        : m === "denied"
          ? "denied"
          : "default";

    const fakeSub = {
      toJSON: () => ({
        endpoint: "https://e2e.example.invalid/push",
        keys: { p256dh: "dGVzdA", auth: "dGVzdA" },
      }),
    };

    const hasSubInitially = m === "granted-with-sub";

    const registration = {
      scope: "/",
      pushManager: {
        getSubscription: async () => (hasSubInitially ? fakeSub : null),
        subscribe: async () => fakeSub,
      },
    };

    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        ready: Promise.resolve(registration),
        register: async () => registration,
      },
      configurable: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).PushManager = function PushManager() {};

    const E2ENotification = class {
      static get permission() {
        return notifPermission;
      }
      static requestPermission() {
        if (m === "denied") {
          return Promise.resolve("denied");
        }
        notifPermission = "granted";
        return Promise.resolve("granted");
      }
    };

    Object.defineProperty(window, "Notification", {
      value: E2ENotification,
      writable: true,
      configurable: true,
    });
  }, mode);
}

/** Stub POST /api/push/subscribe so registerPushSubscription succeeds */
export async function stubPushSubscribeApi(page: Page): Promise<void> {
  await page.route("**/api/push/subscribe", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      });
    } else {
      await route.continue();
    }
  });
}
