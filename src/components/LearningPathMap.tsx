import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Brain, Code2, GitBranch, GitPullRequest, Layers, Map, Search, Sparkles, Target, Workflow } from "lucide-react";
import { DifficultyPill } from "@/components/DifficultyPill";
import { getPathNodeRoute } from "@/lib/content";
import type { ContentIndex, LearningPath, LearningPathNode } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

export function LearningPathHome({ index }: { index: ContentIndex }) {
  const realCasesHref = getRealCasesHref(index);

  return (
    <main className="min-h-screen pb-12" data-testid="path-home">
      <PathHeader />

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-extrabold uppercase text-[#007c78]">Learning paths</p>
              <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-6xl">
                Build engineering judgment one node at a time.
              </h1>
              <p className="max-w-3xl text-base font-semibold leading-7 text-[#68737d]">
                Follow role and skill paths made from documents, diagrams, flashcards, and fill-the-gap practice.
              </p>
            </div>

            <div className="mt-7 grid gap-5" data-testid="learning-path-list">
              {index.learningPaths.map((learningPath) => (
                <PathOverview key={learningPath.slug} index={index} learningPath={learningPath} />
              ))}
            </div>
          </div>

          <aside className="grid h-fit gap-4 lg:sticky lg:top-5">
            <section className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4">
              <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase text-[#68737d]">
                <Sparkles className="h-4 w-4 text-[#8a5c00]" aria-hidden="true" />
                Study mix
              </h2>
              <div className="mt-4 grid gap-2 text-sm font-bold text-[#68737d]">
                <StatRow label="Paths" value={index.learningPaths.length} color="text-[#007c78]" />
                <StatRow label="Exercises" value={index.exercises.length} color="text-[#5840b8]" />
                <StatRow label="Documents" value={index.documents.length} color="text-[#245fba]" />
              </div>
            </section>

            <Link
              href="/browse"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-b-4 border-[#1d4e9e] bg-[#245fba] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
              data-testid="home-browse-link"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Content library
            </Link>
            {realCasesHref ? (
              <Link
                href={realCasesHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-b-4 border-[#6f4a00] bg-[#8a5c00] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
                data-testid="home-real-cases-link"
              >
                <Workflow className="h-4 w-4" aria-hidden="true" />
                Real cases
              </Link>
            ) : null}
            <Link
              href="/interviews"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
              data-testid="home-interviews-link"
            >
              <Code2 className="h-4 w-4" aria-hidden="true" />
              Interview prep
            </Link>
            <Link
              href="/code-reviews"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-b-4 border-[#5840b8] bg-[#6f52d9] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
              data-testid="home-code-reviews-link"
            >
              <GitPullRequest className="h-4 w-4" aria-hidden="true" />
              Code reviews
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

export function LearningPathDetail({ index, learningPath }: { index: ContentIndex; learningPath: LearningPath }) {
  const flashcardFeed = index.passiveFlashcardFeeds.find((feed) => feed.pathSlug === learningPath.slug && feed.status === "published");

  return (
    <main className="min-h-screen pb-12" data-testid="path-detail">
      <PathHeader />

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Paths
        </Link>

        <div className="mt-6">
          <span className="inline-flex items-center gap-1 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-2.5 py-1 text-xs font-extrabold uppercase text-[#007c78]">
            <Target className="h-3.5 w-3.5" aria-hidden="true" />
            {learningPath.kind} path
          </span>
          <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-6xl">{learningPath.title}</h1>
          <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-[#68737d]">{learningPath.summary}</p>
          {flashcardFeed ? (
            <Link
              href={flashcardFeed.route}
              className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-b-4 border-[#1d4e9e] bg-[#245fba] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
              data-testid="path-flashcard-feed-link"
            >
              <Layers className="h-4 w-4" aria-hidden="true" />
              Flashcard feed
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>

        <div className="mt-8 grid gap-5">
          {learningPath.units.map((unit, unitIndex) => (
            <section
              key={unit.slug}
              id={unit.slug}
              className="scroll-mt-5 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4 sm:p-6"
              data-testid={`path-unit-${unit.slug}`}
            >
              <p className="text-xs font-extrabold uppercase text-[#68737d]">Unit {unitIndex + 1}</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-normal text-[#263238]">{unit.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#68737d]">{unit.summary}</p>
              <PathNodes index={index} learningPath={learningPath} nodes={unit.nodes} className="mt-5" />
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

function getRealCasesHref(index: ContentIndex) {
  const path = index.learningPaths.find(
    (learningPath) =>
      learningPath.slug === "system-design-fundamentals" &&
      learningPath.units.some((unit) => unit.slug === "real-production-data-platforms"),
  );

  return path ? `${path.route}#real-production-data-platforms` : undefined;
}

function PathHeader() {
  return (
    <header className="border-b-2 border-[#d5e2e8] bg-white px-4 py-4">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Codematica home">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78]">
            <Map className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xl font-extrabold text-[#007c78]">Codematica</span>
            <span className="block truncate text-xs font-extrabold uppercase text-[#68737d]">Path map</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/interviews"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]"
          >
            <Code2 className="h-4 w-4 text-[#007c78]" aria-hidden="true" />
            Interviews
          </Link>
          <Link
            href="/browse"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]"
          >
            <Search className="h-4 w-4 text-[#245fba]" aria-hidden="true" />
            Content library
          </Link>
        </nav>
      </div>
    </header>
  );
}

function PathOverview({ index, learningPath }: { index: ContentIndex; learningPath: LearningPath }) {
  const nodeCount = learningPath.units.reduce((sum, unit) => sum + unit.nodes.length, 0);

  return (
    <article
      className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#007c78] hover:shadow-[0_8px_0_#d5e2e8] sm:p-5"
      data-testid={`path-card-${learningPath.slug}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#f6fbfc] px-2.5 py-1 text-xs font-extrabold uppercase text-[#007c78]">
          {learningPath.kind}
        </span>
        <span className="rounded-lg bg-[#edf5ff] px-2.5 py-1 text-xs font-extrabold text-[#245fba]">{learningPath.category}</span>
        <span className="rounded-lg bg-[#fff5d6] px-2.5 py-1 text-xs font-extrabold text-[#7a5200]">{nodeCount} nodes</span>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-normal text-[#263238]">{learningPath.title}</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#68737d]">{learningPath.summary}</p>
        </div>
        <Link
          href={learningPath.route}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
        >
          Open path
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <PathNodes index={index} learningPath={learningPath} nodes={learningPath.units[0]?.nodes ?? []} className="mt-5" isPreview />
    </article>
  );
}

function PathNodes({
  index,
  learningPath,
  nodes,
  className,
  isPreview = false,
}: {
  index: ContentIndex;
  learningPath: LearningPath;
  nodes: LearningPathNode[];
  className?: string;
  isPreview?: boolean;
}) {
  const visibleNodes = isPreview ? nodes.slice(0, 5) : nodes;

  return (
    <div className={cn("grid gap-3", className)} data-testid={`path-nodes-${learningPath.slug}`}>
      {visibleNodes.map((node, nodeIndex) => {
        const display = getNodeDisplay(index, node);

        return (
          <Link
            key={`${node.kind}-${node.slug}`}
            href={getPathNodeRoute(node, learningPath.slug)}
            className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#f6fbfc] p-3 transition hover:-translate-y-0.5 hover:border-[#007c78]"
            data-testid={`path-node-${node.kind}-${node.slug.replaceAll("/", "-")}`}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg border-2 border-b-4 text-sm font-extrabold",
                display.colorClass,
              )}
            >
              {nodeIndex + 1}
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase text-[#68737d]">
                  {display.icon}
                  {display.kindLabel}
                </span>
                {display.difficulty ? <DifficultyPill difficulty={display.difficulty} /> : null}
              </span>
              <span className="mt-1 block text-base font-extrabold text-[#263238]">{display.title}</span>
              <span className="mt-1 block text-xs font-bold leading-5 text-[#68737d]">{display.summary}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function getNodeDisplay(index: ContentIndex, node: LearningPathNode) {
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
      summary: diagram ? `Mermaid diagram stored in ${diagram.sourcePath}.` : "Diagram",
      kindLabel: "Diagram",
      difficulty: undefined,
      icon: <GitBranch className="h-3.5 w-3.5 text-[#007c78]" aria-hidden="true" />,
      colorClass: "border-[#6dd8cf] bg-[#e8f8f6] text-[#007c78]",
    };
  }

  if (node.kind === "interview") {
    const [companySlug, questionSlug] = node.slug.split("/");
    const company = index.interviewCompanies.find((item) => item.slug === companySlug);
    const question = company?.questions.find((item) => item.slug === questionSlug);

    return {
      title: question?.title ?? node.slug,
      summary: question ? `${question.companyName} problem - ${question.tags.slice(0, 3).join(", ")}` : "Interview problem",
      kindLabel: "Interview problem",
      difficulty: question?.difficulty,
      icon: <Code2 className="h-3.5 w-3.5 text-[#8a5c00]" aria-hidden="true" />,
      colorClass: "border-[#ffd86b] bg-[#fff5d6] text-[#8a5c00]",
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

  if (type === "code-review") {
    return "Code review";
  }

  return "Questionnaire";
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#f6fbfc] px-3 py-2">
      <span>{label}</span>
      <span className={cn("font-extrabold", color)}>{value}</span>
    </div>
  );
}
