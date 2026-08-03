import { describe, expect, it } from "vitest";
import { getContentIndex } from "@/lib/content";
import {
  createProgressDisplayItem,
  normalizeProgressInput,
  normalizeProgressRow,
  progressInputArraySchema,
  type StoredProgressRow,
} from "./progress";

describe("progress contract", () => {
  it("normalizes valid progress payloads with default path and position values", () => {
    expect(
      normalizeProgressInput({
        surface: "document",
        slug: "system-design/cache-invalidation",
        status: "started",
      }),
    ).toEqual({
      surface: "document",
      slug: "system-design/cache-invalidation",
      pathSlug: "",
      status: "started",
      position: {},
    });
  });

  it("rejects stale document slugs before persistence", () => {
    expect(() =>
      normalizeProgressInput({
        surface: "document",
        slug: "system-design/missing-article",
        status: "started",
      }, getContentIndex()),
    ).toThrow(/unknown document/i);
  });

  it("maps stored rows back to current content routes", () => {
    const row: StoredProgressRow = {
      surface: "practice",
      slug: "programming/python-runtime-questionnaire",
      pathSlug: "python-for-ts-js-engineers",
      status: "completed",
      position: { questionIndex: 5 },
      lastSeenAt: "2026-06-21T12:00:00.000Z",
      completedAt: "2026-06-21T12:00:00.000Z",
    };

    expect(createProgressDisplayItem(row, getContentIndex())).toEqual(
      expect.objectContaining({
        title: "Python Runtime Model Questionnaire",
        href: "/practice/programming/python-runtime-questionnaire?path=python-for-ts-js-engineers",
        eyebrow: "Practice",
        status: "completed",
      }),
    );
  });

  it("filters stale stored rows when building display items", () => {
    expect(
      createProgressDisplayItem(
        {
          surface: "practice",
          slug: "programming/missing-questionnaire",
          pathSlug: "",
          status: "started",
          position: {},
          lastSeenAt: "2026-06-21T12:00:00.000Z",
          completedAt: null,
        },
        getContentIndex(),
      ),
    ).toBeUndefined();
  });

  it("parses database-shaped rows into display-ready stored rows", () => {
    expect(
      normalizeProgressRow({
        surface: "document",
        slug: "programming/python-runtime-model",
        path_slug: "python-for-ts-js-engineers",
        status: "started",
        position: { scrollRatio: 0.44 },
        last_seen_at: "2026-06-21T12:00:00.000Z",
        completed_at: null,
      }),
    ).toEqual({
      surface: "document",
      slug: "programming/python-runtime-model",
      pathSlug: "python-for-ts-js-engineers",
      status: "started",
      position: { scrollRatio: 0.44 },
      lastSeenAt: "2026-06-21T12:00:00.000Z",
      completedAt: null,
    });
  });

  it("rejects oversized sync batches instead of silently truncating progress", () => {
    const payload = Array.from({ length: 30 }, () => ({
      surface: "diagram",
      slug: "system-design/cache-aside",
      status: "completed",
    }));

    expect(() => progressInputArraySchema.parse(payload)).toThrow();
  });
});
