import { describe, expect, it } from "vitest";
import {
  getDocumentBySlug,
  getExerciseBySlug,
  getLearningPathBySlug,
  getNextPathNodeRoute,
  getSourceById,
} from ".";

const cases = [
  {
    slug: "request-identities-and-navigation",
    skill: "request-identity",
    sources: [
      "boundary-rfc3986",
      "boundary-rfc8141",
      "boundary-rfc9110",
      "boundary-rfc9112",
    ],
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
    skill: "transport-scope",
    sources: [
      "boundary-rfc9293",
      "boundary-rfc768",
      "boundary-rfc9113",
      "boundary-rfc9000",
      "boundary-rfc9114",
      "boundary-rfc826",
      "boundary-chrome-push",
      "boundary-dsvpn",
    ],
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
    skill: "interaction-contract",
    sources: [
      "boundary-rfc9110",
      "boundary-graphql-security",
      "boundary-grpc-core",
      "boundary-rfc6455",
      "boundary-fielding-rest",
    ],
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
    skill: "derived-state",
    sources: [
      "boundary-pg-materialized",
      "boundary-kafka-design",
      "boundary-kafka-introduction",
      "boundary-kafka-kraft",
    ],
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
    skill: "document-query",
    sources: [
      "boundary-mongo-query",
      "boundary-mongo-skip",
      "boundary-mongo-explain",
    ],
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
    skill: "memory-domain",
    sources: [
      "boundary-ostep-paging",
      "boundary-ostep-segments",
      "boundary-linux-device-io",
    ],
    answers: [
      "With 16-byte pages, virtual 21 has page 1 and offset 5; frame 7 gives physical 117.",
      "Check mapping presence and permission before translating or accessing the target.",
      "For base 100 and exclusive limit 12, offset 11 maps to 111; offset 12 is rejected.",
      "Paging can waste space inside a final page; variable segments can leave separated free holes.",
      "Use the documented platform device-I/O accessors and ordering rules; an ordinary pointer is not a portable MMIO contract.",
    ],
  },
];

describe("selected systems boundary review", () => {
  it.each(cases)(
    "preserves evidence and independently keyed decisions for $slug",
    ({ slug, skill, sources, answers }) => {
      const doc = getDocumentBySlug(`system-design/${slug}`);
      expect(doc).toBeDefined();
      expect(doc?.headings).toHaveLength(5);
      expect(doc?.sourceRefs).toEqual(sources);
      for (const id of sources) {
        const source = getSourceById(id);
        expect(source).toMatchObject({ lastVerifiedAt: "2026-10-04" });
        if (id === "boundary-chrome-push")
          expect(source?.license).toEqual({
            name: "CC BY 4.0 (page prose; code samples have separate terms)",
            url: "https://creativecommons.org/licenses/by/4.0/",
          });
        else expect(source?.license).toBeUndefined();
        expect(doc?.markdown).toContain(`](${source?.url})`);
      }
      const quiz = getExerciseBySlug(`system-design/${slug}-checkpoint`);
      if (quiz?.type !== "questionnaire")
        throw new Error("Missing systems checkpoint");
      expect(quiz.documentSlug).toBe(doc?.slug);
      expect(quiz.sourceRefs).toEqual(sources);
      expect(quiz.skillIds).toEqual([skill]);
      expect(quiz.questions).toHaveLength(5);
      expect(new Set(quiz.questions.map((q) => q.id)).size).toBe(5);
      expect(
        quiz.questions.map((q) =>
          q.kind === "choice"
            ? q.options.filter((o) => o.isCorrect).map((o) => o.label)
            : [],
        ),
      ).toEqual(answers.map((a) => [a]));
      for (const q of quiz.questions) {
        expect(q.skillIds).toEqual([skill]);
        expect(q.explanation.length).toBeGreaterThan(100);
      }
    },
  );
  it("orders six qualified skills and retains the original terminal coding and programming paths", () => {
    const path = getLearningPathBySlug("systems-boundary-review");
    expect(path?.sourcePolicy).toBe("required");
    expect(
      path?.units.map((u) => u.nodes.map((n) => `${n.kind}:${n.slug}`)),
    ).toEqual(
      cases.map((c) => [
        `document:system-design/${c.slug}`,
        `exercise:system-design/${c.slug}-checkpoint`,
      ]),
    );
    expect(path?.sourceRefs).toEqual([
      ...new Set(cases.flatMap((c) => c.sources)),
    ]);
    expect(path?.progression?.skills.map((s) => s.id)).toEqual(
      cases.map((c) => c.skill),
    );
    expect(path?.progression?.stages).toHaveLength(6);
    for (const [index, stage] of (path?.progression?.stages ?? []).entries()) {
      const { slug, skill } = cases[index];
      expect(stage).toMatchObject({
        id: skill,
        unitSlugs: [slug],
        requiredNodeSlugs: [
          `system-design/${slug}`,
          `system-design/${slug}-checkpoint`,
        ],
        checkpointExerciseSlug: `system-design/${slug}-checkpoint`,
        passThreshold: 0.8,
        minimumSkillScore: 0.8,
        estimatedMinutes: 20,
      });
      expect(path?.units[index].nodes).toEqual([
        {
          kind: "document",
          slug: `system-design/${slug}`,
          skillIds: [skill],
          required: true,
        },
        {
          kind: "exercise",
          slug: `system-design/${slug}-checkpoint`,
          skillIds: [skill],
          required: true,
        },
      ]);
      expect(stage.outcomes.map((o) => o.skillId)).toEqual([skill]);
      expect(
        getNextPathNodeRoute("systems-boundary-review", {
          kind: "document",
          slug: `system-design/${slug}`,
        }),
      ).toBe(
        `/practice/system-design/${slug}-checkpoint?path=systems-boundary-review`,
      );
      expect(
        getNextPathNodeRoute("systems-boundary-review", {
          kind: "exercise",
          slug: `system-design/${slug}-checkpoint`,
        }),
      ).toBe(
        index === 5
          ? undefined
          : `/docs/system-design/${cases[index + 1].slug}?path=systems-boundary-review`,
      );
    }
    expect(
      getLearningPathBySlug("coding-interview-pattern-practice")?.units,
    ).toHaveLength(8);
    expect(
      getLearningPathBySlug("programming-contract-review")?.units,
    ).toHaveLength(4);
    expect(
      getNextPathNodeRoute("coding-interview-pattern-practice", {
        kind: "exercise",
        slug: "programming/keypad-search-checkpoint",
      }),
    ).toBeUndefined();
    expect(
      getNextPathNodeRoute("programming-contract-review", {
        kind: "exercise",
        slug: "programming/tree-shapes-and-cost-models-checkpoint",
      }),
    ).toBeUndefined();
  });
});
