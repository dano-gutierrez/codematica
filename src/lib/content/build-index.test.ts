import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildContentIndex, collectMermaidDiagrams } from "./build-index";

async function makeTempRoot() {
  return mkdtemp(path.join(os.tmpdir(), "codematica-content-"));
}

async function writeKnowledge(rootDir: string, slug: string, diagramRefs: string[] = []) {
  const filePath = path.join(rootDir, "content", "knowledge", `${slug}.md`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    `---
title: Test Document
slug: ${slug}
summary: This is a valid summary for a generated test document.
track: System Design
topic: Caching
difficulty: senior
tags: [caching]
prerequisites: []
diagramRefs: ${JSON.stringify(diagramRefs)}
status: published
---

## Test Heading

Cache aside is a useful pattern.
`,
  );
}

async function writeDiagram(rootDir: string, slug: string) {
  const filePath = path.join(rootDir, "content", "diagrams", `${slug}.mmd`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, "flowchart LR\n  A --> B\n");
}

async function writeExercise(rootDir: string, slug: string, overrides: Record<string, unknown> = {}) {
  const filePath = path.join(rootDir, "content", "exercises", `${slug}.json`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify(
      {
        slug,
        title: "Cache Aside Recall",
        type: "flashcard",
        documentSlug: "system-design/cache-invalidation",
        concept: "Cache invalidation",
        difficulty: "senior",
        tags: ["caching"],
        status: "published",
        prompt: "What makes cache invalidation a product contract?",
        answer: "The acceptable stale state is a user-facing tradeoff.",
        explanation: "Freshness, latency, cost, and ownership define the product behavior.",
        ...overrides,
      },
      null,
      2,
    ),
  );
}

async function writeLearningPath(rootDir: string, slug: string, nodeSlug = "system-design/cache-invalidation") {
  const filePath = path.join(rootDir, "content", "learning-paths", `${slug}.json`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify(
      {
        slug,
        title: "System Design Fundamentals",
        summary: "A short path through cache design and practice.",
        kind: "skill",
        category: "System Design",
        audience: "Engineers preparing for production design reviews.",
        status: "published",
        units: [
          {
            slug: "caching",
            title: "Caching Contracts",
            summary: "Learn how cache behavior maps to product tradeoffs.",
            nodes: [
              { kind: "document", slug: nodeSlug },
              { kind: "diagram", slug: "system-design/cache-aside" },
              { kind: "exercise", slug: "system-design/cache-aside-recall" },
            ],
          },
        ],
      },
      null,
      2,
    ),
  );
}

describe("buildContentIndex", () => {
  it("indexes documents and external Mermaid diagrams", async () => {
    const rootDir = await makeTempRoot();
    await writeDiagram(rootDir, "system-design/cache-aside");
    await writeKnowledge(rootDir, "system-design/cache-invalidation", ["system-design/cache-aside"]);
    await writeExercise(rootDir, "system-design/cache-aside-recall");
    await writeLearningPath(rootDir, "system-design-fundamentals");

    const index = await buildContentIndex({ rootDir });

    expect(index.schemaVersion).toBe(2);
    expect(index.documents).toHaveLength(1);
    expect(index.diagrams).toHaveLength(1);
    expect(index.exercises).toEqual([
      expect.objectContaining({
        slug: "system-design/cache-aside-recall",
        route: "/practice/system-design/cache-aside-recall",
        type: "flashcard",
      }),
    ]);
    expect(index.learningPaths).toEqual([
      expect.objectContaining({
        slug: "system-design-fundamentals",
        route: "/paths/system-design-fundamentals",
        units: [
          expect.objectContaining({
            nodes: [
              { kind: "document", slug: "system-design/cache-invalidation" },
              { kind: "diagram", slug: "system-design/cache-aside" },
              { kind: "exercise", slug: "system-design/cache-aside-recall" },
            ],
          }),
        ],
      }),
    ]);
    expect(index.tracks).toEqual([
      {
        name: "System Design",
        slug: "system-design",
        documentCount: 1,
        difficulties: ["senior"],
        topics: ["Caching"],
      },
    ]);
  });

  it("fails when a document references a missing external diagram", async () => {
    const rootDir = await makeTempRoot();
    await writeKnowledge(rootDir, "system-design/cache-invalidation", ["system-design/missing"]);

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/references missing diagram/);
  });

  it("fails when a path references a missing node", async () => {
    const rootDir = await makeTempRoot();
    await writeDiagram(rootDir, "system-design/cache-aside");
    await writeKnowledge(rootDir, "system-design/cache-invalidation", ["system-design/cache-aside"]);
    await writeExercise(rootDir, "system-design/cache-aside-recall");
    await writeLearningPath(rootDir, "system-design-fundamentals", "system-design/missing");

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/references missing document/);
  });

  it("fails when an exercise references a missing document", async () => {
    const rootDir = await makeTempRoot();
    await writeDiagram(rootDir, "system-design/cache-aside");
    await writeKnowledge(rootDir, "system-design/cache-invalidation", ["system-design/cache-aside"]);
    await writeExercise(rootDir, "system-design/cache-aside-recall", {
      documentSlug: "system-design/missing",
    });
    await writeLearningPath(rootDir, "system-design-fundamentals");

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/references missing document/);
  });

  it("fails when a cloze exercise does not contain exactly one blank", async () => {
    const rootDir = await makeTempRoot();
    await writeDiagram(rootDir, "system-design/cache-aside");
    await writeKnowledge(rootDir, "system-design/cache-invalidation", ["system-design/cache-aside"]);
    await writeExercise(rootDir, "system-design/cache-aside-recall", {
      type: "cloze",
      prompt: "Fill the gap.",
      template: "Use {{blank}} when {{blank}}.",
      acceptedAnswers: ["versioned keys"],
      explanation: "Cloze prompts must have one answer slot.",
    });
    await writeLearningPath(rootDir, "system-design-fundamentals");

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/exactly one \{\{blank\}\}/);
  });

  it("fails on duplicate exercise slugs", async () => {
    const rootDir = await makeTempRoot();
    await writeDiagram(rootDir, "system-design/cache-aside");
    await writeKnowledge(rootDir, "system-design/cache-invalidation", ["system-design/cache-aside"]);
    await writeExercise(rootDir, "system-design/cache-aside-recall");
    await writeExercise(rootDir, "system-design/cache-aside-copy", {
      slug: "system-design/cache-aside-recall",
    });
    await writeLearningPath(rootDir, "system-design-fundamentals");

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/Duplicate exercise slug/);
  });
});

describe("collectMermaidDiagrams", () => {
  it("indexes .mmd and .mermaid files", async () => {
    const rootDir = await makeTempRoot();
    await writeDiagram(rootDir, "system-design/cache-aside");
    const mermaidPath = path.join(rootDir, "content", "diagrams", "system-design", "write-invalidation.mermaid");
    await mkdir(path.dirname(mermaidPath), { recursive: true });
    await writeFile(mermaidPath, "flowchart LR\n  W --> C\n");

    const diagrams = await collectMermaidDiagrams(rootDir);

    expect(diagrams.map((diagram) => diagram.slug)).toEqual([
      "system-design/cache-aside",
      "system-design/write-invalidation",
    ]);
  });
});
