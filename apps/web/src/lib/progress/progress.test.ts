import { describe, expect, it } from "vitest";
import { getContentIndex } from "@/lib/content";
import {
  createProgressDisplayItem,
  createProgressDisplayItems,
  createProgressUpsertRow,
  createStoredProgressRow,
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

  it("maps every durable progress surface and filters stale rows in lists", () => {
    const index = getContentIndex();
    const now = "2026-08-05T12:00:00.000Z";
    const rows: StoredProgressRow[] = [
      { surface: "document", slug: "system-design/cache-invalidation", pathSlug: "", status: "started", position: {}, lastSeenAt: now, completedAt: null },
      { surface: "diagram", slug: "system-design/cache-aside", pathSlug: "", status: "completed", position: {}, lastSeenAt: now, completedAt: now },
      { surface: "practice", slug: "system-design/cache-product-contract", pathSlug: "", status: "started", position: {}, lastSeenAt: now, completedAt: null },
      { surface: "passive-feed", slug: "python-for-ts-js-engineers", pathSlug: "", status: "started", position: {}, lastSeenAt: now, completedAt: null },
      { surface: "interview", slug: "google/number-of-islands", pathSlug: "", status: "completed", position: {}, lastSeenAt: now, completedAt: now },
      { surface: "document", slug: "missing/document", pathSlug: "", status: "started", position: {}, lastSeenAt: now, completedAt: null },
    ];
    const displays = createProgressDisplayItems(rows, index);
    expect(displays).toHaveLength(5);
    expect(displays.map((item) => item.eyebrow)).toEqual(expect.arrayContaining(["Document", "Diagram", "Practice", "Flashcards", "Google interview"]));
  });

  it("creates deterministic local and database rows for started and completed states", () => {
    const now = new Date("2026-08-05T12:00:00.000Z");
    const started = normalizeProgressInput({ surface: "diagram", slug: "system-design/cache-aside", status: "started" });
    expect(createStoredProgressRow(started, now)).toMatchObject({ lastSeenAt: now.toISOString(), completedAt: null });
    const completed = { ...started, status: "completed" as const };
    expect(createProgressUpsertRow("user-1", completed, now)).toMatchObject({ user_id: "user-1", completed_at: now.toISOString() });
  });

  it("rejects stale references for every progress surface and learning path", () => {
    const index = getContentIndex();
    for (const [surface, slug] of [
      ["diagram", "missing/diagram"],
      ["practice", "missing/practice"],
      ["passive-feed", "missing-feed"],
      ["interview", "google/missing-question"],
    ] as const) {
      expect(() => normalizeProgressInput({ surface, slug, status: "started" }, index)).toThrow(/unknown/i);
    }
    expect(() => normalizeProgressInput({ surface: "document", slug: "system-design/cache-invalidation", pathSlug: "missing-path", status: "started" }, index)).toThrow(/unknown learning path/i);
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
