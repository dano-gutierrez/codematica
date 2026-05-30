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

describe("buildContentIndex", () => {
  it("indexes documents and external Mermaid diagrams", async () => {
    const rootDir = await makeTempRoot();
    await writeDiagram(rootDir, "system-design/cache-aside");
    await writeKnowledge(rootDir, "system-design/cache-invalidation", ["system-design/cache-aside"]);

    const index = await buildContentIndex({ rootDir });

    expect(index.documents).toHaveLength(1);
    expect(index.diagrams).toHaveLength(1);
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
