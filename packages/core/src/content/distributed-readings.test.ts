import { describe, expect, it } from "vitest";
import { getContentIndex, getDocumentBySlug, getExerciseBySlug, getLearningPathBySlug, getNextPathNodeRoute } from ".";

const sources = ["dynamo-sosp-2007", "raft-extended-2014", "tail-at-scale-2013"];
const slug = "system-design/distributed-reading-reviews";

describe("distributed reading reviews", () => {
  it.each([
    [sources[0], "Amazon.com", "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf", "SOSP 2007"],
    [sources[1], "Diego Ongaro and John Ousterhout", "https://raft.github.io/raft.pdf", "May 20, 2014"],
    [sources[2], "Jeffrey Dean and Luiz André Barroso", "https://barroso.org/publications/TheTailAtScale.pdf", "February 2013"],
  ])("preserves selected primary edition and destination for %s", (id, provider, url, edition) => {
    const source = getContentIndex().sources.find(source => source.id === id);
    expect(source).toMatchObject({ provider, url, lastVerifiedAt: "2026-10-04" });
    expect(source?.attribution).toContain(edition);
    expect(source?.license).toBeUndefined();
    expect(getDocumentBySlug(slug)?.markdown).toContain(`](${url})`);
  });

  it("keeps paper assumptions and runtime evidence separate", () => {
    const lesson = getDocumentBySlug(slug)!;
    expect(lesson?.sourceRefs).toEqual(sources);
    expect(lesson?.prerequisites).toEqual(["system-design/scaling-decision-worksheet", "software-engineering/product-interview-durable-generation-architecture"]);
    expect(lesson?.headings.map(heading => heading.id)).toEqual([
      "read-for-a-specific-contract", "name-the-quorum-members", "commitment-needs-more-than-a-copy-count", "measure-the-whole-fan-out", "write-a-comparison-receipt",
    ]);
    for (const boundary of ["R + W > N does not establish linearizability", "current-term entry", "A committed command does not deduplicate client retries", "independent leaf events", "correlated stalls", "no distributed cluster or latency benchmark was run"]) expect(lesson?.markdown).toContain(boundary);
    for (const match of lesson.markdown.matchAll(/\]\(\/docs\/([^)?#]+)(?:[?#][^)]*)?\)/g)) expect(getDocumentBySlug(match[1]), `Missing local destination ${match[1]}`).toBeDefined();
  });

  it("scores four distinct review mistakes with explicit answer keys", () => {
    const quiz = getExerciseBySlug("system-design/distributed-reading-checkpoint");
    if (quiz?.type !== "questionnaire") throw new Error("Distributed reading needs a questionnaire");
    expect(quiz.documentSlug).toBe(slug);
    expect(quiz.sourceRefs).toEqual(sources);
    expect(quiz.questions.map(question => question.id)).toEqual(["quorum-membership", "commit-term", "retry-effect", "fanout-assumptions"]);
    expect(quiz.questions.map(question => question.kind === "choice" ? question.options.filter(option => option.isCorrect).map(option => option.label) : [])).toEqual([
      ["Name the actual read/write participants and version reconciliation; the inequality alone does not prove a latest single value."],
      ["An old-term majority count alone is insufficient; use Raft's current-term commitment rule and log/election constraints."],
      ["Preserve a client request identity and associated result; log commitment alone does not deduplicate retries."],
      ["About 63.4% under independence; correlated stalls and extra hedge work require separate evidence."],
    ]);
  });

  it("keeps the distributed unit intact before the video review", () => {
    const path = getLearningPathBySlug("system-design-fundamentals")!;
    expect(path.units.map(unit => unit.slug)).toEqual(["caching-contracts", "capacity-decisions", "routing-decisions", "api-security-boundaries", "client-compatibility", "traffic-rate", "webhook-authenticity", "reservation-boundaries", "distributed-readings", "video-delivery"]);
    expect(path.units[8]?.nodes).toEqual([{ kind: "document", slug }, { kind: "exercise", slug: "system-design/distributed-reading-checkpoint" }]);
    expect(getNextPathNodeRoute(path.slug, { kind: "exercise", slug: "system-design/reservation-boundary-checkpoint" })).toBe(`/docs/${slug}?path=${path.slug}`);
    expect(getNextPathNodeRoute(path.slug, { kind: "document", slug })).toBe(`/practice/system-design/distributed-reading-checkpoint?path=${path.slug}`);
    expect(getNextPathNodeRoute(path.slug, { kind: "exercise", slug: "system-design/distributed-reading-checkpoint" })).toBe(`/docs/system-design/video-delivery-boundaries?path=${path.slug}`);
    expect(getLearningPathBySlug("backend-engineer-readiness")?.units.flatMap(unit => unit.nodes).some(node => node.slug === slug)).toBe(false);
  });
});
