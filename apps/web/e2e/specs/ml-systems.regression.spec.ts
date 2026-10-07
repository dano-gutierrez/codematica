import { expect, test } from "@playwright/test";

test("@regression follows the source-linked ML Systems path into a guided lab", async ({ page }) => {
  await page.goto("/paths/ml-systems-engineer");
  await expect(page.getByTestId("path-detail")).toBeVisible();
  await expect(page.getByRole("heading", { name: "ML Systems Engineer — Harvard CS249r" })).toBeVisible();
  await expect(page.getByTestId("path-progression-roadmap")).toContainText("Scientific Computing Apprentice");
  await expect(page.getByTestId("path-progression-roadmap")).toContainText("Framework Builder");
  await expect(page.getByTestId("path-progression-roadmap")).toContainText("planned");

  const companion = page.getByTestId("path-node-source-ml-systems-ai-engineering-introduction");
  await expect(companion).toContainText("Source + document");
  await companion.click();
  await expect(page).toHaveURL(/\/docs\/ml-systems\/ai-engineering-introduction\?path=ml-systems-engineer/);
  await expect(page.getByTestId("source-references")).toContainText("Volume I — Introduction");
  await expect(page.getByTestId("source-references").getByRole("link")).toHaveAttribute("href", "https://mlsysbook.ai/vol1/introduction/introduction.html");

  await page.getByTestId("document-next-node").click();
  await expect(page).toHaveURL(/\/practice\/ml-systems\/ai-triad-guided-lab\?path=ml-systems-engineer/);
  await expect(page.getByTestId("guided-lab-session")).toBeVisible();
  await expect(page.getByTestId("source-references")).toContainText("CS249r Interactive Labs");

  await page.getByLabel("Audit data freshness and population shift").check();
  await page.getByLabel("Observations are separated from hypotheses").check();
  await page.getByLabel("All three D–A–M axes are considered").check();
  await page.getByLabel("The next action has an explicit decision rule").check();
  await expect(page.getByTestId("guided-lab-complete")).toBeEnabled();
  await page.getByTestId("guided-lab-complete").click();
  await expect(page.getByRole("link", { name: "Next activity" })).toBeVisible();
});

test("@regression completes the neural companion checkpoint without completing its planned stage", async ({ page }) => {
  await page.goto("/paths/ml-systems-engineer");
  const companion = page.getByTestId("path-node-source-ml-systems-neural-computation");
  await expect(companion).toContainText("Source + document");
  await companion.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Neural Computation — Check A Gradient Before Training");
  await expect(page.getByTestId("source-references")).toContainText("Understanding Deep Learning");
  await page.getByTestId("document-next-node").click();
  await expect(page).toHaveURL(/neural-computation-checkpoint\?path=ml-systems-engineer/);

  const answers = [
    "The optimizer has not applied an update.",
    "Only the weight tensor payload under the stated representation.",
    "Check the derivative, objective and epsilon on a small deterministic case.",
  ];
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");
  const correctAnswer = answers.map(answer => page.getByRole("radio", { name: answer, exact: true })).reduce((a, b) => a.or(b));
  for (let index = 0; index < answers.length; index++) {
    await expect(page.getByText(`Question ${index + 1} of 3`, { exact: true })).toBeVisible();
    await expect(correctAnswer).toHaveCount(1);
    await correctAnswer.check();
    await page.getByRole("button", { name: "Check answer", exact: true }).click();
    await expect(page.getByText("Correct", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: index === 2 ? "Finish" : "Next", exact: true }).click();
  }
  await expect(page.getByText("Score 100%", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Next activity" })).toHaveAttribute("href", "https://mlsysbook.ai/vol1/nn_architectures/nn_architectures.html");
  await page.goto("/paths/ml-systems-engineer");
  await expect(page.getByTestId("path-progression-roadmap")).toContainText("Framework Builder");
  await expect(page.getByTestId("path-progression-roadmap")).toContainText("planned");
});

test("@regression reads a case-study claim record without certifying the external index", async ({ page }) => {
  await page.goto("/docs/ml-systems/ml-workflow?path=ml-systems-engineer");
  await expect(page.getByRole("heading", { name:"Review a case study as a claim",exact:true })).toBeVisible();
  const sources = page.getByTestId("source-references");
  await expect(sources).toContainText("Volume I — ML Workflow");
  await expect(sources).toContainText("A Curated List of ML System Design Case Studies");
  await expect(sources.getByRole("link",{name:"A Curated List of ML System Design Case Studies"})).toHaveAttribute("href","https://github.com/Engineer1999/A-Curated-List-of-ML-System-Design-Case-Studies/tree/1da84a9dc996d857fe63d1f1609fad6caa17f8cb");
  await expect(page.getByTestId("markdown-renderer")).toContainText("reported outcomes were not independently verified");
  await expect(page.getByTestId("markdown-renderer")).toContainText("Write unknown when omitted");
});
