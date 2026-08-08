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
  await expect(page.getByRole("link", { name: "Next node" })).toBeVisible();
});
