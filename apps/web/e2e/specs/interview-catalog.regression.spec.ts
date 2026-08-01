import { expect, test } from "@playwright/test";

test("@regression opens the interview catalog and completes a guided coding walkthrough", async ({ page }) => {
  await test.step("open the catalog and use random question navigation", async () => {
    await page.goto("/interviews");
    await expect(page.getByTestId("interview-catalog")).toBeVisible();
    await expect(page.getByTestId("interview-company-card-amazon")).toContainText("Amazon");
    await expect(page.getByTestId("interview-company-logo-amazon").first()).toBeVisible();
    await page.getByTestId("interview-random-button").click();
    await expect(page.getByTestId("interview-question-page")).toBeVisible();
    await expect(page.getByTestId("interview-question-session")).toBeVisible();
  });

  await test.step("open a known company question", async () => {
    await page.goto("/interviews/amazon");
    await expect(page.getByTestId("interview-company-page")).toBeVisible();
    await expect(page.getByTestId("interview-question-list")).toContainText("Two Sum Product Pair");
    await page.getByTestId("interview-question-card-two-sum-product-pair").click();
    await expect(page.getByTestId("interview-question-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Two Sum Product Pair" })).toBeVisible();
  });

  await test.step("advance the guided solution and switch language", async () => {
    const session = page.getByTestId("interview-question-session");
    await expect(page.getByTestId("interview-step-position")).toContainText("Step 1");
    await session.getByRole("button", { name: "Next" }).click();
    await expect(page.getByTestId("interview-step-position")).toContainText("Step 2");
    await session.getByRole("button", { name: "Next" }).click();
    await expect(page.getByTestId("interview-step-position")).toContainText("Step 3");
    await page.getByLabel("Solution language").selectOption("java");
    await session.getByRole("button", { name: /Show full explanation/i }).click();
    await expect(page.getByTestId("interview-final-explanation")).toContainText("works");
    await expect(page.getByTestId("interview-code")).toContainText("int[]");
  });
});

test("@regression explores the anonymous Mondrian interview and runs all web solutions", async ({ page }) => {
  test.setTimeout(120_000);
  await test.step("open the real-world collection", async () => {
    await page.goto("/interviews");
    await expect(page.getByTestId("real-world-interviews-section")).toContainText("Real-world interviews");
    await expect(page.getByTestId("company-interviews-section")).toContainText("Company interview prep");
    await page.getByTestId("interview-collection-card-real-world").click();
    await expect(page.getByTestId("interview-collection-page")).toContainText("Anonymous real-world collection");
    await page.getByTestId("interview-question-card-mondrian-composition-generator").click();
  });

  await test.step("review the evaluation intent and red flags", async () => {
    await expect(page.getByRole("heading", { name: "Generate a Mondrian-style Composition" })).toBeVisible();
    await expect(page.getByTestId("interview-evaluation-guide")).toContainText("ambiguous visual request");
    await expect(page.getByRole("heading", { name: "Red flags and why they matter" })).toBeVisible();
    await expect(page.getByText("Hardcodes one painting")).toBeVisible();
  });

  await test.step("run and compare all three solutions", async () => {
    const preview = () => page.frameLocator('iframe[title="Sandpack Preview"]');
    await expect(page.getByTestId("web-solution-detail")).toContainText("Weighted CSS Grid");
    await expect(page.getByTestId("web-playground")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("web-playground-run").click({ force: true });
    await expect(preview().getByRole("img", { name: /generated composition/i })).toBeVisible({ timeout: 30_000 });

    await page.getByTestId("web-solution-tab-recursive-rectangular-subdivision").click({ force: true });
    await expect(page.getByTestId("web-solution-detail")).toContainText("Recursive Rectangular Subdivision");
    await expect(preview().getByRole("img", { name: /generated tree/i })).toBeVisible({ timeout: 30_000 });

    await page.getByTestId("web-solution-tab-responsive-svg-geometry").click({ force: true });
    await expect(page.getByTestId("web-solution-detail")).toContainText("Responsive SVG Geometry");
    await expect(preview().getByRole("img", { name: /generated SVG composition/i })).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("web-playground-reset").click({ force: true });
  });
});
