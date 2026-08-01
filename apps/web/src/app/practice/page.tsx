import type { Metadata } from "next";
import { PracticeCatalog } from "@/components/SectionCatalogs";
import { getContentIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "Practice And Review - Codematica",
  description: "Browse questionnaires, flashcards, cloze prompts, writing drills, and quick review feeds.",
};

export default function PracticePage() {
  return <PracticeCatalog index={getContentIndex()} />;
}
