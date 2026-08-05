import { describe, expect, it, vi } from "vitest";
import { getContentIndex } from "@/lib/content";
import { getProgressSummary, getSkillProgress, syncAnonymousProgress, syncSkillProgress, upsertProgress, type ProgressDataClient } from "./server";

function createProgressClient({
  userId = "user-1",
  rows = [],
  upsertError,
}: {
  userId?: string | null;
  rows?: unknown[];
  upsertError?: { message: string };
}) {
  const upserts: unknown[] = [];
  const from = vi.fn((table: string) => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        limit: vi.fn(async () => ({ data: rows, error: null })),
      })),
    })),
    upsert: vi.fn(async (payload: unknown, options: { onConflict: string }) => {
      upserts.push({ table, payload, options });
      return { data: null, error: upsertError ?? null };
    }),
  }));

  const client = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: userId ? { id: userId } : null },
        error: null,
      })),
    },
    from,
  } satisfies ProgressDataClient;

  return { client, from, upserts };
}

describe("progress server helpers", () => {
  it("returns an empty signed-out summary without querying progress rows", async () => {
    const { client, from } = createProgressClient({ userId: null });

    await expect(getProgressSummary(client, getContentIndex())).resolves.toEqual({
      isSignedIn: false,
      items: [],
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("maps authenticated progress rows to display items", async () => {
    const { client } = createProgressClient({
      rows: [
        {
          surface: "document",
          slug: "programming/python-runtime-model",
          path_slug: "python-for-ts-js-engineers",
          status: "started",
          position: {},
          last_seen_at: "2026-06-21T12:00:00.000Z",
          completed_at: null,
        },
      ],
    });

    await expect(getProgressSummary(client, getContentIndex())).resolves.toEqual({
      isSignedIn: true,
      items: [
        expect.objectContaining({
          title: "Python Runtime Model For TypeScript And JavaScript Engineers",
          href: "/docs/programming/python-runtime-model?path=python-for-ts-js-engineers",
        }),
      ],
    });
  });

  it("upserts authenticated progress with the user id and unique conflict target", async () => {
    const { client, upserts } = createProgressClient({ userId: "user-123" });

    await expect(
      upsertProgress(
        client,
        {
          surface: "practice",
          slug: "system-design/cache-product-contract",
          pathSlug: "system-design-fundamentals",
          status: "completed",
          position: { revealed: true },
        },
        getContentIndex(),
      ),
    ).resolves.toEqual({ status: 200, body: { ok: true } });

    expect(upserts[0]).toEqual(
      expect.objectContaining({
        table: "user_progress_items",
        options: { onConflict: "user_id,surface,slug,path_slug" },
        payload: expect.objectContaining({
          user_id: "user-123",
          surface: "practice",
          slug: "system-design/cache-product-contract",
          path_slug: "system-design-fundamentals",
          status: "completed",
          completed_at: expect.any(String),
        }),
      }),
    );
  });

  it("rejects unauthenticated progress upserts", async () => {
    const { client } = createProgressClient({ userId: null });

    await expect(
      upsertProgress(
        client,
        {
          surface: "document",
          slug: "system-design/cache-invalidation",
          status: "started",
        },
        getContentIndex(),
      ),
    ).resolves.toEqual({ status: 401, body: { error: "Sign in to sync progress." } });
  });

  it("rejects stale progress payloads", async () => {
    const { client } = createProgressClient({ userId: "user-123" });

    await expect(
      upsertProgress(
        client,
        {
          surface: "document",
          slug: "system-design/missing",
          status: "started",
        },
        getContentIndex(),
      ),
    ).resolves.toEqual({ status: 422, body: { error: "Invalid progress item." } });
  });

  it("syncs anonymous progress in one bounded batch and skips stale items", async () => {
    const { client, upserts } = createProgressClient({ userId: "user-123" });

    await expect(
      syncAnonymousProgress(
        client,
        [
          {
            surface: "document",
            slug: "programming/python-runtime-model",
            status: "started",
          },
          {
            surface: "document",
            slug: "programming/missing",
            status: "started",
          },
        ],
        getContentIndex(),
      ),
    ).resolves.toEqual({ status: 200, body: { synced: 1, rejected: 1 } });

    expect(upserts[0]).toEqual(
      expect.objectContaining({
        payload: [
          expect.objectContaining({
            user_id: "user-123",
            slug: "programming/python-runtime-model",
          }),
        ],
      }),
    );
  });

  it("syncs bounded Japanese skill mastery without changing completion rows", async () => {
    const { client, upserts } = createProgressClient({ userId: "user-123" });
    await expect(syncSkillProgress(client, [{ pathSlug: "japanese-foundations", skillId: "kana-reading", bestScore: 0.9, attemptCount: 3, reviewBox: 4, masteryState: "mastered", lastPracticedAt: "2026-08-04T12:00:00.000Z", nextReviewAt: "2026-09-03T12:00:00.000Z" }])).resolves.toEqual({ status: 200, body: { synced: 1 } });
    expect(upserts[0]).toMatchObject({
      table: "user_skill_progress",
      options: { onConflict: "user_id,path_slug,skill_id" },
      payload: [expect.objectContaining({ user_id: "user-123", skill_id: "kana-reading", best_score: 0.9, review_box: 4 })],
    });
  });

  it("loads authenticated Japanese mastery rows for lossless device merging", async () => {
    const { client } = createProgressClient({
      userId: "user-123",
      rows: [{
        path_slug: "japanese-foundations",
        skill_id: "kana-reading",
        best_score: 0.9,
        attempt_count: 3,
        review_box: 4,
        mastery_state: "mastered",
        last_practiced_at: "2026-08-04T12:00:00.000Z",
        next_review_at: "2026-09-03T12:00:00.000Z",
      }],
    });

    await expect(getSkillProgress(client)).resolves.toEqual({
      isSignedIn: true,
      items: [expect.objectContaining({ pathSlug: "japanese-foundations", skillId: "kana-reading", reviewBox: 4 })],
    });
  });
});
