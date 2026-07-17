import { expect, test } from "@playwright/test";

test("@regression mobile user studies trigram indexes and opens the database flashcard feed", async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __codematicaQuestionnaireRandom?: () => number; __codematicaPassiveFlashcardRandom?: () => number }).__codematicaQuestionnaireRandom =
      () => 0.99;
    (window as Window & { __codematicaQuestionnaireRandom?: () => number; __codematicaPassiveFlashcardRandom?: () => number }).__codematicaPassiveFlashcardRandom =
      () => 0.999999;
  });

  await page.goto("/");
  await expect(page.getByTestId("path-card-database-indexes-and-search")).toContainText("Database Indexes And Search");

  await page.getByTestId("path-card-database-indexes-and-search").getByRole("link", { name: /Open path/i }).click();
  await expect(page.getByTestId("path-detail")).toBeVisible();
  await expect(page.getByTestId("path-node-document-databases-trigram-fuzzy-indexes")).toContainText("Trigram");

  await page.getByTestId("path-node-document-databases-trigram-fuzzy-indexes").click();
  await expect(page.getByTestId("document-page")).toBeVisible();
  await expect(page).toHaveURL(/\/docs\/databases\/trigram-fuzzy-indexes\?path=database-indexes-and-search/);
  await expect(page.getByRole("heading", { name: "Trigram Fuzzy Indexes In PostgreSQL" })).toBeVisible();
  await expect(page.getByTestId("markdown-renderer")).toContainText("gin_trgm_ops");
  await expect(page.getByTestId("document-next-node")).toHaveAttribute(
    "href",
    "/practice/databases/trigram-fuzzy-indexes-questionnaire?path=database-indexes-and-search",
  );

  await page.goto("/browse");
  await page.getByTestId("knowledge-search-input").fill("gin_trgm_ops");
  await expect(page.getByTestId("search-results")).toContainText("Trigram Fuzzy Indexes In PostgreSQL");

  await page.goto("/practice/databases/trigram-fuzzy-indexes-questionnaire?path=database-indexes-and-search");
  await expect(page.getByTestId("practice-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trigram Fuzzy Indexes Questionnaire" })).toBeVisible();
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 1 of 6");
  await page.getByLabel(/three-character fragments/i).check();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 2 of 6");
  await page.getByTestId("questionnaire-cloze-answer-input").fill("similarity threshold");
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 3 of 6");
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 4 of 6");
  await page.getByTestId("questionnaire-match-gin").click();
  await page.getByRole("option", { name: "fast trigram filtering" }).click();
  await page.getByTestId("questionnaire-match-gist").click();
  await page.getByRole("option", { name: "distance ordering" }).click();
  await page.getByTestId("questionnaire-match-operator-class").click();
  await page.getByRole("option", { name: "operator support" }).click();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 5 of 6");
  await page.getByLabel(/Apply the same lower expression/i).check();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 6 of 6");
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-finish").click();
  await expect(page.getByTestId("questionnaire-complete")).toContainText("Refresh complete");

  await page.goto("/paths/database-indexes-and-search");
  await page.getByTestId("path-flashcard-feed-link").click();
  await expect(page).toHaveURL(/\/paths\/database-indexes-and-search\/flashcards/);
  await expect(page.getByTestId("passive-flashcard-feed")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("passive-flashcard-card-0")).toContainText("Indexes Are Read Models");
});
