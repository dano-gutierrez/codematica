"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useState, type PointerEvent } from "react";
import {
  checkWritingAttempt,
  getAssistedStrokeCompletion,
  normalizeWritingStroke,
  type LanguageCharacter,
  type LanguageStrokePoint,
  type WritingCheckResult,
  type WritingStroke,
} from "@codematica/core";
import { cn } from "@/lib/utils";

type WritingProgressHandler = (status: "started" | "completed", position: Record<string, unknown>) => void;

export function JapaneseWritingPractice({
  characters,
  prompt,
  modes = ["assisted", "free"],
  nextHref,
  onProgressEvent,
}: {
  characters: LanguageCharacter[];
  prompt: string;
  modes?: Array<"assisted" | "free">;
  nextHref?: string;
  onProgressEvent?: WritingProgressHandler;
}) {
  const [mode, setMode] = useState<"assisted" | "free">(modes.includes("assisted") ? "assisted" : "free");
  const [characterIndex, setCharacterIndex] = useState(0);
  const [strokes, setStrokes] = useState<WritingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<WritingStroke>();
  const [result, setResult] = useState<WritingCheckResult>();
  const [assistedFeedback, setAssistedFeedback] = useState<string>();
  const character = characters[characterIndex];

  function resetForCharacter(nextIndex = characterIndex, nextMode = mode) {
    setCharacterIndex(nextIndex);
    setMode(nextMode);
    setStrokes([]);
    setCurrentStroke(undefined);
    setResult(undefined);
    setAssistedFeedback(undefined);
  }

  function startStroke(event: PointerEvent<SVGSVGElement>) {
    if (result || !character || strokes.length >= character.strokes.length) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setCurrentStroke({ points: [svgPoint(event)] });
    setAssistedFeedback(undefined);
  }

  function moveStroke(event: PointerEvent<SVGSVGElement>) {
    if (!currentStroke || result) return;
    const nextPoint = svgPoint(event);
    setCurrentStroke((stroke) => (stroke ? { points: [...stroke.points, nextPoint] } : stroke));
  }

  function endStroke(event: PointerEvent<SVGSVGElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!character || !currentStroke || result) {
      setCurrentStroke(undefined);
      return;
    }

    const normalized = normalizeWritingStroke({ points: [...currentStroke.points, svgPoint(event)] });
    const expected = character.strokes[strokes.length];

    if (mode === "assisted" && expected) {
      const completion = getAssistedStrokeCompletion(expected, normalized);
      if (!completion.shouldComplete) {
        setCurrentStroke(undefined);
        setAssistedFeedback(`Try stroke ${strokes.length + 1} again. Start at the numbered dot and follow the highlighted guide.`);
        return;
      }
      setStrokes((value) => [...value, { points: expected.points }]);
    } else {
      setStrokes((value) => [...value, normalized]);
    }

    setCurrentStroke(undefined);
    setAssistedFeedback(undefined);
  }

  function checkCurrentCharacter() {
    if (!character) return;
    const nextResult = checkWritingAttempt({ expectedStrokes: character.strokes, actualStrokes: strokes, mode });
    setResult(nextResult);
    if (nextResult.isCorrect && characterIndex + 1 >= characters.length) {
      onProgressEvent?.("completed", { mode, characterSlug: character.slug, passed: true });
    }
  }

  if (!character) return <p className="mt-6 text-sm font-bold text-[#68737d]">This writing exercise has no available characters.</p>;

  const expectedStroke = character.strokes[strokes.length];

  return (
    <div className="mt-6" data-testid="writing-practice">
      <p className="text-lg font-bold leading-8 text-[#33434b]">{prompt}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {modes.includes("assisted") ? (
          <ModeButton active={mode === "assisted"} tone="green" testId="writing-mode-assisted" onClick={() => resetForCharacter(characterIndex, "assisted")}>Assisted</ModeButton>
        ) : null}
        {modes.includes("free") ? (
          <ModeButton active={mode === "free"} tone="blue" testId="writing-mode-free" onClick={() => resetForCharacter(characterIndex, "free")}>Free</ModeButton>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="rounded-lg border-2 border-[#d5e2e8] bg-[#f6fbfc] p-4">
          <p className="text-xs font-extrabold uppercase text-[#68737d]">Character {characterIndex + 1} of {characters.length}</p>
          <p className="mt-2 text-7xl font-extrabold leading-none text-[#263238]">{character.glyph}</p>
          <p className="mt-3 text-xl font-extrabold text-[#263238]">{character.romaji} /{character.ipa}/</p>
          {character.inputSequences.length ? <p className="mt-2 text-sm font-bold text-[#245fba]">IME: {character.inputSequences.join(" or ")}</p> : null}
          <p className="mt-2 text-sm font-semibold leading-6 text-[#68737d]">{character.meanings.join(", ")}</p>
        </div>

        <div className="grid gap-3">
          <svg viewBox="0 0 100 100" role="img" aria-label={`Writing pad for ${character.title}`} onPointerDown={startStroke} onPointerMove={moveStroke} onPointerUp={endStroke} onPointerCancel={endStroke} className="aspect-square w-full max-w-[22rem] touch-none rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white" data-testid="writing-pad">
            <path d="M 50 0 L 50 100 M 0 50 L 100 50" stroke="#e4edf1" strokeWidth="0.8" fill="none" />
            {mode === "assisted" ? character.strokes.slice(strokes.length).map((stroke, index) => (
              <path key={stroke.id} d={pointsToPath(stroke.points)} stroke={index === 0 ? "#6dd8cf" : "#d5e2e8"} strokeWidth={index === 0 ? 5 : 3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            )) : null}
            {mode === "assisted" && expectedStroke ? (
              <>
                <circle cx={expectedStroke.points[0][0]} cy={expectedStroke.points[0][1]} r="5" fill="#007c78" />
                <text x={expectedStroke.points[0][0]} y={expectedStroke.points[0][1] + 2} textAnchor="middle" fontSize="6" fontWeight="800" fill="white">{strokes.length + 1}</text>
              </>
            ) : null}
            {[...strokes, ...(currentStroke ? [currentStroke] : [])].map((stroke, index) => (
              <path key={`${index}-${stroke.points.length}`} d={pointsToPath(stroke.points)} stroke="#263238" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}
          </svg>

          {assistedFeedback ? <p className="rounded-lg border-2 border-[#f7cf5d] bg-[#fff5d6] p-3 text-sm font-bold text-[#7a5200]" data-testid="writing-assisted-feedback">{assistedFeedback}</p> : null}
          {result ? (
            <div className={cn("rounded-lg border-2 border-b-4 p-4", result.isCorrect ? "border-[#6dd8cf] bg-[#e8f8f6]" : "border-[#f7cf5d] bg-[#fff5d6]")} data-testid="writing-feedback">
              <p className={cn("text-sm font-extrabold", result.isCorrect ? "text-[#007c78]" : "text-[#7a5200]")}>{result.isCorrect ? "Correct" : "Review this"}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#33434b]">{result.feedback}</p>
              <p className="mt-1 text-xs font-extrabold uppercase text-[#68737d]">Score {result.score}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => setStrokes((value) => value.slice(0, -1))} disabled={strokes.length === 0 || Boolean(result)} className="inline-flex min-h-12 items-center rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-4 py-2 text-sm font-extrabold text-[#263238] disabled:opacity-45">Undo</button>
        <button type="button" onClick={() => resetForCharacter()} className="inline-flex min-h-12 items-center rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-4 py-2 text-sm font-extrabold text-[#263238]">Clear</button>
        <button type="button" onClick={checkCurrentCharacter} disabled={strokes.length === 0 || Boolean(result) || strokes.length !== character.strokes.length} className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-45" data-testid="writing-check"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Check</button>
        {result?.isCorrect && characterIndex + 1 < characters.length ? (
          <button type="button" onClick={() => { const nextIndex = characterIndex + 1; onProgressEvent?.("started", { mode, characterSlug: characters[nextIndex]?.slug }); resetForCharacter(nextIndex); }} className="inline-flex min-h-12 items-center rounded-lg border-2 border-b-4 border-[#1d4e9e] bg-[#245fba] px-4 py-2 text-sm font-extrabold text-white" data-testid="writing-next-character">Next character</button>
        ) : null}
        {result?.isCorrect && characterIndex + 1 >= characters.length && nextHref ? <Link href={nextHref} className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#1d4e9e] bg-[#245fba] px-4 py-2 text-sm font-extrabold text-white">Next node <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link> : null}
      </div>
    </div>
  );
}

function ModeButton({ active, tone, testId, onClick, children }: { active: boolean; tone: "green" | "blue"; testId: string; onClick: () => void; children: string }) {
  const activeClass = tone === "green" ? "border-[#00645f] bg-[#007c78] text-white" : "border-[#1d4e9e] bg-[#245fba] text-white";
  return <button type="button" onClick={onClick} className={cn("min-h-11 rounded-lg border-2 border-b-4 px-3 py-2 text-sm font-extrabold", active ? activeClass : "border-[#d5e2e8] bg-white text-[#263238]")} data-testid={testId}>{children}</button>;
}

function svgPoint(event: PointerEvent<SVGSVGElement>): LanguageStrokePoint {
  const rect = event.currentTarget.getBoundingClientRect();
  return [Math.min(100, Math.max(0, ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100)), Math.min(100, Math.max(0, ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100))];
}

function pointsToPath(points: LanguageStrokePoint[]) {
  if (!points.length) return "";
  const [first, ...rest] = points;
  return [`M ${first[0]} ${first[1]}`, ...rest.map((point) => `L ${point[0]} ${point[1]}`)].join(" ");
}
