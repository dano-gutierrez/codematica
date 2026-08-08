import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JapaneseReview } from "@/components/JapaneseReview";
import { getContentIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "Japanese Review - Codematica",
  description: "Review due Japanese skills without mixing in separate flashcard or audio practice modes.",
};

export default function JapaneseReviewPage() {
  const index = getContentIndex();
  const learningPath = index.learningPaths.find((path) => path.slug === "japanese-foundations");
  if (!learningPath) notFound();
  return <JapaneseReview learningPath={learningPath} />;
}
