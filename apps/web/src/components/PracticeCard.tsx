"use client";

import { Button } from "./Button";
import { ButtonLink } from "./ButtonLink";
import { ArrowRight, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DifficultyPill } from "@/components/DifficultyPill";
import { JapaneseWritingPractice } from "@/components/JapaneseWritingPractice";
import { QuestionnaireSession } from "@/components/QuestionnaireSession";
import { getLanguageCharacterBySlug } from "@/lib/content";
import type { LearningExercise } from "@/lib/content/schema";
import type { ProgressStatus } from "@/lib/progress/progress";
import { cn } from "@/lib/utils";

type PracticeProgressHandler = (status: ProgressStatus, position: Record<string, unknown>) => void | Promise<void>;

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
    <section className="py-2" data-testid="practice-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-xl border border-[#d5e2e8] bg-[#f6fbfc] px-2.5 py-1 text-xs font-semibold text-[#5840b8]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {exerciseKindLabel(exercise)}
        </span>
        <DifficultyPill difficulty={exercise.difficulty} />
        <span className="rounded-xl bg-[#eaf7f4] px-2.5 py-1 text-xs font-semibold text-[#007c78]">{exercise.concept}</span>
      </div>

      <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-[#263238] sm:text-4xl">{exercise.title}</h1>

      {exercise.type === "flashcard" ? (
        <Flashcard exercise={exercise} nextHref={nextHref} onProgressEvent={onProgressEvent} />
      ) : exercise.type === "cloze" ? (
        <ClozeCard exercise={exercise} nextHref={nextHref} onProgressEvent={onProgressEvent} />
      ) : exercise.type === "writing" ? (
        <WritingCard exercise={exercise} nextHref={nextHref} onProgressEvent={onProgressEvent} />
      ) : exercise.type === "guided-lab" ? (
        <GuidedLab exercise={exercise} nextHref={nextHref} onProgressEvent={onProgressEvent} />
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

  if (exercise.type === "guided-lab") return "Guided lab";

  return "Questionnaire";
}

function GuidedLab({
  exercise,
  nextHref,
  onProgressEvent,
}: {
  exercise: Extract<LearningExercise, { type: "guided-lab" }>;
  nextHref?: string;
  onProgressEvent?: PracticeProgressHandler;
}) {
  const [predictionId, setPredictionId] = useState<string>();
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const complete = Boolean(predictionId) && evidenceIds.length === exercise.evidenceChecklist.length;
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [startFailed, setStartFailed] = useState(false);
  const busy = useRef(false);
  const acknowledged = useRef(false);
  const version = useRef(0);
  const mounted = useRef(true);
  const completionHeading = useRef<HTMLHeadingElement>(null);
  const firstPrediction = useRef<HTMLInputElement>(null);
  const restorePredictionFocus = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (saved) completionHeading.current?.focus();
    else if (restorePredictionFocus.current) { restorePredictionFocus.current = false; firstPrediction.current?.focus(); }
  }, [saved]);

  async function choosePrediction(id: string) {
    if (busy.current || acknowledged.current) return;
    setPredictionId(id);
    setStartFailed(false);
    const request = ++version.current;
    try { await onProgressEvent?.("started", { predictionCommitted: true }); }
    catch { if (mounted.current && request === version.current) setStartFailed(true); }
  }

  async function finish() {
    if (!complete || busy.current || acknowledged.current) return;
    busy.current = true;
    const request = ++version.current;
    setSaving(true); setFailed(false); setStartFailed(false);
    try {
      await onProgressEvent?.("completed", { predictionCommitted: true, evidenceCount: evidenceIds.length, evidenceTotal: exercise.evidenceChecklist.length });
      if (mounted.current && request === version.current) { acknowledged.current = true; setSaved(true); }
    } catch { if (mounted.current && request === version.current) setFailed(true); }
    finally { busy.current = false; if (mounted.current && request === version.current) setSaving(false); }
  }

  function restart() {
    if (busy.current) return;
    version.current++; acknowledged.current = false; restorePredictionFocus.current = true;
    setSaved(false); setFailed(false); setStartFailed(false);
    setPredictionId(undefined); setEvidenceIds([]); setNotes({});
  }


  function toggleEvidence(id: string) {
    setEvidenceIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <div className="mt-6 grid gap-6" data-testid="guided-lab-session">
      <div className="rounded-xl border border-[#d5e2e8] bg-[#f6fbfc] p-4">
        <p className="text-sm font-semibold uppercase text-[#007c78]">Briefing · about {exercise.estimatedMinutes} minutes</p>
        <p className="mt-2 text-base font-normal leading-7 text-[#33434b]">{exercise.briefing}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-normal leading-6 text-[#53616c]">{exercise.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
      </div>

      <fieldset className="rounded-xl border border-[#f7cf5d] bg-[#fffaf0] p-4">
        <legend className="px-2 text-sm font-semibold uppercase text-[#7a5200]">Choose your prediction</legend>
        <p className="text-base font-normal leading-7 text-[#263238]">{exercise.prediction.prompt}</p>
        <div className="mt-3 grid gap-2">
          {exercise.prediction.options.map((option, index) => (
            <label key={option.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[#d2bd76] bg-white px-3 py-2 text-sm font-medium text-[#33434b]">
              <input ref={index === 0 ? firstPrediction : undefined} type="radio" name="prediction" disabled={saving || saved} checked={predictionId === option.id} onChange={() => void choosePrediction(option.id)} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <ol className="grid gap-3">
        {exercise.steps.map((step, index) => (
          <li key={step.id} className="rounded-xl border border-[#d5e2e8] bg-white p-4">
            <p className="text-xs font-semibold uppercase text-[#68737d]">Step {index + 1}</p>
            <h2 className="mt-1 text-xl font-semibold text-[#263238]">{step.title}</h2>
            <p className="mt-2 text-sm font-normal leading-6 text-[#53616c]">{step.instructions}</p>
          </li>
        ))}
      </ol>

      <fieldset className="rounded-xl border border-[#6dd8cf] bg-[#e8f8f6] p-4">
        <legend className="px-2 text-sm font-semibold uppercase text-[#00645f]">Evidence checklist</legend>
        <div className="grid gap-2">
          {exercise.evidenceChecklist.map((item) => (
            <label key={item.id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-[#33434b]">
              <input type="checkbox" disabled={saving || saved} checked={evidenceIds.includes(item.id)} onChange={() => toggleEvidence(item.id)} />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="rounded-xl border border-[#c8b8ff] bg-[#f3efff] p-4">
        <h2 className="text-sm font-semibold uppercase text-[#5840b8]">Reflect, then extend</h2>
        {exercise.reflectionPrompts.map((prompt) => <label key={prompt} className="mt-3 block text-sm font-medium leading-6 text-[#33434b]">{prompt}<textarea value={notes[prompt] ?? ""} onChange={event => { const value = event.target.value; setNotes(current => ({ ...current, [prompt]: value })); }} className="mt-1 ui-input min-h-24" /></label>)}
        <p className="mt-4 text-sm font-normal leading-6 text-[#53616c]"><span className="font-semibold">Extension:</span> {exercise.extensionChallenge}</p>
      </div>

      {saving ? <p role="status">Completing lab…</p> : null}
      {failed ? <p role="alert" className="ui-notice ui-notice-danger">Couldn’t save progress. Your choices and working notes are still here.</p> : startFailed ? <p role="alert" className="ui-notice ui-notice-danger">Couldn’t save progress. Keep working and retry when completing the lab.</p> : null}
      {saved ? <div className="ui-notice ui-notice-success"><h2 ref={completionHeading} tabIndex={-1} className="text-xl font-semibold">Lab complete.</h2></div> : null}
      <div className="ui-actions">
        {saved ? <Button key="restart" label="Practice again" icon={RotateCcw} tone="warning" variant="quiet" onClick={restart} /> : <Button key="complete" label={failed ? "Retry completion" : "Complete lab"} icon={CheckCircle2} tone={failed ? "warning" : "success"} variant="primary" disabled={!complete} busy={saving} onClick={() => void finish()} data-testid="guided-lab-complete" />}
        {complete && nextHref ? <NextLink href={nextHref} label={nextHref.endsWith("/flashcards") ? "Start review feed" : "Next activity"} /> : null}
      </div>
    </div>
  );
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
      <p className="text-lg font-medium leading-8 text-[#33434b]">{exercise.prompt}</p>

      {isRevealed ? (
        <div className="mt-5 grid gap-3 rounded-xl border border-[#d5e2e8] bg-[#f6fbfc] p-4">
          <p className="text-xs font-semibold uppercase text-[#68737d]">Answer</p>
          <p className="text-lg font-normal leading-8 text-[#263238]">{exercise.answer}</p>
          <p className="text-sm font-normal leading-6 text-[#68737d]">{exercise.explanation}</p>
        </div>
      ) : null}

      <div className="ui-actions mt-6">
        <Button label="Reveal answer" icon={CheckCircle2} tone="success" variant="primary" onClick={revealAnswer} disabled={isRevealed} />
        {isRevealed ? (
          <Button label="Reset" icon={RotateCcw} tone="warning" iconOnly onClick={() => setIsRevealed(false)} />
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
      <p className="text-lg font-medium leading-8 text-[#33434b]">{exercise.prompt}</p>

      <div className="mt-5 rounded-xl border border-[#d5e2e8] bg-[#f6fbfc] p-4 text-lg font-normal leading-9 text-[#263238]">
        <span>{prefix}</span>
        <label className="ui-cloze-entry">
          <span className="sr-only">Answer</span>
          <input
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value);
              setResult(undefined);
            }}
            aria-label="Answer"
            className="ui-input"
            data-testid="cloze-answer-input"
          />
        </label>
        <span>{suffix}</span>
      </div>

      {result ? (
        <div
          className={cn(
            "mt-5 rounded-xl border p-4",
            result === "correct" ? "border-[#6dd8cf] bg-[#e8f8f6]" : "border-[#f7cf5d] bg-[#fff5d6]",
          )}
          role="status"
          data-testid="cloze-feedback"
        >
          <p className={cn("text-sm font-semibold", result === "correct" ? "text-[#007c78]" : "text-[#7a5200]")}>
            {result === "correct" ? "Correct" : "Try again"}
          </p>
          <p className="mt-2 text-sm font-normal leading-6 text-[#33434b]">{exercise.explanation}</p>
        </div>
      ) : null}

      <div className="ui-actions mt-6">
        <Button label="Check answer" icon={CheckCircle2} tone="success" variant="primary" onClick={checkAnswer} />
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
  return <JapaneseWritingPractice characters={characters} exercise={exercise} prompt={exercise.prompt} nextHref={nextHref} onProgressEvent={onProgressEvent} />;
}

function NextLink({ href, label = "Next activity" }: { href: string; label?: string }) {
  return <ButtonLink href={href} label={label} icon={ArrowRight} tone="success" variant="primary" />;
}
