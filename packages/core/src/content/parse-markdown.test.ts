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

describe("parseKnowledgeMarkdown", () => {
  it("validates frontmatter and extracts searchable structure", () => {
    const parsed = parseKnowledgeMarkdown(validMarkdown);

    expect(parsed.frontmatter.slug).toBe("system-design/cache-invalidation");
    expect(parsed.headings).toEqual([{ id: "core-decision", depth: 2, text: "Core Decision" }]);
    expect(parsed.plainText).toContain("Cache invalidation is a product contract");
    expect(parsed.mermaidBlocks).toEqual([{ id: "embedded-1", source: "flowchart LR\n  A --> B" }]);
    expect(parsed.readingMinutes).toBe(1);
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

  it("handles empty documents and ignores non-Mermaid code fences", () => {
    const parsed = parseKnowledgeMarkdown(`---
title: Empty But Valid Knowledge Document
slug: system-design/empty-valid
summary: A valid summary used to exercise the empty Markdown indexing boundary safely.
track: System Design
topic: Testing
difficulty: foundation
tags: [testing]
prerequisites: []
diagramRefs: []
status: published
---

\`\`\`typescript
\`\`\`
`);
    expect(parsed.mermaidBlocks).toEqual([]);
    expect(parsed.readingMinutes).toBe(1);
  });
});

describe("slugifyHeading", () => {
  it("creates stable heading anchors", () => {
    expect(slugifyHeading("Operational Tests: SLOs & Cache Keys")).toBe("operational-tests-slos-cache-keys");
  });
});
