"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Code2, RotateCcw } from "lucide-react";
import { MermaidBlock } from "@/components/MermaidBlock";
import type { InterviewQuestion, InterviewSolutionTrack } from "@/lib/content/schema";
import { selectInterviewSolutionTrack } from "@/lib/interviews";

type LanguageKey = keyof InterviewSolutionTrack["languages"];

const languageOptions: { value: LanguageKey; label: string }[] = [
  { value: "python", label: "Python" },
  { value: "typescript", label: "TypeScript" },
  { value: "java", label: "Java" },
];

export function InterviewQuestionSession({ question }: { question: InterviewQuestion }) {
  const [track, setTrack] = useState(() => question.solutionTracks[0]);
  const [previousTrackId, setPreviousTrackId] = useState<string | undefined>();
  const [stepIndex, setStepIndex] = useState(0);
  const [language, setLanguage] = useState<LanguageKey>("python");
  const isFinal = stepIndex >= track.steps.length;
  const visibleSteps = track.steps.slice(0, Math.min(stepIndex + 1, track.steps.length));
  const currentCode = track.languages[language];

  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (!isMounted) {
        return;
      }

      const selectedTrack = selectInterviewSolutionTrack(question);
      setTrack(selectedTrack);
      setPreviousTrackId(selectedTrack.id);
    });

    return () => {
      isMounted = false;
    };
  }, [question]);

  function advance() {
    setStepIndex((value) => Math.min(value + 1, track.steps.length));
  }

  function restart() {
    const selectedTrack = selectInterviewSolutionTrack(question, previousTrackId);
    setTrack(selectedTrack);
    setPreviousTrackId(selectedTrack.id);
    setStepIndex(0);
  }

  const progressLabel = useMemo(() => {
    if (isFinal) {
      return "Full explanation";
    }

    return `Step ${stepIndex + 1} of ${track.steps.length}`;
  }, [isFinal, stepIndex, track.steps.length]);

  return (
    <section className="mt-7 grid gap-5" data-testid="interview-question-session">
      <div className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase text-[#68737d]" data-testid="interview-step-position">
              {progressLabel}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-normal text-[#263238]" data-testid="interview-solution-track">
              {track.title}
            </h2>
          </div>
          <label className="grid gap-1 text-xs font-extrabold uppercase text-[#68737d]">
            Solution language
            <select
              aria-label="Solution language"
              value={language}
              onChange={(event) => setLanguage(event.target.value as LanguageKey)}
              className="min-h-11 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#f6fbfc] px-3 text-sm font-extrabold normal-case text-[#263238] outline-none focus:border-[#007c78]"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-4 text-sm font-semibold leading-6 text-[#68737d]">{track.summary}</p>

        <div className="mt-5 grid gap-3">
          {visibleSteps.map((step, index) => (
            <article key={`${track.id}-${step.title}`} className="rounded-lg border-2 border-[#d5e2e8] bg-[#f6fbfc] p-4">
              <p className="text-xs font-extrabold uppercase text-[#007c78]">Step {index + 1}</p>
              <h3 className="mt-1 text-lg font-extrabold text-[#263238]">{step.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#33434b]">{step.explanation}</p>
            </article>
          ))}
        </div>

        {isFinal ? (
          <div className="mt-5 grid gap-4" data-testid="interview-final-explanation">
            <section className="rounded-lg border-2 border-[#6dd8cf] bg-[#e8f8f6] p-4">
              <p className="text-xs font-extrabold uppercase text-[#007c78]">Why this works</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#33434b]">{track.explanation}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-extrabold text-[#263238]">
                <span className="rounded-lg bg-white px-2.5 py-1">Time {track.complexity.time}</span>
                <span className="rounded-lg bg-white px-2.5 py-1">Space {track.complexity.space}</span>
              </div>
            </section>
            <section className="overflow-hidden rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#182027]">
              <div className="flex items-center justify-between gap-3 border-b border-[#33434b] px-4 py-3 text-xs font-extrabold uppercase text-[#b7c3cc]">
                <span className="inline-flex items-center gap-2">
                  <Code2 className="h-4 w-4" aria-hidden="true" />
                  {currentCode.label}
                </span>
              </div>
              <pre className="overflow-x-auto p-4 text-sm leading-6 text-[#eef6f7]" data-testid="interview-code">
                <code>{currentCode.code}</code>
              </pre>
            </section>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {isFinal ? (
            <button
              type="button"
              onClick={restart}
              className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-4 py-2 text-sm font-extrabold text-[#263238]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Restart
            </button>
          ) : (
            <button
              type="button"
              onClick={advance}
              className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#1d4e9e] bg-[#245fba] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
            >
              {stepIndex + 1 >= track.steps.length ? "Show full explanation" : "Next"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {question.diagrams.length > 0 ? (
        <section className="grid gap-4">
          {question.diagrams.map((diagram) => (
            <MermaidBlock key={diagram.title} title={diagram.title} source={diagram.mermaid} />
          ))}
        </section>
      ) : null}

      {(question.sourceLinks.length > 0 || question.resources.length > 0) && isFinal ? (
        <section className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4">
          <h2 className="text-sm font-extrabold uppercase text-[#68737d]">Sources and resources</h2>
          <div className="mt-3 grid gap-2">
            {[...question.sourceLinks, ...question.resources].map((link) => (
              <a key={`${link.label}-${link.url}`} href={link.url} className="text-sm font-extrabold text-[#245fba] underline-offset-4 hover:underline">
                {link.label}
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
