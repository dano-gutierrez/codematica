import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  getDocumentBySlug,
  getExerciseBySlug,
  getLearningPathBySlug,
  getNextPathNodeRoute,
  getSourceById,
} from ".";

const lessons = [
  "javascript-value-contracts",
  "lazy-demand-and-stream-boundaries",
  "text-domain-and-matching",
  "tree-shapes-and-cost-models",
];
const skills = [
  "value-ownership",
  "bounded-demand",
  "text-domain",
  "shape-and-cost",
];
const references = [
  [
    "js-contract-const",
    "js-contract-freeze",
    "js-contract-objects",
    "js-contract-equality",
    "js-contract-this",
    "js-contract-splice",
    "js-contract-sort",
    "js-contract-substr",
  ],
  [
    "demand-mdn-iteration",
    "demand-mdn-forof",
    "demand-node-stream",
    "demand-node-loop",
    "demand-tus-offset",
  ],
  ["text-mdn-regex", "text-mdn-forof", "text-regex-vis"],
  [
    "shape-opendsa-binary",
    "shape-opendsa-bst",
    "cost-opendsa-selection",
    "cost-oxford-b16",
  ],
];
const questions = [
  [
    "binding-and-copy",
    "missing-removal",
    "own-properties",
    "equality-rule",
    "call-receiver",
  ],
  [
    "bounded-demand",
    "early-cleanup",
    "stream-pressure",
    "resume-offset",
    "host-ordering",
  ],
  [
    "letter-domain",
    "pointer-progress",
    "whole-match",
    "escape-layer",
    "visual-evidence",
  ],
  [
    "shape-independent",
    "global-order",
    "selection-count",
    "cost-claim",
    "model-boundary",
  ],
];
const answers = [
  [
    "The binding is fixed; the nested object remains shared and mutable.",
    "Check for -1 before splice; the missing item must leave the list unchanged.",
    "Object.keys lists enumerable own string keys; inherited keys are separate.",
    "5 == true is false; true converts to 1, which differs from 5.",
    "The ordinary function uses its call receiver; the captured arrow retains its lexical this.",
  ],
  [
    "Pull only through the second qualifying value; eager mapping reads the full finite input.",
    "Breaking for...of calls an available iterator return; a generator finally can release its owned resource.",
    "Pause after write returns false; highWaterMark is a pressure threshold, not a strict total-memory cap.",
    "Verify session and file identity, obtain the accepted offset, then send fresh bytes from that offset.",
    "Record the host and scheduling context; Node timer phases do not define every browser or module ordering.",
  ],
  [
    "Reverse only ASCII letters and keep every other accepted ASCII character at its original position.",
    "Advance at least one pointer each iteration; skip fixed characters and move both pointers after a swap.",
    "Use the intended dialect and verify the matched text covers the entire input.",
    "A constructor string needs the JavaScript escape layer before the regex parser receives the pattern.",
    "A diagram helps explain structure; it proves neither dialect equivalence nor bounded runtime.",
  ],
  [
    "Full means zero or two children; complete means no missing breadth-first slot before an occupied slot.",
    "Carry ancestor bounds; a locally valid child can still violate the root's range.",
    "The authored selection scan makes n(n-1)/2 comparisons even on sorted input.",
    "Name the operation and assumptions; expected, worst-case and amortized claims differ.",
    "The bounded fixtures check the stated representation; they do not prove arbitrary graphs or runtime speed.",
  ],
];

