"use client";

import { useSearchParams } from "next/navigation";
import { PracticeCard } from "@/components/PracticeCard";
import type { LearningExercise } from "@/lib/content/schema";
import { appendPathToHref, recordProgress } from "@/lib/progress/client";
import type { ProgressStatus } from "@/lib/progress/progress";

type PathScopedPracticeCardProps = {
  exercise: LearningExercise;
  nextHrefsByPath: Record<string, string>;
};

export function PathScopedPracticeCard({ exercise, nextHrefsByPath }: PathScopedPracticeCardProps) {
  const searchParams = useSearchParams();
  const pathSlug = searchParams.get("path") ?? "";
  const nextHref = pathSlug ? nextHrefsByPath[pathSlug] : undefined;

  function handleProgressEvent(status: ProgressStatus, position: Record<string, unknown>) {
    void recordProgress(
      {
        surface: "practice",
        slug: exercise.slug,
        pathSlug,
        title: exercise.title,
        summary: `${exercise.concept} practice`,
        href: appendPathToHref(exercise.route, pathSlug),
        eyebrow: "Practice",
      },
      status,
      position,
    );
  }

  return <PracticeCard exercise={exercise} nextHref={nextHref} onProgressEvent={handleProgressEvent} />;
}
