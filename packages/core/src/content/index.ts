import rawContentIndex from "../generated/content-index.json";
import type { ContentIndex, LearningPathNode } from "./schema";

const contentIndex = rawContentIndex as unknown as ContentIndex;

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

export function getSourceById(id: string) {
  return contentIndex.sources.find((source) => source.id === id);
}

export function getSourcesByRefs(sourceRefs: readonly string[] | undefined) {
  if (!sourceRefs?.length) return [];
  const refs = new Set(sourceRefs);
  return contentIndex.sources.filter((source) => refs.has(source.id));
}

export function getExerciseBySlug(slug: string) {
  return contentIndex.exercises.find((exercise) => exercise.slug === slug);
}

export function getLanguageCharacterBySlug(slug: string) {
  return contentIndex.languageCharacters.find((character) => character.slug === slug);
}

export function getLanguageVocabularyBySlug(slug: string) {
  return contentIndex.languageVocabulary.find((item) => item.slug === slug);
}

export function getJapaneseCharacters() {
  return contentIndex.languageCharacters.filter((character) => character.language === "ja" && character.status === "published");
}

export function getJapaneseVocabulary() {
  return contentIndex.languageVocabulary.filter((item) => item.language === "ja" && item.status === "published");
}

export function getJapaneseGrammar() {
  return contentIndex.languageGrammar.filter((item) => item.status === "published");
}

export function getPassiveFlashcardFeedByPathSlug(pathSlug: string) {
  return contentIndex.passiveFlashcardFeeds.find((feed) => feed.pathSlug === pathSlug);
}

export function getInterviewCollectionBySlug(slug: string) {
  return contentIndex.interviewCollections.find((collection) => collection.slug === slug);
}

export function getInterviewCompanyBySlug(slug: string) {
  const collection = getInterviewCollectionBySlug(slug);
  return collection?.kind === "company" ? collection : undefined;
}

export function getInterviewQuestionBySlug(collectionSlug: string, questionSlug: string) {
  return getInterviewCollectionBySlug(collectionSlug)?.questions.find((question) => question.slug === questionSlug);
}

export function getReferencedDiagrams(diagramRefs: string[]) {
  const refs = new Set(diagramRefs);
  return contentIndex.diagrams.filter((diagram) => refs.has(diagram.slug));
}

export function getPathNodeRoute(node: LearningPathNode, pathSlug?: string) {
  const pathSearch = pathSlug ? `?path=${encodeURIComponent(pathSlug)}` : "";

  if (node.kind === "document") {
    return `/docs/${node.slug}${pathSearch}`;
  }

  if (node.kind === "diagram") {
    return `/diagrams/${node.slug}${pathSearch}`;
  }

  if (node.kind === "source") {
    const companion =
      node.companionKind === "document"
        ? contentIndex.documents.find((document) => document.slug === node.slug && document.status === "published")
        : contentIndex.exercises.find((exercise) => exercise.slug === node.slug && exercise.status === "published");
    if (companion) return `${companion.route}${pathSearch}`;
    return getSourceById(node.sourceRef)?.url ?? `/paths${pathSearch}`;
  }

  return `/practice/${node.slug}${pathSearch}`;
}

export function getNextPathNodeRoute(pathSlug: string, currentNode: LearningPathNode) {
  const learningPath = getLearningPathBySlug(pathSlug);

  if (!learningPath) {
    return undefined;
  }

  const nodes = learningPath.units.flatMap((unit) => unit.nodes);
  const currentIndex = nodes.findIndex(
    (node) => node.slug === currentNode.slug && (node.kind === currentNode.kind || (node.kind === "source" && node.companionKind === currentNode.kind)),
  );
  const nextNode = currentIndex >= 0 ? nodes[currentIndex + 1] : undefined;

  return nextNode ? getPathNodeRoute(nextNode, learningPath.slug) : undefined;
}

export function getNextPathNodeRoutesByPath(currentNode: LearningPathNode) {
  return Object.fromEntries(
    contentIndex.learningPaths
      .map((learningPath) => [learningPath.slug, getNextPathNodeRoute(learningPath.slug, currentNode)] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  );
}
