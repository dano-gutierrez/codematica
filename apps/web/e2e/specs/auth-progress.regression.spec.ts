import { expect, test } from "@playwright/test";

test("@regression signed-out users can learn and see local keep-reading progress", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());

  await test.step("read an article without auth", async () => {
    await page.goto("/docs/system-design/cache-invalidation");
    await expect(page.getByTestId("document-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cache Invalidation Under Product Pressure" })).toBeVisible();
    await expect(page.getByTestId("save-progress-prompt")).toBeVisible();
  });

  await test.step("resume from the home keep-reading section", async () => {
    await page.goto("/");
    await expect(page.getByTestId("path-home")).toBeVisible();
    await expect(page.getByTestId("keep-reading-section")).toContainText("Cache Invalidation Under Product Pressure");
  });

  await test.step("complete practice without auth redirects", async () => {
    await page.goto("/practice/system-design/cache-product-contract");
    await expect(page.getByTestId("practice-page")).toBeVisible();
    await page.getByRole("button", { name: /Reveal answer/i }).click();
    await expect(page.getByText(/It defines how stale the user experience may become/)).toBeVisible();
    await expect(page.getByTestId("save-progress-prompt")).toBeVisible();
  });
});
