import rawContentIndex from "@/generated/content-index.json";
import type { ContentIndex } from "./schema";

const contentIndex = rawContentIndex as ContentIndex;

export function getContentIndex() {
  return contentIndex;
}

export function getPublishedDocuments() {
  return contentIndex.documents.filter((document) => document.status === "published");
}

export function getDocumentBySlug(slug: string) {
  return contentIndex.documents.find((document) => document.slug === slug);
}

export function getDiagramBySlug(slug: string) {
  return contentIndex.diagrams.find((diagram) => diagram.slug === slug);
}

export function getReferencedDiagrams(diagramRefs: string[]) {
  const refs = new Set(diagramRefs);
  return contentIndex.diagrams.filter((diagram) => refs.has(diagram.slug));
}
