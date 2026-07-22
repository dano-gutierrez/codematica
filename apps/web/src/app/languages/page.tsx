import type { Metadata } from "next";
import { LanguageCatalog } from "@/components/SectionCatalogs";
import { getContentIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "Languages - Codematica",
  description: "Browse Codematica language courses, reference catalogs, vocabulary, and writing practice.",
};

export default function LanguagesPage() {
  return <LanguageCatalog index={getContentIndex()} />;
}
