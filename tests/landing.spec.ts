import { test, expect } from "@playwright/test";

test("Homepage loads and displays The Blueprints", async ({ page }) => {
  await page.goto("http://localhost:3000");

  await expect(page.getByText(/The Blueprints/i)).toBeVisible();

  const loginElement = page.getByRole("link", { name: /Sign In/i });

  await expect(loginElement).toBeVisible();
});
