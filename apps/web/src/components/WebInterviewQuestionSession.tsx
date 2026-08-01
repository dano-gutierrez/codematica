"use client";

import dynamic from "next/dynamic";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import type { InterviewQuestion } from "@/lib/content/schema";
import { recordProgress } from "@/lib/progress/client";

const WebPlayground = dynamic(() => import("@/components/WebPlayground").then((module) => module.WebPlayground), {
  ssr: false,
  loading: () => <div className="min-h-96 animate-pulse rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#edf5ff]" aria-label="Loading playground" />,
});

type WebInterviewQuestion = Extract<InterviewQuestion, { kind: "web" }>;

export function WebInterviewQuestionSession({ question }: { question: WebInterviewQuestion }) {
  const [trackId, setTrackId] = useState(question.solutionTracks[0].id);
  const track = question.solutionTracks.find((candidate) => candidate.id === trackId) ?? question.solutionTracks[0];

  function selectTrack(nextTrackId: string) {
    setTrackId(nextTrackId);
    void recordProgress(
      {
        surface: "interview",
        slug: `${question.collectionSlug}/${question.slug}`,
        title: question.title,
        summary: question.summary,
        href: question.route,
        eyebrow: "Real-world interview",
      },
      "started",
      { trackId: nextTrackId, mode: "web-playground" },
    );
  }

  return (
    <section className="mt-7 grid gap-6" data-testid="web-interview-session">
      <section className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 sm:p-6" data-testid="interview-evaluation-guide">
        <p className="text-xs font-extrabold uppercase text-[#b4322a]">What the interviewer is assessing</p>
        <h2 className="mt-2 text-3xl font-extrabold text-[#263238]">Turn ambiguity into a credible frontend MVP.</h2>
        <p className="mt-4 text-base font-semibold leading-7 text-[#4d5c65]">{question.evaluation.intent}</p>
        <div className="mt-6 grid gap-3">
          {question.evaluation.expectedSignals.map((signal) => (
            <div key={signal} className="flex gap-3 rounded-lg border-2 border-[#d5e2e8] bg-[#f6fbfc] p-3 text-sm font-semibold leading-6 text-[#33434b]">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#007c78]" aria-hidden="true" />
              <span>{signal}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <RubricSection title="What an accepted solution demonstrates" items={question.evaluation.acceptanceCriteria} tone="accepted" />
        <RubricSection title="Red flags and why they matter" items={question.evaluation.redFlags} tone="warning" />
      </div>

      <section className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 sm:p-6">
        <p className="text-xs font-extrabold uppercase text-[#68737d]">Three accepted approaches</p>
        <h2 className="mt-2 text-3xl font-extrabold text-[#263238]">Choose a solution and run it.</h2>
        <div className="mt-5 grid gap-2 md:grid-cols-3" role="tablist" aria-label="Solution approaches">
          {question.solutionTracks.map((candidate, index) => (
            <button
              key={candidate.id}
              type="button"
              role="tab"
              aria-selected={candidate.id === track.id}
              onClick={() => selectTrack(candidate.id)}
              className={`min-h-14 rounded-lg border-2 border-b-4 px-3 py-2 text-left text-sm font-extrabold transition ${
                candidate.id === track.id ? "border-[#1d4e9e] bg-[#245fba] text-white" : "border-[#d5e2e8] bg-[#f6fbfc] text-[#263238]"
              }`}
              data-testid={`web-solution-tab-${candidate.id}`}
            >
              <span className="block text-xs uppercase opacity-80">Approach {index + 1}</span>
              <span className="mt-1 block">{candidate.title}</span>
            </button>
          ))}
        </div>

        <article className="mt-6" role="tabpanel" data-testid="web-solution-detail">
          <h3 className="text-3xl font-extrabold text-[#263238]">{track.title}</h3>
          <p className="mt-3 text-base font-semibold leading-7 text-[#68737d]">{track.summary}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {track.steps.map((step, index) => (
              <section key={step.title} className="rounded-lg border-2 border-[#d5e2e8] bg-[#f6fbfc] p-4">
                <p className="text-xs font-extrabold uppercase text-[#007c78]">Step {index + 1}</p>
                <h4 className="mt-1 text-lg font-extrabold text-[#263238]">{step.title}</h4>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#4d5c65]">{step.explanation}</p>
              </section>
            ))}
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="rounded-lg border-2 border-[#6dd8cf] bg-[#e8f8f6] p-4">
              <p className="text-xs font-extrabold uppercase text-[#007c78]">Why this works</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#33434b]">{track.explanation}</p>
            </section>
            <section className="rounded-lg border-2 border-[#9cc7ff] bg-[#edf5ff] p-4">
              <p className="text-xs font-extrabold uppercase text-[#245fba]">Why it would be accepted</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#33434b]">{track.acceptanceRationale}</p>
            </section>
          </div>
          <section className="mt-4 rounded-lg border-2 border-[#d5e2e8] bg-white p-4">
            <p className="text-xs font-extrabold uppercase text-[#68737d]">Tradeoffs and next refinements</p>
            <ul className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-[#4d5c65]">
              {track.tradeoffs.map((tradeoff) => <li key={tradeoff}>- {tradeoff}</li>)}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-extrabold text-[#263238]">
              <span className="rounded-lg bg-[#f6fbfc] px-2.5 py-1">Time {track.complexity.time}</span>
              <span className="rounded-lg bg-[#f6fbfc] px-2.5 py-1">Space {track.complexity.space}</span>
            </div>
          </section>
        </article>
      </section>

      <WebPlayground key={track.id} project={track.project} projectId={`${question.id}-${track.id}`} />

      <section className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4">
        <h2 className="text-sm font-extrabold uppercase text-[#68737d]">Provenance</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#4d5c65]">{question.sourceNote}</p>
      </section>
    </section>
  );
}

function RubricSection({ title, items, tone }: { title: string; items: Array<{ title: string; explanation: string }>; tone: "accepted" | "warning" }) {
  return (
    <section className={`rounded-lg border-2 border-b-4 p-5 ${tone === "accepted" ? "border-[#6dd8cf] bg-[#e8f8f6]" : "border-[#f2a39d] bg-[#fff1ef]"}`}>
      <h2 className={`text-2xl font-extrabold ${tone === "accepted" ? "text-[#00645f]" : "text-[#8f2922]"}`}>{title}</h2>
      <div className="mt-4 grid gap-4">
        {items.map((item) => (
          <article key={item.title}>
            <h3 className="flex items-center gap-2 text-base font-extrabold text-[#263238]">
              {tone === "warning" ? <ShieldAlert className="h-4 w-4 shrink-0 text-[#b4322a]" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-[#007c78]" aria-hidden="true" />}
              {item.title}
            </h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#4d5c65]">{item.explanation}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
