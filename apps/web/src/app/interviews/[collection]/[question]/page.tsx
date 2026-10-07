import { Suspense } from "react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ButtonLink";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SourceReferences } from "@/components/SourceReferences";
import { DifficultyPill } from "@/components/DifficultyPill";
import { InterviewHeader } from "@/components/InterviewCatalog";
import { InterviewQuestionSession } from "@/components/InterviewQuestionSession";
import { getContentIndex, getInterviewCollectionBySlug, getInterviewQuestionBySlug, getNextPathNodeRoutesByPath, getSourcesByRefs } from "@/lib/content";

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

      <section className="ui-page">
        <ButtonLink href={collection.route} label={collection.name} icon={ArrowLeft} />

        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-[#d5e2e8] bg-[#f6fbfc] px-2.5 py-1 text-xs font-semibold uppercase text-[#007c78]">
              {collection.name}
            </span>
            <DifficultyPill difficulty={question.difficulty} />
            {question.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-xl bg-[#edf5ff] px-2.5 py-1 text-xs font-semibold text-[#245fba]">
                {tag}
              </span>
            ))}
          </div>

          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-[#263238] sm:text-4xl">{question.title}</h1>
          <p className="mt-4 text-base font-normal leading-7 text-[#68737d]">{question.summary}</p>

          <section className="mt-6 border-t border-[#e1e5e9] py-4">
            <p className="text-xs font-semibold uppercase text-[#68737d]">Prompt</p>
            <p className="mt-2 text-base font-medium leading-7 text-[#33434b]">{question.prompt}</p>
            {question.constraints.length > 0 ? (
              <ul className="mt-4 grid gap-2 text-sm font-normal leading-6 text-[#68737d]">
                {question.constraints.map((constraint) => (
                  <li key={constraint}>- {constraint}</li>
                ))}
              </ul>
            ) : null}
          </section>

          {question.examples.length > 0 ? (
            <section className="mt-5 grid gap-3">
              {question.examples.map((example) => (
                <div key={`${example.input}-${example.output}`} className="rounded-xl border border-[#d5e2e8] bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-[#68737d]">Example</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#263238]">Input: {example.input}</p>
                  <p className="mt-1 text-sm font-medium leading-6 text-[#263238]">Output: {example.output}</p>
                  {example.explanation ? <p className="mt-2 text-sm font-normal leading-6 text-[#68737d]">{example.explanation}</p> : null}
                </div>
              ))}
            </section>
          ) : null}
        </div>

        <SourceReferences sources={getSourcesByRefs(question.sourceRefs)} />
        <Suspense fallback={<p>Loading solution guide…</p>}><InterviewQuestionSession question={question} nextHrefsByPath={getNextPathNodeRoutesByPath({ kind: "interview", slug: `${collectionSlug}/${questionSlug}` })} /></Suspense>
      </section>
    </main>
  );
}
