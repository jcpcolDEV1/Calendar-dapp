import { test, expect } from "@playwright/test";

// Generate unique email for each test run to avoid conflicts with existing data
const TEST_EMAIL = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.com`;
const TEST_PASSWORD = "TestPassword123!";

// Helper: click on today's day cell (or first available in grid)
async function clickTodayCell(page: import("@playwright/test").Page) {
  const dateKey = new Date().toISOString().split("T")[0];
  const dayCell = page.getByTestId(`day-cell-${dateKey}`);
  const visible = await dayCell.isVisible().catch(() => false);
  if (visible) {
    await dayCell.click();
  } else {
    await page.locator('[data-testid^="day-cell-"]').first().click();
  }
}

test.describe("Calendar E2E Flows", () => {
  test("Full calendar flow: signup, login, create, edit, delete, persistence", async ({ page }) => {
    // Handle native confirm dialog for delete
    page.on("dialog", (dialog) => dialog.accept());

    // 1. Signup with email
    await test.step("1. Signup - Open homepage and navigate to signup", async () => {
      await page.goto("/");
      await expect(page).toHaveURL("/");
      await page.goto("/signup");
      await expect(page).toHaveURL("/signup");
    });

    await test.step("1. Signup - Register with unique email", async () => {
      await page.getByTestId("signup-email").fill(TEST_EMAIL);
      await page.getByTestId("signup-password").fill(TEST_PASSWORD);
      await page.getByTestId("signup-submit").click();
      await expect(page).toHaveURL(/\/app/, { timeout: 15000 });
      await expect(page.getByText("Calendar")).toBeVisible({ timeout: 5000 });
    });

    // 2. Login (logout first, then login)
    await test.step("2. Login - Log out and log back in", async () => {
      await page.getByTestId("user-menu-button").click();
      await page.getByTestId("user-menu-signout").click();
      await expect(page).toHaveURL(/\//);

      await page.goto("/login");
      await expect(page).toHaveURL("/login");
      await page.getByTestId("login-email").fill(TEST_EMAIL);
      await page.getByTestId("login-password").fill(TEST_PASSWORD);
      await page.getByTestId("login-submit").click();
      await expect(page).toHaveURL(/\/app/, { timeout: 15000 });
      await expect(page.getByText("Calendar")).toBeVisible({ timeout: 10000 });
    });

    // 3. Create a calendar entry
    await test.step("3. Create entry - Click day and add Test Event", async () => {
      await clickTodayCell(page);
      await expect(page.getByTestId("day-detail-panel")).toBeVisible({ timeout: 5000 });
      await page.getByTestId("day-panel-add-entry").click();
      await page.getByTestId("entry-form-title").fill("Test Event");
      await page.getByTestId("entry-form-submit").click();
      await expect(page.getByText("Test Event")).toBeVisible({ timeout: 5000 });
    });

    // 4. Edit the entry
    await test.step("4. Edit entry - Update title to Updated Test Event", async () => {
      const entryCard = page.getByTestId("entry-card").filter({ hasText: "Test Event" });
      await entryCard.getByRole("button", { name: "Edit" }).click();
      await page.getByTestId("entry-form-title").fill("Updated Test Event");
      await page.getByTestId("entry-form-submit").click();
      await expect(page.getByText("Updated Test Event")).toBeVisible({ timeout: 5000 });
    });

    // 5. Delete the entry
    await test.step("5. Delete entry - Remove and verify gone", async () => {
      const entryCard = page.getByTestId("entry-card").filter({ hasText: "Updated Test Event" });
      await entryCard.getByRole("button", { name: "Delete" }).click();
      await expect(page.getByText("Updated Test Event")).not.toBeVisible({ timeout: 3000 });
    });

    // 6. Verify persistence
    await test.step("6. Persistence - Create new entry, reload, verify still there", async () => {
      await page.getByTestId("day-panel-add-entry").click();
      await page.getByTestId("entry-form-title").fill("Persistence Test Event");
      await page.getByTestId("entry-form-submit").click();
      await expect(page.getByText("Persistence Test Event")).toBeVisible({ timeout: 5000 });

      await page.reload();
      await expect(page.getByText("Calendar")).toBeVisible({ timeout: 10000 });
      await clickTodayCell(page);
      await expect(page.getByText("Persistence Test Event")).toBeVisible({ timeout: 5000 });
    });
  });
});
