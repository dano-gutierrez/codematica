import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PassiveFlashcardFeed } from "@/components/PassiveFlashcardFeed";
import { getContentIndex, getLearningPathBySlug, getPassiveFlashcardFeedByPathSlug } from "@/lib/content";

type FlashcardFeedPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getContentIndex().passiveFlashcardFeeds.map((feed) => ({
    slug: feed.pathSlug,
  }));
}

export async function generateMetadata({ params }: FlashcardFeedPageProps): Promise<Metadata> {
  const { slug } = await params;
  const feed = getPassiveFlashcardFeedByPathSlug(slug);
  const learningPath = getLearningPathBySlug(slug);

  return {
    title: feed ? `${feed.title} - Codematica` : "Flashcard feed not found - Codematica",
    description: feed?.summary ?? learningPath?.summary,
  };
}

export default async function FlashcardFeedPage({ params }: FlashcardFeedPageProps) {
  const { slug } = await params;
  const feed = getPassiveFlashcardFeedByPathSlug(slug);

  if (!feed || feed.status !== "published") {
    notFound();
  }

  return <PassiveFlashcardFeed feed={feed} />;
}
