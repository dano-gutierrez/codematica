import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackButton } from "@/components/BackButton";
import { PathScopedPracticeCard } from "@/components/PathScopedPracticeCard";
import { PracticeCard } from "@/components/PracticeCard";
import { getContentIndex, getExerciseBySlug, getNextPathNodeRoutesByPath } from "@/lib/content";

type PracticePageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

export function generateStaticParams() {
  return getContentIndex().exercises.map((exercise) => ({
    slug: exercise.slug.split("/"),
  }));
}

export async function generateMetadata({ params }: PracticePageProps): Promise<Metadata> {
  const { slug } = await params;
  const exercise = getExerciseBySlug(slug.join("/"));
  const description =
    exercise?.type === "questionnaire"
      ? `${exercise.questions.length} ${exercise.difficulty} questions for ${exercise.concept}.`
      : exercise?.prompt;

  return {
    title: exercise ? `${exercise.title} - Codematica` : "Practice not found - Codematica",
    description,
  };
}

export default async function PracticePage({ params }: PracticePageProps) {
  const { slug } = await params;
  const exerciseSlug = slug.join("/");
  const exercise = getExerciseBySlug(exerciseSlug);

  if (!exercise) {
    notFound();
  }

  const nextHrefsByPath = getNextPathNodeRoutesByPath({ kind: "exercise", slug: exercise.slug });

  return (
    <main className="min-h-screen px-4 py-5 sm:py-8" data-testid="practice-page">
      <div className="mx-auto w-full max-w-4xl">
        <BackButton />

        <div className="mt-6">
          <Suspense fallback={<PracticeCard exercise={exercise} />}>
            <PathScopedPracticeCard exercise={exercise} nextHrefsByPath={nextHrefsByPath} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