describe("original programming contract review", () => {
  it.each(lessons.map((slug, index) => [slug, index] as const))(
    "retains meaningful evidence and decisions for %s",
    (slug, index) => {
      const doc = getDocumentBySlug(`programming/${slug}`);
      expect(doc).toBeDefined();
      expect(doc?.headings).toHaveLength(5);
      expect(doc?.sourceRefs).toEqual(references[index]);
      for (const id of doc?.sourceRefs ?? []) {
        const source = getSourceById(id);
        expect(source).toMatchObject({ lastVerifiedAt: "2026-10-04" });
        expect(source?.attribution).toContain("selected");
        expect(source?.license).toBeUndefined();
        expect(doc?.markdown).toContain(`](${source?.url})`);
      }
      const quiz = getExerciseBySlug(`programming/${slug}-checkpoint`);
      if (quiz?.type !== "questionnaire")
        throw new Error("Missing contract checkpoint");
      expect(quiz.documentSlug).toBe(`programming/${slug}`);
      expect(quiz.sourceRefs).toEqual(doc?.sourceRefs);
      expect(quiz.skillIds).toEqual([skills[index]]);
      for (const q of quiz.questions)
        expect(q.skillIds).toEqual([skills[index]]);
      expect(quiz.questions.map((q) => q.id)).toEqual(questions[index]);
      expect(
        quiz.questions.map((q) =>
          q.kind === "choice"
            ? q.options.filter((o) => o.isCorrect).map((o) => o.label)
            : [],
        ),
      ).toEqual(answers[index].map((a) => [a]));
      for (const q of quiz.questions)
        expect(q.explanation.length).toBeGreaterThan(100);
    },
  );
  it("orders four scoped skills without altering existing coding practice", () => {
    const path = getLearningPathBySlug("programming-contract-review");
    expect(
      path?.units.map((u) => u.nodes.map((n) => `${n.kind}:${n.slug}`)),
    ).toEqual(
      lessons.map((slug) => [
        `document:programming/${slug}`,
        `exercise:programming/${slug}-checkpoint`,
      ]),
    );
    expect(path?.progression?.skills.map((s) => s.id)).toEqual(skills);
    expect(path?.sourcePolicy).toBe("required");
    expect(path?.sourceRefs).toEqual(references.flat());
    expect(path?.progression?.stages).toHaveLength(4);
    for (const [index, stage] of (path?.progression?.stages ?? []).entries()) {
      expect(stage).toMatchObject({
        id: skills[index],
        unitSlugs: [lessons[index]],
        requiredNodeSlugs: [
          `programming/${lessons[index]}`,
          `programming/${lessons[index]}-checkpoint`,
        ],
        checkpointExerciseSlug: `programming/${lessons[index]}-checkpoint`,
        passThreshold: 0.8,
        minimumSkillScore: 0.8,
        estimatedMinutes: 30,
      });
      expect(stage.outcomes.map((outcome) => outcome.skillId)).toEqual([
        skills[index],
      ]);
    }
    for (let i = 0; i < lessons.length; i++) {
      expect(
        getNextPathNodeRoute("programming-contract-review", {
          kind: "document",
          slug: `programming/${lessons[i]}`,
        }),
      ).toBe(
        `/practice/programming/${lessons[i]}-checkpoint?path=programming-contract-review`,
      );
      expect(
        getNextPathNodeRoute("programming-contract-review", {
          kind: "exercise",
          slug: `programming/${lessons[i]}-checkpoint`,
        }),
      ).toBe(
        i === 3
          ? undefined
          : `/docs/programming/${lessons[i + 1]}?path=programming-contract-review`,
      );
    }
    const coding = getLearningPathBySlug("coding-interview-pattern-practice");
    expect(coding?.units).toHaveLength(8);
    expect(
      coding?.units
        .flatMap((u) => u.nodes)
        .filter((n) => n.kind === "interview"),
    ).toHaveLength(18);
    expect(
      getNextPathNodeRoute("coding-interview-pattern-practice", {
        kind: "exercise",
        slug: "programming/keypad-search-checkpoint",
      }),
    ).toBeUndefined();
  });
  it.each(lessons.slice(0, 3))(
    "executes the canonical %s lab without external I/O",
    (slug) => {
      const document = readFileSync(
        resolve(`content/knowledge/programming/${slug}.md`),
        "utf8",
      );
      const blocks = [
        ...document.matchAll(/^```javascript\n([\s\S]*?)^```$/gm),
      ];
      expect(blocks).toHaveLength(1);
      const result = execFileSync(
        process.execPath,
        ["--input-type=module", "--eval", blocks[0][1]],
        { env: {}, timeout: 5000, encoding: "utf8", cwd: "/tmp" },
      );
      expect(result.trim()).toBe(`${slug}: passed`);
    },
  );
});
