import { expect, test } from "@playwright/test";

test("@regression mobile user searches Python docs and completes a deterministic questionnaire attempt", async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __codematicaQuestionnaireRandom?: () => number }).__codematicaQuestionnaireRandom = () => 0.99;
  });

  await page.goto("/");
  await expect(page.getByTestId("path-card-python-for-ts-js-engineers")).toContainText("Python For TypeScript And JavaScript Engineers");

  await page.getByTestId("path-card-python-for-ts-js-engineers").getByRole("link", { name: /Open path/i }).click();
  await expect(page.getByTestId("path-detail")).toBeVisible();
  await expect(page.getByTestId("path-node-exercise-programming-python-runtime-questionnaire")).toContainText("Questionnaire");

  await page.getByTestId("path-node-document-programming-python-runtime-model").click();
  await expect(page.getByTestId("document-page")).toBeVisible();
  await expect(page).toHaveURL(/\/docs\/programming\/python-runtime-model\?path=python-for-ts-js-engineers/);
  await expect(page.getByTestId("document-next-node")).toHaveAttribute("href", "/practice/programming/python-runtime-questionnaire?path=python-for-ts-js-engineers");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByTestId("path-detail")).toBeVisible();

  await page.goto("/browse");
  await expect(page.getByTestId("content-library-paths-link")).toBeVisible();
  await page.getByTestId("knowledge-search-input").fill("pyproject.toml");
  await expect(page.getByTestId("search-results")).toContainText("Python Packaging And Environments");

  await page.goto("/paths/python-for-ts-js-engineers");
  await page.getByTestId("path-node-exercise-programming-python-runtime-questionnaire").click();
  await expect(page.getByTestId("practice-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Python Runtime Model Questionnaire" })).toBeVisible();
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 1 of 10");
  await page.getByLabel(/Both names are bound to the same object/i).check();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 2 of 10");
  await page.getByTestId("questionnaire-cloze-answer-input").fill("None");
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 3 of 10");
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 4 of 10");
  await page.getByTestId("questionnaire-match-none").click();
  await page.getByRole("option", { name: "null-like singleton" }).click();
  await page.getByTestId("questionnaire-match-dict").click();
  await page.getByRole("option", { name: "plain object or Map depending on key needs" }).click();
  await page.getByTestId("questionnaire-match-with").click();
  await page.getByRole("option", { name: "scoped try/finally cleanup" }).click();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 5 of 10");
  await page.getByLabel(/Separate absence with is None/i).check();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 6 of 10");
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 7 of 10");
  await page.getByLabel(/one-shot iterators/i).check();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 8 of 10");
  await page.getByTestId("questionnaire-cloze-answer-input").fill("I/O");
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 9 of 10");
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 10 of 10");
  await page.getByTestId("questionnaire-match-descriptor").click();
  await page.getByRole("option", { name: "field-looking access can execute code" }).click();
  await page.getByTestId("questionnaire-match-exception-chain").click();
  await page.getByRole("option", { name: "domain error preserves operational cause" }).click();
  await page.getByTestId("questionnaire-match-cycle").click();
  await page.getByRole("option", { name: "module boundaries or import-time wiring may be wrong" }).click();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-finish").click();

  await expect(page.getByTestId("questionnaire-complete")).toContainText("Refresh complete");
  await page.getByRole("link", { name: /Next node/i }).click();
  await expect(page.getByTestId("document-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Python Types And Contracts For TypeScript Engineers" })).toBeVisible();
});

test("@regression mobile Python path opens interview practice with path-aware next node", async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });

  await page.goto("/paths/python-for-ts-js-engineers");
  await expect(page.getByText("Python Interview Practice")).toBeVisible();

  const firstInterviewNode = page.getByTestId("path-node-interview-amazon-lru-cache");
  await expect(firstInterviewNode).toContainText("Interview problem");
  await firstInterviewNode.click();

  await expect(page).toHaveURL(/\/interviews\/amazon\/lru-cache\?path=python-for-ts-js-engineers/);
  await expect(page.getByTestId("interview-question-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "LRU Cache" })).toBeVisible();
  await expect(page.getByTestId("interview-question-session")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("interview-solution-track")).toContainText("Hash Map Plus Recency List");
  await expect(page.getByRole("link", { name: /Next node/i })).toHaveCount(0);

  await page.getByRole("button", { name: /^Next$/ }).click();
  await expect(page.getByTestId("interview-step-position")).toContainText("Step 2 of 3");
  await page.getByRole("button", { name: /^Next$/ }).click();
  await expect(page.getByTestId("interview-step-position")).toContainText("Step 3 of 3");
  await page.getByRole("button", { name: /Show full explanation/i }).click();

  await expect(page.getByTestId("interview-code")).toContainText("class LRUCache");
  await expect(page.getByRole("link", { name: /Next node/i })).toHaveAttribute(
    "href",
    "/interviews/airbnb/in-memory-file-system?path=python-for-ts-js-engineers",
  );

  await page.getByRole("link", { name: /Next node/i }).click();
  await expect(page).toHaveURL(/\/interviews\/airbnb\/in-memory-file-system\?path=python-for-ts-js-engineers/);
  await expect(page.getByRole("heading", { name: "In-Memory File System" })).toBeVisible();
});

test("@regression mobile user opens the passive Python flashcard feed", async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __codematicaPassiveFlashcardRandom?: () => number }).__codematicaPassiveFlashcardRandom = () => 0.999999;
  });

  await page.goto("/paths/python-for-ts-js-engineers");
  await expect(page.getByTestId("path-flashcard-feed-link")).toBeVisible();
  await page.getByTestId("path-flashcard-feed-link").click();

  await expect(page).toHaveURL(/\/paths\/python-for-ts-js-engineers\/flashcards/);
  await expect(page.getByTestId("passive-flashcard-feed")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("passive-flashcard-card-0")).toContainText("Names Bind Objects");
  await expect(page.getByTestId("passive-flashcard-card-0")).toContainText("Python variables are names bound to objects");
  await expect(page.getByRole("button", { name: /Reveal answer/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Check answer/i })).toHaveCount(0);

  await page.getByTestId("passive-flashcard-feed").evaluate((element) => element.scrollBy({ top: window.innerHeight, behavior: "instant" }));
  await expect(page.getByTestId("passive-flashcard-card-1")).toBeInViewport();
});
