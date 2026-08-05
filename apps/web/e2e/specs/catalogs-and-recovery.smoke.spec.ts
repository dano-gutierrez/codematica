import { expect, test } from "@playwright/test";

test("@smoke catalogs, signed-out Auth, and recovery routes remain available", async ({ page }) => {
  await test.step("browse complete catalogs", async () => {
    await page.goto("/practice");
    await expect(page.getByTestId("practice-catalog")).toBeVisible();
    await page.getByTestId("practice-catalog-search").fill("cache");
    await expect(page.getByTestId("practice-catalog")).toContainText(/cache/i);

    await page.goto("/languages");
    await expect(page.getByTestId("language-catalog")).toContainText("Japanese");

    await page.goto("/interviews");
    await expect(page.getByTestId("interview-catalog")).toBeVisible();
    await page.getByTestId("interview-search-input").fill("Number Of Islands");
    await expect(page.getByTestId("interview-all-question-list")).toContainText("Number Of Islands");
  });

  await test.step("keep optional Auth and 404 recovery usable", async () => {
    await page.goto("/login");
    await expect(page.getByTestId("login-form")).toContainText("Auth is not configured");
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeDisabled();

    await page.goto("/docs/does-not-exist");
    await expect(page.getByRole("heading", { name: /outside the map/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /back to paths/i })).toBeVisible();
  });
});
