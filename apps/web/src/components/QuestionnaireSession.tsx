"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, CheckCircle2, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Dropdown, type DropdownOption } from "@/components/Dropdown";
import {
  checkQuestionAnswer,
  createQuestionnaireAttempt,
  type QuestionnaireAnswer,
  type QuestionnaireAnswerResult,
  type QuestionnaireAttemptQuestion,
  type QuestionnaireExercise,
} from "@/lib/practice/questionnaire";
import type { ProgressStatus } from "@/lib/progress/progress";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    __codematicaQuestionnaireRandom?: () => number;
  }
}

export function QuestionnaireSession({
  exercise,
  nextHref,
  onProgressEvent,
}: {
  exercise: QuestionnaireExercise;
  nextHref?: string;
  onProgressEvent?: (status: ProgressStatus, position: Record<string, unknown>) => void;
}) {
  const mountedExercise = useRef(exercise);
  const sessionRef = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(() => createStableInitialAttempt(exercise));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState<QuestionnaireAnswer | undefined>();
  const [result, setResult] = useState<QuestionnaireAnswerResult | undefined>();
  const [isComplete, setIsComplete] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const question = attempt[currentIndex];

  function resetAnswer(nextAnswer?: QuestionnaireAnswer) {
    setAnswer(nextAnswer);
    setResult(undefined);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAttempt(createQuestionnaireAttempt(mountedExercise.current, questionnaireRandom));
      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isReady || isComplete) {
      return;
    }

    onProgressEvent?.("started", { questionIndex: currentIndex, totalQuestions: attempt.length });
  }, [attempt.length, currentIndex, isComplete, isReady, onProgressEvent]);

  useEffect(() => {
    const node = sessionRef.current;

    if (!node) {
      return;
    }

    const rootNode = node;

    function handleOrderingMove(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : undefined;
      const button = target?.closest<HTMLButtonElement>("button[data-order-direction]");

      if (!button || !rootNode.contains(button) || button.disabled) {
        return;
      }

      const currentQuestion = attempt[currentIndex];

      if (currentQuestion?.kind !== "ordering") {
        return;
      }

      const itemIndex = Number(button.dataset.orderIndex);
      const direction = button.dataset.orderDirection === "up" ? -1 : 1;
      const currentItemIds = answer?.kind === "ordering" ? answer.itemIds : currentQuestion.items.map((item) => item.id);
      const nextIndex = itemIndex + direction;

      if (!Number.isInteger(itemIndex) || nextIndex < 0 || nextIndex >= currentItemIds.length) {
        return;
      }

      const nextItemIds = [...currentItemIds];
      [nextItemIds[itemIndex], nextItemIds[nextIndex]] = [nextItemIds[nextIndex], nextItemIds[itemIndex]];
      resetAnswer({ kind: "ordering", itemIds: nextItemIds });
    }

    rootNode.addEventListener("click", handleOrderingMove);

    return () => rootNode.removeEventListener("click", handleOrderingMove);
  }, [answer, attempt, currentIndex]);

  function checkAnswer() {
    const currentAnswer = getEffectiveAnswer(question, answer, sessionRef.current);

    if (!currentAnswer) {
      return;
    }

    setResult(checkQuestionAnswer(question, currentAnswer));
  }

  function advance() {
    if (currentIndex + 1 >= attempt.length) {
      onProgressEvent?.("completed", { questionIndex: currentIndex, totalQuestions: attempt.length });
      setIsComplete(true);
      return;
    }

    setCurrentIndex((value) => value + 1);
    setAnswer(undefined);
    setResult(undefined);
  }

  function restart() {
    setAttempt(createQuestionnaireAttempt(exercise, questionnaireRandom));
    setCurrentIndex(0);
    setAnswer(undefined);
    setResult(undefined);
    setIsComplete(false);
  }

  function renderQuestionBody() {
    if (question.kind === "choice") {
      return (
        <div className="mt-5 grid gap-3">
          {question.options.map((option) => (
            <label
              key={option.id}
              className="grid min-h-14 cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-3 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-4 py-3 text-left text-base font-extrabold leading-6 text-[#263238]"
              data-testid={`questionnaire-choice-${option.id}`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.id}
                disabled={!isReady || Boolean(result)}
                className="h-5 w-5 accent-[#007c78] disabled:opacity-60"
              />
              {option.label}
            </label>
          ))}
        </div>
      );
    }

    if (question.kind === "cloze") {
      const [prefix, suffix] = question.template.split("{{blank}}");

      return (
        <div className="mt-5 rounded-lg border-2 border-[#d5e2e8] bg-[#f6fbfc] p-4 text-lg font-extrabold leading-9 text-[#263238]">
          <span>{prefix}</span>
          <label className="mx-1 inline-grid min-w-[12rem] align-middle">
            <span className="sr-only">Answer</span>
            <input
              disabled={!isReady || Boolean(result)}
              aria-label="Answer"
              className="h-11 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 text-base font-extrabold text-[#263238] outline-none focus:border-[#007c78] disabled:opacity-70"
              data-testid="questionnaire-cloze-answer-input"
            />
          </label>
          <span>{suffix}</span>
        </div>
      );
    }

    if (question.kind === "ordering") {
      const itemIds = answer?.kind === "ordering" ? answer.itemIds : question.items.map((item) => item.id);
      const itemsById = new Map(question.items.map((item) => [item.id, item]));

      return (
        <div className="mt-5 grid gap-3">
          {itemIds.map((itemId, itemIndex) => {
            const item = itemsById.get(itemId);
            const label = item?.label ?? itemId;

            return (
              <div key={itemId} className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-3">
                <span className="self-center text-base font-extrabold leading-6 text-[#263238]">{label}</span>
                <span className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!isReady || Boolean(result) || itemIndex === 0}
                    aria-label={`Move ${label} up`}
                    data-order-direction="up"
                    data-order-index={itemIndex}
                    className="flex h-11 items-center justify-center rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#f6fbfc] text-[#263238] disabled:opacity-45"
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={!isReady || Boolean(result) || itemIndex === itemIds.length - 1}
                    aria-label={`Move ${label} down`}
                    data-order-direction="down"
                    data-order-index={itemIndex}
                    className="flex h-11 items-center justify-center rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#f6fbfc] text-[#263238] disabled:opacity-45"
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    const selectedMatches = answer?.kind === "matching" ? answer.selectedMatches : {};

    return (
      <div className="mt-5 grid gap-3">
        {question.leftItems.map((leftItem) => (
          <div key={leftItem.id} className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-3">
            <Dropdown
              label={`Match for ${leftItem.label}`}
              value={selectedMatches[leftItem.id] ?? ""}
              options={question.rightItems.map(
                (rightItem) =>
                  ({
                    value: rightItem.id,
                    label: rightItem.label,
                  }) satisfies DropdownOption,
              )}
              onValueChange={(nextValue) =>
                resetAnswer({
                  kind: "matching",
                  selectedMatches: {
                    ...selectedMatches,
                    [leftItem.id]: nextValue,
                  },
                })
              }
              disabled={!isReady || Boolean(result)}
              placeholder="Choose match"
              testId={`questionnaire-match-${leftItem.id}`}
              triggerClassName="bg-[#f6fbfc]"
            />
          </div>
        ))}
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="mt-6 grid gap-5" data-testid="questionnaire-complete">
        <div className="rounded-lg border-2 border-b-4 border-[#6dd8cf] bg-[#e8f8f6] p-4">
          <p className="text-sm font-extrabold uppercase text-[#007c78]">Refresh complete</p>
          <p className="mt-2 text-base font-semibold leading-7 text-[#33434b]">You reached the end of this Python practice session.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={restart}
            className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-4 py-2 text-sm font-extrabold text-[#263238]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Restart
          </button>
          {nextHref ? <NextNodeLink href={nextHref} /> : null}
        </div>
      </div>
    );
  }

  const canCheck = isReady && !result;

  return (
    <div className="mt-6" data-testid="questionnaire-session" data-ready={isReady ? "true" : "false"} ref={sessionRef}>
      <div className="flex items-center justify-between gap-3 rounded-lg border-2 border-[#d5e2e8] bg-[#f6fbfc] px-3 py-2">
        <p className="text-xs font-extrabold uppercase text-[#68737d]" data-testid="questionnaire-position">
          Question {currentIndex + 1} of {attempt.length}
        </p>
        <p className="text-xs font-extrabold uppercase text-[#007c78]">{question.kind}</p>
      </div>

      <div className="mt-5" data-testid="questionnaire-question">
        <p className="text-lg font-bold leading-8 text-[#33434b]">{question.prompt}</p>
        {renderQuestionBody()}
      </div>

      {result ? <QuestionFeedback question={question} result={result} /> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={checkAnswer}
          disabled={!canCheck}
          className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-65 disabled:hover:translate-y-0"
          data-testid="questionnaire-check"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Check answer
        </button>

        {result ? (
          <button
            type="button"
            onClick={advance}
            className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#1d4e9e] bg-[#245fba] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
            data-testid={currentIndex + 1 >= attempt.length ? "questionnaire-finish" : "questionnaire-next"}
          >
            {currentIndex + 1 >= attempt.length ? "Finish" : "Next"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function createStableInitialAttempt(exercise: QuestionnaireExercise) {
  return createQuestionnaireAttempt(exercise, () => 0.999999);
}

function questionnaireRandom() {
  return window.__codematicaQuestionnaireRandom?.() ?? Math.random();
}

function QuestionFeedback({ question, result }: { question: QuestionnaireAttemptQuestion; result: QuestionnaireAnswerResult }) {
  return (
    <div
      className={cn(
        "mt-5 rounded-lg border-2 border-b-4 p-4",
        result.isCorrect ? "border-[#6dd8cf] bg-[#e8f8f6]" : "border-[#f7cf5d] bg-[#fff5d6]",
      )}
      data-testid="questionnaire-feedback"
    >
      <p className={cn("text-sm font-extrabold", result.isCorrect ? "text-[#007c78]" : "text-[#7a5200]")}>
        {result.isCorrect ? "Correct" : "Review this"}
      </p>
      {!result.isCorrect || question.kind !== "choice" ? (
        <p className="mt-2 text-sm font-extrabold leading-6 text-[#263238]">Correct answer: {result.correctAnswer}</p>
      ) : null}
      <p className="mt-2 text-sm font-semibold leading-6 text-[#33434b]">{question.explanation}</p>
    </div>
  );
}

function getEffectiveAnswer(question: QuestionnaireAttemptQuestion, answer?: QuestionnaireAnswer, sessionNode?: HTMLDivElement | null): QuestionnaireAnswer | undefined {
  if (question.kind === "choice") {
    const selectedOption = sessionNode?.querySelector<HTMLInputElement>(`input[name="question-${question.id}"]:checked`);
    return {
      kind: "choice",
      selectedOptionId: selectedOption?.value ?? "",
    };
  }

  if (question.kind === "cloze") {
    const input = sessionNode?.querySelector<HTMLInputElement>('[data-testid="questionnaire-cloze-answer-input"]');
    return {
      kind: "cloze",
      value: input?.value ?? "",
    };
  }

  if (question.kind === "ordering") {
    if (answer?.kind === "ordering") {
      return answer;
    }

    return {
      kind: "ordering",
      itemIds: question.items.map((item) => item.id),
    };
  }

  if (answer?.kind === "matching") {
    return answer;
  }

  return {
    kind: "matching",
    selectedMatches: {},
  };
}

function NextNodeLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#1d4e9e] bg-[#245fba] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
    >
      Next node
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}
