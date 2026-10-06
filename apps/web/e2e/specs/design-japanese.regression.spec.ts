import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  ["dictionary", "/languages/japanese"],
  ["character", "/languages/japanese/characters/hiragana/a"],
  ["word", "/languages/japanese/vocabulary/japan"],
  ["notebooks", "/languages/japanese/notebooks"],
  ["review", "/languages/japanese/review"],
  ["flashcards", "/languages/japanese/review/flashcards"],
  ["listening", "/languages/japanese/review/listening"],
  ["writing", "/languages/japanese/review/writing"],
  ["questionnaire", "/practice/programming/python-runtime-questionnaire"],
] as const;

test("@regression @design matching feedback stays visible after an incorrect first pair", async ({ page }) => {
  for (const scale of ["100%", "200%"]) {
    await page.goto("/practice/languages/japanese-hiragana-vowels-writing");
    await page.evaluate(value => { document.documentElement.style.fontSize = value; }, scale);
    await page.getByTestId("writing-activity-match").click();
    await page.getByTestId("writing-match-kana-characters-0-0").click();
    await page.getByTestId("writing-match-romaji-characters-0-1").click();
    const feedback = page.getByRole("status");
    await expect(feedback).toContainText("Try another pair");
    await expect(feedback).toBeInViewport({ ratio: 1 });
  }
});

for (const width of [320, 768, 1440]) {
  for (const [name, route] of routes) {
    for (const scale of ["100%", "200%"]) {
      test(`@regression @design ${name} reflows at ${width}px with ${scale} text`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveCount(1);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(value => { document.documentElement.style.fontSize = value; }, scale);
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect((await new AxeBuilder({ page }).include("main").analyze()).violations).toEqual([]);
        // The complete 650-word dictionary exceeds browser screenshot limits at 200% text.
        // Keep all document-wide assertions and capture its beginning, middle and resources.
        await page.screenshot({ path: test.info().outputPath(`${name}-${width}-${scale}.png`), fullPage: name !== "dictionary" });
        if (name === "dictionary") {
          await page.getByRole("heading", { name: "Basic katakana" }).scrollIntoViewIfNeeded();
          await page.screenshot({ path: test.info().outputPath(`katakana-${width}-${scale}.png`) });
          await page.getByRole("heading", { name: "Learning resources" }).scrollIntoViewIfNeeded();
          await page.screenshot({ path: test.info().outputPath(`resources-${width}-${scale}.png`) });
        }
      });
    }
  }
}

test("@regression @design dictionary announces empty search and restores focus", async ({ page }) => {
  await page.goto("/languages/japanese");
  const search = page.getByRole("textbox", { name: "Search Japanese" });
  await search.fill("qzqznotfound");
  await expect(page.getByRole("status")).toContainText("No matches");
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(search).toBeFocused();
  await expect(page.getByRole("heading", { name: "Basic hiragana" })).toBeVisible();
});

test("@regression @design touch notebook actions remain visibly labeled", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/languages/japanese/characters/hiragana/a");
  const restart = page.getByRole("button", { name: "Clear and restart sheet", exact: true });
  await expect(restart.getByTestId("ui-button-label")).toBeVisible();
  const bounds = await restart.boundingBox();
  expect(bounds!.height).toBeGreaterThanOrEqual(48);
  await page.getByRole("button", { name: "Clear current character" }).click();
  await page.getByRole("button", { name: "Show example" }).click();
  await expect(page.getByRole("button", { name: "Hide example" })).toBeVisible();
});

test("@regression @design dictionary keeps all words searchable and browsable", async ({ page }) => {
  await page.goto("/languages/japanese");
  const catalog = page.getByTestId("japanese-vocabulary-disclosure");
  await catalog.getByRole("heading", { name: "Beginner words and greetings" }).click();
  const japan = catalog.getByTestId("japanese-vocabulary-japanese-vocabulary-japan");
  await expect(japan).toBeVisible();
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await japan.click();
  await expect(page.getByTestId("japanese-vocabulary-page")).toBeVisible();
  await page.getByRole("link", { name: "Japanese", exact: true }).click();
  await page.getByRole("textbox", { name: "Search Japanese" }).fill("nihon");
  await expect(page.getByTestId("japanese-search-results").getByTestId("japanese-vocabulary-japanese-vocabulary-japan")).toBeVisible();
});
