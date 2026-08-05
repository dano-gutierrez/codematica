import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JapaneseReview } from "@/components/JapaneseReview";
import { getContentIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "Japanese Review - Codematica",
  description: "Review due Japanese skills or browse every flashcard without locking the course.",
};

export default function JapaneseReviewPage() {
  const index = getContentIndex();
  const learningPath = index.learningPaths.find((path) => path.slug === "japanese-foundations");
  if (!learningPath) notFound();
  return <JapaneseReview index={index} learningPath={learningPath} />;
}
