import { expect, test } from "@playwright/test";

test("@regression follows existing coding patterns through an explanation to the next question", async ({ page }) => {
  await page.goto("/paths/coding-interview-pattern-practice");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Coding Interview Pattern Practice");
  await expect(page.getByText(/Backtracking and comprehensive dynamic programming are outside this path/)).toBeVisible();
  await page.getByTestId("path-node-interview-amazon-two-sum-product-pair").click();
  await expect(page).toHaveURL(/two-sum-product-pair\?path=coding-interview-pattern-practice/);
  await expect(page.getByTestId("interview-next-node")).toHaveCount(0);
  const session = page.getByTestId("interview-question-session");
  await session.getByRole("button", { name: "Next", exact: true }).click();
  await session.getByRole("button", { name: "Next", exact: true }).click();
  await session.getByRole("button", { name: "Show full explanation", exact: true }).click();
  await expect(page.getByTestId("interview-final-explanation")).toBeVisible();
  await expect(page.getByTestId("interview-next-node")).toHaveAttribute("href", "/interviews/apple/validate-parentheses-stream?path=coding-interview-pattern-practice");
  await page.getByTestId("interview-next-node").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Validate Parentheses Stream");
  await expect(page.getByTestId("interview-step-position")).toContainText("Step 1");
  await expect(page.getByTestId("interview-next-node")).toHaveCount(0);
});

test("@regression keeps standalone coding walkthroughs independent of path continuation", async ({ page }) => {
  await page.goto("/interviews/amazon/two-sum-product-pair");
  const session = page.getByTestId("interview-question-session");
  await session.getByRole("button", { name: "Next", exact: true }).click();
  await session.getByRole("button", { name: "Next", exact: true }).click();
  await session.getByRole("button", { name: "Show full explanation", exact: true }).click();
  await expect(page.getByTestId("interview-final-explanation")).toBeVisible();
  await expect(page.getByTestId("interview-next-node")).toHaveCount(0);
});

for (const path of ["__proto__", "toString"]) {
  test(`@regression ignores inherited path key ${path} after the coding explanation`, async ({ page }) => {
    await page.goto(`/interviews/amazon/two-sum-product-pair?path=${path}`);
    const session = page.getByTestId("interview-question-session");
    await session.getByRole("button", { name: "Next", exact: true }).click();
    await session.getByRole("button", { name: "Next", exact: true }).click();
    await session.getByRole("button", { name: "Show full explanation", exact: true }).click();
    await expect(page.getByTestId("interview-final-explanation")).toBeVisible();
    await expect(page.getByTestId("interview-next-node")).toHaveCount(0);
  });
}
