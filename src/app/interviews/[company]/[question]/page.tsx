import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DifficultyPill } from "@/components/DifficultyPill";
import { InterviewHeader } from "@/components/InterviewCatalog";
import { InterviewQuestionSession } from "@/components/InterviewQuestionSession";
import { getContentIndex, getInterviewCompanyBySlug, getInterviewQuestionBySlug, getNextPathNodeRoute } from "@/lib/content";

type InterviewQuestionPageProps = {
  params: Promise<{
    company: string;
    question: string;
  }>;
  searchParams?: Promise<{
    path?: string;
  }>;
};

export function generateStaticParams() {
  return getContentIndex().interviewCompanies.flatMap((company) =>
    company.questions.map((question) => ({
      company: company.slug,
      question: question.slug,
    })),
  );
}

export async function generateMetadata({ params }: InterviewQuestionPageProps): Promise<Metadata> {
  const { company: companySlug, question: questionSlug } = await params;
  const question = getInterviewQuestionBySlug(companySlug, questionSlug);

  return {
    title: question ? `${question.title} - ${question.companyName} Interview Prep - Codematica` : "Interview question not found - Codematica",
    description: question?.summary,
  };
}

export default async function InterviewQuestionPage({ params, searchParams }: InterviewQuestionPageProps) {
  const { company: companySlug, question: questionSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const company = getInterviewCompanyBySlug(companySlug);
  const question = getInterviewQuestionBySlug(companySlug, questionSlug);
  const pathSlug = resolvedSearchParams?.path;
  const nextHref = pathSlug ? getNextPathNodeRoute(pathSlug, { kind: "interview", slug: `${companySlug}/${questionSlug}` }) : undefined;

  if (!company || !question) {
    notFound();
  }

  return (
    <main className="min-h-screen pb-12" data-testid="interview-question-page">
      <InterviewHeader />

      <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
        <Link
          href={company.route}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {company.name}
        </Link>

        <div className="mt-6 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#f6fbfc] px-2.5 py-1 text-xs font-extrabold uppercase text-[#007c78]">
              {company.name}
            </span>
            <DifficultyPill difficulty={question.difficulty} />
            {question.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-lg bg-[#edf5ff] px-2.5 py-1 text-xs font-extrabold text-[#245fba]">
                {tag}
              </span>
            ))}
          </div>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-6xl">{question.title}</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-[#68737d]">{question.summary}</p>

          <section className="mt-6 rounded-lg border-2 border-[#d5e2e8] bg-[#f6fbfc] p-4">
            <p className="text-xs font-extrabold uppercase text-[#68737d]">Prompt</p>
            <p className="mt-2 text-base font-bold leading-7 text-[#33434b]">{question.prompt}</p>
            {question.constraints.length > 0 ? (
              <ul className="mt-4 grid gap-2 text-sm font-semibold leading-6 text-[#68737d]">
                {question.constraints.map((constraint) => (
                  <li key={constraint}>- {constraint}</li>
                ))}
              </ul>
            ) : null}
          </section>

          {question.examples.length > 0 ? (
            <section className="mt-5 grid gap-3">
              {question.examples.map((example) => (
                <div key={`${example.input}-${example.output}`} className="rounded-lg border-2 border-[#d5e2e8] bg-white p-4">
                  <p className="text-xs font-extrabold uppercase text-[#68737d]">Example</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#263238]">Input: {example.input}</p>
                  <p className="mt-1 text-sm font-bold leading-6 text-[#263238]">Output: {example.output}</p>
                  {example.explanation ? <p className="mt-2 text-sm font-semibold leading-6 text-[#68737d]">{example.explanation}</p> : null}
                </div>
              ))}
            </section>
          ) : null}
        </div>

        <InterviewQuestionSession question={question} nextHref={nextHref} />
      </section>
    </main>
  );
}
