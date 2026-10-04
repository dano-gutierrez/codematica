import { expect, test } from "@playwright/test";

test("@regression reuses durable architecture in the backend path and completes retry practice", async ({ page }) => {
  await page.goto("/paths/backend-engineer-readiness");
  await page.getByTestId("path-node-document-software-engineering-product-interview-durable-generation-architecture").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Product Engineering Architecture Drill — Durable Generation and Revenue Safety");
  await expect(page.getByRole("heading", { name: "Optional lab: duplicate delivery versus one local effect", exact: true })).toBeVisible();
  await expect(page.getByTestId("source-references")).toContainText("SQLite");
  await page.getByTestId("document-next-node").click();
  await expect(page).toHaveURL(/durable-retry-lab-checkpoint\?path=backend-engineer-readiness/);
  await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");
  const answers = [
    "Neither the debit nor its receipt committed.",
    "The same scoped operation identity and a matching request; return its stored result.",
    "Its stored result of 90; current balance is a separate query.",
    "These local atomicity and retry cases pass; provider effects and database throughput need separate evidence.",
  ];
  const correctAnswer = answers.map(answer => page.getByRole("radio", { name: answer, exact: true })).reduce((a, b) => a.or(b));
  for (let index = 0; index < answers.length; index++) {
    await expect(page.getByText(`Question ${index + 1} of 4`, { exact: true })).toBeVisible();
    await expect(correctAnswer).toHaveCount(1);
    await correctAnswer.check();
    await page.getByRole("button", { name: "Check answer", exact: true }).click();
    await expect(page.getByText("Correct", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: index === 3 ? "Finish" : "Next", exact: true }).click();
  }
  await expect(page.getByText("Score 100%", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Next activity" })).toHaveAttribute("href", "/docs/system-design/fair-admission-and-reservations?path=backend-engineer-readiness");
  await page.getByRole("link", { name: "Next activity" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fair Admission And Reservations — Separate Policy From Ownership");
});
