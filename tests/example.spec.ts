import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("opens the app and verifies homepage loads", async ({ page }) => {
    await page.goto("/");

    await page.pause(); // Browser stays open for inspection

    await expect(page).toHaveURL("/");
  });

  test("checks the Your Personal Calendar title exists", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Your Personal Calendar" })).toBeVisible();
  });
});
