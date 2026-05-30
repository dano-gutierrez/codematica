import Fuse from "fuse.js";
import type { ContentIndex, Difficulty, KnowledgeDocument, MermaidDiagram } from "./content/schema";

export type SearchFilters = {
  track?: string;
  difficulty?: Difficulty;
};

export type SearchResult = {
  id: string;
  kind: "document" | "diagram";
  title: string;
  route: string;
  summary: string;
  track: string;
  topic: string;
  difficulty?: Difficulty;
  tags: string[];
  snippet: string;
  score: number;
};

type SearchableItem = {
  id: string;
  kind: "document" | "diagram";
  title: string;
  route: string;
  summary: string;
  track: string;
  topic: string;
  difficulty?: Difficulty;
  tags: string[];
  headings: string[];
  body: string;
};

export function createSearchItems(index: ContentIndex): SearchableItem[] {
  return [
    ...index.documents.map(documentToSearchItem),
    ...index.diagrams.map(diagramToSearchItem),
  ];
}

export function searchContent(index: ContentIndex, query: string, filters: SearchFilters = {}) {
  const trimmedQuery = query.trim();
  const items = filterSearchItems(createSearchItems(index), filters);

  if (!trimmedQuery) {
    return items.map((item, index) => toSearchResult(item, item.summary, items.length - index));
  }

  return fuzzySearch(items, trimmedQuery);
}

function filterSearchItems(items: SearchableItem[], filters: SearchFilters) {
  return items.filter((item) => {
    if (filters.track && item.track !== filters.track) {
      return false;
    }

    if (filters.difficulty && item.difficulty !== filters.difficulty) {
      return false;
    }

    return true;
  });
}

function fuzzySearch(items: SearchableItem[], query: string): SearchResult[] {
  const fuse = new Fuse(items, {
    includeScore: true,
    threshold: 0.38,
    ignoreLocation: true,
    keys: [
      { name: "title", weight: 0.36 },
      { name: "tags", weight: 0.24 },
      { name: "headings", weight: 0.18 },
      { name: "summary", weight: 0.14 },
      { name: "body", weight: 0.08 },
    ],
  });

  return fuse
    .search(query)
    .map(({ item, score }) =>
      toSearchResult(item, buildSnippet(item.body, query) || item.summary, Math.round((1 - (score ?? 1)) * 100)),
    );
}

export function buildSnippet(body: string, query: string, radius = 84) {
  const normalizedBody = body.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  const index = normalizedBody.indexOf(normalizedQuery);

  if (index < 0) {
    return "";
  }

  const start = Math.max(0, index - radius);
  const end = Math.min(body.length, index + query.length + radius);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < body.length ? "..." : "";

  return `${prefix}${body.slice(start, end).trim()}${suffix}`;
}

function documentToSearchItem(document: KnowledgeDocument): SearchableItem {
  return {
    id: document.id,
    kind: "document",
    title: document.title,
    route: document.route,
    summary: document.summary,
    track: document.track,
    topic: document.topic,
    difficulty: document.difficulty,
    tags: document.tags,
    headings: document.headings.map((heading) => heading.text),
    body: document.plainText,
  };
}

function diagramToSearchItem(diagram: MermaidDiagram): SearchableItem {
  return {
    id: diagram.id,
    kind: "diagram",
    title: diagram.title,
    route: diagram.route,
    summary: `Mermaid diagram stored in ${diagram.sourcePath}.`,
    track: "Diagrams",
    topic: "Mermaid",
    tags: ["diagram", "mermaid"],
    headings: [diagram.title],
    body: diagram.source,
  };
}

function toSearchResult(item: SearchableItem, snippet: string, score: number): SearchResult {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    route: item.route,
    summary: item.summary,
    track: item.track,
    topic: item.topic,
    difficulty: item.difficulty,
    tags: item.tags,
    snippet,
    score,
  };
}
