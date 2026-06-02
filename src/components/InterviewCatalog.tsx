import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Code2, Search } from "lucide-react";
import { DifficultyPill } from "@/components/DifficultyPill";
import { RandomInterviewButton } from "@/components/RandomInterviewButton";
import type { ContentIndex, InterviewCompany, InterviewQuestion } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

export function InterviewCatalog({ index }: { index: ContentIndex }) {
  const routes = index.interviewCompanies.flatMap((company) => company.questions.map((question) => question.route));

  return (
    <main className="min-h-screen pb-12" data-testid="interview-catalog">
      <InterviewHeader />

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0">
            <p className="text-sm font-extrabold uppercase text-[#007c78]">Reported public prep</p>
            <h1 className="mt-2 max-w-4xl text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-6xl">
              Practice coding loops by company signal.
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-[#68737d]">
              These are community-reported and public prep prompts rewritten for Codematica. They are not official company question banks.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {index.interviewCompanies.map((company) => (
                <CompanyTile key={company.slug} company={company} />
              ))}
            </div>
          </div>

          <aside className="grid h-fit gap-4 lg:sticky lg:top-5">
            <section className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4">
              <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase text-[#68737d]">
                <Code2 className="h-4 w-4 text-[#245fba]" aria-hidden="true" />
                Catalog
              </h2>
              <div className="mt-4 grid gap-2 text-sm font-bold text-[#68737d]">
                <StatRow label="Companies" value={index.interviewCompanies.length} />
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

export function InterviewCompanyDetail({ company }: { company: InterviewCompany }) {
  return (
    <main className="min-h-screen pb-12" data-testid="interview-company-page">
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
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
              Company catalog
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-6xl">{company.name}</h1>
            <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-[#68737d]">{company.summary}</p>
          </div>
          <CompanyLogo company={company} className="h-20 w-20 p-3" />
        </div>

        <div className="mt-8 grid gap-4" data-testid="interview-question-list">
          {company.questions.map((question) => (
            <QuestionCard key={question.slug} question={question} />
          ))}
        </div>
      </section>
    </main>
  );
}

export function InterviewHeader() {
  return (
    <header className="border-b-2 border-[#d5e2e8] bg-white px-4 py-4">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Codematica home">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78]">
            <Code2 className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xl font-extrabold text-[#007c78]">Codematica</span>
            <span className="block truncate text-xs font-extrabold uppercase text-[#68737d]">Interview prep</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/browse"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]"
          >
            <Search className="h-4 w-4 text-[#245fba]" aria-hidden="true" />
            Browse
          </Link>
        </nav>
      </div>
    </header>
  );
}

function CompanyTile({ company }: { company: InterviewCompany }) {
  return (
    <Link
      href={company.route}
      className="grid min-h-56 grid-rows-[auto_minmax(0,1fr)_auto] gap-4 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#007c78] hover:shadow-[0_8px_0_#d5e2e8]"
      data-testid={`interview-company-card-${company.slug}`}
    >
      <CompanyLogo company={company} className="h-14 w-14 p-2.5" />
      <span className="min-w-0">
        <span className="block text-2xl font-extrabold tracking-normal text-[#263238]">{company.name}</span>
        <span className="mt-2 block text-sm font-semibold leading-6 text-[#68737d]">{company.summary}</span>
      </span>
      <span className="inline-flex items-center gap-2 text-sm font-extrabold text-[#245fba]">
        {company.questions.length} questions
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
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
      className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#007c78] hover:shadow-[0_8px_0_#d5e2e8] sm:p-5"
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
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-[#245fba]">
        Start walkthrough
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
