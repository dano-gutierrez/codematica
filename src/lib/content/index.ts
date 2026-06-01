import rawContentIndex from "@/generated/content-index.json";
import type { ContentIndex, LearningPathNode } from "./schema";

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

export function getLearningPathBySlug(slug: string) {
  return contentIndex.learningPaths.find((learningPath) => learningPath.slug === slug);
}

export function getExerciseBySlug(slug: string) {
  return contentIndex.exercises.find((exercise) => exercise.slug === slug);
}

export function getReferencedDiagrams(diagramRefs: string[]) {
  const refs = new Set(diagramRefs);
  return contentIndex.diagrams.filter((diagram) => refs.has(diagram.slug));
}

export function getPathNodeRoute(node: LearningPathNode, pathSlug?: string) {
  if (node.kind === "document") {
    return `/docs/${node.slug}`;
  }

  if (node.kind === "diagram") {
    return `/diagrams/${node.slug}`;
  }

  const pathSearch = pathSlug ? `?path=${encodeURIComponent(pathSlug)}` : "";
  return `/practice/${node.slug}${pathSearch}`;
}

export function getNextPathNodeRoute(pathSlug: string, currentNode: LearningPathNode) {
  const learningPath = getLearningPathBySlug(pathSlug);

  if (!learningPath) {
    return undefined;
  }

  const nodes = learningPath.units.flatMap((unit) => unit.nodes);
  const currentIndex = nodes.findIndex((node) => node.kind === currentNode.kind && node.slug === currentNode.slug);
  const nextNode = currentIndex >= 0 ? nodes[currentIndex + 1] : undefined;

  return nextNode ? getPathNodeRoute(nextNode, learningPath.slug) : undefined;
}
