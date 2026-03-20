import { test, expect } from "@playwright/test";
import {
  installPushBrowserMock,
  stubPushSubscribeApi,
} from "./helpers/push-mock";

const TEST_PASSWORD = "TestPassword123!";

function uniqueEmail() {
  return `e2e-push-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`;
}

async function signupAndReachApp(page: import("@playwright/test").Page) {
  const email = uniqueEmail();
  await page.goto("/signup");
  await page.getByTestId("signup-email").fill(email);
  await page.getByTestId("signup-password").fill(TEST_PASSWORD);
  await page.getByTestId("signup-submit").click();
  await expect(page).toHaveURL(/\/app/, { timeout: 15000 });
  await expect(page.getByText("Calendar")).toBeVisible({ timeout: 10000 });
  return email;
}

test.describe("Notification permission banner (mocked browser APIs)", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await stubPushSubscribeApi(page);
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("calendar_push_banner_dismissed");
      } catch {
        /* ignore */
      }
    });
  });

  test("shows banner on /app when permission is default, hides after Activar", async ({
    page,
  }) => {
    await installPushBrowserMock(page, "prompt");

    await signupAndReachApp(page);

    const banner = page.getByTestId("notification-permission-banner");
    await expect(banner).toBeVisible({ timeout: 8000 });
    await expect(
      page.getByText("Activa notificaciones para recibir recordatorios")
    ).toBeVisible();

    await page.getByTestId("notification-permission-banner-activate").click();

    await expect(banner).not.toBeVisible({ timeout: 5000 });
  });

  test('hides banner after "Ahora no" and stays hidden on reload', async ({
    page,
  }) => {
    await installPushBrowserMock(page, "prompt");

    await signupAndReachApp(page);

    const banner = page.getByTestId("notification-permission-banner");
    await expect(banner).toBeVisible({ timeout: 8000 });

    await page.getByTestId("notification-permission-banner-dismiss").click();
    await expect(banner).not.toBeVisible();

    await page.reload();
    await expect(page.getByText("Calendar")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("notification-permission-banner")).not.toBeVisible();
  });

  test("does not show banner when permission granted and subscription exists", async ({
    page,
  }) => {
    await installPushBrowserMock(page, "granted-with-sub");

    await signupAndReachApp(page);

    await expect(
      page.getByTestId("notification-permission-banner")
    ).not.toBeVisible({ timeout: 5000 });
  });

  test("does not show banner when permission is denied", async ({ page }) => {
    await installPushBrowserMock(page, "denied");

    await signupAndReachApp(page);

    await expect(
      page.getByTestId("notification-permission-banner")
    ).not.toBeVisible({ timeout: 5000 });
  });
});
