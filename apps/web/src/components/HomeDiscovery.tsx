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

      <section className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-5 sm:py-7">
        <div className="home-intro">
          <h1 className="home-title">What will you learn today?</h1>
        </div>

        <label className="relative mt-4 block">
          <span className="sr-only">Search all Codematica content</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#68737d]" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="What do you want to learn?"
            className="h-14 w-full rounded-xl border border-[#7d8b94] bg-white pl-12 pr-12 text-base font-medium text-[#263238] outline-none transition placeholder:text-[#68737d] focus:border-[#007c78]"
            data-testid="home-global-search"
          />
          {isSearching ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[#68737d] hover:bg-[#eaf7f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007c78]"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </label>

        <div className="mt-4">
          {isSearching ? (
            <SearchResults query={query} sections={groupedResults} total={results.length} />
          ) : (
            <>
              <nav className="home-shortcuts" aria-label="Explore sections">
                {sections.map((section) => <Link key={section.id} href={section.route} className="home-shortcut" data-testid={`home-explore-${section.id}`}>
                  <span className={cn("home-shortcut-icon", sectionThemes[section.id].softBackground, sectionThemes[section.id].accentText)}>{sectionIcon(section.id)}</span>
                  <span>{{ paths: "Paths", lessons: "Lessons", interviews: "Interviews", practice: "Practice", languages: "Languages" }[section.id]}</span>
                </Link>)}
              </nav>
              <KeepReadingSection initialItems={keepReadingItems} isSignedIn={isSignedIn} />
              <div className="mt-6 grid min-w-0 gap-8">
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
          <p className="text-sm font-semibold uppercase text-[#68737d]">Search results</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#263238]">{total} matches for “{query.trim()}”</h2>
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
        <div className="mt-5 rounded-xl border border-[#d5e2e8] bg-white p-5 text-sm font-medium text-[#68737d]">
          No paths, lessons, interviews, practice, or language content matches that search.
        </div>
      )}
    </section>
  );
}

function HomeSectionRow({ section }: { section: HomeDiscoverySection }) {
  return (
    <section className="min-w-0 max-w-full" data-testid={`home-section-${section.id}`}>
      <SectionHeading section={section} showDescription={false} />
      <div className="home-row mt-3">
        {section.items.map((item) => (
          <DiscoveryCard key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ section, showDescription }: { section: HomeDiscoverySection; showDescription: boolean }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className={cn("flex items-center gap-2 text-xl font-semibold tracking-tight text-[#263238]")}>
          {sectionIcon(section.id)}
          {section.title}
        </h2>
        {showDescription ? <p className="mt-1 text-sm font-semibold text-[#68737d]">{section.description}</p> : null}
      </div>
      <Link
        href={section.route}
        className={cn(
          "section-view-all",
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
        "discovery-card",
        theme.hoverBorder,
      )}
      data-testid={`discovery-card-${item.kind}-${item.sourceSlug.replaceAll("/", "-")}`}
    >
      <span className={cn("w-fit text-[11px] font-medium", theme.accentText)}>
        {item.eyebrow}
      </span>
      <span className="discovery-card-title text-[#263238]">{item.title}</span>
      <span className="discovery-card-summary mt-2 text-sm font-normal leading-6 text-[#68737d]">{item.summary}</span>
      <span className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {item.difficulty ? <DifficultyPill difficulty={item.difficulty} /> : null}
        <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", theme.accentText)}>
          <span className="sr-only">Open</span>
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
