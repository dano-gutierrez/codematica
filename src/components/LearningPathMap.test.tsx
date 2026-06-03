import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LearningPathDetail } from "./LearningPathMap";
import type { ContentIndex, LearningPath } from "@/lib/content/schema";

const learningPath: LearningPath = {
  id: "path-python",
  slug: "python-for-ts-js-engineers",
  title: "Python For TypeScript And JavaScript Engineers",
  summary: "Refresh senior Python fundamentals through production practice.",
  kind: "skill",
  category: "Programming",
  audience: "TypeScript and JavaScript engineers refreshing Python.",
  status: "published",
  route: "/paths/python-for-ts-js-engineers",
  sourcePath: "content/learning-paths/python-for-ts-js-engineers.json",
  contentHash: "hash",
  units: [
    {
      slug: "interview-practice",
      title: "Interview Practice",
      summary: "Apply Python concepts to interview problems.",
      nodes: [{ kind: "interview", slug: "amazon/lru-cache" }],
    },
  ],
};

const index = {
  schemaVersion: 6,
  documents: [],
  diagrams: [],
  learningPaths: [learningPath],
  exercises: [],
  passiveFlashcardFeeds: [],
  interviewCompanies: [
    {
      id: "company-amazon",
      slug: "amazon",
      name: "Amazon",
      logo: { src: "/company-logos/amazon.svg", alt: "Amazon logo" },
      summary: "Practice array, cache, and frequency-ranking problems.",
      status: "published",
      route: "/interviews/amazon",
      sourcePath: "content/interviews/amazon.json",
      contentHash: "hash",
      questions: [
        {
          id: "question-lru",
          slug: "lru-cache",
          title: "LRU Cache",
          summary: "Implement a fixed-capacity cache that evicts the least recently used key.",
          prompt: "Implement a fixed-capacity cache that evicts the least recently used key.",
          difficulty: "senior",
          tags: ["design", "hash-map"],
          route: "/interviews/amazon/lru-cache",
          companySlug: "amazon",
          companyName: "Amazon",
          sourceLinks: [{ label: "Reported public list", url: "https://example.com" }],
          resources: [],
          examples: [],
          constraints: [],
          diagrams: [],
          solutionTracks: [],
        },
      ],
    },
  ],
  tracks: [],
} satisfies ContentIndex;

describe("LearningPathDetail", () => {
  it("renders interview nodes as interview problems", () => {
    render(<LearningPathDetail index={index} learningPath={learningPath} />);

    const node = screen.getByTestId("path-node-interview-amazon-lru-cache");

    expect(node).toHaveAttribute("href", "/interviews/amazon/lru-cache?path=python-for-ts-js-engineers");
    expect(node).toHaveTextContent("Interview problem");
    expect(node).toHaveTextContent("LRU Cache");
    expect(node).toHaveTextContent("Senior");
  });
});
