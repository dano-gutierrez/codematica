import { describe, expect, it } from "vitest";
import { getContentIndex, getDocumentBySlug, getReferencedDiagrams } from ".";

describe("generated content index", () => {
  it("loads starter documents and diagrams", () => {
    const index = getContentIndex();

    expect(index.documents.length).toBeGreaterThanOrEqual(3);
    expect(index.diagrams.length).toBeGreaterThanOrEqual(2);
    expect(getDocumentBySlug("system-design/cache-invalidation")?.title).toBe("Cache Invalidation Under Product Pressure");
  });

  it("resolves diagram references from article frontmatter", () => {
    const document = getDocumentBySlug("system-design/cache-invalidation");

    expect(document).toBeDefined();
    expect(getReferencedDiagrams(document?.diagramRefs ?? []).map((diagram) => diagram.slug)).toEqual(["system-design/cache-aside"]);
  });
});
