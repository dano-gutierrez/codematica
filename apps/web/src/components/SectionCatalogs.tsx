"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Languages, Map as MapIcon, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { createDiscoveryItems, type ContentIndex, type Difficulty, type LearningPath } from "@codematica/core";
import { AppHeader } from "@/components/AppHeader";
import { DiscoveryCard } from "@/components/HomeDiscovery";
import { Dropdown, type DropdownOption } from "@/components/Dropdown";

const difficultyOptions = [
  { value: "all", label: "All levels", description: "Every learning depth" },
  { value: "foundation", label: "Foundation", description: "Core concepts" },
  { value: "practitioner", label: "Practitioner", description: "Production patterns" },
  { value: "senior", label: "Senior", description: "Tradeoff-heavy material" },
  { value: "principal", label: "Principal", description: "Org-scale decisions" },
] satisfies DropdownOption[];

export function LearningPathCatalog({ index }: { index: ContentIndex }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [category, setCategory] = useState("all");
  const paths = useMemo(
    () =>
      index.learningPaths.filter(
        (path) =>
          path.status === "published" &&
          (kind === "all" || path.kind === kind) &&
          (category === "all" || path.category === category) &&
          matchesText([path.title, path.summary, path.category, path.audience], query),
      ),
    [category, index.learningPaths, kind, query],
  );
  const grouped = useMemo(() => groupBy(paths, (path) => path.category), [paths]);
  const categories = useMemo(() => [...new Set(index.learningPaths.filter((path) => path.status === "published").map((path) => path.category))].sort(), [index.learningPaths]);

  return (
    <main className="min-h-screen pb-14" data-testid="path-catalog">
      <AppHeader subtitle="Learning paths" />
      <section className="mx-auto w-full max-w-7xl px-4 py-7 sm:py-9">
        <p className="text-sm font-extrabold uppercase text-[#00645f]">Learning paths</p>
        <h1 className="mt-2 max-w-4xl text-4xl font-extrabold leading-tight text-[#263238] sm:text-5xl">Follow a clear route from lesson to practice.</h1>
        <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-[#68737d]">Browse every role, engineering skill, and language course by category.</p>

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_15rem_16rem]" data-testid="path-catalog-controls">
          <SearchInput value={query} onChange={setQuery} placeholder="Search paths and categories" testId="path-catalog-search" />
          <Dropdown
            label="Path type"
            value={kind}
            onValueChange={setKind}
            testId="path-kind-filter"
            icon={<MapIcon className="h-4 w-4" aria-hidden="true" />}
            options={[
              { value: "all", label: "All path types", description: "Role and skill paths" },
              { value: "role", label: "Role paths", description: "Career-oriented sequences" },
              { value: "skill", label: "Skill paths", description: "Topic-focused sequences" },
            ]}
          />
          <Dropdown
            label="Category"
            value={category}
            onValueChange={setCategory}
            testId="path-category-filter"
            icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
            options={[
              { value: "all", label: "All categories", description: `${index.learningPaths.length} learning paths` },
              ...categories.map((value) => ({ value, label: value, description: "Learning path category" })),
            ]}
          />
        </div>

        <p className="mt-5 text-sm font-bold text-[#68737d]" aria-live="polite">{paths.length} paths</p>
        <div className="mt-6 grid gap-9" data-testid="learning-path-list">
          {[...grouped.entries()].map(([group, groupPaths]) => (
            <section key={group}>
              <h2 className="text-2xl font-extrabold text-[#00645f]">{group}</h2>
              <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {groupPaths.map((path) => <PathCatalogCard key={path.slug} path={path} />)}
              </div>
            </section>
          ))}
        </div>
        {paths.length === 0 ? <EmptyState>No learning paths match those filters.</EmptyState> : null}
      </section>
    </main>
  );
}

