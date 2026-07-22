import { expect, test } from "@playwright/test";

test("@regression home discovery exposes every section and searches across content types", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("discovery-home")).toBeVisible();
  for (const section of ["paths", "lessons", "interviews", "practice", "languages"]) {
    await expect(page.getByTestId(`home-section-${section}`)).toBeVisible();
    await expect(page.getByTestId(`home-view-all-${section}`)).toBeVisible();
  }
  await expect(page.getByTestId("home-section-languages")).toContainText("Japanese");

  await page.getByTestId("home-global-search").fill("Number Of Islands");
  await expect(page.getByTestId("home-discovery-results")).toContainText("Number Of Islands");
  await expect(page.getByTestId("home-discovery-results")).toContainText("Google interview question");

  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByTestId("home-global-search").fill("water");
  await expect(page.getByTestId("home-discovery-results")).toContainText("Kanji Water");

  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.getByTestId("home-view-all-paths")).toHaveCSS("background-color", "rgb(0, 100, 95)");
  await expect(page.getByTestId("home-view-all-interviews")).toHaveCSS("background-color", "rgb(75, 54, 158)");
  await expect(page.getByTestId("home-view-all-languages")).toHaveCSS("background-color", "rgb(122, 82, 0)");

  await page.getByTestId("home-view-all-practice").click();
  await expect(page).toHaveURL(/\/practice$/);
  await expect(page.getByTestId("practice-catalog")).toBeVisible();
});
