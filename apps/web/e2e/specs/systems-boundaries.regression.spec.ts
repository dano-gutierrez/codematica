import { expect, test } from "@playwright/test";

const cases = [
  {
    slug: "request-identities-and-navigation",
    title: "Request Identities And Navigation \u2014 Trace The Actual Target",
    headings: [
      "Split the identifier before following it",
      "Derive the target from the chosen request form",
      "Record reuse instead of assuming a fresh connection",
      "Separate the response from the displayed page",
      "Preserve a bounded navigation receipt",
    ],
    sourceUrl: "https://www.rfc-editor.org/rfc/rfc3986.html",
    answers: [
      "Send /books/7?edition=2; keep #notes out of the HTTP target.",
      "The authority is library.example:8443; the path is /books/7.",
      "A URI can identify without promising that retrieval will succeed.",
      "A valid reusable connection can avoid a new handshake; record the actual path.",
      "A successful response is one stage; rendering and later requests have their own evidence.",
    ],
  },
  {
    slug: "transport-streams-and-tunnels",
    title: "Transport Streams And Tunnels \u2014 Name The Recovery Boundary",
    headings: [
      "Distinguish the unit from its delivery promise",
      "Locate head-of-line blocking precisely",
      "Keep link identity and endpoint authority separate",
      "Check negotiated features and tunnel assumptions",
      "Review an original loss trace",
    ],
    sourceUrl: "https://www.rfc-editor.org/rfc/rfc9293.html",
    answers: [
      "HTTP/2 interleaves streams, but missing TCP bytes can stall delivery across them.",
      "HTTP/3 uses QUIC over UDP; QUIC supplies reliable ordered stream delivery.",
      "Another QUIC stream may progress, while shared congestion and compression dependencies still matter.",
      "A link address identifies the local next hop; it is not the remote application's identity.",
      "The author reports a TCP-restricted use case; verify the tunnel and inner/outer loss tradeoff for your workload.",
    ],
  },
  {
    slug: "api-interactions-and-intermediaries",
    title: "API Interactions And Intermediaries \u2014 Select A Contract",
    headings: [
      "Compare requirements before API labels",
      "Name whose behalf an intermediary represents",
      "Bound work and authority separately",
      "Preserve uncertainty after a deadline",
      "Keep the selection receipt testable",
    ],
    sourceUrl: "https://www.rfc-editor.org/rfc/rfc9110.html",
    answers: [
      "Record separate resource-style, RPC, query-shape, channel and callback contracts.",
      "The forward proxy is client-selected; the reverse intermediary represents an origin service.",
      "Authorize the requested resources and bound query work independently of the selected fields.",
      "A deadline failure does not prove that the server made no change.",
      "Routing and TLS termination do not establish durable application effects or user authorization.",
    ],
  },
  {
    slug: "derived-state-and-log-boundaries",
    title: "Derived State And Log Boundaries \u2014 Reconcile The Effect",
    headings: [
      "Separate stored results from their maintenance policy",
      "Require identity and a predecessor for each delta",
      "Distinguish partitions, replicas and consumer groups",
      "Coordinate the offset with the destination effect",
      "Keep metadata consensus separate from data replication",
    ],
    sourceUrl:
      "https://www.postgresql.org/docs/17/rules-materializedviews.html",
    answers: [
      "Replacing 5 by 8 contributes +3; replaying that replacement must not add another +3.",
      "Use stable identity and the expected previous version; a missing predecessor needs repair.",
      "Partition count and replication factor describe different dimensions.",
      "A crash after the external effect but before its offset can repeat the effect on replay.",
      "The KRaft metadata quorum is separate from data-partition replica placement.",
    ],
  },
  {
    slug: "document-query-and-pagination-contracts",
    title: "Document Queries And Pagination \u2014 Keep The Predicate",
    headings: [
      "Treat the filter as a complete contract",
      "Resume after the full ordering tuple",
      "Count the work behind a page number",
      "Inspect the plan rather than the index name",
      "Preserve the meaning when the collection changes",
    ],
    sourceUrl: "https://www.mongodb.com/docs/manual/tutorial/query-documents/",
    answers: [
      "Keep the authorization and document predicate on every page request.",
      "Order by score and a unique tie-breaker, then resume strictly after the full cursor tuple.",
      "Growing skip offsets require scanning past earlier results; compare an indexed range query.",
      "Inspect the plan and examined-versus-returned work under representative data; an index name alone proves no deadline.",
      "A cursor is a continuation rule, not a guarantee of an unchanged concurrent result set.",
    ],
  },
  {
    slug: "virtual-addresses-and-device-io",
    title: "Virtual Addresses And Device I/O \u2014 Check The Domain First",
    headings: [
      "Preserve the page offset during translation",
      "Check presence and protection before access",
      "Keep the segment bound exclusive",
      "Name where unused space occurs",
      "Treat device registers as a separate I/O domain",
    ],
    sourceUrl: "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf",
    answers: [
      "With 16-byte pages, virtual 21 has page 1 and offset 5; frame 7 gives physical 117.",
      "Check mapping presence and permission before translating or accessing the target.",
      "For base 100 and exclusive limit 12, offset 11 maps to 111; offset 12 is rejected.",
      "Paging can waste space inside a final page; variable segments can leave separated free holes.",
      "Use the documented platform device-I/O accessors and ordering rules; an ordinary pointer is not a portable MMIO contract.",
    ],
  },
];

