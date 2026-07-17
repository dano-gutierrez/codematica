import type { LearningExercise, QuestionnaireQuestion } from "../content/schema";

export type QuestionnaireExercise = Extract<LearningExercise, { type: "questionnaire" }>;

export type MatchingAttemptItem = {
  id: string;
  label: string;
};

export type QuestionnaireAttemptQuestion =
  | Extract<QuestionnaireQuestion, { kind: "choice" }>
  | Extract<QuestionnaireQuestion, { kind: "cloze" }>
  | Extract<QuestionnaireQuestion, { kind: "ordering" }>
  | (Extract<QuestionnaireQuestion, { kind: "matching" }> & {
      leftItems: MatchingAttemptItem[];
      rightItems: MatchingAttemptItem[];
    });

export type QuestionnaireAnswer =
  | { kind: "choice"; selectedOptionId: string }
  | { kind: "cloze"; value: string }
  | { kind: "ordering"; itemIds: string[] }
  | { kind: "matching"; selectedMatches: Record<string, string> };

export type QuestionnaireAnswerResult = {
  isCorrect: boolean;
  correctAnswer: string;
};

type RandomFn = () => number;

export function shuffleItems<T>(items: readonly T[], random: RandomFn = Math.random) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function createQuestionnaireAttempt(exercise: QuestionnaireExercise, random: RandomFn = Math.random): QuestionnaireAttemptQuestion[] {
  return shuffleItems(exercise.questions, random).map((question) => {
    if (question.kind === "choice") {
      return {
        ...question,
        options: shuffleItems(question.options, random),
      };
    }

    if (question.kind === "ordering") {
      return {
        ...question,
        items: shuffleItems(question.items, random),
      };
    }

    if (question.kind === "matching") {
      return {
        ...question,
        leftItems: shuffleItems(
          question.pairs.map((pair) => ({ id: pair.id, label: pair.prompt })),
          random,
        ),
        rightItems: shuffleItems(
          question.pairs.map((pair) => ({ id: pair.id, label: pair.match })),
          random,
        ),
      };
    }

    return question;
  });
}

export function checkQuestionAnswer(question: QuestionnaireQuestion, answer: QuestionnaireAnswer): QuestionnaireAnswerResult {
  if (question.kind !== answer.kind) {
    return {
      isCorrect: false,
      correctAnswer: correctAnswerText(question),
    };
  }

  if (question.kind === "choice" && answer.kind === "choice") {
    const correctOption = question.options.find((option) => option.isCorrect);

    return {
      isCorrect: correctOption?.id === answer.selectedOptionId,
      correctAnswer: correctOption?.label ?? "",
    };
  }

  if (question.kind === "cloze" && answer.kind === "cloze") {
    const normalizedAnswer = normalizeText(answer.value);
    const isCorrect = question.acceptedAnswers.some((acceptedAnswer) => normalizeText(acceptedAnswer) === normalizedAnswer);

    return {
      isCorrect,
      correctAnswer: question.acceptedAnswers[0] ?? "",
    };
  }

  if (question.kind === "ordering" && answer.kind === "ordering") {
    return {
      isCorrect: question.correctOrder.every((itemId, index) => answer.itemIds[index] === itemId),
      correctAnswer: correctAnswerText(question),
    };
  }

  if (question.kind === "matching" && answer.kind === "matching") {
    return {
      isCorrect: question.pairs.every((pair) => answer.selectedMatches[pair.id] === pair.id),
      correctAnswer: correctAnswerText(question),
    };
  }

  return {
    isCorrect: false,
    correctAnswer: correctAnswerText(question),
  };
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function correctAnswerText(question: QuestionnaireQuestion) {
  if (question.kind === "choice") {
    return question.options.find((option) => option.isCorrect)?.label ?? "";
  }

  if (question.kind === "cloze") {
    return question.acceptedAnswers[0] ?? "";
  }

  if (question.kind === "ordering") {
    const itemsById = new Map(question.items.map((item) => [item.id, item.label]));
    return question.correctOrder.map((itemId) => itemsById.get(itemId) ?? itemId).join(" -> ");
  }

  return question.pairs.map((pair) => `${pair.prompt} -> ${pair.match}`).join("; ");
}
