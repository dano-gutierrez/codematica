import { describe, expect, it } from "vitest";
import { getDocumentBySlug, getExerciseBySlug, getLearningPathBySlug, getNextPathNodeRoute, getPassiveFlashcardFeedByPathSlug } from ".";
import { checkQuestionAnswer, type QuestionnaireAnswer } from "../practice/questionnaire";

const slug = "databases/postgres-connection-pooling";
const pathSlug = "database-indexes-and-search";

function quiz() {
  const exercise = getExerciseBySlug(`${slug}-questionnaire`);
  if (exercise?.type !== "questionnaire") throw new Error("Missing pooling questionnaire");
  return exercise;
}

describe("connection pooling learning unit", () => {
  it("connects the published lesson, checkpoint, and review cards to the existing database path", () => {
    expect(getLearningPathBySlug(pathSlug)?.units.at(-1)?.nodes).toEqual([
      { kind: "document", slug },
      { kind: "exercise", slug: `${slug}-questionnaire` },
    ]);
    expect(getDocumentBySlug(slug)?.status).toBe("published");
    expect(quiz().documentSlug).toBe(slug);
    expect(getNextPathNodeRoute(pathSlug, { kind: "exercise", slug: "databases/postgres-hybrid-search-query-questionnaire" })).toBe(`/docs/${slug}?path=${pathSlug}`);
    expect(getNextPathNodeRoute(pathSlug, { kind: "document", slug })).toBe(`/practice/${slug}-questionnaire?path=${pathSlug}`);
    const cards = getPassiveFlashcardFeedByPathSlug(pathSlug)?.cards.filter((card) => card.sourceDocSlug === slug);
    expect(cards).toHaveLength(8);
    expect(new Set(cards?.map((card) => card.type))).toEqual(new Set(["concept", "practical", "snippet", "interview"]));
  });

  it.each([
    ["direct-budget", { kind: "cloze", value: String(Math.floor((1187 - 187 - 200) / (25 * 2 * 2))) }, { kind: "cloze", value: "10" }],
    ["surge-budget", { kind: "cloze", value: String(30 * 2 * 2 * 8 + 200) }, { kind: "cloze", value: "1000" }],
    ["proxy-budget", { kind: "cloze", value: String(3 * 2 * 80 + 120) }, { kind: "cloze", value: "200" }],
    ["hold-time", { kind: "cloze", value: String(600 * 0.04) }, { kind: "cloze", value: "600" }],
  ] satisfies [string, QuestionnaireAnswer, QuestionnaireAnswer][])("grades the calculated %s answer and rejects the tempting shortcut", (id, right, wrong) => {
    const question = quiz().questions.find((question) => question.id === id);
    expect(question).toBeDefined();
    expect(checkQuestionAnswer(question!, right).isCorrect).toBe(true);
    expect(checkQuestionAnswer(question!, wrong).isCorrect).toBe(false);
  });

  it("pins failure-mode decisions instead of accepting arbitrary configured answers", () => {
    const decisions: Record<string, string> = {
      multiplexing: "reuse-after-transaction",
      "session-state": "test-exact-features",
      "termination-window": "best-effort",
      "spot-placement": "stable-baseline",
      "saturated-database": "reduce-work",
      "ambiguous-commit": "reconcile",
    };
    expect(quiz().questions).toHaveLength(12);
    for (const [id, correct] of Object.entries(decisions)) {
      const question = quiz().questions.find((item) => item.id === id);
      if (question?.kind !== "choice") throw new Error(`Missing choice ${id}`);
      for (const option of question.options) {
        expect(checkQuestionAnswer(question, { kind: "choice", selectedOptionId: option.id }).isCorrect).toBe(option.id === correct);
      }
    }
    const shutdown = quiz().questions.find((item) => item.id === "shutdown-order");
    if (!shutdown) throw new Error("Missing shutdown question");
    expect(checkQuestionAnswer(shutdown, { kind: "ordering", itemIds: ["stop", "drain", "close", "exit"] }).isCorrect).toBe(true);
    expect(checkQuestionAnswer(shutdown, { kind: "ordering", itemIds: ["close", "stop", "drain", "exit"] }).isCorrect).toBe(false);
    const modes = quiz().questions.find((item) => item.id === "pooling-modes");
    if (!modes) throw new Error("Missing pooling modes question");
    expect(checkQuestionAnswer(modes, { kind: "matching", selectedMatches: { session: "session", transaction: "transaction", statement: "statement" } }).isCorrect).toBe(true);
    expect(checkQuestionAnswer(modes, { kind: "matching", selectedMatches: { session: "transaction", transaction: "session", statement: "statement" } }).isCorrect).toBe(false);
  });
});