for (const [index, fixture] of cases.entries()) {
  test(`@regression reads and completes systems boundary ${fixture.slug}`, async ({
    page,
  }) => {
    const path = "systems-boundary-review";
    await page.goto(`/paths/${path}`);
    await page
      .getByTestId(`path-node-document-system-design-${fixture.slug}`)
      .click();
    await expect(page).toHaveURL(
      `/docs/system-design/${fixture.slug}?path=${path}`,
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      fixture.title,
    );
    for (const heading of fixture.headings)
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
    const sources = page.getByTestId("source-references");
    await expect(sources).toBeVisible();
    await expect(
      sources
        .getByRole("link")
        .filter({
          hasText:
            /RFC|Kafka|MongoDB|OSTEP|Linux|DSVPN|Chrome|GraphQL|gRPC|Fielding/,
        }),
    ).not.toHaveCount(0);
    const urls = await sources
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(urls).toContain(fixture.sourceUrl);
    await expect(page.getByTestId("document-next-node")).toHaveAttribute(
      "href",
      `/practice/system-design/${fixture.slug}-checkpoint?path=${path}`,
    );
    await page.getByTestId("document-next-node").click();
    await expect(page.getByTestId("questionnaire-session")).toHaveAttribute(
      "data-ready",
      "true",
    );
    const correct = fixture.answers
      .map((answer) => page.getByRole("radio", { name: answer, exact: true }))
      .reduce((first, second) => first.or(second));
    const incorrect = [
      "Send /books/7?edition=2#notes as the complete target.",
      "The authority includes /books/7?edition=2.",
      "Every URI must initiate an HTTP request.",
      "Every navigation still requires a new TCP and TLS handshake.",
      "A 200 HTML response proves that the whole application is ready.",
    ]
      .map((answer) => page.getByRole("radio", { name: answer, exact: true }))
      .reduce((first, second) => first.or(second));
    for (let question = 0; question < fixture.answers.length; question++) {
      await expect(
        page.getByText(`Question ${question + 1} of 5`, { exact: true }),
      ).toBeVisible();
      await expect(correct).toHaveCount(1);
      if (index === 0 && question === 0) {
        await expect(incorrect).toHaveCount(1);
        await incorrect.check();
      } else await correct.check();
      await page
        .getByRole("button", { name: "Check answer", exact: true })
        .click();
      await expect(
        page.getByTestId("questionnaire-feedback").getByText(
          index === 0 && question === 0 ? "Review this" : "Correct",
          { exact: true },
        ),
      ).toBeVisible();
      await page
        .getByRole("button", {
          name: question === 4 ? "Finish" : "Next",
          exact: true,
        })
        .click();
    }
    await expect(
      page.getByText(index === 0 ? "Score 80%" : "Score 100%", { exact: true }),
    ).toBeVisible();
    const next = page.getByRole("link", { name: "Next activity", exact: true });
    if (index === cases.length - 1) await expect(next).toHaveCount(0);
    else {
      await expect(next).toHaveAttribute(
        "href",
        `/docs/system-design/${cases[index + 1].slug}?path=${path}`,
      );
      await next.click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        cases[index + 1].title,
      );
    }
  });
}
