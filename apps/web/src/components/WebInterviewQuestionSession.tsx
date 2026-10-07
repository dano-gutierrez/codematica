"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/Button";
import { ButtonLink } from "@/components/ButtonLink";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { CodeBlock } from "@/components/CodeBlock";
import type { InterviewQuestion } from "@/lib/content/schema";
import { appendPathToHref, recordProgress } from "@/lib/progress/client";

const WebPlayground = dynamic(
  () =>
    import("@/components/WebPlayground").then((module) => module.WebPlayground),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-96 animate-pulse rounded-xl border border-[#d5e2e8] bg-[#edf5ff]"
        aria-label="Loading playground"
      />
    ),
  },
);
type WebInterviewQuestion = Extract<InterviewQuestion, { kind: "web" }>;

export function WebInterviewQuestionSession({
  question,
  nextHrefsByPath = {},
}: {
  question: WebInterviewQuestion;
  nextHrefsByPath?: Record<string, string>;
}) {
  const [trackId, setTrackId] = useState(question.solutionTracks[0].id);
  const [stepIndex, setStepIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [language, setLanguage] = useState<"typescript" | "python">(
    "typescript",
  );
  const searchParams = useSearchParams();
  const paths = Object.keys(nextHrefsByPath);
  const pathSlug =
    searchParams.get("path") ?? (paths.length === 1 ? paths[0] : undefined);
  const nextHref = pathSlug ? nextHrefsByPath[pathSlug] : undefined;
  const track =
    question.solutionTracks.find((candidate) => candidate.id === trackId) ??
    question.solutionTracks[0];
  const showPython = language === "python" && Boolean(track.python);
  const target = {
    surface: "interview" as const,
    slug: `${question.collectionSlug}/${question.slug}`,
    title: question.title,
    summary: question.summary,
    href: appendPathToHref(question.route, pathSlug ?? ""),
    pathSlug,
    eyebrow: "Interview practice",
  };

  function selectTrack(nextTrackId: string) {
    setTrackId(nextTrackId);
    setStepIndex(0);
    setRevealed(false);
    void recordProgress(target, "started", {
      trackId: nextTrackId,
      stepIndex: 0,
      mode: "guided-web",
    });
  }

  function advance() {
    if (stepIndex === track.steps.length - 1) setRevealed(true);
    else setStepIndex((current) => current + 1);
  }

  return (
    <section
      className="mt-7 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7 [&>*]:min-w-0"
      data-testid="web-interview-session"
    >
      <details className="ui-disclosure" data-testid="interview-evaluation-guide">
        <summary>
          What to demonstrate
        </summary>
        <p className="mt-3 leading-7 text-[#4d5c65]">
          {question.evaluation.intent}
        </p>
        <ul className="mt-4 grid gap-3">
          {question.evaluation.expectedSignals.map((signal) => (
            <li key={signal} className="flex gap-3 leading-6 text-[#33434b]">
              <CheckCircle2
                className="mt-1 h-5 w-5 shrink-0 text-[#00645f]"
                aria-hidden="true"
              />
              {signal}
            </li>
          ))}
        </ul>
      </details>
      <div className="grid gap-5 lg:grid-cols-2">
        <RubricSection
          title="Practice acceptance criteria"
          items={question.evaluation.acceptanceCriteria}
        />
        <RubricSection
          title="Red flags and why they matter"
          items={question.evaluation.redFlags}
        />
      </div>
      <section>
        <h2 className="text-2xl font-semibold text-[#263238]">
          Choose an approach
        </h2>
        <p className="mt-2 text-[#4d5c65]">
          Start with approach 1. Compare alternatives after you can explain and
          test the baseline.
        </p>
        <div
          className="ui-filters mt-4"
          role="group"
          aria-label="Solution approaches"
        >
          {question.solutionTracks.map((candidate, index) => (
            <Button
              key={candidate.id}
              label={`Approach ${index + 1} · ${candidate.title}`}
              icon={Code2}
              tone="info"
              aria-pressed={candidate.id === track.id}
              onClick={() => selectTrack(candidate.id)}
              data-testid={`web-solution-tab-${candidate.id}`}
            />
          ))}
        </div>
        <article className="mt-6" data-testid="web-solution-detail">
          <h3 className="text-2xl font-semibold text-[#263238]">
            {track.title}
          </h3>
          <p className="mt-3 leading-7 text-[#4d5c65]">{track.summary}</p>
          <p
            className="mt-4 font-semibold text-[#00645f]"
            aria-live="polite"
            data-testid="web-recipe-position"
          >
            {revealed
              ? "Full solution"
              : `Step ${stepIndex + 1} of ${track.steps.length}`}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {revealed ? (
              <Button label="Restart recipe" icon={RotateCcw} tone="warning"
                onClick={() => { setStepIndex(0); setRevealed(false); }} />
            ) : (
              <>
                <Button label="Previous step" icon={ArrowLeft} disabled={stepIndex === 0}
                  onClick={() => setStepIndex((current) => current - 1)} />
                <Button label={stepIndex === track.steps.length - 1 ? "Reveal solution" : "Next step"}
                  icon={ArrowRight} tone="info" variant="primary" onClick={advance} />
                <Button label="Show full solution" icon={BookOpen} tone="assist" onClick={() => setRevealed(true)} />
              </>
            )}
          </div>
          {revealed && track.python ? (
            <div role="group" aria-label="Solution language" className="mt-4 flex flex-wrap gap-2">
              {(["typescript", "python"] as const).map((value) => (
                <Button key={value} label={value === "python" ? "Python" : "TypeScript"} icon={Code2} tone="info"
                  aria-pressed={language === value} onClick={() => setLanguage(value)} />
              ))}
            </div>
          ) : null}
          <ol className="mt-4 grid gap-4">
            {(revealed ? track.steps : [track.steps[stepIndex]]).map((step, index) => (
              <li key={step.title}>
                <h4 className="text-lg font-semibold text-[#263238]">
                  {(revealed ? index : stepIndex) + 1}. {step.title}
                </h4>
                <p className="mt-2 leading-7 text-[#4d5c65]">{step.explanation}</p>
              </li>
            ))}
          </ol>
          {revealed ? (
            <div
              className="mt-6 grid gap-5"
              data-testid="web-solution-explanation"
            >
              <section>
                <h4 className="text-lg font-semibold">Why this works</h4>
                <p className="mt-2 leading-7 text-[#33434b]">
                  {track.explanation}
                </p>
              </section>
              <section>
                <h4 className="text-lg font-semibold">
                  How it meets the requirements
                </h4>
                <p className="mt-2 leading-7 text-[#33434b]">
                  {track.acceptanceRationale}
                </p>
              </section>
              <section>
                <h4 className="text-lg font-semibold">
                  Pain points and tradeoffs
                </h4>
                <ul className="mt-2 list-disc space-y-2 pl-5 leading-7 text-[#33434b]">
                  {track.tradeoffs.map((tradeoff) => (
                    <li key={tradeoff}>{tradeoff}</li>
                  ))}
                </ul>
              </section>
              <p className="leading-7 text-[#33434b]">
                <strong>Time:</strong>{" "}
                {showPython
                  ? track.python!.complexity.time
                  : track.complexity.time}
                <br />
                <strong>Space:</strong>{" "}
                {showPython
                  ? track.python!.complexity.space
                  : track.complexity.space}
              </p>

            </div>
          ) : null}
        </article>
      </section>
      {revealed ? (
        showPython ? (
          <section>
            <h2 className="text-2xl font-semibold">Python logic companion</h2>
            <p className="mt-3 leading-7 text-[#33434b]">
              {track.python!.explanation}
            </p>
            <p className="mt-3 leading-7 text-[#33434b]">
              Save as solution.py and open with{" "}
              <code>python3 -i solution.py</code> to call the functions. The TypeScript
              project demonstrates browser behavior.
            </p>
            <CodeBlock
              code={track.python!.code}
              language="python"
              className="mt-4"
              dataTestId="web-python-companion"
            />
          </section>
        ) : (
          <WebPlayground
            key={track.id}
            project={track.project}
            projectId={`${question.id}-${track.id}`}
          />
        )
      ) : null}
      {revealed && nextHref ? (
        <ButtonLink
          href={nextHref}
          label="Continue to checkpoint" icon={ArrowRight} tone="success" variant="primary"
          data-testid="interview-next-node"
          onClick={() =>
            void recordProgress(target, "completed", {
              trackId: track.id,
              recipeReviewed: true,
            })
          }
        />
      ) : null}
      <section>
        <h2 className="text-sm font-semibold uppercase text-[#4d5c65]">
          Provenance
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#4d5c65]">
          {question.sourceNote}
        </p>
      </section>
    </section>
  );
}

function RubricSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ title: string; explanation: string }>;
}) {
  return (
    <details className="ui-disclosure">
      <summary>{title}</summary>
      <div className="mt-4 grid gap-4">
        {items.map((item) => (
          <article key={item.title}>
            <h3 className="font-semibold text-[#263238]">{item.title}</h3>
            <p className="mt-1 leading-6 text-[#4d5c65]">{item.explanation}</p>
          </article>
        ))}
      </div>
    </details>
  );
}
