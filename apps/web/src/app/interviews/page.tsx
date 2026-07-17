import type { Metadata } from "next";
import { InterviewCatalog } from "@/components/InterviewCatalog";
import { getContentIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "Interview Coding Catalog - Codematica",
  description: "Company-style coding interview practice organized by major technology companies.",
};

export default function InterviewsPage() {
  return <InterviewCatalog index={getContentIndex()} />;
}
