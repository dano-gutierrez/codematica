import { expect, test } from "@playwright/test";

test("@regression reads Mermaid examples, answers a single-correct-choice question, and opens scrolling review", async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __codematicaQuestionnaireRandom?: () => number }).__codematicaQuestionnaireRandom = () => 0.99;
    (window as Window & { __codematicaPassiveFlashcardRandom?: () => number }).__codematicaPassiveFlashcardRandom = () => 0.999999;
  });

  await page.goto("/paths/mermaid-diagram-authoring");
  await expect(page.getByTestId("path-detail")).toContainText("Reading And Writing Mermaid Diagrams");
  await page.getByTestId("path-node-document-programming-mermaid-syntax-fundamentals").click();

  await expect(page.getByTestId("document-page")).toContainText("Read A Mermaid Block In Three Layers");
  await expect(page.getByTestId("mermaid-block")).toHaveCount(3);
  await expect(page.getByTestId("mermaid-diagram")).toHaveCount(3);
  await expect(page.getByText("Source").first()).toBeVisible();

  await page.goto("/docs/programming/mermaid-software-diagrams?path=mermaid-diagram-authoring");
  await expect(page.getByTestId("mermaid-block")).toHaveCount(4);
  await expect(page.getByTestId("mermaid-diagram")).toHaveCount(4);
  await expect(page.getByTestId("mermaid-error")).toHaveCount(0);

  await page.goto("/docs/programming/mermaid-planning-and-data-diagrams?path=mermaid-diagram-authoring");
  await expect(page.getByTestId("mermaid-block")).toHaveCount(6);
  await expect(page.getByTestId("mermaid-diagram")).toHaveCount(6);
  await expect(page.getByTestId("mermaid-error")).toHaveCount(0);

  await page.goto("/practice/programming/mermaid-syntax-fundamentals-questionnaire?path=mermaid-diagram-authoring");
  await expect(page.getByTestId("questionnaire-position")).toContainText("Question 1 of 8");
  await expect(page.getByRole("radio")).toHaveCount(3);
  await page.getByLabel("flowchart LR").check();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Incorrect options:");

  await page.goto("/paths/mermaid-diagram-authoring/flashcards");
  await expect(page.getByTestId("passive-flashcard-feed")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("passive-flashcard-card-0")).toContainText("Declaration Comes First");
});
