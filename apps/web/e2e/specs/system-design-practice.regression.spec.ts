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
    next: "/docs/system-design/routing-decision-lab?path=system-design-fundamentals",
  },
  {
    slug: "routing-decision-lab",
    title: "Routing Decisions — Choose A Signal And Test Its Limits",
    source: "NGINX HTTP Upstream Module",
    checkpoint: "routing-decision-checkpoint",
    answers: [
      "Treat connection count as one signal; measure queued work and latency for this workload.",
      "Affinity may change and IPs may be shared; keep authorization and durable session state independent.",
      "Exclude the ineligible backend before ranking; define a bounded no-capacity response.",
      "The toy’s stated routing and validation cases; real proxy behavior and throughput need separate tests.",
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
    next: "/docs/system-design/client-compatibility-contracts?path=system-design-fundamentals",
  },
  {
    slug: "client-compatibility-contracts",
    title: "Client Compatibility — Separate Layout, Data And Meaning",
    source: "Duolingo — Server-Driven UI",
    checkpoint: "client-compatibility-checkpoint",
    answers: [
      "Reuse a compatible cached layout with supported fresh data; a version number alone does not prove component support.",
      "Use an explicit unavailable or upgrade state; no compatible cached layout was established.",
      "Reject the unsupported data contract; an old layout cannot repair incompatible field meaning or types.",
      "The JSON can parse while the meaning breaks: old callers may mistake the first page for the complete result.",
    ],
    next: "/docs/system-design/fair-admission-and-reservations?path=system-design-fundamentals",
  },
  {
    slug: "fair-admission-and-reservations",
    title: "Fair Admission And Reservations — Separate Policy From Ownership",
    source: "PostgreSQL 17 — SELECT And SKIP LOCKED",
    checkpoint: "reservation-boundary-checkpoint",
    answers: [
      "No matching row was acquired by that statement; it cannot infer sold out.",
      "Eligibility and abuse policy; one account does not prove one legitimate human.",
      "Reject the stale inventory transition and record/reconcile B’s payment outcome.",
      "Completion is ineligible; expiry may win the guarded transition.",
      "Enforce overlap exclusion for the same room; adjacent half-open stays may coexist.",
      "Commit the guarded transition to expired; elapsed time alone does not remove the hold from the constraint.",
    ],
  },
];

for (const scenario of cases) {
  test(`@regression follows ${scenario.slug} into its scored path checkpoint`, async ({ page }) => {
    await page.goto("/paths/system-design-fundamentals");
    await page.getByTestId(`path-node-document-system-design-${scenario.slug}`).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(scenario.title);
    await expect(page.getByTestId("source-references")).toContainText(scenario.source);
    if (scenario.slug === "fair-admission-and-reservations") {
      await expect(page.getByRole("heading", {name:"Protect room dates with an overlap constraint",exact:true})).toBeVisible();
      await expect(page.getByTestId("source-references")).toContainText("PostgreSQL 17 — Range Types");
      await expect(page.getByTestId("source-references")).toContainText("PostgreSQL 17 — Exclusion Constraints");
    }
    await page.getByTestId("document-next-node").click();
    await expect(page).toHaveURL(new RegExp(`${scenario.checkpoint}\\?path=system-design-fundamentals`));
    await expect(page.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true");
    const correctAnswer = scenario.answers.map(answer => page.getByRole("radio", { name: answer, exact: true })).reduce((a, b) => a.or(b));
    for (let index = 0; index < scenario.answers.length; index++) {
      await expect(page.getByText(`Question ${index + 1} of ${scenario.answers.length}`, { exact: true })).toBeVisible();
      await expect(correctAnswer).toHaveCount(1);
      await correctAnswer.check();
      await page.getByRole("button", { name: "Check answer", exact: true }).click();
      await expect(page.getByText("Correct", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: index === scenario.answers.length - 1 ? "Finish" : "Next", exact: true }).click();
    }
    await expect(page.getByText("Score 100%", { exact: true })).toBeVisible();
    if (scenario.next) await expect(page.getByRole("link", { name: "Next activity" })).toHaveAttribute("href", scenario.next);
  });
}
