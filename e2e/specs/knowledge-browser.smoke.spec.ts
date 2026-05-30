import { expect, test } from "@playwright/test";

test("@smoke mobile user can search, read, and open a diagram", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("knowledge-browser")).toBeVisible();
  await expect(page.getByTestId("search-mode-exact")).toHaveCount(0);
  await expect(page.getByTestId("search-mode-fuzzy")).toHaveCount(0);

  await page.getByTestId("track-filter").click();
  await page.getByRole("option", { name: "Programming" }).click();
  await expect(page.getByTestId("track-filter")).toContainText("Programming");
  await expect(page.getByTestId("search-results")).toContainText("TypeScript Boundary Design");

  await page.getByTestId("track-filter").click();
  await page.getByRole("option", { name: "All tracks" }).click();
  await page.getByTestId("difficulty-filter").click();
  await page.getByRole("option", { name: "Senior" }).click();
  await expect(page.getByTestId("difficulty-filter")).toContainText("Senior");

  await page.getByTestId("knowledge-search-input").fill("invalidation");
  await expect(page.getByTestId("search-results")).toContainText("Cache Invalidation");

  await page.getByRole("link", { name: /Cache Invalidation/ }).first().click();
  await expect(page.getByTestId("document-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cache Invalidation Under Product Pressure" })).toBeVisible();
  await expect(page.getByTestId("markdown-renderer")).toContainText("Core Decision");
  await expect(page.getByTestId("referenced-diagrams")).toContainText("Cache Aside");

  await page.getByRole("link", { name: "Cache Aside" }).first().click();
  await expect(page.getByTestId("diagram-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cache Aside" })).toBeVisible();
  await expect(page.getByTestId("mermaid-block")).toBeVisible();
  await expect(page.getByTestId("mermaid-diagram")).toBeVisible();
});
