import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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

  return {
    title: exercise ? `${exercise.title} - Codematica` : "Practice not found - Codematica",
    description: exercise?.prompt,
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
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href={pathSlug ? `/paths/${pathSlug}` : "/"}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {pathSlug ? "Path" : "Paths"}
        </Link>

        <div className="mt-6">
          <PracticeCard exercise={exercise} nextHref={nextHref} />
        </div>
      </div>
    </main>
  );
}
