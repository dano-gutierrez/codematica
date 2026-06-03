import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { PracticeCard } from "@/components/PracticeCard";
import { getContentIndex, getExerciseBySlug, getNextPathNodeRoute } from "@/lib/content";

type PracticePageProps = {
  params: Promise<{
    slug: string[];
  }>;
  searchParams: Promise<{
    path?: string | string[];
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

export default async function PracticePage({ params, searchParams }: PracticePageProps) {
  const { slug } = await params;
  const { path } = await searchParams;
  const exerciseSlug = slug.join("/");
  const exercise = getExerciseBySlug(exerciseSlug);

  if (!exercise) {
    notFound();
  }

  const pathSlug = Array.isArray(path) ? path[0] : path;
  const nextHref = pathSlug ? getNextPathNodeRoute(pathSlug, { kind: "exercise", slug: exercise.slug }) : undefined;

  return (
    <main className="min-h-screen px-4 py-5 sm:py-8" data-testid="practice-page">
      <div className="mx-auto w-full max-w-6xl">
        <BackButton />

        <div className="mt-6">
          <PracticeCard exercise={exercise} nextHref={nextHref} />
        </div>
      </div>
    </main>
  );
}
