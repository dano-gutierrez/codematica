import { expect, test } from "@playwright/test";

test("@regression mobile user studies Langfuse tracing and opens the AI flashcard feed", async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __codematicaQuestionnaireRandom?: () => number; __codematicaPassiveFlashcardRandom?: () => number }).__codematicaQuestionnaireRandom =
      () => 0.99;
    (window as Window & { __codematicaQuestionnaireRandom?: () => number; __codematicaPassiveFlashcardRandom?: () => number }).__codematicaPassiveFlashcardRandom =
      () => 0.999999;
  });

  await page.goto("/paths");
  await expect(page.getByTestId("path-card-ai-engineering-langfuse-langchain")).toContainText("Langfuse And LangChain AI Engineering");

  await page.getByTestId("path-card-ai-engineering-langfuse-langchain").getByRole("link", { name: /Open path/i }).click();
  await expect(page.getByTestId("path-detail")).toBeVisible();
  await expect(page.getByTestId("path-node-document-ai-engineering-langfuse-tracing-fundamentals")).toContainText("Langfuse Tracing");

  await page.getByTestId("path-node-document-ai-engineering-langfuse-tracing-fundamentals").click();
  await expect(page.getByTestId("document-page")).toBeVisible();
  await expect(page).toHaveURL(/\/docs\/ai-engineering\/langfuse-tracing-fundamentals\?path=ai-engineering-langfuse-langchain/);
  await expect(page.getByRole("heading", { name: "Langfuse Tracing Fundamentals" })).toBeVisible();
  await expect(page.getByTestId("markdown-renderer")).toContainText("Trace Design Lens");
  await expect(page.getByTestId("document-next-node")).toHaveAttribute(
    "href",
    "/diagrams/ai-engineering/langfuse-trace-lifecycle?path=ai-engineering-langfuse-langchain",
  );

  await page.goto("/practice/ai-engineering/langfuse-tracing-questionnaire?path=ai-engineering-langfuse-langchain");
  await expect(page.getByTestId("practice-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Langfuse Tracing Questionnaire" })).toBeVisible();
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 1 of 4");
  await page.getByLabel(/A trace groups one user or system interaction/i).check();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 2 of 4");
  await page.getByTestId("questionnaire-cloze-answer-input").fill("span");
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 3 of 4");
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await page.getByTestId("questionnaire-next").click();

  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 4 of 4");
  await page.getByTestId("questionnaire-match-trace").click();
  await page.getByRole("option", { name: "full request or task timeline" }).click();
  await page.getByTestId("questionnaire-match-generation").click();
  await page.getByRole("option", { name: "model call with prompt, response, usage, and model metadata" }).click();
  await page.getByTestId("questionnaire-match-session").click();
  await page.getByRole("option", { name: "multi-turn user journey across traces" }).click();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");

  await page.goto("/paths/ai-engineering-langfuse-langchain");
  await page.getByTestId("path-flashcard-feed-link").click();
  await expect(page).toHaveURL(/\/paths\/ai-engineering-langfuse-langchain\/flashcards/);
  await expect(page.getByTestId("passive-flashcard-feed")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("passive-flashcard-card-0")).toContainText("AI Product Loop");
});
