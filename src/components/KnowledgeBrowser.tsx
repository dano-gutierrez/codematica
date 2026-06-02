"use client";

import Link from "next/link";
import { BookOpen, CheckCircle2, GitBranch, Map, Network, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { DifficultyPill } from "@/components/DifficultyPill";
import { Dropdown, type DropdownOption } from "@/components/Dropdown";
import type { ContentIndex, Difficulty } from "@/lib/content/schema";
import { searchContent } from "@/lib/search";
import { cn } from "@/lib/utils";

const difficultyLabels: Record<Difficulty, string> = {
  foundation: "Foundation",
  practitioner: "Practitioner",
  senior: "Senior",
  principal: "Principal",
};

const difficultyOptions = [
  { value: "all", label: "All levels", description: "Every learning depth" },
  { value: "foundation", label: difficultyLabels.foundation, description: "Core concepts" },
  { value: "practitioner", label: difficultyLabels.practitioner, description: "Production patterns" },
  { value: "senior", label: difficultyLabels.senior, description: "Tradeoff-heavy guides" },
  { value: "principal", label: difficultyLabels.principal, description: "Org-scale decisions" },
] satisfies DropdownOption[];

export function KnowledgeBrowser({ index }: { index: ContentIndex }) {
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState("all");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");

  const trackOptions = useMemo(
    () => [
      { value: "all", label: "All tracks", description: `${index.documents.length} docs and ${index.diagrams.length} diagrams` },
      ...index.tracks.map((trackOption) => ({
        value: trackOption.name,
        label: trackOption.name,
        description: `${trackOption.documentCount} docs - ${trackOption.topics.join(", ")}`,
      })),
    ],
    [index.diagrams.length, index.documents.length, index.tracks],
  );

  const results = useMemo(
    () =>
      searchContent(index, query, {
        track: track === "all" ? undefined : track,
        difficulty: difficulty === "all" ? undefined : difficulty,
      }),
    [difficulty, index, query, track],
  );

  const visibleResults = results.slice(0, 30);

  return (
    <main className="min-h-screen pb-12" data-testid="knowledge-browser">
      <header className="border-b-2 border-[#d5e2e8] bg-white px-4 py-4">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Codematica home">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78]">
              <Network className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xl font-extrabold text-[#007c78]">Codematica</span>
              <span className="block truncate text-xs font-extrabold uppercase text-[#68737d]">Software engineering map</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#33434b]">
            <Link
              href="/"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]"
              data-testid="content-library-paths-link"
            >
              <Map className="h-4 w-4 text-[#007c78]" aria-hidden="true" />
              Learning paths
            </Link>
            <span className="hidden rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 sm:inline-flex">{index.documents.length} docs</span>
            <span className="hidden rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 sm:inline-flex">{index.diagrams.length} diagrams</span>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-extrabold uppercase text-[#007c78]">Content library</p>
                <h1 className="mt-2 max-w-4xl text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-6xl">
                  Study architecture, code, and engineering tradeoffs.
                </h1>
              </div>

              <div className="grid gap-3" data-testid="search-controls">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#68737d]" aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search concepts, patterns, failures"
                    className="h-14 w-full rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white pl-12 pr-4 text-base font-bold text-[#263238] outline-none transition placeholder:text-[#68737d] focus:border-[#007c78]"
                    data-testid="knowledge-search-input"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Dropdown
                  label="Track"
                  value={track}
                  options={trackOptions}
                  onValueChange={setTrack}
                  testId="track-filter"
                  icon={<Network className="h-4 w-4" aria-hidden="true" />}
                />
                <Dropdown
                  label="Difficulty"
                  value={difficulty}
                  options={difficultyOptions}
                  onValueChange={(nextDifficulty) => setDifficulty(nextDifficulty as "all" | Difficulty)}
                  testId="difficulty-filter"
                  icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                />
              </div>
            </div>

            <div className="mt-7 grid gap-3" data-testid="search-results">
              {visibleResults.map((result) => (
                <Link
                  key={`${result.kind}-${result.id}`}
                  href={result.route}
                  className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#007c78] hover:shadow-[0_8px_0_#d5e2e8]"
                  data-testid={`result-${result.kind}-${result.id}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#f6fbfc] px-2 py-1 text-xs font-extrabold text-[#245fba]">
                      {result.kind === "document" ? <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> : <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />}
                      {result.kind === "document" ? "Doc" : "Diagram"}
                    </span>
                    {result.difficulty ? <DifficultyPill difficulty={result.difficulty} /> : null}
                    <span className="text-xs font-extrabold uppercase text-[#68737d]">{result.track}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-extrabold tracking-normal text-[#263238]">{highlight(result.title, query)}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#68737d]">{highlight(result.snippet || result.summary, query)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="rounded-lg bg-[#eaf7f4] px-2.5 py-1 text-xs font-extrabold text-[#007c78]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
              {visibleResults.length === 0 ? (
                <div className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 text-sm font-bold text-[#68737d]" data-testid="empty-results">
                  No indexed nodes match the current filters.
                </div>
              ) : null}
            </div>
          </div>

          <aside className="grid h-fit gap-4 lg:sticky lg:top-5">
            <section className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4">
              <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase text-[#68737d]">
                <Sparkles className="h-4 w-4 text-[#8a5c00]" aria-hidden="true" />
                Tracks
              </h2>
              <div className="mt-4 grid gap-2">
                {index.tracks.map((trackOption) => (
                  <button
                    key={trackOption.slug}
                    type="button"
                    onClick={() => setTrack(trackOption.name)}
                    className={cn(
                      "rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-3 text-left transition hover:border-[#007c78]",
                      track === trackOption.name && "border-[#00645f] bg-[#eaf7f4]",
                    )}
                  >
                    <span className="block text-sm font-extrabold text-[#263238]">{trackOption.name}</span>
                    <span className="mt-1 block text-xs font-bold text-[#68737d]">
                      {trackOption.documentCount} docs - {trackOption.topics.join(", ")}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4">
              <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase text-[#68737d]">
                <CheckCircle2 className="h-4 w-4 text-[#007c78]" aria-hidden="true" />
                Progression
              </h2>
              <div className="mt-4 grid gap-2 text-sm font-bold text-[#68737d]">
                <div className="flex items-center justify-between rounded-lg bg-[#f6fbfc] px-3 py-2">
                  <span>Published nodes</span>
                  <span className="font-extrabold text-[#007c78]">{index.documents.filter((doc) => doc.status === "published").length}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#f6fbfc] px-3 py-2">
                  <span>Diagram nodes</span>
                  <span className="font-extrabold text-[#245fba]">{index.diagrams.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#f6fbfc] px-3 py-2">
                  <span>Senior+</span>
                  <span className="font-extrabold text-[#8a5c00]">
                    {index.documents.filter((doc) => doc.difficulty === "senior" || doc.difficulty === "principal").length}
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function highlight(text: string, query: string) {
  const trimmed = query.trim();

  if (!trimmed) {
    return text;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmed)})`, "ig"));

  return parts.map((part, index) =>
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-[#fff2c2] px-1 text-[#263238]">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
