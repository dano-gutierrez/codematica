import { expect, test } from "@playwright/test";

test("@regression @design home discovery exposes compact cards and searches across content types", async ({ page }) => {
  await page.goto("/learn");

  await expect(page.getByTestId("discovery-home")).toBeVisible();
  for (const section of ["paths", "lessons", "interviews", "practice", "languages"]) {
    await expect(page.getByTestId(`home-section-${section}`)).toBeVisible();
    await expect(page.getByTestId(`home-view-all-${section}`)).toBeVisible();
  }
  await expect(page.getByTestId("home-section-languages")).toContainText("Japanese");
  const pathSummary = page.getByTestId("home-section-paths").getByText("A source-linked career path", { exact: false });
  await expect(pathSummary).toHaveCount(0);
  await expect(page.getByTestId("home-section-paths").getByRole("link", { name: /ML Systems/ }).first()).toBeVisible();

  await page.getByTestId("home-global-search").fill("Number Of Islands");
  await expect(page.getByTestId("home-discovery-results")).toContainText("Number Of Islands");
  await expect(page.getByTestId("home-discovery-results")).toContainText("Google interview question");
  await expect(page.getByTestId("home-discovery-results").getByText("Count connected groups of land in a rectangular grid and compare breadth-first with depth-first flood fill.", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByTestId("home-global-search").fill("water");
  await expect(page.getByTestId("home-discovery-results")).toContainText("Kanji Water");

  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.getByTestId("home-view-all-paths")).toHaveCSS("color", "rgb(0, 100, 95)");
  await expect(page.getByTestId("home-view-all-interviews")).toHaveCSS("color", "rgb(0, 100, 95)");
  await expect(page.getByTestId("home-view-all-languages")).toHaveCSS("color", "rgb(0, 100, 95)");

  await page.getByTestId("home-view-all-practice").click();
  await expect(page).toHaveURL(/\/practice$/);
  await expect(page.getByTestId("practice-catalog")).toBeVisible();
});
