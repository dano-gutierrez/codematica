import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __codematicaQuestionnaireRandom?: () => number }).__codematicaQuestionnaireRandom = () => 0.999999;
    (window as Window & { __codematicaPassiveFlashcardRandom?: () => number }).__codematicaPassiveFlashcardRandom = () => 0.999999;
  });
});

test("@regression discovers the FDE role path and continues from its first checkpoint", async ({ page }) => {
  await page.goto("/paths");
  await page.getByTestId("path-card-forward-deployed-engineer").getByRole("link", { name: /Open path/i }).click();
  await expect(page.getByTestId("path-detail")).toContainText("Forward Deployed Engineer (FDE)");
  await page.getByTestId("path-node-document-fde-role-and-transition").click();
  await expect(page.getByTestId("markdown-renderer")).toContainText("Frontend and mobile");
  await expect(page.getByTestId("source-references")).toContainText("OpenAI");
  await page.getByTestId("document-next-node").click();
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");
  const answers = [
    "Workflow fit, reasons for non-use and the intended operational outcome.",
    "Build and test a small tenant-aware API, SQL query and fake connector.",
    "Who writes production code, owns rollout and supports the customer afterward?",
    "I completed curriculum assessments and can show separate project evidence.",
  ];
  for (const [index, answer] of answers.entries()) {
    await page.getByLabel(answer, { exact: true }).check();
    await page.getByTestId("questionnaire-check").click();
    await expect(page.getByTestId("questionnaire-feedback")).toContainText("Correct");
    await page.getByTestId(index === answers.length - 1 ? "questionnaire-finish" : "questionnaire-next").click();
  }
  await expect(page.getByTestId("questionnaire-complete")).toBeVisible();
  await expect(page.getByRole("link", { name: "Next activity" })).toHaveAttribute("href", "/docs/fde/discovery-and-domain?path=forward-deployed-engineer");
});

test("@regression the FDE discovery lab requires evidence and keeps ordered continuation", async ({ page }) => {
  await page.goto("/docs/fde/discovery-and-domain?path=forward-deployed-engineer");
  await page.getByTestId("document-next-node").click();
  await expect(page).toHaveURL(/\/practice\/fde\/discovery-lab\?path=forward-deployed-engineer/);
  await expect(page.getByTestId("guided-lab-complete")).toBeDisabled();
  await page.getByLabel("Data access and workflow ownership.", { exact: true }).check();
  for (const label of [
    "I recorded observations separately from assumptions.",
    "I named data, decision and operational owners.",
    "I defined one bounded workflow and its exclusions.",
    "I captured a baseline plan and customer playback corrections.",
  ]) await page.getByLabel(label, { exact: true }).check();
  await page.getByTestId("guided-lab-complete").click();
  await expect(page.getByRole("link", { name: "Next activity" })).toHaveAttribute("href", "/practice/fde/discovery-and-domain-checkpoint?path=forward-deployed-engineer");
});

test("@regression reads sourced FDE cases and finishes into passive review", async ({ page }) => {
  await page.goto("/docs/fde/case-studies?path=forward-deployed-engineer");
  await expect(page.getByTestId("markdown-renderer")).toContainText("vendor-reported");
  await page.getByTestId("source-references-toggle").click();
  await expect(page.getByTestId("source-references").getByRole("link", { name: /Morgan Stanley/ })).toHaveAttribute("href", "https://openai.com/index/morgan-stanley/");
  await expect(page.getByTestId("markdown-renderer")).toContainText("Two fictional failure studies");
  await page.goto("/practice/fde/career-launch-checkpoint?path=forward-deployed-engineer");
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");
  for (const [index, answer] of [
    "Run the stack, map owners, shadow a deployment and reproduce a known issue.",
    "Verify the current arrangements with the hiring team and concrete deployment examples.",
    "Work you are authorized to share, with synthetic replacements for private material.",
    "Choose a demonstrated technical gap and a customer-facing gap for focused practice.",
  ].entries()) {
    await page.getByLabel(answer, { exact: true }).check();
    await page.getByTestId("questionnaire-check").click();
    await page.getByTestId(index === 3 ? "questionnaire-finish" : "questionnaire-next").click();
  }
  const next = page.getByRole("link", { name: "Start review feed" });
  await expect(next).toHaveAttribute("href", "/paths/forward-deployed-engineer/flashcards");
  await next.click();
  await expect(page.getByTestId("passive-flashcard-feed")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("passive-flashcard-card-0")).toContainText("operators still use their spreadsheet");
});