function PathCatalogCard({ path }: { path: LearningPath }) {
  const nodes = path.units.flatMap((unit) => unit.nodes);
  const nodeCounts = {
    document: nodes.filter((node) => node.kind === "document").length,
    diagram: nodes.filter((node) => node.kind === "diagram").length,
    exercise: nodes.filter((node) => node.kind === "exercise").length,
  };

  return (
    <article className="flex min-h-72 flex-col rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#00645f] hover:shadow-[0_7px_0_#d5e2e8]" data-testid={`path-card-${path.slug}`}>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-lg border border-[#7bcac3] bg-[#e8f8f6] px-2.5 py-1 text-xs font-extrabold uppercase text-[#00645f]">{path.kind} path</span>
        {path.category === "Languages" ? <span className="rounded-lg bg-[#fff5d6] px-2.5 py-1 text-xs font-extrabold text-[#7a5200]">Language path</span> : null}
      </div>
      <h3 className="mt-4 text-2xl font-extrabold text-[#263238]">{path.title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#68737d]">{path.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-extrabold text-[#68737d]">
        <span>{path.units.length} units</span><span aria-hidden="true">·</span><span>{nodeCounts.document} lessons</span><span aria-hidden="true">·</span><span>{nodeCounts.exercise} practice</span>
        {nodeCounts.diagram > 0 ? <><span aria-hidden="true">·</span><span>{nodeCounts.diagram} diagrams</span></> : null}
      </div>
      <Link href={path.route} className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-b-4 border-[#004d49] bg-[#00645f] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5">
        Open path <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

export function PracticeCatalog({ index }: { index: ContentIndex }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const items = useMemo(
    () =>
      createDiscoveryItems(index).filter(
        (item) =>
          item.section === "practice" &&
          (type === "all" || (type === "feed" ? item.kind === "flashcard-feed" : item.tags.includes(type))) &&
          (difficulty === "all" || item.difficulty === difficulty) &&
          matchesText([item.title, item.summary, item.eyebrow, ...item.tags], query),
      ),
    [difficulty, index, query, type],
  );
  const activeItems = items.filter((item) => item.kind === "exercise");
  const reviewItems = items.filter((item) => item.kind === "flashcard-feed");

  return (
    <main className="min-h-screen pb-14" data-testid="practice-catalog">
      <AppHeader subtitle="Practice & review" />
      <section className="mx-auto w-full max-w-7xl px-4 py-7 sm:py-9">
        <p className="text-sm font-extrabold uppercase text-[#a6263c]">Practice & review</p>
        <h1 className="mt-2 max-w-4xl text-4xl font-extrabold leading-tight text-[#263238] sm:text-5xl">Turn reading into active recall.</h1>
        <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-[#68737d]">Open every questionnaire, flashcard, fill-the-gap prompt, handwriting drill, and scrolling review feed.</p>

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem_16rem]">
          <SearchInput value={query} onChange={setQuery} placeholder="Search practice activities" testId="practice-catalog-search" />
          <Dropdown
            label="Activity type"
            value={type}
            onValueChange={setType}
            testId="practice-type-filter"
            icon={<Brain className="h-4 w-4" aria-hidden="true" />}
            options={[
              { value: "all", label: "All activities", description: "Active and passive practice" },
              { value: "questionnaire", label: "Questionnaires", description: "Multi-question sessions" },
              { value: "flashcard", label: "Flashcards", description: "Reveal-answer practice" },
              { value: "cloze", label: "Fill the gap", description: "Typed recall prompts" },
              { value: "writing", label: "Writing", description: "Assisted and free handwriting" },
              { value: "feed", label: "Quick review feeds", description: "Scroll-only flashcard review" },
            ]}
          />
          <Dropdown label="Difficulty" value={difficulty} onValueChange={(value) => setDifficulty(value as "all" | Difficulty)} testId="practice-difficulty-filter" options={difficultyOptions} />
        </div>

        <p className="mt-5 text-sm font-bold text-[#68737d]" aria-live="polite">{items.length} activities</p>
        <CatalogGroup title="Active practice" items={activeItems} />
        <CatalogGroup title="Quick review feeds" items={reviewItems} />
        {items.length === 0 ? <EmptyState>No practice activities match those filters.</EmptyState> : null}
      </section>
    </main>
  );
}

function CatalogGroup({ title, items }: { title: string; items: ReturnType<typeof createDiscoveryItems> }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-2xl font-extrabold text-[#a6263c]">{title}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => <DiscoveryCard key={`${item.kind}-${item.id}`} item={item} />)}
      </div>
    </section>
  );
}

export function LanguageCatalog({ index }: { index: ContentIndex }) {
  const japaneseCharacters = index.languageCharacters.filter((item) => item.language === "ja" && item.status === "published");
  const japaneseVocabulary = index.languageVocabulary.filter((item) => item.language === "ja" && item.status === "published");
  const writingExercises = index.exercises.filter((item) => item.type === "writing" && item.status === "published");

  return (
    <main className="min-h-screen pb-14" data-testid="language-catalog">
      <AppHeader subtitle="Languages" />
      <section className="mx-auto w-full max-w-7xl px-4 py-7 sm:py-9">
        <p className="text-sm font-extrabold uppercase text-[#7a5200]">Languages</p>
        <h1 className="mt-2 max-w-4xl text-4xl font-extrabold leading-tight text-[#263238] sm:text-5xl">Build language foundations through reading and writing.</h1>
        <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-[#68737d]">Choose a language hub for its course, reference catalog, vocabulary, pronunciation, and writing practice.</p>

        <article className="mt-7 grid gap-6 rounded-lg border-2 border-b-4 border-[#e8c45c] bg-white p-5 md:grid-cols-[minmax(0,1fr)_18rem] md:p-7">
          <div>
            <span className="inline-flex rounded-lg border border-[#e8c45c] bg-[#fff5d6] px-2.5 py-1 text-xs font-extrabold uppercase text-[#7a5200]">Available now</span>
            <h2 className="mt-4 flex items-center gap-3 text-3xl font-extrabold text-[#263238]"><Languages className="h-7 w-7 text-[#7a5200]" aria-hidden="true" />Japanese</h2>
            <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[#68737d]">Study hiragana, katakana, starter kanji, beginner vocabulary, IPA-supported pronunciation, and handwriting.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/languages/japanese" className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#5b3d00] bg-[#7a5200] px-4 py-2 text-sm font-extrabold text-white">Open Japanese hub <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link href="/paths/japanese-foundations" className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#e8c45c] bg-[#fff5d6] px-4 py-2 text-sm font-extrabold text-[#7a5200]">Japanese path <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          </div>
          <dl className="grid content-start gap-2 text-sm font-bold text-[#68737d]">
            <Stat label="Characters" value={japaneseCharacters.length} />
            <Stat label="Vocabulary" value={japaneseVocabulary.length} />
            <Stat label="Writing drills" value={writingExercises.length} />
          </dl>
        </article>
      </section>
    </main>
  );
}

function SearchInput({ value, onChange, placeholder, testId }: { value: string; onChange: (value: string) => void; placeholder: string; testId: string }) {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#68737d]" aria-hidden="true" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-14 w-full rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white pl-12 pr-4 text-base font-bold text-[#263238] outline-none focus:border-[#007c78]" data-testid={testId} />
    </label>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 text-sm font-bold text-[#68737d]">{children}</div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-lg bg-[#fff5d6] px-3 py-2"><dt>{label}</dt><dd className="font-extrabold text-[#7a5200]">{value}</dd></div>;
}

function matchesText(values: string[], query: string) {
  const normalized = query.trim().toLocaleLowerCase("en-US");
  return !normalized || values.some((value) => value.toLocaleLowerCase("en-US").includes(normalized));
}

function groupBy<T>(items: T[], keyFor: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(keyFor(item), [...(groups.get(keyFor(item)) ?? []), item]);
  return new Map([...groups.entries()].sort(([left], [right]) => left.localeCompare(right)));
}
