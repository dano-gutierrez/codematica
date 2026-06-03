import { describe, expect, it } from "vitest";
import type { ContentIndex } from "./content/schema";
import { buildSnippet, searchContent } from "./search";

const index: ContentIndex = {
  schemaVersion: 7,
  tracks: [],
  learningPaths: [],
  exercises: [],
  passiveFlashcardFeeds: [],
  caseStudyFlows: [],
  interviewCompanies: [],
  documents: [
    {
      id: "doc-cache",
      title: "Cache Invalidation",
      slug: "system-design/cache-invalidation",
      route: "/docs/system-design/cache-invalidation",
      summary: "Freshness and invalidation strategies.",
      track: "System Design",
      topic: "Caching",
      difficulty: "senior",
      tags: ["caching", "freshness"],
      prerequisites: [],
      diagramRefs: [],
      status: "published",
      sourcePath: "content/knowledge/system-design/cache-invalidation.md",
      bodyPath: "content/knowledge/system-design/cache-invalidation.md",
      markdown: "## Cache Aside",
      plainText: "Cache aside uses lazy loading and explicit invalidation.",
      headings: [{ id: "cache-aside", depth: 2, text: "Cache Aside" }],
      mermaidBlocks: [],
      contentHash: "hash",
      readingMinutes: 1,
    },
    {
      id: "doc-types",
      title: "TypeScript Boundary Design",
      slug: "programming/typescript-boundaries",
      route: "/docs/programming/typescript-boundaries",
      summary: "Contracts for large frontends.",
      track: "Programming",
      topic: "TypeScript",
      difficulty: "senior",
      tags: ["typescript"],
      prerequisites: [],
      diagramRefs: [],
      status: "published",
      sourcePath: "content/knowledge/programming/typescript-boundaries.md",
      bodyPath: "content/knowledge/programming/typescript-boundaries.md",
      markdown: "## Contracts",
      plainText: "Runtime schemas protect API boundaries.",
      headings: [{ id: "contracts", depth: 2, text: "Contracts" }],
      mermaidBlocks: [],
      contentHash: "hash",
      readingMinutes: 1,
    },
  ],
  diagrams: [
    {
      id: "diagram-cache",
      title: "Cache Aside",
      slug: "system-design/cache-aside",
      route: "/diagrams/system-design/cache-aside",
      sourcePath: "content/diagrams/system-design/cache-aside.mmd",
      source: "sequenceDiagram\n  API->>Cache: Read key",
      contentHash: "hash",
    },
  ],
};

describe("searchContent", () => {
  it("performs fuzzy full-document search by default", () => {
    const results = searchContent(index, "lazy loading");

    expect(results.map((result) => result.title)).toEqual(["Cache Invalidation"]);
    expect(results[0]?.snippet).toContain("lazy loading");
  });

  it("weights title and tags above body text", () => {
    const results = searchContent(index, "cach");

    expect(results[0]?.title).toBe("Cache Invalidation");
  });

  it("applies track and difficulty filters", () => {
    const results = searchContent(index, "contracts", {
      track: "Programming",
      difficulty: "senior",
    });

    expect(results.map((result) => result.title)).toEqual(["TypeScript Boundary Design"]);
  });

  it("includes diagrams in searchable items", () => {
    const results = searchContent(index, "sequenceDiagram");

    expect(results.map((result) => result.kind)).toEqual(["diagram"]);
  });
});

describe("buildSnippet", () => {
  it("returns a focused snippet around query matches", () => {
    expect(buildSnippet("Before cache invalidation after", "cache")).toBe("Before cache invalidation after");
  });
});
