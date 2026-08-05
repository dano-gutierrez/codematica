import { describe, expect, it } from "vitest";
import { applyReviewRating, mergeSkillProgress, orderDueReviews } from "./mastery";

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
});
