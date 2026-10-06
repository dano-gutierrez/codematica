import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const labSlug = "ml-systems/ai-triad-guided-lab";
const labRoute = `/practice/${labSlug}?path=ml-systems-engineer`;
const notePrompt = "Why is adding compute attractive even when it does not target the bottleneck?";

async function prepareLab(page: Page) {
  await page.getByLabel("Audit data freshness and population shift").check();
  await page.getByLabel("Observations are separated from hypotheses").check();
  await page.getByLabel("All three D–A–M axes are considered").check();
  await page.getByLabel("The next action has an explicit decision rule").check();
  await page.getByLabel(notePrompt).fill("Private working note");
}

test("@regression @design follows the source-linked ML Systems path into a guided lab and restarts", async ({ page }) => {
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
  await page.getByTestId("source-references-toggle").click();
  await expect(page.getByTestId("source-references").getByRole("link")).toHaveAttribute("href", "https://mlsysbook.ai/vol1/introduction/introduction.html");

  await page.getByTestId("document-next-node").click();
  await expect(page).toHaveURL(/\/practice\/ml-systems\/ai-triad-guided-lab\?path=ml-systems-engineer/);
  await expect(page.getByTestId("guided-lab-session")).toBeVisible();
  await expect(page.getByTestId("source-references")).toContainText("CS249r Interactive Labs");

  await prepareLab(page);
  await expect(page.getByTestId("guided-lab-complete")).toBeEnabled();
  await page.getByTestId("guided-lab-complete").click();
  await expect(page.getByRole("heading", { name: "Lab complete." })).toBeFocused();
  await expect(page.getByLabel(notePrompt)).toHaveValue("Private working note");
  await expect(page.getByRole("link", { name: "Next activity" })).toBeVisible();
  await page.getByRole("button", { name: "Practice again" }).click();
  await expect(page.getByLabel("Buy more GPUs")).toBeFocused();
  await expect(page.getByLabel(notePrompt)).toHaveValue("");
  await expect(page.getByLabel("Observations are separated from hypotheses")).not.toBeChecked();
  await expect(page.getByTestId("guided-lab-complete")).toBeDisabled();
});

test("@regression @design preserves guided-lab notes through a storage failure and retries completion", async ({ page }) => {
  await page.route("**/api/progress", route => route.fulfill({ status: 401, body: "{}" }));
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    let failed = false;
    Storage.prototype.setItem = function (key, value) {
      if (key === "codematica:anonymous-progress:v1" && !failed) {
        const rows = JSON.parse(value) as { input: { slug: string; status: string } }[];
        if (rows.some(row => row.input.slug === "ml-systems/ai-triad-guided-lab" && row.input.status === "completed")) {
          failed = true;
          throw new DOMException("Synthetic storage failure", "QuotaExceededError");
        }
      }
      return original.call(this, key, value);
    };
  });
  await page.goto(labRoute);
  await prepareLab(page);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("codematica:anonymous-progress:v1"))).toContain('"status":"started"');
  await page.getByTestId("guided-lab-complete").click();
  await expect(page.getByTestId("guided-lab-session").getByRole("alert")).toContainText("Your choices and working notes are still here.");
  await expect(page.getByLabel(notePrompt)).toHaveValue("Private working note");
  await expect(page.getByLabel("Audit data freshness and population shift")).toBeChecked();
  await expect(page.getByLabel("Observations are separated from hypotheses")).toBeChecked();
  await expect(page.getByRole("heading", { name: "Lab complete." })).toHaveCount(0);
  await page.getByRole("button", { name: "Retry completion" }).click();
  await expect(page.getByRole("heading", { name: "Lab complete." })).toBeFocused();
  const rows = await page.evaluate(() => JSON.parse(localStorage.getItem("codematica:anonymous-progress:v1") ?? "[]"));
  expect(rows.filter((row: { input: { slug: string } }) => row.input.slug === labSlug)).toMatchObject([
    { input: { pathSlug: "ml-systems-engineer", status: "completed", position: { predictionCommitted: true, evidenceCount: 3, evidenceTotal: 3 } } },
  ]);
  expect(JSON.stringify(rows)).not.toContain("Private working note");
});

for (const scale of ["100%", "200%"]) {
  test(`@regression @design guided-lab completion reflows at 320px with ${scale} text`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(labRoute);
    await page.evaluate(value => { document.documentElement.style.fontSize = value; }, scale);
    await prepareLab(page);
    await page.getByTestId("guided-lab-complete").click();
    await expect(page.getByRole("heading", { name: "Lab complete." })).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).include("main").analyze()).violations).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`guided-lab-complete-${scale}.png`), fullPage: true });
  });
}
