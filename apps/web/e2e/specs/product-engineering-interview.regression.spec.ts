import { expect, test } from "@playwright/test";

const pathSlug = "product-engineering-interview";
const prefix = "software-engineering/product-interview-";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __codematicaQuestionnaireRandom?: () => number }).__codematicaQuestionnaireRandom = () => 0.999999;
  });
});

test("@regression discovers Product Engineering research, reads the design, and completes the mock evidence", async ({ page }) => {
  await page.goto("/browse");
  await page.getByTestId("knowledge-search-input").fill("Product Engineering");
  await expect(page.getByTestId("search-results")).toContainText("Product Engineering Interview Research and Preparation Brief");
  await page.goto("/paths");
  await page.getByTestId(`path-card-${pathSlug}`).getByRole("link", { name: /Open path/i }).click();
  await page.getByTestId("path-node-document-software-engineering-product-interview-research-brief").click();
  await expect(page.getByTestId("markdown-renderer")).toContainText("It contains no reported company questions.");
  await expect(page.getByTestId("source-references")).toContainText("Monitoring Distributed Systems");
  await expect(page.getByTestId("document-next-node")).toHaveAttribute("href", `/docs/${prefix}javascript-preview-coordinator?path=${pathSlug}`);

  await page.goto(`/docs/${prefix}durable-generation-architecture?path=${pathSlug}`);
  await expect(page.getByTestId("mermaid-diagram")).toHaveCount(2);
  await expect(page.getByTestId("mermaid-error")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto(`/docs/${prefix}mock-interview?path=${pathSlug}`);
  await page.getByTestId("document-next-node").click();
  await expect(page.getByTestId("guided-lab-session")).toBeVisible();
  await expect(page.getByTestId("guided-lab-complete")).toBeDisabled();
  await page.getByLabel("A retry repeats an uncertain provider or billing effect.", { exact: true }).check();
  const evidence = [
    "I separated replaceable preview intents from durable accepted exports.",
    "I demonstrated stale success, stale error, and disposal with controlled promises.",
    "I proved a failed generation releases its slot and stated the never-settles limit.",
    "I drew atomic job, reservation, and outbox acceptance.",
    "I traced an unknown provider outcome without claiming exactly-once effects.",
    "I explained versioned reconnect recovery and workspace authorization.",
    "I defined user-facing signals and evidence needed to confirm recovery.",
    "I rehearsed two factual ownership stories and scored all six rubric dimensions.",
  ];
  for (const label of evidence) await page.getByLabel(label, { exact: true }).check();
  await expect(page.getByTestId("guided-lab-complete")).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("product-interview-mock-mobile.png"), fullPage: true });
  await page.getByTestId("guided-lab-complete").click();
  await page.getByRole("link", { name: "Next activity", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/practice/${prefix}mock-interview-questionnaire\\?path=${pathSlug}`));
  await page.reload();
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");
});

test("@regression reviews a wrong Product Engineering coding answer, finishes the checkpoint, and opens review", async ({ page }) => {
  await page.goto(`/docs/${prefix}javascript-preview-coordinator?path=${pathSlug}`);
  await expect(page.getByTestId("markdown-renderer")).toContainText("function createPreviewCoordinator");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByTestId("document-next-node").click();
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");
  await page.getByLabel("Run B and C immediately in parallel.", { exact: true }).check();
  await page.getByTestId("questionnaire-check").click();
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("Review this");
  await expect(page.getByTestId("questionnaire-feedback")).toContainText("The bounded pending slot retains only C");
  await page.getByTestId("questionnaire-next").click();
  const answers = [
    "A disposed/revision guard before every UI callback.",
    "Suppress A’s obsolete error and continue with B.",
    "The baseline blocks; a timeout alone does not prove remote work stopped.",
    "An immutable input snapshot or stable revision reference.",
    "No; accepted exports need durable identity and completion tracking.",
  ];
  for (const [index, answer] of answers.entries()) {
    await page.getByLabel(answer, { exact: true }).check();
    await page.getByTestId("questionnaire-check").click();
    await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
    await page.getByTestId(index === answers.length - 1 ? "questionnaire-finish" : "questionnaire-next").click();
  }
  await expect(page.getByTestId("questionnaire-complete")).toBeVisible();
  await page.getByRole("link", { name: "Next activity", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/docs/${prefix}durable-generation-architecture\\?path=${pathSlug}`));
  await page.goto(`/paths/${pathSlug}`);
  await page.getByTestId("path-flashcard-feed-link").click();
  await expect(page.getByTestId("passive-flashcard-feed")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("passive-flashcard-card-0")).toBeVisible();
});
