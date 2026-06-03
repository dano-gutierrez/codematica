import { describe, expect, it } from "vitest";
import { parseKnowledgeMarkdown, slugifyHeading } from "./parse-markdown";

const validMarkdown = `---
title: Cache Invalidation Under Product Pressure
slug: system-design/cache-invalidation
summary: A senior guide to freshness, latency, and safe invalidation in distributed systems.
track: System Design
topic: Caching
difficulty: senior
tags:
  - caching
prerequisites: []
diagramRefs:
  - system-design/cache-aside
status: published
---

## Core Decision

Cache invalidation is a product contract.

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`
`;

const validComplexityFlow = {
  id: "lookup-comparison",
  title: "Membership Lookup Tradeoff",
  scenario: "Compare a repeated list scan with a prebuilt set lookup for a permission check.",
  variants: [
    {
      id: "list-scan",
      label: "List scan",
      complexity: "O(n)",
      summary: "The program may inspect every permission before it can answer.",
      operationCounts: [1, 2, 3],
      code: {
        language: "typescript",
        label: "Linear lookup",
        source: "permissions.includes(requiredPermission)",
      },
      nodes: [
        {
          id: "request",
          label: "Request",
          kind: "input",
          description: "A request asks for one permission.",
          position: { x: 0, y: 0 },
        },
        {
          id: "scan",
          label: "Scan list",
          kind: "operation",
          description: "Check each permission until one matches.",
          position: { x: 220, y: 0 },
        },
      ],
      edges: [{ id: "request-scan", source: "request", target: "scan", label: "iterate" }],
      steps: [
        {
          id: "read-request",
          title: "Read the requested permission",
          description: "The input arrives as one value, but the stored list can be any length.",
          activeNodeIds: ["request"],
          activeEdgeIds: [],
        },
        {
          id: "compare-next",
          title: "Compare the next item",
          description: "Every miss costs one more comparison.",
          activeNodeIds: ["scan"],
          activeEdgeIds: ["request-scan"],
        },
        {
          id: "finish-scan",
          title: "Stop when found or exhausted",
          description: "The worst case touches every permission in the list.",
          activeNodeIds: ["scan"],
          activeEdgeIds: ["request-scan"],
        },
      ],
    },
    {
      id: "set-lookup",
      label: "Prebuilt set",
      complexity: "O(1) per query after O(n) build",
      summary: "The program pays once to build an index, then each query is a hash lookup.",
      operationCounts: [1, 1],
      code: {
        language: "typescript",
        label: "Hash lookup",
        source: "permissionSet.has(requiredPermission)",
      },
      nodes: [
        {
          id: "set",
          label: "Permission set",
          kind: "data",
          description: "A hash-backed index built before repeated checks.",
          position: { x: 0, y: 0 },
        },
        {
          id: "answer",
          label: "Answer",
          kind: "result",
          description: "A membership answer returns without scanning every item.",
          position: { x: 220, y: 0 },
        },
      ],
      edges: [{ id: "set-answer", source: "set", target: "answer", label: "hash" }],
      steps: [
        {
          id: "hash-key",
          title: "Hash the requested permission",
          description: "The lookup jumps to the bucket instead of walking every permission.",
          activeNodeIds: ["set"],
          activeEdgeIds: [],
        },
        {
          id: "return-answer",
          title: "Return the membership result",
          description: "The query cost stays flat as the permission list grows.",
          activeNodeIds: ["set", "answer"],
          activeEdgeIds: ["set-answer"],
        },
      ],
    },
  ],
};

describe("parseKnowledgeMarkdown", () => {
  it("validates frontmatter and extracts searchable structure", () => {
    const parsed = parseKnowledgeMarkdown(validMarkdown);

    expect(parsed.frontmatter.slug).toBe("system-design/cache-invalidation");
    expect(parsed.headings).toEqual([{ id: "core-decision", depth: 2, text: "Core Decision" }]);
    expect(parsed.plainText).toContain("Cache invalidation is a product contract");
    expect(parsed.mermaidBlocks).toEqual([{ id: "embedded-1", source: "flowchart LR\n  A --> B" }]);
    expect(parsed.readingMinutes).toBe(1);
  });

  it("validates complexity flow blocks and indexes readable text instead of raw JSON", () => {
    const markdown = `${validMarkdown}

\`\`\`complexity-flow
${JSON.stringify(validComplexityFlow, null, 2)}
\`\`\`
`;

    const parsed = parseKnowledgeMarkdown(markdown);

    expect(parsed.complexityFlowBlocks).toHaveLength(1);
    expect(parsed.complexityFlowBlocks[0]).toEqual(validComplexityFlow);
    expect(parsed.plainText).toContain("Membership Lookup Tradeoff");
    expect(parsed.plainText).toContain("List scan");
    expect(parsed.plainText).toContain("Prebuilt set");
    expect(parsed.plainText).not.toContain("\"nodes\"");
    expect(parsed.plainText).not.toContain("\"operationCounts\"");
  });

  it("rejects invalid complexity flow JSON", () => {
    expect(() =>
      parseKnowledgeMarkdown(`${validMarkdown}

\`\`\`complexity-flow
{ "id": "broken",
\`\`\`
`),
    ).toThrow(/Invalid complexity-flow JSON/);
  });

  it("rejects duplicate complexity flow IDs and bad active references", () => {
    const duplicateVariantIds = {
      ...validComplexityFlow,
      variants: [
        validComplexityFlow.variants[0],
        {
          ...validComplexityFlow.variants[1],
          id: validComplexityFlow.variants[0].id,
        },
      ],
    };
    const badReference = {
      ...validComplexityFlow,
      variants: [
        {
          ...validComplexityFlow.variants[0],
          steps: [
            {
              ...validComplexityFlow.variants[0].steps[0],
              activeNodeIds: ["missing-node"],
            },
          ],
        },
        validComplexityFlow.variants[1],
      ],
    };

    expect(() =>
      parseKnowledgeMarkdown(`${validMarkdown}

\`\`\`complexity-flow
${JSON.stringify(duplicateVariantIds, null, 2)}
\`\`\`
`),
    ).toThrow(/duplicate complexity flow variant id/);
    expect(() =>
      parseKnowledgeMarkdown(`${validMarkdown}

\`\`\`complexity-flow
${JSON.stringify(badReference, null, 2)}
\`\`\`
`),
    ).toThrow(/unknown complexity flow node/);
  });

  it("rejects complexity flow operation counts that do not match steps", () => {
    const mismatchedCounts = {
      ...validComplexityFlow,
      variants: [
        {
          ...validComplexityFlow.variants[0],
          operationCounts: [1],
        },
        validComplexityFlow.variants[1],
      ],
    };

    expect(() =>
      parseKnowledgeMarkdown(`${validMarkdown}

\`\`\`complexity-flow
${JSON.stringify(mismatchedCounts, null, 2)}
\`\`\`
`),
    ).toThrow(/operationCounts length must match steps length/);
  });

  it("rejects missing required frontmatter", () => {
    expect(() =>
      parseKnowledgeMarkdown(`---
slug: broken/doc
summary: Missing the title should fail validation.
track: System Design
topic: Caching
difficulty: senior
tags: [caching]
---

Body
`),
    ).toThrow();
  });
});

describe("slugifyHeading", () => {
  it("creates stable heading anchors", () => {
    expect(slugifyHeading("Operational Tests: SLOs & Cache Keys")).toBe("operational-tests-slos-cache-keys");
  });
});
