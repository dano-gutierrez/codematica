import { describe, expect, it } from "vitest";
import { calculateQuestionnaireSkillScores, checkQuestionAnswer, createQuestionnaireAttempt } from "./questionnaire";
import type { LearningExercise } from "../content/schema";

const questionnaire = {
  id: "practice-python",
  slug: "programming/python-runtime-questionnaire",
  title: "Python Runtime Questionnaire",
  documentSlug: "programming/python-runtime-model",
  concept: "Python runtime model",
  difficulty: "senior" as const,
  tags: ["python", "javascript"],
  status: "published" as const,
  route: "/practice/programming/python-runtime-questionnaire",
  sourcePath: "content/exercises/programming/python-runtime-questionnaire.json",
  contentHash: "hash",
  type: "questionnaire" as const,
  questions: [
    {
      id: "choice-runtime",
      kind: "choice" as const,
      prompt: "Which review note best describes Python annotations at runtime?",
      options: [
        { id: "compile", label: "They block execution like TypeScript compile errors.", isCorrect: false },
        { id: "metadata", label: "They are metadata for tools unless code explicitly inspects them.", isCorrect: true },
        { id: "jit", label: "They drive runtime JIT specialization.", isCorrect: false },
      ],
      explanation: "Python keeps annotations available to tools, but they do not enforce values by themselves.",
    },
    {
      id: "cloze-runtime",
      kind: "cloze" as const,
      prompt: "Fill the gap.",
      template: "Use {{blank}} at the trust boundary instead of assuming annotations validate input.",
      acceptedAnswers: ["runtime validation", "validation"],
      explanation: "Python annotations are not a substitute for runtime parsing of untrusted data.",
    },
    {
      id: "order-runtime",
      kind: "ordering" as const,
      prompt: "Order the boundary flow.",
      items: [
        { id: "receive", label: "Receive unknown input" },
        { id: "validate", label: "Validate and normalize" },
        { id: "use", label: "Use typed domain model" },
      ],
      correctOrder: ["receive", "validate", "use"],
      explanation: "The boundary should narrow unknown data before domain code depends on it.",
    },
    {
      id: "match-runtime",
      kind: "matching" as const,
      prompt: "Match the Python concept to the JS/TS comparison.",
      pairs: [
        { id: "dict", prompt: "dict", match: "plain object or Map depending on key needs" },
        { id: "none", prompt: "None", match: "null-like singleton" },
      ],
      explanation: "The comparisons are useful starting points, but each has runtime differences.",
    },
  ],
} satisfies LearningExercise;

describe("questionnaire helpers", () => {
  it("calculates per-skill and overall checkpoint scores", () => {
    expect(calculateQuestionnaireSkillScores([
      { question: { ...questionnaire.questions[0], skillIds: ["systems-thinking", "quantitative-reasoning"] }, isCorrect: true },
      { question: { ...questionnaire.questions[1], skillIds: ["quantitative-reasoning"] }, isCorrect: false },
    ])).toEqual({ overall: 0.5, skills: { "systems-thinking": 1, "quantitative-reasoning": 0.5 } });
  });

  it("creates a shuffled attempt without mutating source questions", () => {
    const randomValues = [0.9, 0.1, 0.8, 0.2, 0.7, 0.3, 0.6, 0.4, 0.5];
    const attempt = createQuestionnaireAttempt(questionnaire, () => randomValues.shift() ?? 0.5);

    expect(attempt).toHaveLength(4);
    expect(attempt.map((question) => question.id)).not.toEqual(questionnaire.questions.map((question) => question.id));
    const firstQuestion = questionnaire.questions[0];

    expect(firstQuestion?.kind).toBe("choice");
    expect(firstQuestion?.kind === "choice" ? firstQuestion.options.map((option) => option.id) : []).toEqual(["compile", "metadata", "jit"]);
  });

  it("checks answers for all questionnaire question kinds", () => {
    const [choice, cloze, ordering, matching] = questionnaire.questions;

    expect(checkQuestionAnswer(choice, { kind: "choice", selectedOptionId: "metadata" }).isCorrect).toBe(true);
    expect(checkQuestionAnswer(cloze, { kind: "cloze", value: " Runtime Validation " }).isCorrect).toBe(true);
    expect(checkQuestionAnswer(ordering, { kind: "ordering", itemIds: ["receive", "validate", "use"] }).isCorrect).toBe(true);
    expect(
      checkQuestionAnswer(matching, {
        kind: "matching",
        selectedMatches: { dict: "dict", none: "none" },
      }).isCorrect,
    ).toBe(true);
  });

  it("returns useful correct answer text for feedback", () => {
    const ordering = questionnaire.questions[2];
    const result = checkQuestionAnswer(ordering, { kind: "ordering", itemIds: ["validate", "receive", "use"] });

    expect(result).toEqual({
      isCorrect: false,
      correctAnswer: "Receive unknown input -> Validate and normalize -> Use typed domain model",
    });
  });

  it("rejects mismatched and incorrect answers with feedback for every kind", () => {
    const [choice, cloze, ordering, matching] = questionnaire.questions;
    expect(checkQuestionAnswer(choice, { kind: "cloze", value: "metadata" })).toMatchObject({ isCorrect: false, correctAnswer: expect.stringContaining("metadata") });
    expect(checkQuestionAnswer(choice, { kind: "choice", selectedOptionId: "missing" }).isCorrect).toBe(false);
    expect(checkQuestionAnswer(cloze, { kind: "cloze", value: "not validation" })).toEqual({ isCorrect: false, correctAnswer: "runtime validation" });
    expect(checkQuestionAnswer(ordering, { kind: "ordering", itemIds: ["receive"] }).isCorrect).toBe(false);
    expect(checkQuestionAnswer(matching, { kind: "matching", selectedMatches: { dict: "none", none: "dict" } })).toEqual({
      isCorrect: false,
      correctAnswer: "dict -> plain object or Map depending on key needs; None -> null-like singleton",
    });
  });

  it("falls back safely when authored answer labels are missing", () => {
    const noCorrect = { ...questionnaire.questions[0], options: questionnaire.questions[0].kind === "choice" ? questionnaire.questions[0].options.map((option) => ({ ...option, isCorrect: false })) : [] };
    expect(checkQuestionAnswer(noCorrect, { kind: "choice", selectedOptionId: "anything" })).toEqual({ isCorrect: false, correctAnswer: "" });
    const emptyCloze = { ...questionnaire.questions[1], acceptedAnswers: [] };
    expect(checkQuestionAnswer(emptyCloze, { kind: "cloze", value: "" })).toEqual({ isCorrect: false, correctAnswer: "" });
  });
});
