import { describe, expect, it } from "vitest";
import {
  getDocumentBySlug,
  getExerciseBySlug,
  getLearningPathBySlug,
  getNextPathNodeRoute,
  getSourceById,
} from ".";

const slug = "programming/keypad-dictionary-search";
const checkpoint = "programming/keypad-search-checkpoint";
describe("bounded keypad dictionary practice", () => {
  it.each([
    [
      "keypad-python313-mappings",
      "https://docs.python.org/3.13/library/stdtypes.html",
      "mutable sequences and mappings",
    ],
    [
      "keypad-python313-product",
      "https://docs.python.org/3.13/library/itertools.html#itertools.product",
      "finite input pools",
    ],
  ])("pins the selected primary scope of %s", (id, url, scope) => {
    const source = getSourceById(id);
    expect(source).toMatchObject({ url, lastVerifiedAt: "2026-10-04" });
    expect(source?.attribution).toContain(scope);
    expect(source?.license).toBeUndefined();
  });
  it("states finite input, terminal, branch and result ownership contracts", () => {
    const lesson = getDocumentBySlug(slug);
    expect(lesson?.prerequisites).toEqual([
      "programming/python-runtime-model",
      "programming/bfs-dfs-interview-patterns",
    ]);
    expect(lesson?.headings.map((h) => h.id)).toEqual([
      "define-the-closed-dictionary",
      "separate-a-prefix-from-a-word",
      "restore-the-branch-state",
      "run-the-original-reference",
      "choose-the-cost-and-evidence-boundary",
    ]);
    expect(lesson?.sourceRefs).toEqual([
      "keypad-python313-mappings",
      "keypad-python313-product",
    ]);
    const prose = lesson?.markdown.replace(/```[\s\S]*?```/g, "");
    for (const phrase of [
      "at most 128 words",
      "one to eight ASCII lowercase letters",
      "empty digits return an empty list",
      "validate the whole dictionary before searching",
      "a prefix is not a completed word",
      "restore the buffer before exploring a sibling",
      "independent dictionary-scan oracle",
      "bounded checks are not a complete backtracking syllabus",
    ])
      expect(prose).toContain(phrase);
    for (const id of lesson?.sourceRefs ?? [])
      expect(lesson?.markdown).toContain(`](${getSourceById(id)?.url})`);
  });
  it("pins five independent dictionary and ownership decisions", () => {
    const quiz = getExerciseBySlug(checkpoint);
    if (quiz?.type !== "questionnaire")
      throw new Error("Keypad practice needs a questionnaire");
    expect(quiz.documentSlug).toBe(slug);
    expect(quiz.sourceRefs).toEqual([
      "keypad-python313-mappings",
      "keypad-python313-product",
    ]);
    expect(quiz.questions.map((q) => q.id)).toEqual([
      "closed-dictionary",
      "terminal-word",
      "branch-rollback",
      "validate-first",
      "reference-cost",
    ]);
    expect(
      quiz.questions.map((q) =>
        q.kind === "choice"
          ? q.options.filter((o) => o.isCorrect).map((o) => o.label)
          : [],
      ),
    ).toEqual([
      [
        "Return [ad, ae, be, cf]; only complete dictionary words with the exact encoding qualify.",
      ],
      [
        "Return only ad for 23; adg is a longer word, and an unfinished prefix is not a result.",
      ],
      [
        "Snapshot each completed word and pop the chosen letter before exploring the next sibling.",
      ],
      [
        "Reject the malformed dictionary before search, even when digits are empty or no prefix matches.",
      ],
      [
        "Compare with the independent scan under the same input contract; measure repeated-query costs before preferring a trie.",
      ],
    ]);
  });
  it("preserves eighteen interview identities and appends selected backtracking", () => {
    const path = getLearningPathBySlug("coding-interview-pattern-practice")!;
    expect(path.units.map((u) => u.slug)).toEqual([
      "foundations",
      "contiguous-data",
      "ordered-data",
      "trees-and-structure",
      "bounded-caches",
      "graph-decisions",
      "array-state-reviews",
      "keypad-dictionary-search",
    ]);
    expect(
      path.units.flatMap((u) => u.nodes).filter((n) => n.kind === "interview"),
    ).toHaveLength(18);
    expect(path.units.at(-1)?.nodes).toEqual([
      { kind: "document", slug },
      { kind: "exercise", slug: checkpoint },
    ]);
    expect(
      getNextPathNodeRoute(path.slug, {
        kind: "exercise",
        slug: "programming/array-state-checkpoint",
      }),
    ).toBe(`/docs/${slug}?path=${path.slug}`);
    expect(getNextPathNodeRoute(path.slug, { kind: "document", slug })).toBe(
      `/practice/${checkpoint}?path=${path.slug}`,
    );
    expect(
      getNextPathNodeRoute(path.slug, { kind: "exercise", slug: checkpoint }),
    ).toBeUndefined();
    expect(path.summary).toContain("selected backtracking");
    expect(path.summary).toContain("comprehensive dynamic programming");
  });
});
