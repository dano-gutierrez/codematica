"use client";

import Link from "next/link";
import { BookOpen, CheckCircle2, GitBranch, Network, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DifficultyPill } from "@/components/DifficultyPill";
import { Dropdown, type DropdownOption } from "@/components/Dropdown";
import type { ContentIndex, Difficulty } from "@/lib/content/schema";
import { searchContent } from "@/lib/search";

const difficultyLabels: Record<Difficulty, string> = {
  foundation: "Foundation",
  practitioner: "Practitioner",
  senior: "Senior",
  principal: "Principal",
};

const difficultyOptions = [
  { value: "all", label: "All levels", description: "All difficulty levels" },
  { value: "foundation", label: difficultyLabels.foundation, description: "Core concepts" },
  { value: "practitioner", label: difficultyLabels.practitioner, description: "Production patterns" },
  { value: "senior", label: difficultyLabels.senior, description: "Guides to tradeoffs" },
  { value: "principal", label: difficultyLabels.principal, description: "Organization-wide decisions" },
] satisfies DropdownOption[];

export function KnowledgeBrowser({ index }: { index: ContentIndex }) {
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState("all");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const [kind, setKind] = useState<"all" | "document" | "diagram">("all");

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
        kind: kind === "all" ? undefined : kind,
      }),
    [difficulty, index, kind, query, track],
  );

  return (
    <main className="min-h-screen pb-12" data-testid="knowledge-browser">
      <AppHeader subtitle="Lessons & diagrams" />

      <section className="ui-page">
        <div className="grid gap-6">
          <div className="min-w-0">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="mt-2 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-[#263238] sm:text-4xl">
                  Lessons & diagrams
                </h1>
              </div>

              <div className="grid gap-3" data-testid="search-controls">
                <label className="ui-field-icon">
                  <Search className="h-5 w-5" aria-hidden="true" />
                  <input
                    aria-label="Search lessons and diagrams"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search concepts, patterns, failures"
                    className="ui-input ui-filter-input"
                    data-testid="knowledge-search-input"
                  />
                </label>
              </div>

              <div className="ui-filters">
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
                <Dropdown
                  label="Content type"
                  value={kind}
                  options={[
                    { value: "all", label: "Lessons & diagrams", description: "Every library item" },
                    { value: "document", label: "Lessons", description: `${index.documents.length} Markdown guides` },
                    { value: "diagram", label: "Diagrams", description: `${index.diagrams.length} visual guides` },
                  ]}
                  onValueChange={(nextKind) => setKind(nextKind as "all" | "document" | "diagram")}
                  testId="content-type-filter"
                  icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
                />
              </div>
            </div>

            <p className="ui-results-count" role="status">{results.length} results</p>
            <div className="grid gap-3" data-testid="search-results">
              {results.map((result) => (
                <Link
                  key={`${result.kind}-${result.id}`}
                  href={result.route}
                  className="ui-result-row"
                  data-testid={`result-${result.kind}-${result.id}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-xl border border-[#d5e2e8] bg-[#f6fbfc] px-2 py-1 text-xs font-semibold text-[#245fba]">
                      {result.kind === "document" ? <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> : <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />}
                      {result.kind === "document" ? "Lesson" : "Diagram"}
                    </span>
                    {result.difficulty ? <DifficultyPill difficulty={result.difficulty} /> : null}
                    <span className="text-xs font-semibold uppercase text-[#68737d]">{result.track}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#263238]">{highlight(result.title, query)}</h2>
                  <p className="mt-2 text-sm font-normal leading-6 text-[#68737d]">{highlight(result.snippet || result.summary, query)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="rounded-xl bg-[#eaf7f4] px-2.5 py-1 text-xs font-semibold text-[#007c78]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
              {results.length === 0 ? (
                <div className="rounded-xl border border-[#d5e2e8] bg-white p-5 text-sm font-medium text-[#68737d]" data-testid="empty-results">
                  No lessons or diagrams match these filters.
                </div>
              ) : null}
            </div>
          </div>

          <details className="ui-disclosure">
            <summary>Library overview</summary>
            <dl className="ui-metadata">
              <div><dt>Published lessons</dt><dd>{index.documents.filter(doc => doc.status === "published").length}</dd></div>
              <div><dt>Diagrams</dt><dd>{index.diagrams.length}</dd></div>
              <div><dt>Senior and principal</dt><dd>{index.documents.filter(doc => doc.difficulty === "senior" || doc.difficulty === "principal").length}</dd></div>
            </dl>
          </details>
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
