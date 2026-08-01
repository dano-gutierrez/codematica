import type { Metadata } from "next";
import { LearningPathCatalog } from "@/components/SectionCatalogs";
import { getContentIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "Learning Paths - Codematica",
  description: "Browse every Codematica role, skill, and language learning path.",
};

export default function PathsPage() {
  return <LearningPathCatalog index={getContentIndex()} />;
}
