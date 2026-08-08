import { describe, expect, it } from "vitest";
import { getContentIndex, getNextPathNodeRoute, searchContent } from ".";

describe("@codematica/core", () => {
  it("loads the bundled generated index for shared runtimes", () => {
    const index = getContentIndex();

    expect(index.schemaVersion).toBe(9);
    expect(index.learningPaths.length).toBeGreaterThan(0);
    expect(index.documents.length).toBeGreaterThan(0);
  });

  it("preserves route helpers and search behavior", () => {
    const index = getContentIndex();

    expect(getNextPathNodeRoute("python-for-ts-js-engineers", { kind: "document", slug: "programming/python-runtime-model" })).toBe(
      "/practice/programming/python-runtime-questionnaire?path=python-for-ts-js-engineers",
    );
    expect(searchContent(index, "cache invalidation")[0]?.title).toMatch(/Cache Invalidation/i);
  });
});
