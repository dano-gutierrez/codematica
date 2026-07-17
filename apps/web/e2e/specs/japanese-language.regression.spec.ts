import { expect, test } from "@playwright/test";

test("@regression mobile user searches Japanese and opens a writing drill", async ({ page }) => {
  await page.goto("/languages/japanese");
  await expect(page.getByTestId("japanese-language-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Practice kana, kanji, and writing/i })).toBeVisible();

  await page.getByTestId("japanese-search-input").fill("water");
  await expect(page.getByTestId("japanese-search-results")).toContainText("水");
  await expect(page.getByTestId("japanese-character-japanese-kanji-water")).toContainText("/mizɯ/");
  await expect(page.getByTestId("japanese-vocabulary-japanese-vocabulary-water")).toContainText("mizu");

  await page.getByTestId("japanese-vocabulary-japanese-vocabulary-water").click();
  await expect(page).toHaveURL(/\/languages\/japanese\/vocabulary\/water/);
  await expect(page.getByTestId("japanese-vocabulary-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "mizu" })).toBeVisible();

  await page.goto("/");
  await expect(page.getByTestId("path-card-japanese-foundations")).toContainText("Japanese Foundations");
  await page.getByTestId("path-card-japanese-foundations").getByRole("link", { name: /Open path/i }).click();
  await expect(page.getByTestId("path-detail")).toBeVisible();
  await expect(page.getByTestId("path-node-exercise-languages-japanese-hiragana-vowels-writing")).toContainText("Writing");

  await page.getByTestId("path-node-exercise-languages-japanese-hiragana-vowels-writing").click();
  await expect(page.getByTestId("practice-page")).toBeVisible();
  await expect(page.getByTestId("writing-practice")).toBeVisible();
  await expect(page.getByTestId("writing-pad")).toBeVisible();
  await expect(page.getByTestId("writing-mode-assisted")).toHaveCSS("color", "rgb(255, 255, 255)");

  await page.getByTestId("writing-mode-free").click();
  await expect(page.getByTestId("writing-mode-free")).toHaveCSS("color", "rgb(255, 255, 255)");
});
