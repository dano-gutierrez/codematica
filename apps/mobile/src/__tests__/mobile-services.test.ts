import { pathParam } from "../lib/params";
import { loadNativeSkillProgress, syncNativeSkillProgress } from "../lib/skill-progress";

const progress = {
  pathSlug: "japanese-foundations",
  skillId: "kana-reading",
  bestScore: 0.9,
  attemptCount: 3,
  reviewBox: 4,
  masteryState: "mastered" as const,
  lastPracticedAt: "2026-08-04T12:00:00.000Z",
  nextReviewAt: "2026-09-03T12:00:00.000Z",
};

function client({ user = { id: "user-1" }, rows = [], error = null }: { user?: { id: string } | null; rows?: unknown[]; error?: { message: string } | null } = {}) {
  const upserts: unknown[][] = [];
  return {
    value: {
      auth: { getUser: jest.fn(async () => ({ data: { user }, error: null })) },
      from: jest.fn(() => ({
        select: jest.fn(() => ({ order: jest.fn(() => ({ limit: jest.fn(async () => ({ data: rows, error })) })) })),
        upsert: jest.fn(async (payload: unknown[]) => { upserts.push(payload); return { data: null, error }; }),
      })),
    },
    upserts,
  };
}

describe("mobile service adapters", () => {
  it("normalizes Expo Router catch-all parameters", () => {
    expect(pathParam(undefined)).toBe("");
    expect(pathParam("one/two")).toBe("one/two");
    expect(pathParam(["one", "two"])).toBe("one/two");
  });

  it("loads valid skill progress and drops malformed rows", async () => {
    const remote = client({ rows: [{
      path_slug: progress.pathSlug, skill_id: progress.skillId, best_score: progress.bestScore,
      attempt_count: progress.attemptCount, review_box: progress.reviewBox, mastery_state: progress.masteryState,
      last_practiced_at: progress.lastPracticedAt, next_review_at: progress.nextReviewAt,
    }, { bad: true }] });
    await expect(loadNativeSkillProgress(remote.value as never)).resolves.toEqual([progress]);
    await expect(loadNativeSkillProgress(undefined)).resolves.toEqual([]);
    await expect(loadNativeSkillProgress(client({ user: null }).value as never)).resolves.toEqual([]);
    await expect(loadNativeSkillProgress(client({ error: { message: "offline" } }).value as never)).resolves.toEqual([]);
  });

  it("syncs mastery in bounded batches and stops without clearing on errors", async () => {
    const rows = Array.from({ length: 21 }, (_, index) => ({ ...progress, skillId: `skill-${index}` }));
    const remote = client();
    await expect(syncNativeSkillProgress(remote.value as never, rows)).resolves.toBe(true);
    expect(remote.upserts.map((batch) => batch.length)).toEqual([20, 1]);
    expect(remote.upserts[0][0]).toMatchObject({ user_id: "user-1", skill_id: "skill-0" });
    await expect(syncNativeSkillProgress(undefined, rows)).resolves.toBe(false);
    await expect(syncNativeSkillProgress(client({ user: null }).value as never, rows)).resolves.toBe(false);
    await expect(syncNativeSkillProgress(client({ error: { message: "offline" } }).value as never, rows)).resolves.toBe(false);
  });
});
