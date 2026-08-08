import { expect, test } from "@playwright/test";

test("@regression mobile user searches Japanese and opens a writing drill", async ({ page }) => {
  await page.goto("/languages/japanese");
  await expect(page.getByTestId("japanese-language-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Practice kana, kanji, and writing/i })).toBeVisible();
  await expect(page.getByTestId("japanese-study-tools")).toBeVisible();
  await expect(page.getByTestId("japanese-flashcards-link")).toHaveAttribute("href", "/paths/japanese-foundations/flashcards");
  await expect(page.getByTestId("japanese-review-link")).toHaveAttribute("href", "/languages/japanese/review");
  await expect(page.getByTestId("japanese-resource-shelf")).toContainText("Irodori");
  await expect(page.getByRole("heading", { name: "Basic katakana" })).toBeVisible();

  await page.getByTestId("japanese-flashcards-link").click();
  await expect(page.getByTestId("passive-flashcard-feed")).toBeVisible();
  await expect(page.getByTestId("passive-flashcard-card-0")).toBeVisible();

  await page.goto("/languages/japanese");
  await page.getByTestId("japanese-search-input").fill("koohii");
  await expect(page.getByTestId("japanese-vocabulary-japanese-vocabulary-coffee")).toContainText("コーヒー");

  await page.getByTestId("japanese-search-input").fill("shi");
  await expect(page.getByTestId("japanese-character-japanese-katakana-shi")).toContainText("Katakana Shi");
  await page.getByTestId("japanese-character-japanese-katakana-shi").click();
  await expect(page.getByTestId("japanese-character-practice")).toBeVisible();
  await expect(page.getByTestId("writing-pad")).toBeVisible();

  await page.goto("/languages/japanese");

  await page.getByTestId("japanese-search-input").fill("konbanha");
  await expect(page.getByTestId("japanese-vocabulary-japanese-vocabulary-good-evening")).toContainText("こんばんは");
  await page.getByTestId("japanese-vocabulary-japanese-vocabulary-good-evening").click();
  await expect(page.getByTestId("japanese-vocabulary-breakdown")).toContainText("topic particle");
  await page.getByRole("link", { name: "Open Hiragana Ha" }).click();
  await expect(page.getByTestId("japanese-character-practice")).toBeVisible();
  await expect(page.getByTestId("writing-pad")).toBeVisible();
  await page.getByTestId("writing-mode-free").click();
  await expect(page.getByTestId("writing-mode-free")).toHaveCSS("color", "rgb(255, 255, 255)");

  await page.goto("/languages/japanese");

  await page.getByTestId("japanese-search-input").fill("water");
  await expect(page.getByTestId("japanese-search-results")).toContainText("水");
  await expect(page.getByTestId("japanese-character-japanese-kanji-water")).toContainText("/mizɯ/");
  await expect(page.getByTestId("japanese-vocabulary-japanese-vocabulary-water")).toContainText("mizu");

  await page.getByTestId("japanese-vocabulary-japanese-vocabulary-water").click();
  await expect(page).toHaveURL(/\/languages\/japanese\/vocabulary\/water/);
  await expect(page.getByTestId("japanese-vocabulary-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "mizu" })).toBeVisible();

  await page.goto("/paths");
  await expect(page.getByTestId("path-card-japanese-foundations")).toContainText("Japanese Foundations");
  await page.getByTestId("path-card-japanese-foundations").getByRole("link", { name: /Open path/i }).click();
  await expect(page.getByTestId("path-detail")).toBeVisible();
  await expect(page.getByTestId("path-progression-roadmap")).toContainText("Kana Explorer");
  await expect(page.getByTestId("path-progression-roadmap")).toContainText("Everyday Navigator");
  await expect(page.getByTestId("path-flashcard-feed-link")).toBeVisible();
  await expect(page.getByTestId("path-node-document-languages-japanese-hiragana-foundations")).toContainText("Read The 46 Basic Hiragana");
  await expect(page.getByTestId("path-node-document-languages-japanese-katakana-foundations")).toContainText("Read The 46 Basic Katakana");
  await expect(page.getByTestId("path-node-document-languages-japanese-romaji-kana-input")).toContainText("Romaji Is Not Kana Input");
  await page.getByTestId("path-node-document-languages-japanese-romaji-kana-input").click();
  await expect(page.getByTestId("markdown-renderer")).toContainText("konbanha");
  await expect(page.getByRole("heading", { name: "The Three Particle Exceptions" })).toBeVisible();

  await page.goto("/paths/japanese-foundations");
  await expect(page.getByTestId("path-node-exercise-languages-japanese-hiragana-vowels-writing")).toContainText("Writing");

  await page.getByTestId("path-node-exercise-languages-japanese-hiragana-vowels-writing").click();
  await expect(page.getByTestId("practice-page")).toBeVisible();
  await expect(page.getByTestId("writing-practice")).toBeVisible();
  await expect(page.getByTestId("writing-pad")).toBeVisible();
  await expect(page.getByTestId("writing-mode-assisted")).toHaveCSS("color", "rgb(255, 255, 255)");

  await page.getByTestId("writing-mode-free").click();
  await expect(page.getByTestId("writing-mode-free")).toHaveCSS("color", "rgb(255, 255, 255)");

  await page.goto("/languages/japanese/review");
  await expect(page.getByTestId("japanese-review-browser")).toBeVisible();
  await page.getByRole("button", { name: "Good" }).click();
  await expect(page.getByRole("button", { name: "Good" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Good" })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Good saved");
  await expect(page.getByText(/Best 85% · box 1/)).toBeVisible();
});
