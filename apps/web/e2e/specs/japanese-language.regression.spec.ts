import { expect, test, type CDPSession } from "@playwright/test";

type PadBox = { x: number; y: number; width: number; height: number };

async function drawTouchStroke(session: CDPSession, box: PadBox, points: Array<[number, number]>) {
  const [start, ...moves] = points;
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width * start![0], y: box.y + box.height * start![1] }],
  });
  for (const [x, y] of moves) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: box.x + box.width * x, y: box.y + box.height * y }],
    });
  }
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

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
  await expect(page.getByRole("link", { name: /flashcards/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /audio/i })).toHaveCount(0);
  await page.getByRole("button", { name: "Good" }).click();
  await expect(page.getByRole("button", { name: "Good" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Good" })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Good saved");
  await expect(page.getByText(/Best 85% · box 1/)).toBeVisible();
});

test("@regression assisted writing accepts a rough trace that follows the guide", async ({ page }) => {
  await page.goto("/languages/japanese/characters/kanji/one");

  const pad = page.getByTestId("writing-pad");
  await expect(pad).toBeVisible();
  await pad.scrollIntoViewIfNeeded();
  const box = await pad.boundingBox();
  expect(box).not.toBeNull();

  const session = await page.context().newCDPSession(page);
  await drawTouchStroke(session, box!, [[0.24, 0.64], [0.5, 0.65], [0.77, 0.62]]);

  await expect(page.getByTestId("writing-assisted-feedback")).toHaveCount(0);
  await expect(page.getByTestId("writing-check")).toBeEnabled();
  await page.getByTestId("writing-check").click();
  await expect(page.getByTestId("writing-feedback")).toContainText("Correct");
});

test("@regression free writing accepts a recognizable imperfect hiragana character", async ({ page }) => {
  await page.goto("/languages/japanese/characters/hiragana/a");
  await page.getByTestId("writing-mode-free").click();

  const pad = page.getByTestId("writing-pad");
  await pad.scrollIntoViewIfNeeded();
  const box = await pad.boundingBox();
  expect(box).not.toBeNull();

  const session = await page.context().newCDPSession(page);
  await drawTouchStroke(session, box!, [[0.28, 0.44], [0.63, 0.42]]);
  await drawTouchStroke(session, box!, [[0.6, 0.25], [0.54, 0.74]]);
  await drawTouchStroke(session, box!, [[0.76, 0.54], [0.6, 0.8], [0.38, 0.75], [0.67, 0.57]]);

  await expect(page.getByTestId("writing-check")).toBeEnabled();
  await page.getByTestId("writing-check").click();
  await expect(page.getByTestId("writing-feedback")).toContainText("Correct");
});
