import { describe, expect, it } from "vitest";
import { toSupabaseDocumentRow } from "./sync-supabase";
import type { KnowledgeDocument } from "../../src/lib/content/schema";

const document = {
  id: "doc",
  title: "Big O Program Flow",
  slug: "programming/big-o-program-flow",
  summary: "Learn how Big O changes as program flow and data structures change.",
  track: "Programming",
  topic: "Algorithms",
  difficulty: "foundation",
  tags: ["algorithms", "complexity"],
  prerequisites: [],
  diagramRefs: [],
  status: "published",
  route: "/docs/programming/big-o-program-flow",
  sourcePath: "content/knowledge/programming/big-o-program-flow.md",
  bodyPath: "content/knowledge/programming/big-o-program-flow.md",
  markdown: "## Program Flow",
  plainText: "Program Flow Membership Lookup Tradeoff",
  headings: [{ id: "program-flow", depth: 2, text: "Program Flow" }],
  mermaidBlocks: [],
  complexityFlowBlocks: [
    {
      id: "membership-lookup-comparison",
      title: "Membership Lookup Tradeoff",
      scenario: "Compare repeated list scans with prebuilt set lookups.",
      variants: [
        {
          id: "list-scan",
          label: "List scan",
          complexity: "O(n)",
          summary: "A miss may inspect every item.",
          operationCounts: [1],
          nodes: [
            {
              id: "request",
              label: "Request",
              kind: "input",
              description: "A lookup request.",
              position: { x: 0, y: 0 },
            },
            {
              id: "scan",
              label: "Scan list",
              kind: "operation",
              description: "Compare list values.",
              position: { x: 220, y: 0 },
            },
          ],
          edges: [{ id: "request-scan", source: "request", target: "scan", label: "iterate" }],
          steps: [
            {
              id: "start",
              title: "Start scan",
              description: "The list length controls the possible work.",
              activeNodeIds: ["request"],
              activeEdgeIds: [],
            },
          ],
        },
      ],
    },
  ],
  contentHash: "hash",
  readingMinutes: 2,
} satisfies KnowledgeDocument;

describe("sync-supabase", () => {
  it("includes complexity flow blocks in document rows", () => {
    expect(toSupabaseDocumentRow(document)).toEqual(
      expect.objectContaining({
        slug: "programming/big-o-program-flow",
        complexity_flow_blocks: document.complexityFlowBlocks,
      }),
    );
  });
});
