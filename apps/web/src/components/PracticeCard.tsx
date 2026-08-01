"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { DifficultyPill } from "@/components/DifficultyPill";
import { JapaneseWritingPractice } from "@/components/JapaneseWritingPractice";
import { QuestionnaireSession } from "@/components/QuestionnaireSession";
import { getLanguageCharacterBySlug } from "@/lib/content";
import type { LearningExercise } from "@/lib/content/schema";
import type { ProgressStatus } from "@/lib/progress/progress";
import { cn } from "@/lib/utils";

type PracticeProgressHandler = (status: ProgressStatus, position: Record<string, unknown>) => void;

export function PracticeCard({
  exercise,
  nextHref,
  onProgressEvent,
}: {
  exercise: LearningExercise;
  nextHref?: string;
  onProgressEvent?: PracticeProgressHandler;
}) {
  return (
    <section className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 sm:p-7" data-testid="practice-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#f6fbfc] px-2.5 py-1 text-xs font-extrabold text-[#5840b8]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {exerciseKindLabel(exercise)}
        </span>
        <DifficultyPill difficulty={exercise.difficulty} />
        <span className="rounded-lg bg-[#eaf7f4] px-2.5 py-1 text-xs font-extrabold text-[#007c78]">{exercise.concept}</span>
      </div>

      <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-5xl">{exercise.title}</h1>

      {exercise.type === "flashcard" ? (
        <Flashcard exercise={exercise} nextHref={nextHref} onProgressEvent={onProgressEvent} />
      ) : exercise.type === "cloze" ? (
        <ClozeCard exercise={exercise} nextHref={nextHref} onProgressEvent={onProgressEvent} />
      ) : exercise.type === "writing" ? (
        <WritingCard exercise={exercise} nextHref={nextHref} onProgressEvent={onProgressEvent} />
      ) : (
        <QuestionnaireSession exercise={exercise} nextHref={nextHref} onProgressEvent={onProgressEvent} />
      )}
    </section>
  );
}

function exerciseKindLabel(exercise: LearningExercise) {
  if (exercise.type === "flashcard") {
    return "Flashcard";
  }

  if (exercise.type === "cloze") {
    return "Fill the gap";
  }

  if (exercise.type === "writing") {
    return "Writing";
  }

  return "Questionnaire";
}

function Flashcard({
  exercise,
  nextHref,
  onProgressEvent,
}: {
  exercise: Extract<LearningExercise, { type: "flashcard" }>;
  nextHref?: string;
  onProgressEvent?: PracticeProgressHandler;
}) {
  const [isRevealed, setIsRevealed] = useState(false);

  function revealAnswer() {
    setIsRevealed(true);
    onProgressEvent?.("completed", { revealed: true });
  }

  return (
    <div className="mt-6">
      <p className="text-lg font-bold leading-8 text-[#33434b]">{exercise.prompt}</p>

      {isRevealed ? (
        <div className="mt-5 grid gap-3 rounded-lg border-2 border-[#d5e2e8] bg-[#f6fbfc] p-4">
          <p className="text-xs font-extrabold uppercase text-[#68737d]">Answer</p>
          <p className="text-lg font-extrabold leading-8 text-[#263238]">{exercise.answer}</p>
          <p className="text-sm font-semibold leading-6 text-[#68737d]">{exercise.explanation}</p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={revealAnswer}
          className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-65 disabled:hover:translate-y-0"
          disabled={isRevealed}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Reveal answer
        </button>
        {isRevealed ? (
          <button
            type="button"
            onClick={() => setIsRevealed(false)}
            className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-4 py-2 text-sm font-extrabold text-[#263238]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </button>
        ) : null}
        {isRevealed && nextHref ? <NextLink href={nextHref} /> : null}
      </div>
    </div>
  );
}

function ClozeCard({
  exercise,
  nextHref,
  onProgressEvent,
}: {
  exercise: Extract<LearningExercise, { type: "cloze" }>;
  nextHref?: string;
  onProgressEvent?: PracticeProgressHandler;
}) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"correct" | "incorrect" | undefined>();
  const [prefix, suffix] = exercise.template.split("{{blank}}");
  const normalizedAnswer = answer.trim().toLowerCase();
  const isCorrect = exercise.acceptedAnswers.some((acceptedAnswer) => acceptedAnswer.trim().toLowerCase() === normalizedAnswer);

  function checkAnswer() {
    setResult(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      onProgressEvent?.("completed", { correct: true });
    }
  }

  return (
    <div className="mt-6">
      <p className="text-lg font-bold leading-8 text-[#33434b]">{exercise.prompt}</p>

      <div className="mt-5 rounded-lg border-2 border-[#d5e2e8] bg-[#f6fbfc] p-4 text-lg font-extrabold leading-9 text-[#263238]">
        <span>{prefix}</span>
        <label className="mx-1 inline-grid min-w-[12rem] align-middle">
          <span className="sr-only">Answer</span>
          <input
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value);
              setResult(undefined);
            }}
            aria-label="Answer"
            className="h-11 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 text-base font-extrabold text-[#263238] outline-none focus:border-[#007c78]"
            data-testid="cloze-answer-input"
          />
        </label>
        <span>{suffix}</span>
      </div>

      {result ? (
        <div
          className={cn(
            "mt-5 rounded-lg border-2 border-b-4 p-4",
            result === "correct" ? "border-[#6dd8cf] bg-[#e8f8f6]" : "border-[#f7cf5d] bg-[#fff5d6]",
          )}
          data-testid="cloze-feedback"
        >
          <p className={cn("text-sm font-extrabold", result === "correct" ? "text-[#007c78]" : "text-[#7a5200]")}>
            {result === "correct" ? "Correct" : "Try again"}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#33434b]">{exercise.explanation}</p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={checkAnswer}
          className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Check answer
        </button>
        {result && nextHref ? <NextLink href={nextHref} /> : null}
      </div>
    </div>
  );
}

function WritingCard({
  exercise,
  nextHref,
  onProgressEvent,
}: {
  exercise: Extract<LearningExercise, { type: "writing" }>;
  nextHref?: string;
  onProgressEvent?: PracticeProgressHandler;
}) {
  const characters = exercise.characterSlugs.flatMap((slug) => {
    const character = getLanguageCharacterBySlug(slug);
    return character ? [character] : [];
  });
  return <JapaneseWritingPractice characters={characters} prompt={exercise.prompt} modes={exercise.modes} nextHref={nextHref} onProgressEvent={onProgressEvent} />;
}

function NextLink({ href }: { href: string }) {
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
