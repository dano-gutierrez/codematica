import { expect, test } from "@playwright/test";
const cases = [
  {
    slug: "concurrency-boundaries",
    title: "Concurrency — Protect Transitions And Own Waiting",
    checkpoint: "concurrency-boundary-checkpoint",
    headings: [
      "Separate progress from simultaneous execution",
      "Protect the whole transition",
      "Wait for state, not a notification",
      "Account for permit ownership",
      "Name the lifetime and coordination scope",
    ],
    sources: [
      "Python 3.13 — Conditions, Permits And Build Scope",
      "Java SE 17 — JVM Thread States",
      "Java SE 17 — Ordering Versus Compound Atomicity",
    ],
    answers: [
      "The trace can finish at 1; protect the whole read-modify-write transition.",
      "Recheck the predicate under the reacquired condition lock; notification is not a reserved item.",
      "Do not release: no permit was acquired, and unconditional release corrupts capacity accounting.",
      "RUNNABLE is a JVM state; it does not prove the thread currently owns a CPU.",
      "Use shared authoritative ownership and stale-worker rejection; a local mutex alone cannot fence another process.",
    ],
    next: "/docs/software-engineering/pattern-selection-contracts?path=backend-engineer-readiness",
  },
  {
    slug: "pattern-selection-contracts",
    title: "Design Patterns — Preserve Contracts Before Adding Indirection",
    checkpoint: "pattern-selection-checkpoint",
    headings: [
      "Choose the change axis",
      "Preserve the substitution contract",
      "Adapt units without hiding failures",
      "Wrap one call without changing its outcome",
      "Own shared state and lifetimes",
    ],
    sources: [
      "Fowler — Replace Conditional With Polymorphism",
      "Microsoft .NET — Service Safety And Lifetime",
    ],
    answers: [
      "Keep the simple conditional until an actual change axis justifies extra indirection.",
      "Preserve accepted inputs, returned values and errors across every strategy and caller.",
      "Convert 12.50 USD to 1250 cents under an explicit currency/unit contract; reject ambiguous input.",
      "Invoke the underlying operation once and preserve its result or exception; define instrumentation failure policy separately.",
      "Check shared-state synchronization and dependency scope; one construction does not make the instance safe.",
    ],
    next: undefined,
  },
];
for (const scenario of cases) {
  test(`@regression follows backend ${scenario.slug} into its scored checkpoint`, async ({
    page,
  }) => {
    await page.goto("/paths/backend-engineer-readiness");
    await page
      .getByTestId(`path-node-document-software-engineering-${scenario.slug}`)
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      scenario.title,
    );
    for (const heading of scenario.headings)
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
    for (const source of scenario.sources)
      await expect(page.getByTestId("source-references")).toContainText(source);
    await page.getByTestId("document-next-node").click();
    await expect(page).toHaveURL(
      `/practice/software-engineering/${scenario.checkpoint}?path=backend-engineer-readiness`,
    );
    await expect(page.getByTestId("questionnaire-session")).toHaveAttribute(
      "data-ready",
      "true",
    );
    const correct = scenario.answers
      .map((answer) => page.getByRole("radio", { name: answer, exact: true }))
      .reduce((a, b) => a.or(b));
    for (let i = 0; i < scenario.answers.length; i++) {
      await expect(
        page.getByText(`Question ${i + 1} of ${scenario.answers.length}`, {
          exact: true,
        }),
      ).toBeVisible();
      await expect(correct).toHaveCount(1);
      await correct.check();
      await page
        .getByRole("button", { name: "Check answer", exact: true })
        .click();
      await expect(page.getByText("Correct", { exact: true })).toBeVisible();
      await page
        .getByRole("button", {
          name: i === scenario.answers.length - 1 ? "Finish" : "Next",
          exact: true,
        })
        .click();
    }
    await expect(page.getByText("Score 100%", { exact: true })).toBeVisible();
    if (scenario.next) {
      await expect(
        page.getByRole("link", { name: "Next activity" }),
      ).toHaveAttribute("href", scenario.next);
      await page.getByRole("link", { name: "Next activity" }).click();
      await expect(page).toHaveURL(scenario.next);
    } else
      await expect(
        page.getByRole("link", { name: "Next activity" }),
      ).toHaveCount(0);
  });
}
