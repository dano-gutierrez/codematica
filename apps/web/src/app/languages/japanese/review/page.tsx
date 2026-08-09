import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JapaneseReview } from "@/components/JapaneseReview";
import { getContentIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "Japanese Review - Codematica",
  description: "Review due Japanese skills and open substantive N5 flashcard, writing, and approved listening modes.",
};

export default function JapaneseReviewPage() {
  const index = getContentIndex();
  const learningPath = index.learningPaths.find((path) => path.slug === "japanese-foundations");
  if (!learningPath) notFound();
  const approvedAudio = new Set(index.languageAudio.filter((audio) => audio.qaStatus === "approved").map((audio) => audio.id));
  const hasListening = index.exercises.some((exercise) => exercise.type === "questionnaire" && exercise.status === "published" && exercise.questions.some((question) => question.kind === "listening-choice" && approvedAudio.has(question.audioId)));
  return <JapaneseReview learningPath={learningPath} hasListening={hasListening} />;
}
