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

test("@regression reads original array contracts and completes their terminal checkpoint", async ({ page }) => {
  await page.goto("/paths/coding-interview-pattern-practice");
  await expect(page.getByTestId("path-node-document-programming-array-state-invariants")).toBeVisible();
  await page.getByTestId("path-node-interview-uber-shortest-path-weighted-road-graph").click();
  const session = page.getByTestId("interview-question-session");
  await expect(page.getByTestId("interview-next-node")).toHaveCount(0);
  await session.getByRole("button", { name: "Next", exact: true }).click();
  await session.getByRole("button", { name: "Next", exact: true }).click();
  await session.getByRole("button", { name: "Show full explanation", exact: true }).click();
  await expect(page.getByTestId("interview-final-explanation")).toBeVisible();
  await expect(page.getByTestId("interview-next-node")).toHaveAttribute("href", "/docs/programming/array-state-invariants?path=coding-interview-pattern-practice");
  await page.getByTestId("interview-next-node").click();
  await expect(page).toHaveURL("/docs/programming/array-state-invariants?path=coding-interview-pattern-practice");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Array State Reviews — Define The Invariant Before The Pattern");
  for (const heading of ["Retain the best nonempty segment", "Place only values with a valid slot", "Wait for a strictly greater value"]) await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  await page.getByTestId("document-next-node").click();
  await expect(page).toHaveURL("/practice/programming/array-state-checkpoint?path=coding-interview-pattern-practice");
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");
  const answers = [
    "Return sum -2 with the nonempty segment [1, 2); zero would violate this contract.",
    "Return (0, 0, 1): earliest start, then earliest exclusive end.",
    "Reject duplicate values before swaps; the unique 0..n domain is part of the contract.",
    "Return [2, 2, None]; equal values stay pending until a strictly greater value appears.",
  ];
  const correct = answers.map(answer => page.getByRole("radio", { name: answer, exact: true })).reduce((first, second) => first.or(second));
  for (let index = 0; index < answers.length; index++) {
    await expect(page.getByText(`Question ${index + 1} of ${answers.length}`, { exact: true })).toBeVisible();
    await expect(correct).toHaveCount(1);
    await correct.check();
    await page.getByRole("button", { name: "Check answer", exact: true }).click();
    await expect(page.getByText("Correct", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: index === answers.length - 1 ? "Finish" : "Next", exact: true }).click();
  }
  await expect(page.getByText("Score 100%", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Next activity" })).toHaveCount(0);
});
