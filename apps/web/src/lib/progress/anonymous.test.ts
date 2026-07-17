import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addAnonymousProgressItem,
  clearAnonymousProgressItems,
  getAnonymousProgressItems,
  getAnonymousProgressSummaryItems,
} from "./anonymous";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("anonymous progress buffer", () => {
  it("stores the latest progress event first and deduplicates by surface, slug, and path", () => {
    addAnonymousProgressItem({
      input: {
        surface: "document",
        slug: "system-design/cache-invalidation",
        pathSlug: "system-design-fundamentals",
        status: "started",
        position: {},
      },
      display: {
        id: "document-system-design/cache-invalidation-system-design-fundamentals",
        title: "Cache Invalidation Under Product Pressure",
        summary: "Cache invalidation document.",
        href: "/docs/system-design/cache-invalidation?path=system-design-fundamentals",
        eyebrow: "Document",
        status: "started",
        lastSeenAt: "2026-06-21T12:00:00.000Z",
      },
    });

    addAnonymousProgressItem({
      input: {
        surface: "document",
        slug: "system-design/cache-invalidation",
        pathSlug: "system-design-fundamentals",
        status: "completed",
        position: { scrollRatio: 0.9 },
      },
      display: {
        id: "document-system-design/cache-invalidation-system-design-fundamentals",
        title: "Cache Invalidation Under Product Pressure",
        summary: "Cache invalidation document.",
        href: "/docs/system-design/cache-invalidation?path=system-design-fundamentals",
        eyebrow: "Document",
        status: "completed",
        lastSeenAt: "2026-06-21T12:01:00.000Z",
      },
    });

    expect(getAnonymousProgressItems()).toHaveLength(1);
    expect(getAnonymousProgressItems()[0]?.input.status).toBe("completed");
    expect(getAnonymousProgressSummaryItems()[0]?.title).toBe("Cache Invalidation Under Product Pressure");
  });

  it("bounds the anonymous buffer", () => {
    for (let index = 0; index < 30; index += 1) {
      addAnonymousProgressItem({
        input: {
          surface: "diagram",
          slug: `system-design/cache-aside-${index}`,
          pathSlug: "",
          status: "started",
          position: {},
        },
        display: {
          id: `diagram-${index}`,
          title: `Diagram ${index}`,
          summary: "Diagram summary.",
          href: `/diagrams/system-design/cache-aside-${index}`,
          eyebrow: "Diagram",
          status: "started",
          lastSeenAt: "2026-06-21T12:00:00.000Z",
        },
      });
    }

    expect(getAnonymousProgressItems()).toHaveLength(20);
  });

  it("clears buffered items after sync", () => {
    addAnonymousProgressItem({
      input: {
        surface: "practice",
        slug: "system-design/cache-product-contract",
        pathSlug: "",
        status: "completed",
        position: {},
      },
      display: {
        id: "practice-system-design/cache-product-contract",
        title: "Cache Product Contract",
        summary: "Practice.",
        href: "/practice/system-design/cache-product-contract",
        eyebrow: "Practice",
        status: "completed",
        lastSeenAt: "2026-06-21T12:00:00.000Z",
      },
    });

    clearAnonymousProgressItems();

    expect(getAnonymousProgressItems()).toEqual([]);
  });
});
