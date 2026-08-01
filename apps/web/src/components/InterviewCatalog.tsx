"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Code2, PanelsTopLeft, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DifficultyPill } from "@/components/DifficultyPill";
import { Dropdown } from "@/components/Dropdown";
import { RandomInterviewButton } from "@/components/RandomInterviewButton";
import type { ContentIndex, InterviewCollection, InterviewCompany, InterviewQuestion } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

export function InterviewCatalog({ index }: { index: ContentIndex }) {
  const routes = index.interviewCollections.flatMap((collection) => collection.questions.map((question) => question.route));
  const realWorldCollections = index.interviewCollections.filter((collection) => collection.kind === "real-world");
  const companies = index.interviewCollections.filter((collection): collection is InterviewCompany => collection.kind === "company");
  const [query, setQuery] = useState("");
  const [companySlug, setCompanySlug] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const questions = useMemo(
    () =>
      index.interviewCollections.flatMap((collection) =>
        collection.questions.filter(
          (question) =>
            (companySlug === "all" || collection.slug === companySlug) &&
            (difficulty === "all" || question.difficulty === difficulty) &&
            (!query.trim() || [question.title, question.summary, collection.name, ...question.tags].join(" ").toLocaleLowerCase("en-US").includes(query.trim().toLocaleLowerCase("en-US"))),
        ),
      ),
    [companySlug, difficulty, index.interviewCollections, query],
  );

  return (
    <main className="min-h-screen pb-12" data-testid="interview-catalog">
      <InterviewHeader />

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0">
            <p className="text-sm font-extrabold uppercase text-[#4b369e]">Interview prep</p>
            <h1 className="mt-2 max-w-4xl text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-6xl">
              Practice real interview judgment and coding patterns.
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-[#68737d]">
              Study anonymous real-world exercises alongside community-reported company preparation. Company prompts are not official question banks.
            </p>

            <section className="mt-9" data-testid="real-world-interviews-section">
              <p className="text-sm font-extrabold uppercase text-[#b4322a]">Real-world interviews</p>
              <h2 className="mt-1 text-3xl font-extrabold text-[#263238]">Build from authentic, anonymous briefs.</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {realWorldCollections.map((collection) => <CollectionTile key={collection.slug} collection={collection} />)}
              </div>
            </section>

            <section className="mt-10" data-testid="company-interviews-section">
              <p className="text-sm font-extrabold uppercase text-[#007c78]">Company interview prep</p>
              <h2 className="mt-1 text-3xl font-extrabold text-[#263238]">Practice reported-public coding patterns.</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {companies.map((company) => (
                  <CompanyTile key={company.slug} company={company} />
                ))}
              </div>
            </section>

            <section className="mt-10">
              <div>
                <p className="text-sm font-extrabold uppercase text-[#4b369e]">All questions</p>
                <h2 className="mt-1 text-3xl font-extrabold text-[#263238]">Browse the complete question catalog.</h2>
              </div>
              <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_16rem_16rem]">
                <label className="relative block">
                  <span className="sr-only">Search interview questions</span>
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#68737d]" aria-hidden="true" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions, collections, and tags" className="h-14 w-full rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white pl-12 pr-4 text-base font-bold text-[#263238] outline-none focus:border-[#4b369e]" data-testid="interview-search-input" />
                </label>
                <Dropdown
                  label="Collection"
                  value={companySlug}
                  onValueChange={setCompanySlug}
                  testId="interview-company-filter"
                  options={[
                    { value: "all", label: "All collections", description: `${index.interviewCollections.length} interview collections` },
                    ...index.interviewCollections.map((collection) => ({ value: collection.slug, label: collection.name, description: `${collection.questions.length} questions` })),
                  ]}
                />
                <Dropdown
                  label="Difficulty"
                  value={difficulty}
                  onValueChange={setDifficulty}
                  testId="interview-difficulty-filter"
                  options={[
                    { value: "all", label: "All levels", description: "Every question difficulty" },
                    { value: "foundation", label: "Foundation", description: "Core interview patterns" },
                    { value: "practitioner", label: "Practitioner", description: "Applied problem solving" },
                    { value: "senior", label: "Senior", description: "Tradeoff-heavy problems" },
                    { value: "principal", label: "Principal", description: "Advanced problems" },
                  ]}
                />
              </div>
              <p className="mt-4 text-sm font-bold text-[#68737d]" aria-live="polite">{questions.length} questions</p>
              <div className="mt-4 grid gap-4" data-testid="interview-all-question-list">
                {questions.map((question) => <QuestionCard key={`${question.collectionSlug}-${question.slug}`} question={question} />)}
              </div>
              {questions.length === 0 ? <div className="mt-4 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 text-sm font-bold text-[#68737d]">No interview questions match those filters.</div> : null}
            </section>
          </div>

          <aside className="grid h-fit gap-4 lg:sticky lg:top-5">
            <section className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4">
              <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase text-[#68737d]">
                <Code2 className="h-4 w-4 text-[#245fba]" aria-hidden="true" />
                Catalog
              </h2>
              <div className="mt-4 grid gap-2 text-sm font-bold text-[#68737d]">
                <StatRow label="Real-world" value={realWorldCollections.length} />
                <StatRow label="Companies" value={companies.length} />
                <StatRow label="Questions" value={routes.length} />
                <StatRow label="Languages" value={3} />
              </div>
            </section>
            <RandomInterviewButton routes={routes} />
          </aside>
        </div>
      </section>
    </main>
  );
}

export function InterviewCollectionDetail({ collection }: { collection: InterviewCollection }) {
  return (
    <main className="min-h-screen pb-12" data-testid={collection.kind === "company" ? "interview-company-page" : "interview-collection-page"}>
      <InterviewHeader />

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <Link
          href="/interviews"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Interviews
        </Link>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-2.5 py-1 text-xs font-extrabold uppercase text-[#007c78]">
              {collection.kind === "company" ? <Building2 className="h-3.5 w-3.5" aria-hidden="true" /> : <PanelsTopLeft className="h-3.5 w-3.5" aria-hidden="true" />}
              {collection.kind === "company" ? "Company catalog" : "Anonymous real-world collection"}
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-6xl">{collection.name}</h1>
            <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-[#68737d]">{collection.summary}</p>
          </div>
          {collection.kind === "company" ? <CompanyLogo company={collection} className="h-20 w-20 p-3" /> : <CollectionIcon className="h-20 w-20" />}
        </div>

        <div className="mt-8 grid gap-4" data-testid="interview-question-list">
          {collection.questions.map((question) => (
            <QuestionCard key={question.slug} question={question} />
          ))}
        </div>
      </section>
    </main>
  );
}

export function InterviewHeader() {
  return <AppHeader subtitle="Interview prep" />;
}

function CompanyTile({ company }: { company: InterviewCompany }) {
  return (
    <Link
      href={company.route}
      className="grid min-h-56 grid-rows-[auto_minmax(0,1fr)_auto] gap-4 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#4b369e] hover:shadow-[0_8px_0_#d5e2e8]"
      data-testid={`interview-company-card-${company.slug}`}
    >
      <CompanyLogo company={company} className="h-14 w-14 p-2.5" />
      <span className="min-w-0">
        <span className="block text-2xl font-extrabold tracking-normal text-[#263238]">{company.name}</span>
        <span className="mt-2 block text-sm font-semibold leading-6 text-[#68737d]">{company.summary}</span>
      </span>
      <span className="inline-flex items-center gap-2 text-sm font-extrabold text-[#4b369e]">
        {company.questions.length} questions
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

function CollectionTile({ collection }: { collection: InterviewCollection }) {
  return (
    <Link
      href={collection.route}
      className="grid min-h-48 grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#b4322a] hover:shadow-[0_8px_0_#d5e2e8]"
      data-testid={`interview-collection-card-${collection.slug}`}
    >
      <CollectionIcon className="h-14 w-14" />
      <span className="min-w-0">
        <span className="block text-2xl font-extrabold text-[#263238]">{collection.name}</span>
        <span className="mt-2 block text-sm font-semibold leading-6 text-[#68737d]">{collection.summary}</span>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-[#b4322a]">
          {collection.questions.length} {collection.questions.length === 1 ? "exercise" : "exercises"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}

function CollectionIcon({ className }: { className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-lg border-2 border-b-4 border-[#111] bg-[#f3c623]", className)} aria-hidden="true">
      <PanelsTopLeft className="h-7 w-7 text-[#111]" />
    </span>
  );
}

function CompanyLogo({ company, className }: { company: InterviewCompany; className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white", className)}>
      <img
        src={company.logo.src}
        alt={company.logo.alt}
        className="h-full w-full object-contain"
        loading="lazy"
        data-testid={`interview-company-logo-${company.slug}`}
      />
    </span>
  );
}

function QuestionCard({ question }: { question: InterviewQuestion }) {
  return (
    <Link
      href={question.route}
      className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#4b369e] hover:shadow-[0_8px_0_#d5e2e8] sm:p-5"
      data-testid={`interview-question-card-${question.slug}`}
    >
      <span className="flex flex-wrap items-center gap-2">
        <DifficultyPill difficulty={question.difficulty} />
        {question.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-lg bg-[#edf5ff] px-2.5 py-1 text-xs font-extrabold text-[#245fba]">
            {tag}
          </span>
        ))}
      </span>
      <span className="mt-4 block text-2xl font-extrabold tracking-normal text-[#263238]">{question.title}</span>
      <span className="mt-2 block text-sm font-semibold leading-6 text-[#68737d]">{question.summary}</span>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-[#4b369e]">
        {question.kind === "web" ? "Explore solutions" : "Start walkthrough"}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#f6fbfc] px-3 py-2">
      <span>{label}</span>
      <span className="font-extrabold text-[#007c78]">{value}</span>
    </div>
  );
}
