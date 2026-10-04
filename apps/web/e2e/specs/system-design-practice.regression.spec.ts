import { expect, test } from "@playwright/test";

const cases = [
  {
    slug: "video-delivery-boundaries",
    title: "Video Delivery — Separate Transfer, Protection And Resume",
    source: "RFC 8216 — HTTP Live Streaming",
    checkpoint: "video-delivery-checkpoint",
    answers: [
      "Four seconds to transfer; the half-second buffer cannot bridge that wait under these assumptions.",
      "Capture policy is observed; identify the DRM security level separately before claiming hardware-only decoding.",
      "Inspect the key status and output policy; downscaling is optional and cannot be assumed.",
      "Define persistence, scoped ordering and recovery, then test the last accepted revision after failure.",
      "Check the dated platform/browser requirements and actual device configuration; the maximum is conditional.",
    ],
  },
  {
    "slug": "distributed-reading-reviews",
    "title": "Distributed Readings — Review The Assumptions",
    "source": "Dynamo — Amazon's Highly Available Key-value Store",
    "checkpoint": "distributed-reading-checkpoint",
    next: "/docs/system-design/video-delivery-boundaries?path=system-design-fundamentals",
    "answers": [
      "Name the actual read/write participants and version reconciliation; the inequality alone does not prove a latest single value.",
      "An old-term majority count alone is insufficient; use Raft's current-term commitment rule and log/election constraints.",
      "Preserve a client request identity and associated result; log commitment alone does not deduplicate retries.",
      "About 63.4% under independence; correlated stalls and extra hedge work require separate evidence."
    ]
  },
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
      "Refuse the sensitive operation until current status is established; record the propagation gap.",
      "Use a unique server-issued identifier in the verified issuer/application scope; raw-token hashes may be bypassed.",
      "Check the server’s cascade policy and consumer enforcement; revoking refresh access alone is not proof about issued access tokens.",
      "The verifier still trusts the old key; issuing a new key alone does not revoke that token.",
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
      "Reject the stale write without overwriting A; checking the tag and committing the update must be one protected transition.",
      "Reject unsupported fields and sort shapes explicitly, keep tenant authorization independent, and measure the allowed query plans.",
      "Continue with the returned token and unchanged query context; zero rows alone do not prove the collection ended.",
      "Treat omitted BASIC fields as unreturned, preserve their types in FULL, and document defaults before clients depend on them.",
    ],
    next: "/docs/system-design/traffic-rate-contracts?path=system-design-fundamentals",
  },
  {
    "slug": "traffic-rate-contracts",
    "title": "Traffic Rate Contracts — Test The Window Before Choosing A Store",
    "source": "Redis — Rate Limiting Algorithm Comparison",
    "checkpoint": "traffic-rate-checkpoint",
    "answers": [
      "A calendar-window limit can allow both batches; it does not enforce the stated rolling-window contract.",
      "Retain distinct accepted attempts inside (now - 60, now]; an attempt exactly 60 seconds old has expired.",
      "A full bucket can admit a burst; its capacity and refill rate do not promise a strict rolling-window count.",
      "Use an in-flight limit with bounded admission and release; a request rate alone does not bound simultaneous slow work."
    ],
    "next": "/docs/system-design/webhook-authenticity-and-replay?path=system-design-fundamentals"
  },
  {
    "slug": "webhook-authenticity-and-replay",
    "title": "Webhook Authenticity — Separate A Valid Delivery From A New Effect",
    "source": "Stripe — Webhook Signatures And Delivery Contracts",
    "checkpoint": "webhook-authenticity-checkpoint",
    "answers": [
      "Verify the exact received bytes with the configured endpoint secret before trusting parsed fields.",
      "Authenticate the timestamp and check the configured clock tolerance; replay prevention also needs durable deduplication.",
      "Verify each delivery, then consult a scoped event receipt; a fresh signature does not make the event new.",
      "Acknowledge durable acceptance, process idempotently and reconcile failures; an in-memory seen set cannot prove crash-safe effects."
    ],
    "next": "/docs/system-design/fair-admission-and-reservations?path=system-design-fundamentals"
  },
  {
    slug: "fair-admission-and-reservations",
    title: "Fair Admission And Reservations — Separate Policy From Ownership",
    source: "PostgreSQL 17 — SELECT And SKIP LOCKED",
    checkpoint: "reservation-boundary-checkpoint",
    next: "/docs/system-design/distributed-reading-reviews?path=system-design-fundamentals",
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
    if (scenario.slug === "video-delivery-boundaries") {
      for (const heading of ["Separate the delivery contracts", "Calculate a segment deadline", "Observe protection at its own boundary", "Preserve playback state deliberately", "Write a delivery review receipt"]) await expect(page.getByRole("heading", {name:heading,exact:true})).toBeVisible();
      for (const source of ["W3C EME — Key Systems And Output Status", "Android MediaDrm — Software And Hardware Security Levels", "Android — Secure Window Capture Policy", "Netflix — Conditional Browser Resolution Requirements"]) await expect(page.getByTestId("source-references")).toContainText(source);
    }
    if (scenario.slug === "client-compatibility-contracts") {
      for (const heading of ["Review conditional writes before trusting a tag", "Bound filtering, sorting and continuation", "Name the resource view and preserve its meaning"]) await expect(page.getByRole("heading", {name:heading,exact:true})).toBeVisible();
      for (const source of ["RFC 9110 — If-Match And Request Preconditions", "Google AIP-160 — Filtering", "Google AIP-158 — Pagination", "Google AIP-157 — Partial Responses"]) await expect(page.getByTestId("source-references")).toContainText(source);
    }
    if (scenario.slug === "cors-csrf-and-authorization") {
      for (const heading of ["Separate token validity from current session state", "Trace revocation to every consumer", "Review the revocation window"]) await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      for (const source of ["OWASP — JWT Revocation And Denylist", "OWASP — REST Token Validation", "RFC 7009 — OAuth Token Revocation", "RFC 9700 — Refresh Token Protection"]) await expect(page.getByTestId("source-references")).toContainText(source);
    }
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
    if (scenario.next) {
      await expect(page.getByRole("link", { name: "Next activity" })).toHaveAttribute("href", scenario.next);
      await page.getByRole("link", { name: "Next activity" }).click();
      await expect(page).toHaveURL(scenario.next);
    } else await expect(page.getByRole("link", { name: "Next activity" })).toHaveCount(0);
  });
}
