import { expect, test } from "@playwright/test";

const pathSlug = "rtk-query-interview-preparation";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __codematicaQuestionnaireRandom?: () => number }).__codematicaQuestionnaireRandom = () => 0.999999;
    (window as Window & { __codematicaPassiveFlashcardRandom?: () => number }).__codematicaPassiveFlashcardRandom = () => 0.999999;
  });
});

test("@regression studies the RTK incident, completes its checkpoint, and continues the path", async ({ page }) => {
  await page.goto("/paths");
  await page.getByTestId(`path-card-${pathSlug}`).getByRole("link", { name: /Open path/i }).click();
  await page.getByTestId("path-node-document-frontend-rtk-query-persistence-and-recovery").click();
  await expect(page).toHaveURL(new RegExp(`/docs/frontend/rtk-query-persistence-and-recovery\\?path=${pathSlug}`));
  await expect(page.getByRole("heading", { name: "RTK Query Persistence and the Forever-Loading Incident", exact: true })).toBeVisible();
  await expect(page.getByTestId("source-references")).toContainText("Persistence and Rehydration");
  await expect(page.getByTestId("mermaid-diagram")).toBeVisible();
  await expect(page.getByTestId("mermaid-error")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "inkitt/flash PR #12666" })).toHaveAttribute("href", "https://github.com/inkitt/flash/pull/12666");
  await expect(page.getByTestId("document-next-node")).toHaveAttribute("href", `/practice/frontend/rtk-query-persistence-and-recovery-questionnaire?path=${pathSlug}`);
  await page.getByTestId("document-next-node").click();
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");

  // A real wrong attempt proves that explanation and correction survive rendering.
  await page.getByLabel("Every restart automatically recreates the original fetch promise.", { exact: true }).check();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Review this");
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Serialized pending state does not recreate a promise");
  await page.getByTestId("questionnaire-next").click();

  const answers = [
    "Their dedicated extractRehydrationInfo reducer path filters pending entries; raw state restoration can bypass it.",
    "Writes prevent recurrence; reads repair already persisted bad entries.",
    "A targeted versioned cache repair that preserves unrelated durable data.",
    "Restore through the real config, subscribe, observe a new fake request, and reach data or error UI.",
    "Reconcile the server operation; removing local state does not justify replay.",
  ];
  for (const [index, answer] of answers.entries()) {
    await expect(page.getByTestId("questionnaire-position")).toContainText(`Question ${index + 2} of 6`);
    await page.getByLabel(answer, { exact: true }).check();
    await page.getByTestId("questionnaire-check").click();
    await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
    await page.getByTestId(index === answers.length - 1 ? "questionnaire-finish" : "questionnaire-next").click();
  }
  await expect(page.getByTestId("questionnaire-complete")).toContainText("Practice complete");
  await page.getByRole("link", { name: /Next activity/i }).click();
  await expect(page).toHaveURL(new RegExp(`/docs/frontend/rtk-query-modern-apis\\?path=${pathSlug}`));
  await expect(page.getByTestId("markdown-renderer")).toContainText("build.infiniteQuery<Page, FeedArg, string | null>");
  await expect(page.getByTestId("markdown-renderer")).toContainText("responseSchema: authorSchema");
  await expect(page.getByTestId("markdown-renderer")).toContainText("2.12.0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("rtk-modern-mobile.png"), fullPage: true });
});

test("@regression finds RTK lessons and opens the existing review feed", async ({ page }) => {
  await page.goto("/browse");
  await page.getByTestId("knowledge-search-input").fill("RTK Query persistence");
  await expect(page.getByTestId("search-results")).toContainText("RTK Query Persistence and the Forever-Loading Incident");
  await page.goto(`/paths/${pathSlug}`);
  await page.getByTestId("path-flashcard-feed-link").click();
  await expect(page).toHaveURL(new RegExp(`/paths/${pathSlug}/flashcards`));
  await expect(page.getByTestId("passive-flashcard-feed")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("passive-flashcard-card-0")).toContainText("They share the cache entry and an in-flight request because the endpoint and serialized argument identify the entry.");
});
