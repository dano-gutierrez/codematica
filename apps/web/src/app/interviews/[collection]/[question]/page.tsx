import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DifficultyPill } from "@/components/DifficultyPill";
import { InterviewHeader } from "@/components/InterviewCatalog";
import { InterviewQuestionSession } from "@/components/InterviewQuestionSession";
import { getContentIndex, getInterviewCollectionBySlug, getInterviewQuestionBySlug } from "@/lib/content";

type InterviewQuestionPageProps = {
  params: Promise<{
    collection: string;
    question: string;
  }>;
};

export function generateStaticParams() {
  return getContentIndex().interviewCollections.flatMap((collection) =>
    collection.questions.map((question) => ({
      collection: collection.slug,
      question: question.slug,
    })),
  );
}

export async function generateMetadata({ params }: InterviewQuestionPageProps): Promise<Metadata> {
  const { collection: collectionSlug, question: questionSlug } = await params;
  const question = getInterviewQuestionBySlug(collectionSlug, questionSlug);

  return {
    title: question ? `${question.title} - ${question.collectionName} - Codematica` : "Interview question not found - Codematica",
    description: question?.summary,
  };
}

export default async function InterviewQuestionPage({ params }: InterviewQuestionPageProps) {
  const { collection: collectionSlug, question: questionSlug } = await params;
  const collection = getInterviewCollectionBySlug(collectionSlug);
  const question = getInterviewQuestionBySlug(collectionSlug, questionSlug);

  if (!collection || !question) {
    notFound();
  }

  return (
    <main className="min-h-screen pb-12" data-testid="interview-question-page">
      <InterviewHeader />

      <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
        <Link
          href={collection.route}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {collection.name}
        </Link>

        <div className="mt-6 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#f6fbfc] px-2.5 py-1 text-xs font-extrabold uppercase text-[#007c78]">
              {collection.name}
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

        <InterviewQuestionSession question={question} />
      </section>
    </main>
  );
}
