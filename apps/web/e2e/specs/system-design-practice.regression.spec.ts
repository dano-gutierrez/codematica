import { expect, test } from "@playwright/test";

const cases = [
  {
    slug: "scaling-decision-worksheet",
    title: "Scaling Decisions — Measure The Constraint First",
    source: "Handling Overload",
    checkpoint: "scaling-decision-checkpoint",
    answers: [
      "240 requests, using the stated average and stable-workload assumptions.",
      "More application capacity; database behavior still needs measurement and bounded concurrency.",
      "The logical table is divided into partitions; distributed ownership is a separate design.",
      "Workload, prediction, controlled change, success/rollback conditions and observed result.",
    ],
    next: "/docs/system-design/cors-csrf-and-authorization?path=system-design-fundamentals",
  },
  {
    slug: "cors-csrf-and-authorization",
    title: "CORS, CSRF And Authorization — Three Different Checks",
    source: "Fetch — CORS Protocol",
    checkpoint: "api-boundary-checkpoint",
    answers: [
      "The server may already have changed state; inspect server evidence.",
      "It does not send that guarded operation after this failed preflight.",
      "Check authorization for that actor, object and operation.",
      "Whether the browser’s actual cookie and request policies permit the credentials to be sent.",
    ],
  },
];

for (const scenario of cases) {
  test(`@regression follows ${scenario.slug} into its scored path checkpoint`, async ({ page }) => {
    await page.goto("/paths/system-design-fundamentals");
    await page.getByTestId(`path-node-document-system-design-${scenario.slug}`).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(scenario.title);
    await expect(page.getByTestId("source-references")).toContainText(scenario.source);
    await page.getByTestId("document-next-node").click();
    await expect(page).toHaveURL(new RegExp(`${scenario.checkpoint}\\?path=system-design-fundamentals`));
    await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");
    const correctAnswer = scenario.answers.map(answer => page.getByRole("radio", { name: answer, exact: true })).reduce((a, b) => a.or(b));
    for (let index = 0; index < scenario.answers.length; index++) {
      await expect(page.getByText(`Question ${index + 1} of 4`, { exact: true })).toBeVisible();
      await expect(correctAnswer).toHaveCount(1);
      await correctAnswer.check();
      await page.getByRole("button", { name: "Check answer", exact: true }).click();
      await expect(page.getByText("Correct", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: index === 3 ? "Finish" : "Next", exact: true }).click();
    }
    await expect(page.getByText("Score 100%", { exact: true })).toBeVisible();
    if (scenario.next) await expect(page.getByRole("link", { name: "Next activity" })).toHaveAttribute("href", scenario.next);
  });
}
