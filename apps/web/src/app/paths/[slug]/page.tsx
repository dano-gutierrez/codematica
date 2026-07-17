import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LearningPathDetail } from "@/components/LearningPathMap";
import { getContentIndex, getLearningPathBySlug } from "@/lib/content";

type PathPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getContentIndex().learningPaths.map((learningPath) => ({
    slug: learningPath.slug,
  }));
}

export async function generateMetadata({ params }: PathPageProps): Promise<Metadata> {
  const { slug } = await params;
  const learningPath = getLearningPathBySlug(slug);

  return {
    title: learningPath ? `${learningPath.title} - Codematica` : "Path not found - Codematica",
    description: learningPath?.summary,
  };
}

export default async function PathPage({ params }: PathPageProps) {
  const { slug } = await params;
  const learningPath = getLearningPathBySlug(slug);

  if (!learningPath) {
    notFound();
  }

  return <LearningPathDetail index={getContentIndex()} learningPath={learningPath} />;
}
