import { describe, expect, it } from "vitest";
import { applyReviewRating, createSkillProgressUpsertRow, mergeSkillProgress, mergeSkillProgressLists, orderDueReviews } from "./mastery";

const now = new Date("2026-08-04T12:00:00.000Z");

describe("Japanese skill mastery", () => {
  it("uses the deterministic six-box schedule", () => {
    const firstGood = applyReviewRating(undefined, {
      pathSlug: "japanese-foundations",
      skillId: "hiragana-vowels",
      rating: "good",
      score: 0.9,
      now,
    });

    expect(firstGood.reviewBox).toBe(1);
    expect(firstGood.nextReviewAt).toBe("2026-08-05T12:00:00.000Z");
    expect(firstGood.masteryState).toBe("learning");

    const easy = applyReviewRating(firstGood, {
      pathSlug: "japanese-foundations",
      skillId: "hiragana-vowels",
      rating: "easy",
      score: 1,
      now,
    });

    expect(easy.reviewBox).toBe(3);
    expect(easy.nextReviewAt).toBe("2026-08-11T12:00:00.000Z");

    const mastered = applyReviewRating(easy, {
      pathSlug: "japanese-foundations",
      skillId: "hiragana-vowels",
      rating: "good",
      score: 0.8,
      now,
    });

    expect(mastered.reviewBox).toBe(4);
    expect(mastered.masteryState).toBe("mastered");
  });

  it("resets Again to box zero and makes it due in ten minutes", () => {
    const result = applyReviewRating(
      {
        pathSlug: "japanese-foundations",
        skillId: "hiragana-vowels",
        bestScore: 1,
        attemptCount: 8,
        reviewBox: 5,
        masteryState: "mastered",
        lastPracticedAt: "2026-08-01T12:00:00.000Z",
        nextReviewAt: "2026-10-01T12:00:00.000Z",
      },
      {
        pathSlug: "japanese-foundations",
        skillId: "hiragana-vowels",
        rating: "again",
        score: 0.3,
        now,
      },
    );

    expect(result.reviewBox).toBe(0);
    expect(result.nextReviewAt).toBe("2026-08-04T12:10:00.000Z");
    expect(result.bestScore).toBe(1);
    expect(result.attemptCount).toBe(9);
  });

  it("orders overdue work first and merges local progress losslessly", () => {
    const rows = [
      {
        pathSlug: "japanese-foundations",
        skillId: "katakana-vowels",
        bestScore: 0.7,
        attemptCount: 2,
        reviewBox: 2,
        masteryState: "learning" as const,
        lastPracticedAt: "2026-08-03T12:00:00.000Z",
        nextReviewAt: "2026-08-07T12:00:00.000Z",
      },
      {
        pathSlug: "japanese-foundations",
        skillId: "hiragana-vowels",
        bestScore: 0.8,
        attemptCount: 3,
        reviewBox: 3,
        masteryState: "reviewing" as const,
        lastPracticedAt: "2026-08-02T12:00:00.000Z",
        nextReviewAt: "2026-08-03T12:00:00.000Z",
      },
    ];

    expect(orderDueReviews(rows, now).map((row) => row.skillId)).toEqual(["hiragana-vowels"]);

    const merged = mergeSkillProgress(rows[0], {
      ...rows[0],
      bestScore: 0.95,
      attemptCount: 4,
      reviewBox: 1,
      lastPracticedAt: "2026-08-04T12:00:00.000Z",
      nextReviewAt: "2026-08-05T12:00:00.000Z",
    });

    expect(merged.bestScore).toBe(0.95);
    expect(merged.attemptCount).toBe(4);
    expect(merged.lastPracticedAt).toBe("2026-08-04T12:00:00.000Z");
  });

  it("handles hard ratings, interval caps, and reviewing state", () => {
    const base = {
      pathSlug: "japanese-foundations", skillId: "kana", bestScore: 0.8, attemptCount: 2,
      reviewBox: 4, masteryState: "mastered" as const, lastPracticedAt: now.toISOString(), nextReviewAt: now.toISOString(),
    };
    const hard = applyReviewRating(base, { pathSlug: base.pathSlug, skillId: base.skillId, rating: "hard", score: 0.6, now });
    expect(hard).toMatchObject({ reviewBox: 3, masteryState: "reviewing", bestScore: 0.8 });
    expect(hard.nextReviewAt).toBe("2026-08-05T12:00:00.000Z");

    const capped = applyReviewRating({ ...base, reviewBox: 5 }, { pathSlug: base.pathSlug, skillId: base.skillId, rating: "easy", score: 1, now });
    expect(capped.reviewBox).toBe(5);
    expect(capped.nextReviewAt).toBe("2026-12-02T12:00:00.000Z");
  });

  it("merges lists deterministically and maps database upsert rows", () => {
    const older = applyReviewRating(undefined, { pathSlug: "japanese-foundations", skillId: "kana", rating: "good", score: 0.7, now });
    const newer = { ...older, bestScore: 0.6, attemptCount: 3, lastPracticedAt: "2026-08-05T12:00:00.000Z" };
    expect(mergeSkillProgress(older, newer)).toMatchObject({ bestScore: 0.7, attemptCount: 3, lastPracticedAt: newer.lastPracticedAt });
    expect(mergeSkillProgressLists([older], [newer])).toHaveLength(1);
    expect(createSkillProgressUpsertRow("user-1", newer)).toMatchObject({ user_id: "user-1", path_slug: "japanese-foundations", skill_id: "kana" });
    expect(() => mergeSkillProgress(older, { ...newer, skillId: "other" })).toThrow(/same path and skill/i);
  });

  it("orders tied due reviews by skill and omits future work", () => {
    const first = applyReviewRating(undefined, { pathSlug: "japanese-foundations", skillId: "b-skill", rating: "again", score: 0.2, now });
    const second = { ...first, skillId: "a-skill" };
    expect(orderDueReviews([first, second], new Date("2026-08-04T12:11:00.000Z")).map((row) => row.skillId)).toEqual(["a-skill", "b-skill"]);
    expect(orderDueReviews([first], now)).toEqual([]);
  });
});
