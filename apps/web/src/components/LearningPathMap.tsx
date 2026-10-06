import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Brain, ExternalLink, GitBranch, Layers, Stamp, Target } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { DifficultyPill } from "@/components/DifficultyPill";
import { getPathNodeRoute } from "@/lib/content";
import type { ContentIndex, LearningPath, LearningPathNode } from "@/lib/content/schema";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./ButtonLink";

export function LearningPathDetail({ index, learningPath }: { index: ContentIndex; learningPath: LearningPath }) {
  const flashcardFeed = index.passiveFlashcardFeeds.find((feed) => feed.pathSlug === learningPath.slug && feed.status === "published");

  return (
    <main className="min-h-screen pb-12" data-testid="path-detail">
      <PathHeader />

      <section className="ui-page">
        <ButtonLink href="/paths" label="All paths" icon={ArrowLeft} variant="quiet" />

        <div className="mt-6">
          <span className="inline-flex items-center gap-1 rounded-xl border border-[#d5e2e8] bg-white px-2.5 py-1 text-xs font-semibold uppercase text-[#007c78]">
            <Target className="h-3.5 w-3.5" aria-hidden="true" />
            {learningPath.kind} path
          </span>
          <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-[#263238] sm:text-4xl">{learningPath.title}</h1>
          <p className="mt-4 max-w-3xl text-lg font-normal leading-8 text-[#68737d]">{learningPath.summary}</p>
          {flashcardFeed ? (
            <ButtonLink href={flashcardFeed.route} label="Flashcard feed" icon={Layers} tone="info" className="mt-5" data-testid="path-flashcard-feed-link" />
          ) : null}
        </div>

        {learningPath.progression ? (
          <section className="mt-8 border-t border-[#e1e5e9] pt-6" data-testid="path-progression-roadmap">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase text-[#7a5200]">Learning milestones</p>
                <h2 className="mt-1 text-3xl font-semibold text-[#263238]">{learningPath.progression.roadmapLabel}</h2>
              </div>
              {learningPath.progression.reviewRoute ? <ButtonLink href={learningPath.progression.reviewRoute} label="Review skills" icon={Brain} tone="success" variant="primary" /> : null}
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {learningPath.progression.stages.map((stage, stageIndex) => (
                <article key={stage.id} className="relative rounded-2xl border border-[#e1e5e9] bg-white p-5">
                  <span className={cn("absolute right-4 top-4 flex h-12 w-12 rotate-[-6deg] items-center justify-center rounded-full border border-dashed", stage.status === "published" ? "border-[#b77b00] bg-[#fff5d6] text-[#7a5200]" : "border-[#9aa8b1] bg-[#eef2f4] text-[#68737d]")} aria-hidden="true"><Stamp className="h-6 w-6" /></span>
                  <p className="text-sm font-semibold uppercase text-[#7a5200]">Stage {stageIndex + 1} · {stage.level} · {stage.status}</p>
                  <h3 className="mt-2 pr-14 text-2xl font-semibold text-[#263238]">{stage.label}</h3>
                  <p className="mt-2 text-base font-normal leading-7 text-[#53616c]">{stage.summary}</p>
                  <p className="mt-3 text-sm font-medium text-[#53616c]">About {stage.estimatedMinutes} minutes{stage.passThreshold === undefined ? " · companion planned" : ` · checkpoint ${Math.round(stage.passThreshold * 100)}%`}</p>
                  <ul className="mt-4 grid gap-2">
                    {stage.outcomes.map((outcome) => <li key={outcome.id} className="text-sm font-normal leading-6 text-[#33434b]"><span className="font-semibold text-[#007c78]">I can:</span> {outcome.statement.replace(/^I can\s+/i, "")}</li>)}
                  </ul>
                  {stage.checkpointExerciseSlug ? <ButtonLink href={`/practice/${stage.checkpointExerciseSlug}?path=${learningPath.slug}`} label="Open checkpoint" icon={ArrowRight} tone="info" variant="quiet" className="mt-4" /> : <p className="mt-4 text-sm font-semibold text-[#68737d]">Official sources are open now; the Codematica checkpoint is planned.</p>}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-8 grid gap-5">
          {learningPath.units.map((unit, unitIndex) => (
            <section key={unit.slug} className="border-t border-[#e1e5e9] pt-6">
              <p className="text-xs font-semibold uppercase text-[#68737d]">Unit {unitIndex + 1}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#263238]">{unit.title}</h2>
              <p className="mt-2 text-sm font-normal leading-6 text-[#68737d]">{unit.summary}</p>
              <PathNodes index={index} learningPath={learningPath} nodes={unit.nodes} className="mt-5" />
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

function PathHeader() {
  return <AppHeader subtitle="Learning paths" />;
}

function PathNodes({
  index,
  learningPath,
  nodes,
  className,
}: {
  index: ContentIndex;
  learningPath: LearningPath;
  nodes: LearningPathNode[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3", className)} data-testid={`path-nodes-${learningPath.slug}`}>
      {nodes.map((node, nodeIndex) => {
        const display = getNodeDisplay(index, node);

        return (
          <Link
            key={`${node.kind}-${node.slug}`}
            href={getPathNodeRoute(node, learningPath.slug)}
            className="ui-result-row grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3"
            data-testid={`path-node-${node.kind}-${node.slug.replaceAll("/", "-")}`}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold",
                display.colorClass,
              )}
            >
              {nodeIndex + 1}
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-[#68737d]">
                  {display.icon}
                  {display.kindLabel}
                </span>
                {display.difficulty ? <DifficultyPill difficulty={display.difficulty} /> : null}
              </span>
              <span className="mt-1 block text-base font-semibold text-[#263238]">{display.title}</span>
              <span className="mt-1 block text-xs font-medium leading-5 text-[#68737d]">{display.summary}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function getNodeDisplay(index: ContentIndex, node: LearningPathNode) {
  if (node.kind === "interview") {
    const question = index.interviewCollections.flatMap((collection) => collection.questions).find((item) => `${item.collectionSlug}/${item.slug}` === node.slug);
    return { title: question?.title ?? node.slug, summary: question?.summary ?? "Interview walkthrough", kindLabel: "Guided solutions", difficulty: question?.difficulty, icon: <Brain className="h-3.5 w-3.5" />, colorClass: "border-[#9cc7ff] bg-[#edf5ff] text-[#245fba]" };
  }

  if (node.kind === "source") {
    const source = index.sources.find((item) => item.id === node.sourceRef);
    const document = node.companionKind === "document" ? index.documents.find((item) => item.slug === node.slug) : undefined;
    const exercise = node.companionKind === "exercise" ? index.exercises.find((item) => item.slug === node.slug) : undefined;
    return {
      title: document?.title ?? exercise?.title ?? source?.title ?? node.slug,
      summary: document?.summary ?? (exercise ? `${exercise.concept} practice. Primary source: ${source?.provider ?? "upstream"}.` : `Open the authoritative ${source?.provider ?? "upstream"} source.`),
      kindLabel: document || exercise ? `Source + ${node.companionKind}` : `Official source · ${node.activity}`,
      difficulty: document?.difficulty ?? exercise?.difficulty,
      icon: <ExternalLink className="h-3.5 w-3.5 text-[#1d4e9e]" aria-hidden="true" />,
      colorClass: "border-[#9cc7ff] bg-[#edf5ff] text-[#1d4e9e]",
    };
  }

  if (node.kind === "document") {
    const document = index.documents.find((item) => item.slug === node.slug);

    return {
      title: document?.title ?? node.slug,
      summary: document?.summary ?? "Document",
      kindLabel: "Document",
      difficulty: document?.difficulty,
      icon: <BookOpen className="h-3.5 w-3.5 text-[#245fba]" aria-hidden="true" />,
      colorClass: "border-[#9cc7ff] bg-[#edf5ff] text-[#245fba]",
    };
  }

  if (node.kind === "diagram") {
    const diagram = index.diagrams.find((item) => item.slug === node.slug);

    return {
      title: diagram?.title ?? node.slug,
      summary: diagram ? `Visual guide to ${diagram.title}.` : "Diagram",
      kindLabel: "Diagram",
      difficulty: undefined,
      icon: <GitBranch className="h-3.5 w-3.5 text-[#007c78]" aria-hidden="true" />,
      colorClass: "border-[#6dd8cf] bg-[#e8f8f6] text-[#007c78]",
    };
  }

  const exercise = index.exercises.find((item) => item.slug === node.slug);

  return {
    title: exercise?.title ?? node.slug,
    summary: exercise ? `${exercise.concept} practice` : "Practice",
    kindLabel: exercise ? exerciseKindLabel(exercise.type) : "Practice",
    difficulty: exercise?.difficulty,
    icon: <Brain className="h-3.5 w-3.5 text-[#5840b8]" aria-hidden="true" />,
    colorClass: "border-[#c8b8ff] bg-[#f3efff] text-[#5840b8]",
  };
}

function exerciseKindLabel(type: ContentIndex["exercises"][number]["type"]) {
  if (type === "flashcard") {
    return "Flashcard";
  }

  if (type === "cloze") {
    return "Fill the gap";
  }

  if (type === "writing") {
    return "Writing";
  }

  if (type === "guided-lab") return "Guided lab";

  return "Questionnaire";
}
