import { expect, test } from "@playwright/test";

test("@regression mobile user studies force-dynamic and opens the Next.js brief feed", async ({ page }) => {
  await page.addInitScript(() => {
    (
      window as Window & {
        __codematicaQuestionnaireRandom?: () => number;
        __codematicaPassiveFlashcardRandom?: () => number;
      }
    ).__codematicaQuestionnaireRandom = () => 0.999999;
    (
      window as Window & {
        __codematicaQuestionnaireRandom?: () => number;
        __codematicaPassiveFlashcardRandom?: () => number;
      }
    ).__codematicaPassiveFlashcardRandom = () => 0.999999;
  });

  await page.goto("/paths");
  await expect(page.getByTestId("path-card-advanced-nextjs-16")).toContainText("Advanced Next.js 16");

  await page.getByTestId("path-card-advanced-nextjs-16").getByRole("link", { name: /Open path/i }).click();
  await expect(page.getByTestId("path-detail")).toBeVisible();
  await expect(page.getByTestId("path-node-document-frontend-nextjs-16-force-dynamic")).toContainText("force-dynamic");

  await page.getByTestId("path-node-document-frontend-nextjs-16-force-dynamic").click();
  await expect(page.getByTestId("document-page")).toBeVisible();
  await expect(page).toHaveURL(/\/docs\/frontend\/nextjs-16-force-dynamic\?path=advanced-nextjs-16/);
  await expect(page.getByRole("heading", { name: "What force-dynamic Means In Next.js 16" })).toBeVisible();
  await expect(page.getByTestId("markdown-renderer")).toContainText("pages are dynamic by default");
  await expect(page.getByTestId("document-next-node")).toHaveAttribute(
    "href",
    "/practice/frontend/nextjs-16-force-dynamic-questionnaire?path=advanced-nextjs-16",
  );

  await page.goto("/browse");
  await page.getByTestId("knowledge-search-input").fill("force-dynamic");
  await expect(page.getByTestId("search-results")).toContainText("What force-dynamic Means In Next.js 16");

  await page.goto("/practice/frontend/nextjs-16-force-dynamic-questionnaire?path=advanced-nextjs-16");
  await expect(page.getByTestId("practice-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Next.js 16 force-dynamic Questionnaire" })).toBeVisible();
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 1 of 6");
  await page.getByLabel(/Render the route at request time/i).check();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 2 of 6");
  await page.getByTestId("questionnaire-cloze-answer-input").fill("not needed");
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 3 of 6");
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 4 of 6");
  await page.getByTestId("questionnaire-match-dynamic").click();
  await page.getByRole("option", { name: "usually remove under Cache Components" }).click();
  await page.getByTestId("questionnaire-match-revalidate").click();
  await page.getByRole("option", { name: "move freshness to cacheLife" }).click();
  await page.getByTestId("questionnaire-match-fetchcache").click();
  await page.getByRole("option", { name: "replace with explicit cached scopes" }).click();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 5 of 6");
  await page.getByLabel(/Add force-dynamic to the whole route/i).check();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 6 of 6");
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-finish").click();
  await expect(page.getByTestId("questionnaire-complete")).toContainText("Refresh complete");

  await page.goto("/paths/advanced-nextjs-16");
  await page.getByTestId("path-flashcard-feed-link").click();
  await expect(page).toHaveURL(/\/paths\/advanced-nextjs-16\/flashcards/);
  await expect(page.getByTestId("passive-flashcard-feed")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("passive-flashcard-card-0")).toContainText("Rendering Model: Boundary First");
  await expect(page.getByTestId("passive-flashcard-card-0")).toContainText("Classify the boundary before changing the flag");
});
