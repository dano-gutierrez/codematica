import { describe, expect, it } from "vitest";
import {
  getDocumentBySlug,
  getExerciseBySlug,
  getLearningPathBySlug,
  getNextPathNodeRoute,
  getSourceById,
} from ".";

import { evidenceAnswers, evidenceSources } from "../test/evidence-review-fixture";

const paths: Record<string, readonly (readonly [string, string])[]> = {
  "engineering-evidence-review": [
    ["ai-engineering/local-decision-contracts", "decision-evidence"],
    ["software-engineering/credential-containment", "incident-evidence"],
    ["programming/java-state-and-proxy-contracts", "java-contracts"],
    [
      "software-engineering/domain-and-deployment-boundaries",
      "domain-boundaries",
    ],
    ["system-design/cloud-responsibility-and-runtime", "cloud-responsibility"],
    ["system-design/federation-and-delegation", "identity-boundaries"],
    ["system-design/card-payment-state-evidence", "payment-evidence"],
  ],
  "creative-computing-review": [
    [
      "creative-computing/authoritative-motion-and-prediction",
      "motion-authority",
    ],
    ["creative-computing/sampled-surfaces-and-time", "sampled-geometry"],
    ["creative-computing/blockout-and-trigger-state", "trigger-state"],
  ],
  "ownership-and-funding-review": [
    ["business/ownership-and-funding-models", "ownership-model"],
  ],
} as const;

describe("selected evidence review paths", () => {
  for (const [pathSlug, pairs] of Object.entries(paths)) {
    it.each(pairs)(
      "contains the sourced lesson %s and its checkpoint",
      (slug, skill) => {
        const doc = getDocumentBySlug(slug);
        expect(doc).toBeDefined();
        if (!doc) throw Error("Missing selected lesson");
        expect(doc?.headings).toHaveLength(5);
        expect(doc?.status).toBe("published");
        expect(doc.sourceRefs?.length ?? 0).toBeGreaterThan(0);
        const exercise = getExerciseBySlug(`${slug}-checkpoint`);
        expect(exercise?.type).toBe("questionnaire");
        if (exercise?.type !== "questionnaire")
          throw Error("Missing selected checkpoint");
        expect(exercise.documentSlug).toBe(slug);
        expect(exercise.skillIds).toEqual([skill]);
        expect(exercise.sourceRefs).toEqual(doc?.sourceRefs);
        expect(exercise.questions).toHaveLength(5);
        expect(
          exercise.questions.map((q) => {
            if (q.kind !== "choice")
              throw Error("Expected a finite choice case");
            expect(q.skillIds).toEqual([skill]);
            expect(q.options.filter((o) => o.isCorrect)).toHaveLength(1);
            expect(new Set(q.options.map((o) => o.label)).size).toBe(3);
            expect(q.explanation.length).toBeGreaterThan(80);
            return q.options.find((o) => o.isCorrect)?.label;
          }),
        ).toEqual(evidenceAnswers[slug]);
        for (const id of exercise.sourceRefs ?? []) {
          expect(getSourceById(id)).toMatchObject({
            lastVerifiedAt: "2026-10-04",
          });
          expect(getSourceById(id)?.url).toBe(evidenceSources[id]);
        }
        const path = getLearningPathBySlug(pathSlug);
        expect(path?.sourcePolicy).toBe("required");
        expect(path?.units.map((u) => u.nodes.map((n) => n.slug))).toEqual(
          pairs.map(([s]) => [s, `${s}-checkpoint`]),
        );
        const position = pairs.findIndex(([s]) => s === slug);
        expect(getNextPathNodeRoute(pathSlug, { kind: "document", slug })).toBe(
          `/practice/${slug}-checkpoint?path=${pathSlug}`,
        );
        expect(
          getNextPathNodeRoute(pathSlug, {
            kind: "exercise",
            slug: `${slug}-checkpoint`,
          }),
        ).toBe(
          position === pairs.length - 1
            ? undefined
            : `/docs/${pairs[position + 1][0]}?path=${pathSlug}`,
        );
      },
    );
  }
});
