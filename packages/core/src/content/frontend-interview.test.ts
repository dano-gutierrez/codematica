import { describe, expect, it } from "vitest";
import { getContentIndex, getDocumentBySlug, getExerciseBySlug, getInterviewQuestionBySlug, getLearningPathBySlug, getNextPathNodeRoute, getPassiveFlashcardFeedByPathSlug } from ".";
import { learningPathNodeSchema, passiveFlashcardCardSchema } from "./schema";
import { checkQuestionAnswer } from "../practice/questionnaire";

const pathSlug = "frontend-interview-practice";
const topics = ["dynamic-board", "random-matrix", "click-board", "column-game", "file-explorer", "multi-select", "user-matrix"];

describe("frontend interview curriculum", () => {
  it("accepts interview path nodes and preserves explicit snippet languages", () => {
    expect(learningPathNodeSchema.parse({ kind: "interview", slug: "frontend-practice/dynamic-board" }).kind).toBe("interview");
    expect(passiveFlashcardCardSchema.parse({ id: "sample", type: "snippet", title: "A typed example", prompt: "What does this code do?", explanation: "It creates an independent empty array.", difficulty: "foundation", tags: ["typescript"], code: "const items = [];", codeLanguage: "typescript" })).toHaveProperty("codeLanguage", "typescript");
  });

  it("connects seven sourced briefs, walkthroughs, checkpoints, and terminal review", () => {
    const path = getLearningPathBySlug(pathSlug);
    expect(path?.units).toHaveLength(7);
    expect(path?.sourcePolicy).toBe("required");
    for (const [index, topic] of topics.entries()) {
      const documentSlug = `frontend/interview-${topic}`;
      const questionSlug = `frontend-practice/${topic}`;
      const exerciseSlug = `${documentSlug}-questionnaire`;
      expect(getDocumentBySlug(documentSlug)?.status).toBe("published");
      const question = getInterviewQuestionBySlug("frontend-practice", topic);
      expect(question?.kind).toBe("web");
      if (question?.kind !== "web") throw new Error(`Missing ${topic}`);
      expect(question.solutionTracks).toHaveLength(3);
      for (const track of question.solutionTracks) {
        expect(track.python?.code).toContain("def ");
        expect(track.project.files["/App.tsx"].code).toContain("export default");
        expect(track.steps.length).toBeGreaterThanOrEqual(4);
      }
      expect(getNextPathNodeRoute(pathSlug, { kind: "document", slug: documentSlug })).toBe(`/interviews/${questionSlug}?path=${pathSlug}`);
      expect(getNextPathNodeRoute(pathSlug, { kind: "interview", slug: questionSlug })).toBe(`/practice/${exerciseSlug}?path=${pathSlug}`);
      expect(getNextPathNodeRoute(pathSlug, { kind: "exercise", slug: exerciseSlug })).toBe(index === topics.length - 1 ? `/paths/${pathSlug}/flashcards` : `/docs/frontend/interview-${topics[index + 1]}?path=${pathSlug}`);
    }
    expect(getNextPathNodeRoute(pathSlug, { kind: "exercise", slug: "missing-node" })).toBeUndefined();
  });

  it("grades every checkpoint option and resolves all review references", () => {
    for (const topic of topics) {
      const exercise = getExerciseBySlug(`frontend/interview-${topic}-questionnaire`);
      expect(exercise?.type).toBe("questionnaire");
      if (exercise?.type !== "questionnaire") throw new Error(`Missing ${topic}`);
      expect(exercise.questions).toHaveLength(8);
      for (const question of exercise.questions) {
        if (question.kind === "choice") {
          expect(question.options.filter((option) => option.isCorrect)).toHaveLength(1);
          for (const option of question.options) expect(checkQuestionAnswer(question, { kind: "choice", selectedOptionId: option.id }).isCorrect).toBe(option.isCorrect);
        } else if (question.kind === "ordering") {
          expect(checkQuestionAnswer(question, { kind: "ordering", itemIds: question.correctOrder }).isCorrect).toBe(true);
          expect(checkQuestionAnswer(question, { kind: "ordering", itemIds: [...question.correctOrder].reverse() }).isCorrect).toBe(false);
        }
        expect(question.explanation.length).toBeGreaterThan(100);
      }
    }
    const feed = getPassiveFlashcardFeedByPathSlug(pathSlug);
    expect(feed?.cards).toHaveLength(42);
    for (const card of feed!.cards) {
      expect(getDocumentBySlug(card.sourceDocSlug!)?.status).toBe("published");
      if (card.code) expect(["typescript", "python"]).toContain(card.codeLanguage);
    }
    const collection = getContentIndex().interviewCollections.find((item) => item.slug === "frontend-practice");
    expect(JSON.stringify(collection)).not.toMatch(/retell|recruiter|coderpad/i);
  });
});
