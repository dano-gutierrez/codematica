import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InterviewCollectionDetail } from "@/components/InterviewCatalog";
import { getContentIndex, getInterviewCollectionBySlug } from "@/lib/content";

type InterviewCollectionPageProps = {
  params: Promise<{
    collection: string;
  }>;
};

export function generateStaticParams() {
  return getContentIndex().interviewCollections.map((collection) => ({
    collection: collection.slug,
  }));
}

export async function generateMetadata({ params }: InterviewCollectionPageProps): Promise<Metadata> {
  const { collection: collectionSlug } = await params;
  const collection = getInterviewCollectionBySlug(collectionSlug);

  return {
    title: collection ? `${collection.name} - Interview Prep - Codematica` : "Interview collection not found - Codematica",
    description: collection?.summary,
  };
}

export default async function InterviewCollectionPage({ params }: InterviewCollectionPageProps) {
  const { collection: collectionSlug } = await params;
  const collection = getInterviewCollectionBySlug(collectionSlug);

  if (!collection) {
    notFound();
  }

  return <InterviewCollectionDetail collection={collection} />;
}
