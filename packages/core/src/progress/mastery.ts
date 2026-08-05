import { z } from "zod";

export const reviewRatingSchema = z.enum(["again", "hard", "good", "easy"]);
export const masteryStateSchema = z.enum(["new", "learning", "reviewing", "mastered"]);

export const skillProgressSchema = z.object({
  pathSlug: z.string().min(3),
  skillId: z.string().min(2),
  bestScore: z.number().min(0).max(1),
  attemptCount: z.number().int().nonnegative(),
  reviewBox: z.number().int().min(0).max(5),
  masteryState: masteryStateSchema,
  lastPracticedAt: z.string().datetime(),
  nextReviewAt: z.string().datetime(),
});

export const skillProgressInputSchema = z.object({
  pathSlug: z.string().min(3),
  skillId: z.string().min(2),
  rating: reviewRatingSchema,
  score: z.number().min(0).max(1),
  now: z.date().default(() => new Date()),
});

export const skillProgressBatchSchema = z.array(skillProgressSchema).max(20);

export type ReviewRating = z.infer<typeof reviewRatingSchema>;
export type MasteryState = z.infer<typeof masteryStateSchema>;
export type SkillProgress = z.infer<typeof skillProgressSchema>;
export type SkillProgressInput = z.infer<typeof skillProgressInputSchema>;

const dayMs = 24 * 60 * 60 * 1_000;
const goodIntervals = [1, 3, 7, 14, 30, 60] as const;
const easyIntervals = [3, 7, 14, 30, 60, 120] as const;

function addMilliseconds(date: Date, milliseconds: number) {
  return new Date(date.getTime() + milliseconds).toISOString();
}

function stateForBox(reviewBox: number): MasteryState {
  if (reviewBox >= 4) return "mastered";
  if (reviewBox >= 3) return "reviewing";
  return "learning";
}

export function applyReviewRating(current: SkillProgress | undefined, rawInput: SkillProgressInput): SkillProgress {
  const input = skillProgressInputSchema.parse(rawInput);
  const previousBox = current?.reviewBox ?? 0;
  let reviewBox: number;
  let nextReviewAt: string;

  if (input.rating === "again") {
    reviewBox = 0;
    nextReviewAt = addMilliseconds(input.now, 10 * 60 * 1_000);
  } else if (input.rating === "hard") {
    reviewBox = Math.max(0, previousBox - 1);
    nextReviewAt = addMilliseconds(input.now, dayMs);
  } else if (input.rating === "good") {
    reviewBox = Math.min(5, previousBox + 1);
    nextReviewAt = addMilliseconds(input.now, goodIntervals[previousBox] * dayMs);
  } else {
    reviewBox = Math.min(5, previousBox + 2);
    nextReviewAt = addMilliseconds(input.now, easyIntervals[previousBox] * dayMs);
  }

  return {
    pathSlug: input.pathSlug,
    skillId: input.skillId,
    bestScore: Math.max(current?.bestScore ?? 0, input.score),
    attemptCount: (current?.attemptCount ?? 0) + 1,
    reviewBox,
    masteryState: stateForBox(reviewBox),
    lastPracticedAt: input.now.toISOString(),
    nextReviewAt,
  };
}

export function orderDueReviews(rows: SkillProgress[], now = new Date()) {
  const nowTime = now.getTime();

  return rows
    .filter((row) => new Date(row.nextReviewAt).getTime() <= nowTime)
    .sort((left, right) => {
      const dueDifference = new Date(left.nextReviewAt).getTime() - new Date(right.nextReviewAt).getTime();
      return dueDifference || left.skillId.localeCompare(right.skillId);
    });
}

export function mergeSkillProgress(local: SkillProgress, remote: SkillProgress): SkillProgress {
  if (local.pathSlug !== remote.pathSlug || local.skillId !== remote.skillId) {
    throw new Error("Skill progress can only be merged for the same path and skill.");
  }

  const newest = new Date(local.lastPracticedAt) >= new Date(remote.lastPracticedAt) ? local : remote;

  return {
    ...newest,
    bestScore: Math.max(local.bestScore, remote.bestScore),
    attemptCount: Math.max(local.attemptCount, remote.attemptCount),
  };
}

export function mergeSkillProgressLists(local: SkillProgress[], remote: SkillProgress[]) {
  const merged = new Map<string, SkillProgress>();

  for (const row of [...remote, ...local]) {
    const key = `${row.pathSlug}:${row.skillId}`;
    const current = merged.get(key);
    merged.set(key, current ? mergeSkillProgress(current, row) : row);
  }

  return [...merged.values()].sort((left, right) => left.skillId.localeCompare(right.skillId));
}

export function createSkillProgressUpsertRow(userId: string, progress: SkillProgress) {
  const parsed = skillProgressSchema.parse(progress);
  return {
    user_id: userId,
    path_slug: parsed.pathSlug,
    skill_id: parsed.skillId,
    best_score: parsed.bestScore,
    attempt_count: parsed.attemptCount,
    review_box: parsed.reviewBox,
    mastery_state: parsed.masteryState,
    last_practiced_at: parsed.lastPracticedAt,
    next_review_at: parsed.nextReviewAt,
  };
}
