import { beforeEach, describe, expect, it, vi } from "vitest";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { POST as recordProgress } from "./route";
import { GET as getSkills, POST as syncSkills } from "./skills/route";
import { GET as getSummary } from "./summary/route";
import { POST as syncAnonymous } from "./sync-anonymous/route";

vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));

function client({ userId = "user-1", rows = [], error = null }: { userId?: string | null; rows?: unknown[]; error?: { message: string } | null } = {}) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: userId ? { id: userId } : null }, error: null })) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ order: vi.fn(() => ({ limit: vi.fn(async () => ({ data: rows, error })) })) })),
      upsert: vi.fn(async () => ({ data: null, error })),
    })),
  };
}

function request(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("progress route handlers", () => {
  beforeEach(() => vi.mocked(createServerSupabaseClient).mockReset());

  it("returns offline-safe responses when Auth is not configured", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(null);
    expect((await recordProgress(request("http://localhost/api/progress", {}))).status).toBe(401);
    expect((await syncAnonymous(request("http://localhost/api/progress/sync-anonymous", {}))).status).toBe(401);
    await expect((await getSummary()).json()).resolves.toEqual({ isSignedIn: false, items: [] });
    await expect((await getSkills()).json()).resolves.toEqual({ isSignedIn: false, items: [] });
  });

  it("validates malformed and stale progress payloads", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(client() as never);
    const malformed = new Request("http://localhost/api/progress", { method: "POST", body: "{" });
    expect((await recordProgress(malformed)).status).toBe(422);
    const malformedBatch = new Request("http://localhost/api/progress/sync-anonymous", { method: "POST", body: "{" });
    expect((await syncAnonymous(malformedBatch)).status).toBe(422);
    expect((await recordProgress(request("http://localhost/api/progress", {
      surface: "document", slug: "missing/document", status: "started",
    }))).status).toBe(422);
    expect((await syncSkills(request("http://localhost/api/progress/skills", { items: [{ bad: true }] }))).status).toBe(422);
  });

  it("records and batches authenticated progress", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(client() as never);
    const recorded = await recordProgress(request("http://localhost/api/progress", {
      surface: "document", slug: "system-design/cache-invalidation", status: "completed",
    }));
    expect(recorded.status).toBe(200);
    await expect(recorded.json()).resolves.toEqual({ ok: true });

    const synced = await syncAnonymous(request("http://localhost/api/progress/sync-anonymous", { items: [{
      surface: "diagram", slug: "system-design/cache-aside", status: "started",
    }] }));
    await expect(synced.json()).resolves.toEqual({ synced: 1, rejected: 0 });

    const skill = {
      pathSlug: "japanese-foundations", skillId: "kana-reading", bestScore: 0.8,
      attemptCount: 2, reviewBox: 3, masteryState: "reviewing",
      lastPracticedAt: "2026-08-04T00:00:00.000Z", nextReviewAt: "2026-08-11T00:00:00.000Z",
    };
    expect((await syncSkills(request("http://localhost/api/progress/skills", { items: [skill] }))).status).toBe(200);
  });

  it("converts backend failures to stable API errors", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(client({ error: { message: "offline" } }) as never);
    expect((await recordProgress(request("http://localhost/api/progress", {
      surface: "document", slug: "system-design/cache-invalidation", status: "started",
    }))).status).toBe(500);
    expect((await getSummary()).status).toBe(500);
    expect((await getSkills()).status).toBe(500);
  });
});
