import { describe, expect, it } from "vitest";
import { getDocumentBySlug, getExerciseBySlug, getLearningPathBySlug, getNextPathNodeRoute } from ".";

describe("original array state practice", () => {
  it("states three distinct contracts and the cost of defensive copies", () => {
    const lesson = getDocumentBySlug("programming/array-state-invariants");
    expect(lesson?.headings.map(heading => heading.id)).toEqual(["choose-the-state-contract", "retain-the-best-nonempty-segment", "place-only-values-with-a-valid-slot", "wait-for-a-strictly-greater-value", "run-the-original-reference", "review-the-evidence"]);
    expect(lesson?.prerequisites).toEqual(["programming/python-runtime-model"]);
    for (const phrase of ["empty input is rejected", "earliest start, then earliest exclusive end", "duplicates are rejected before swapping", "Equal values do not resolve a pending index", "copies and validation use O(n) extra storage", "bounded oracle checks are not a general proof"]) expect(lesson?.markdown).toContain(phrase);
  });

  it("pins independent answers for nonempty, tie, domain and equality failures", () => {
    const quiz = getExerciseBySlug("programming/array-state-checkpoint");
    if (quiz?.type !== "questionnaire") throw new Error("Array state review needs a questionnaire");
    expect(quiz.documentSlug).toBe("programming/array-state-invariants");
    expect(quiz.questions.map(question => question.id)).toEqual(["nonempty-segment", "segment-tie", "slot-domain", "strict-greater"]);
    expect(quiz.questions.map(question => question.kind === "choice" ? question.options.filter(option => option.isCorrect).map(option => option.label) : [])).toEqual([
      ["Return sum -2 with the nonempty segment [1, 2); zero would violate this contract."],
      ["Return (0, 0, 1): earliest start, then earliest exclusive end."],
      ["Reject duplicate values before swaps; the unique 0..n domain is part of the contract."],
      ["Return [2, 2, None]; equal values stay pending until a strictly greater value appears."],
    ]);
  });

  it("appends the review without replacing existing interview identities", () => {
    const path = getLearningPathBySlug("coding-interview-pattern-practice")!;
    expect(path.units.map(unit => unit.slug)).toEqual(["foundations", "contiguous-data", "ordered-data", "trees-and-structure", "bounded-caches", "graph-decisions", "array-state-reviews", "keypad-dictionary-search"]);
    expect(path.units.flatMap(unit => unit.nodes).filter(node => node.kind === "interview")).toHaveLength(18);
    expect(path.units[6]?.nodes).toEqual([{ kind: "document", slug: "programming/array-state-invariants" }, { kind: "exercise", slug: "programming/array-state-checkpoint" }]);
    expect(getNextPathNodeRoute(path.slug, { kind: "interview", slug: "uber/shortest-path-weighted-road-graph" })).toBe("/docs/programming/array-state-invariants?path=coding-interview-pattern-practice");
    expect(getNextPathNodeRoute(path.slug, { kind: "document", slug: "programming/array-state-invariants" })).toBe("/practice/programming/array-state-checkpoint?path=coding-interview-pattern-practice");
    expect(getNextPathNodeRoute(path.slug, { kind: "exercise", slug: "programming/array-state-checkpoint" })).toBe("/docs/programming/keypad-dictionary-search?path=coding-interview-pattern-practice");
  });
});
