import { describe, expect, it } from "vitest";
import { getContentIndex, getDocumentBySlug, getExerciseBySlug, getLearningPathBySlug, getNextPathNodeRoute, getPassiveFlashcardFeedByPathSlug } from ".";
import { checkQuestionAnswer } from "../practice/questionnaire";
import { searchContent } from "../search";

const topics = ["foundations", "cache-and-invalidation", "mutations-and-errors", "persistence-and-recovery", "modern-apis", "production-architecture", "interview-workshop"];

describe("RTK Query interview curriculum", () => {
  it("connects every published lesson to its sourced checkpoint and the next unit", () => {
    const path = getLearningPathBySlug("rtk-query-interview-preparation");
    expect(path?.category).toBe("Front-End Development");
    expect(path?.sourcePolicy).toBe("required");
    expect(path?.units.map((unit) => unit.nodes.map((node) => node.slug))).toEqual(topics.map((topic) => [
      `frontend/rtk-query-${topic}`, `frontend/rtk-query-${topic}-questionnaire`,
    ]));
    const sourceIds = new Set(getContentIndex().sources.map((source) => source.id));
    for (const [index, topic] of topics.entries()) {
      const slug = `frontend/rtk-query-${topic}`;
      const document = getDocumentBySlug(slug);
      const exercise = getExerciseBySlug(`${slug}-questionnaire`);
      expect(document?.status).toBe("published");
      expect(document?.sourceRefs?.length).toBeGreaterThan(0);
      expect(exercise?.sourceRefs?.length).toBeGreaterThan(0);
      for (const id of [...document!.sourceRefs!, ...exercise!.sourceRefs!]) expect(sourceIds.has(id)).toBe(true);
      expect(exercise?.documentSlug).toBe(slug);
      expect(getNextPathNodeRoute(path!.slug, { kind: "document", slug })).toBe(`/practice/${slug}-questionnaire?path=${path!.slug}`);
      expect(getNextPathNodeRoute(path!.slug, { kind: "exercise", slug: `${slug}-questionnaire` })).toBe(
        topics[index + 1] ? `/docs/frontend/rtk-query-${topics[index + 1]}?path=${path!.slug}` : undefined,
      );
    }
  });

  it("grades all scenario answers and rejects every distractor through shared practice logic", () => {
    for (const topic of topics) {
      const exercise = getExerciseBySlug(`frontend/rtk-query-${topic}-questionnaire`);
      expect(exercise?.type).toBe("questionnaire");
      if (exercise?.type !== "questionnaire") throw new Error(`Missing checkpoint: ${topic}`);
      expect(exercise.questions).toHaveLength(6);
      expect(new Set(exercise.questions.map((question) => question.id)).size).toBe(6);
      for (const question of exercise.questions) {
        expect(question.kind).toBe("choice");
        if (question.kind !== "choice") throw new Error("Expected a scenario choice");
        expect(question.options.filter((option) => option.isCorrect)).toHaveLength(1);
        expect(question.explanation.length).toBeGreaterThan(100);
        for (const option of question.options) {
          expect(checkQuestionAnswer(question, { kind: "choice", selectedOptionId: option.id }).isCorrect).toBe(option.isCorrect);
        }
      }
    }
  });

  it("makes the incident searchable and keeps version-specific claims attributable", () => {
    expect(searchContent(getContentIndex(), "RTK Query persistence").some((result) => result.route === "/docs/frontend/rtk-query-persistence-and-recovery")).toBe(true);
    const incident = getDocumentBySlug("frontend/rtk-query-persistence-and-recovery")!;
    expect(incident.markdown).toContain("https://github.com/inkitt/flash/pull/12666");
    expect(incident.markdown).toContain("extractRehydrationInfo");
    const modern = getDocumentBySlug("frontend/rtk-query-modern-apis")!;
    for (const api of ["2.12.0", "infiniteQuery", "responseSchema", "refetchCachedPages"]) expect(modern.markdown).toContain(api);
  });

  it("offers concise review with working links back to every lesson", () => {
    const feed = getPassiveFlashcardFeedByPathSlug("rtk-query-interview-preparation");
    expect(feed?.cards).toHaveLength(21);
    expect(new Set(feed?.cards.map((card) => card.sourceDocSlug))).toEqual(new Set(topics.map((topic) => `frontend/rtk-query-${topic}`)));
    for (const card of feed!.cards) expect(getDocumentBySlug(card.sourceDocSlug!)?.status).toBe("published");
  });
});
