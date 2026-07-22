"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Code2, GitBranch, Languages, Map, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { getHomeDiscoverySections, searchDiscovery, type ContentIndex, type DiscoveryResult, type DiscoverySectionId, type HomeDiscoverySection } from "@codematica/core";
import { AppHeader } from "@/components/AppHeader";
import { DifficultyPill } from "@/components/DifficultyPill";
import { KeepReadingSection } from "@/components/KeepReadingSection";
import type { ProgressDisplayItem } from "@/lib/progress/progress";
import { sectionThemes } from "@/lib/section-themes";
import { cn } from "@/lib/utils";

export function HomeDiscovery({
  index,
  keepReadingItems = [],
  isSignedIn = false,
}: {
  index: ContentIndex;
  keepReadingItems?: ProgressDisplayItem[];
  isSignedIn?: boolean;
}) {
  const [query, setQuery] = useState("");
  const sections = useMemo(() => getHomeDiscoverySections(index), [index]);
  const results = useMemo(() => searchDiscovery(index, query).slice(0, 40), [index, query]);
  const groupedResults = useMemo(
    () =>
      sections
        .map((section) => ({ ...section, items: results.filter((result) => result.section === section.id) }))
        .filter((section) => section.items.length > 0),
    [results, sections],
  );
  const isSearching = query.trim().length > 0;

  return (
    <main className="min-h-screen pb-14" data-testid="discovery-home">
      <AppHeader />

      <section className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-7 sm:py-10">
        <div className="max-w-4xl">
          <p className="text-sm font-extrabold uppercase text-[#007c78]">Choose your next step</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-5xl">What do you want to learn?</h1>
          <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-[#68737d]">
            Search everything or jump into a focused path, lesson, interview question, practice session, or language activity.
          </p>
        </div>

        <label className="relative mt-6 block max-w-4xl">
          <span className="sr-only">Search all Codematica content</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#68737d]" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search paths, lessons, interview questions, or Japanese"
            className="h-14 w-full rounded-lg border-2 border-b-4 border-[#b8ccd5] bg-white pl-12 pr-12 text-base font-bold text-[#263238] outline-none transition placeholder:text-[#68737d] focus:border-[#007c78]"
            data-testid="home-global-search"
          />
          {isSearching ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#68737d] hover:bg-[#eaf7f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007c78]"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </label>

        <div className="mt-7">
          {isSearching ? (
            <SearchResults query={query} sections={groupedResults} total={results.length} />
          ) : (
            <>
              <KeepReadingSection initialItems={keepReadingItems} isSignedIn={isSignedIn} />
              <div className="mt-8 grid min-w-0 gap-10">
                {sections.map((section) => (
                  <HomeSectionRow key={section.id} section={section} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function SearchResults({ query, sections, total }: { query: string; sections: HomeDiscoverySection[]; total: number }) {
  return (
    <section data-testid="home-discovery-results" aria-live="polite">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-extrabold uppercase text-[#68737d]">Search results</p>
          <h2 className="mt-1 text-2xl font-extrabold text-[#263238]">{total} matches for “{query.trim()}”</h2>
        </div>
      </div>
      {sections.length > 0 ? (
        <div className="mt-6 grid gap-9">
          {sections.map((section) => (
            <div key={section.id}>
              <SectionHeading section={section} showDescription={false} />
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {section.items.map((item) => (
                  <DiscoveryCard key={`${item.kind}-${item.id}`} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 text-sm font-bold text-[#68737d]">
          No paths, lessons, interviews, practice, or language content matches that search.
        </div>
      )}
    </section>
  );
}

function HomeSectionRow({ section }: { section: HomeDiscoverySection }) {
  return (
    <section className="min-w-0 max-w-full" data-testid={`home-section-${section.id}`}>
      <SectionHeading section={section} showDescription />
      <div className="mt-4 grid w-full min-w-0 max-w-full snap-x snap-mandatory grid-flow-col auto-cols-[minmax(17rem,84vw)] gap-4 overflow-x-auto pb-3 sm:auto-cols-[minmax(19rem,45vw)] lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible lg:pb-0">
        {section.items.map((item) => (
          <DiscoveryCard key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ section, showDescription }: { section: HomeDiscoverySection; showDescription: boolean }) {
  const theme = sectionThemes[section.id];

  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className={cn("flex items-center gap-2 text-2xl font-extrabold tracking-normal", theme.accentText)}>
          {sectionIcon(section.id)}
          {section.title}
        </h2>
        {showDescription ? <p className="mt-1 text-sm font-semibold text-[#68737d]">{section.description}</p> : null}
      </div>
      <Link
        href={section.route}
        className={cn(
          "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border-2 border-b-4 px-3 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5",
          theme.accentBackground,
          theme.accentBorder,
        )}
        data-testid={`home-view-all-${section.id}`}
      >
        View all
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function DiscoveryCard({ item }: { item: DiscoveryResult }) {
  const theme = sectionThemes[item.section];

  return (
    <Link
      href={item.route}
      className={cn(
        "flex min-h-56 snap-start flex-col rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_7px_0_#d5e2e8]",
        theme.hoverBorder,
      )}
      data-testid={`discovery-card-${item.kind}-${item.sourceSlug.replaceAll("/", "-")}`}
    >
      <span className={cn("w-fit rounded-lg border px-2.5 py-1 text-xs font-extrabold uppercase", theme.accentText, theme.softBackground, theme.softBorder)}>
        {item.eyebrow}
      </span>
      <span className="mt-4 block text-xl font-extrabold tracking-normal text-[#263238]">{item.title}</span>
      <span className="mt-2 line-clamp-3 block text-sm font-semibold leading-6 text-[#68737d]">{item.summary}</span>
      <span className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {item.difficulty ? <DifficultyPill difficulty={item.difficulty} /> : null}
        <span className={cn("inline-flex items-center gap-1 text-sm font-extrabold", theme.accentText)}>
          Open
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}

function sectionIcon(section: DiscoverySectionId) {
  if (section === "paths") return <Map className="h-5 w-5" aria-hidden="true" />;
  if (section === "lessons") return <BookOpen className="h-5 w-5" aria-hidden="true" />;
  if (section === "interviews") return <Code2 className="h-5 w-5" aria-hidden="true" />;
  if (section === "practice") return <Brain className="h-5 w-5" aria-hidden="true" />;
  if (section === "languages") return <Languages className="h-5 w-5" aria-hidden="true" />;
  return <GitBranch className="h-5 w-5" aria-hidden="true" />;
}
