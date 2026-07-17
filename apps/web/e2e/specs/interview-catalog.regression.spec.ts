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
