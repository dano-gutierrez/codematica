import { describe, expect, it } from "vitest";
import { getDocumentBySlug, getExerciseBySlug, getLearningPathBySlug, getNextPathNodeRoute } from ".";

describe("original progressive state review", () => {
  it("keeps historical, retired and rejected states distinct", () => {
    const lesson = getDocumentBySlug("software-engineering/progressive-state-history");
    expect(lesson?.prerequisites).toEqual(["programming/python-runtime-model"]);
    expect(lesson?.headings.map(h => h.id)).toEqual(["extend-one-contract-at-a-time", "make-time-and-rejection-explicit", "merge-current-state-without-rewriting-history", "run-the-original-reference", "challenge-the-state-model"]);
    for (const phrase of ["failed operation does not advance time", "retired IDs cannot be reused", "earlier target history is not rewritten", "single-process, sequential fixture", "not an employer's assessment", "bounded replay checks are not a general proof"]) expect(lesson?.markdown).toContain(phrase);
  });

  it("pins independent merge-history and rejection answers", () => {
    const quiz = getExerciseBySlug("software-engineering/progressive-state-checkpoint");
    if (quiz?.type !== "questionnaire") throw new Error("Progressive state needs a questionnaire");
    expect(quiz.documentSlug).toBe("software-engineering/progressive-state-history");
    expect(quiz.questions.map(q => q.id)).toEqual(["premerge-history", "retired-history", "rejected-state", "scope"]);
    expect(quiz.questions.map(q => q.kind === "choice" ? q.options.filter(o => o.isCorrect).map(o => o.label) : [])).toEqual([
      ["A at time 4 remains 7; only the merge-time and later target balance includes B."],
      ["B retains its earlier balance, returns None from retirement onward, and its ID cannot be reused."],
      ["Reject before recording state or advancing the clock; a valid operation may still use that timestamp."],
      ["The sequential bounded state/history contract; persistence, concurrency and real payments need separate design and tests."],
    ]);
  });

  it("appends the state review and preserves both reservation path destinations", () => {
    const path = getLearningPathBySlug("backend-engineer-readiness")!;
    expect(path.units.map(u => u.slug)).toEqual(["production-judgment", "durable-retries", "reservation-boundaries", "progressive-state"]);
    expect(path.units.at(-1)?.nodes).toEqual([{kind:"document", slug:"software-engineering/progressive-state-history"}, {kind:"exercise",slug:"software-engineering/progressive-state-checkpoint"}]);
    expect(getNextPathNodeRoute(path.slug,{kind:"exercise",slug:"system-design/reservation-boundary-checkpoint"})).toBe("/docs/software-engineering/progressive-state-history?path=backend-engineer-readiness");
    expect(getNextPathNodeRoute("system-design-fundamentals",{kind:"exercise",slug:"system-design/reservation-boundary-checkpoint"})).toBe("/docs/system-design/distributed-reading-reviews?path=system-design-fundamentals");
    expect(getNextPathNodeRoute(path.slug,{kind:"document",slug:"software-engineering/progressive-state-history"})).toBe("/practice/software-engineering/progressive-state-checkpoint?path=backend-engineer-readiness");
    expect(getNextPathNodeRoute(path.slug,{kind:"exercise",slug:"software-engineering/progressive-state-checkpoint"})).toBeUndefined();
  });
});
