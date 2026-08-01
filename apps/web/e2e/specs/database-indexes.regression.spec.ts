import { expect, test } from "@playwright/test";

test("@regression mobile user studies trigram indexes and opens the database flashcard feed", async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __codematicaQuestionnaireRandom?: () => number; __codematicaPassiveFlashcardRandom?: () => number }).__codematicaQuestionnaireRandom =
      () => 0.99;
    (window as Window & { __codematicaQuestionnaireRandom?: () => number; __codematicaPassiveFlashcardRandom?: () => number }).__codematicaPassiveFlashcardRandom =
      () => 0.999999;
  });

  await page.goto("/paths");
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

test("@regression mobile user studies PostgreSQL HOT updates and completes the questionnaire", async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __codematicaQuestionnaireRandom?: () => number; __codematicaPassiveFlashcardRandom?: () => number }).__codematicaQuestionnaireRandom =
      () => 0.99;
    (window as Window & { __codematicaQuestionnaireRandom?: () => number; __codematicaPassiveFlashcardRandom?: () => number }).__codematicaPassiveFlashcardRandom =
      () => 0.999999;
  });

  await page.goto("/paths/database-indexes-and-search");
  await expect(page.getByTestId("path-detail")).toBeVisible();
  await expect(page.getByTestId("path-node-document-databases-postgres-hot-updates")).toContainText("Heap-Only Tuple (HOT) Updates");

  await page.getByTestId("path-node-document-databases-postgres-hot-updates").click();
  await expect(page).toHaveURL(/\/docs\/databases\/postgres-hot-updates\?path=database-indexes-and-search/);
  await expect(page.getByRole("heading", { name: "Heap-Only Tuple (HOT) Updates In PostgreSQL" })).toBeVisible();
  await expect(page.getByTestId("markdown-renderer")).toContainText("n_tup_hot_upd");
  await expect(page.getByTestId("markdown-renderer")).toContainText("BRIN summarizing index on PostgreSQL 16+");
  await expect(page.getByTestId("document-next-node")).toHaveAttribute(
    "href",
    "/practice/databases/postgres-hot-updates-questionnaire?path=database-indexes-and-search",
  );

  await page.goto("/browse");
  await page.getByTestId("knowledge-search-input").fill("heap-only tuple");
  await expect(page.getByTestId("search-results")).toContainText("Heap-Only Tuple (HOT) Updates In PostgreSQL");

  await page.goto("/practice/databases/postgres-hot-updates-questionnaire?path=database-indexes-and-search");
  await expect(page.getByRole("heading", { name: "PostgreSQL HOT Updates Questionnaire" })).toBeVisible();
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 1 of 6");
  await page.getByLabel(/changes only columns not referenced by regular indexes/i).check();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 2 of 6");
  await page.getByTestId("questionnaire-cloze-answer-input").fill("same heap page");
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 3 of 6");
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 4 of 6");
  await page.getByTestId("questionnaire-match-include").click();
  await page.getByRole("option", { name: "blocks HOT via payload" }).click();
  await page.getByTestId("questionnaire-match-expression").click();
  await page.getByRole("option", { name: "blocks HOT via expression" }).click();
  await page.getByTestId("questionnaire-match-brin").click();
  await page.getByRole("option", { name: "can remain eligible" }).click();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 5 of 6");
  await page.getByLabel(/reserves future same-page update room/i).check();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 6 of 6");
  await page.getByLabel(/Eligible updates often avoid new regular-index entries/i).check();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-finish").click();
  await expect(page.getByTestId("questionnaire-complete")).toContainText("Refresh complete");

  await page.goto("/paths/database-indexes-and-search/flashcards");
  await expect(page.getByTestId("passive-flashcard-feed")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("passive-flashcard-card-11").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("passive-flashcard-card-23")).toBeAttached();
  await page.getByTestId("passive-flashcard-card-23").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("passive-flashcard-card-32")).toContainText("HOT Needs Two Conditions");
});
