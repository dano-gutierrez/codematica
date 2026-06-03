"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, GitPullRequest, RotateCcw, Shuffle, X } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { codeLanguageAccent, codeLanguageLabel, highlightCode, normalizeCodeLanguage } from "@/components/CodeBlock";
import type { CodeReviewFinding, LearningExercise } from "@/lib/content/schema";
import {
  applyCodeReviewReplacement,
  findCodeReviewFindingAtPosition,
  findCodeReviewHealthyNoteAtPosition,
  segmentCodeReviewLine,
} from "@/lib/practice/code-review";
import { cn } from "@/lib/utils";

export type CodeReviewExercise = Extract<LearningExercise, { type: "code-review" }>;

type HealthyFeedback = {
  title: string;
  explanation: string;
};

export function CodeReviewSession({
  exercise,
  nextHref,
  reviewRoutes = [],
}: {
  exercise: CodeReviewExercise;
  nextHref?: string;
  reviewRoutes?: string[];
}) {
  const [files, setFiles] = useState(() => exercise.files);
  const [fixedFindingIds, setFixedFindingIds] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [healthyFeedback, setHealthyFeedback] = useState<HealthyFeedback | undefined>();
  const [activeFinding, setActiveFinding] = useState<CodeReviewFinding | undefined>();
  const fixedFindingSet = useMemo(() => new Set(fixedFindingIds), [fixedFindingIds]);
  const isComplete = fixedFindingIds.length === exercise.findings.length;

  function handleCodeClick(filePath: string, line: number, column: number) {
    setAttempts((value) => value + 1);

    const finding = findCodeReviewFindingAtPosition(exercise, { filePath, line, column }, fixedFindingSet);

    if (finding) {
      setFiles((currentFiles) => applyCodeReviewReplacement(currentFiles, finding));
      setFixedFindingIds((currentIds) => (currentIds.includes(finding.id) ? currentIds : [...currentIds, finding.id]));
      setHealthyFeedback(undefined);
      setActiveFinding(finding);
      return;
    }

    const healthyNote = findCodeReviewHealthyNoteAtPosition(exercise, { filePath, line, column });
    const file = exercise.files.find((item) => item.path === filePath);

    setActiveFinding(undefined);
    setHealthyFeedback({
      title: "Healthy code",
      explanation: healthyNote?.explanation ?? file?.healthyExplanation ?? "This portion is consistent with the review goal.",
    });
  }

  function restart() {
    setFiles(exercise.files);
    setFixedFindingIds([]);
    setAttempts(0);
    setHealthyFeedback(undefined);
    setActiveFinding(undefined);
  }

  function reviewAnother() {
    const currentRoute = `/code-reviews?exercise=${encodeURIComponent(exercise.slug)}`;
    const candidates = reviewRoutes.filter((route) => route !== currentRoute);
    const nextRoute = candidates[Math.floor(Math.random() * candidates.length)] ?? reviewRoutes[0] ?? currentRoute;
    window.location.assign(nextRoute);
  }

  return (
    <div className="mt-6 grid gap-5" data-testid="code-review-session">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-[#d5e2e8] bg-[#f6fbfc] px-3 py-2">
        <p className="text-sm font-extrabold leading-6 text-[#33434b]">{exercise.prompt}</p>
        <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-extrabold uppercase text-[#5840b8]" data-testid="code-review-attempts">
          Attempts {attempts}
        </span>
      </div>

      {healthyFeedback ? (
        <div className="rounded-lg border-2 border-b-4 border-[#6dd8cf] bg-[#e8f8f6] p-4" role="alert" data-testid="code-review-healthy-feedback">
          <p className="text-sm font-extrabold text-[#007c78]">{healthyFeedback.title}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#33434b]">{healthyFeedback.explanation}</p>
        </div>
      ) : null}

      <div className="grid gap-4">
        {files.map((file) => (
          <article
            key={file.path}
            className="code-block overflow-hidden rounded-lg border-2 border-b-4 border-[#263544] bg-[#101820]"
            style={{ "--code-accent": codeLanguageAccent(file.language) } as CSSProperties}
            data-testid={`code-review-file-${testIdPart(file.path)}`}
          >
            <div className="code-block-header flex flex-wrap items-center justify-between gap-3 border-b border-[#263544] px-4 py-3">
              <span className="inline-flex min-w-0 items-center gap-2 text-xs font-extrabold uppercase text-[#cbd7e1]">
                <GitPullRequest className="h-4 w-4 shrink-0 text-[#6dd8cf]" aria-hidden="true" />
                <span className="truncate">{file.path}</span>
              </span>
              <span className="rounded-md bg-[#263544] px-2 py-1 text-xs font-extrabold uppercase text-[#dce7ef]">{codeLanguageLabel(file.language)}</span>
            </div>
            <div className="max-h-[32rem] overflow-x-auto overflow-y-auto" data-testid={`code-review-scroll-${testIdPart(file.path)}`}>
              <pre className="code-block-pre min-w-max p-0 text-sm leading-6">
                <code className={cn("hljs", normalizeCodeLanguage(file.language) ? `language-${normalizeCodeLanguage(file.language)}` : undefined)}>
                  {file.lines.map((line, lineIndex) => (
                    <CodeReviewLine
                      key={`${file.path}-${lineIndex}`}
                      exercise={exercise}
                      fixedFindingIds={fixedFindingSet}
                      file={file}
                      lineNumber={lineIndex + 1}
                      onSegmentClick={handleCodeClick}
                    />
                  ))}
                </code>
              </pre>
            </div>
          </article>
        ))}
      </div>

      {isComplete ? (
        <div className="grid gap-4 rounded-lg border-2 border-b-4 border-[#6dd8cf] bg-[#e8f8f6] p-4" data-testid="code-review-complete">
          <div>
            <p className="text-sm font-extrabold uppercase text-[#007c78]">Review complete</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#33434b]">
              Fixed {fixedFindingIds.length} finding{fixedFindingIds.length === 1 ? "" : "s"} in {attempts} attempt{attempts === 1 ? "" : "s"}.
            </p>
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
            {!nextHref && reviewRoutes.length > 0 ? (
              <button
                type="button"
                onClick={reviewAnother}
                className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#1d4e9e] bg-[#245fba] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
              >
                <Shuffle className="h-4 w-4" aria-hidden="true" />
                Review another
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeFinding ? (
        <FindingDialog finding={activeFinding} onClose={() => setActiveFinding(undefined)} isComplete={fixedFindingIds.length === exercise.findings.length} />
      ) : null}
    </div>
  );
}

function CodeReviewLine({
  exercise,
  fixedFindingIds,
  file,
  lineNumber,
  onSegmentClick,
}: {
  exercise: CodeReviewExercise;
  fixedFindingIds: ReadonlySet<string>;
  file: CodeReviewExercise["files"][number];
  lineNumber: number;
  onSegmentClick: (filePath: string, line: number, column: number) => void;
}) {
  const segments = segmentCodeReviewLine(exercise, file, lineNumber, fixedFindingIds);
  const language = normalizeCodeLanguage(file.language);

  return (
    <span className="grid w-max min-w-full grid-cols-[3.25rem_max-content] border-b border-[#1c2a36] last:border-b-0">
      <span className="select-none border-r border-[#263544] bg-[#172430] px-3 py-0.5 text-right font-mono text-xs text-[#8494a3]">{lineNumber}</span>
      <span className="flex w-max whitespace-pre px-3 py-0.5 font-mono">
        {segments.map((segment, segmentIndex) => {
          const testId = segment.findingId
            ? `code-review-finding-${segment.findingId}`
            : segment.healthyNoteId
              ? `code-review-healthy-${segment.healthyNoteId}`
              : `code-review-token-${testIdPart(file.path)}-${lineNumber}-${segmentIndex}`;

          return (
            <button
              key={`${lineNumber}-${segment.startColumn}-${segment.endColumn}`}
              type="button"
              onClick={() => onSegmentClick(file.path, lineNumber, segment.startColumn)}
              className={cn(
                "m-0 inline-block shrink-0 whitespace-pre border-0 bg-transparent p-0 font-mono text-left text-[#dce7ef] outline-none hover:bg-[#263544] focus:bg-[#263544] focus:ring-2 focus:ring-[#6dd8cf]",
                fixedFindingIds.has(segment.findingId ?? "") ? "text-[#6dd8cf]" : undefined,
              )}
              aria-label={`${file.path} line ${lineNumber} column ${segment.startColumn}`}
              data-testid={testId}
              dangerouslySetInnerHTML={{ __html: highlightCode(segment.text || "\u00a0", language) }}
            />
          );
        })}
      </span>
    </span>
  );
}

function FindingDialog({ finding, isComplete, onClose }: { finding: CodeReviewFinding; isComplete: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#101820]/70 px-4 py-6" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="code-review-dialog-title"
        className="max-h-full w-full max-w-lg overflow-auto rounded-lg border-2 border-b-4 border-[#6dd8cf] bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase text-[#007c78]">{finding.kind === "bug" ? "Bug fixed" : "Improvement applied"}</p>
            <h2 id="code-review-dialog-title" className="mt-1 text-2xl font-extrabold tracking-normal text-[#263238]">
              Finding explained
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white text-[#263238]"
            aria-label="Close finding explanation"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-[#33434b]">{finding.explanation}</p>
        <div className="mt-4 rounded-lg border-2 border-[#d5e2e8] bg-[#f6fbfc] p-3">
          <p className="text-xs font-extrabold uppercase text-[#68737d]">Applied replacement</p>
          <pre className="mt-2 overflow-x-auto text-sm font-semibold leading-6 text-[#263238]">
            <code>{finding.replacementLines.join("\n")}</code>
          </pre>
        </div>
        {isComplete ? (
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-[#007c78]">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Review complete
          </p>
        ) : null}
      </section>
    </div>
  );
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

function testIdPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
