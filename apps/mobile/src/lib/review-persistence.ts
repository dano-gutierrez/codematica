import AsyncStorage from "@react-native-async-storage/async-storage";
import { applyReviewRating, mergeSkillProgressLists, skillProgressSchema, type ReviewRating, type SkillProgress } from "@codematica/core";

export const reviewStorageKey = "codematica:japanese-skill-progress:v1";
type Storage = Pick<typeof AsyncStorage, "getItem" | "setItem">;
const writes = new WeakMap<Storage, Promise<unknown>>();

// Every writer of this key reads its base inside the same device-storage queue.
function serialize<T>(storage: Storage, work: () => Promise<T>): Promise<T> {
  const result = (writes.get(storage) ?? Promise.resolve()).then(work);
  writes.set(storage, result.catch(() => undefined));
  return result;
}

async function read(storage: Storage): Promise<SkillProgress[]> {
  const raw: unknown = JSON.parse((await storage.getItem(reviewStorageKey)) ?? "[]");
  if (!Array.isArray(raw)) throw new Error("Review progress is unreadable.");
  const rows = raw.map(row => skillProgressSchema.parse(row));
  const keys = rows.map(row => `${row.pathSlug}:${row.skillId}`);
  if (new Set(keys).size !== rows.length) throw new Error("Review progress contains duplicate skills.");
  return rows;
}

export function mergeNativeReviewProgress(remote: SkillProgress[] = [], storage: Storage = AsyncStorage): Promise<SkillProgress[]> {
  return serialize(storage, async () => {
    const local = await read(storage);
    const merged = mergeSkillProgressLists(local, remote);
    if (JSON.stringify(merged) !== JSON.stringify(local)) {
      await storage.setItem(reviewStorageKey, JSON.stringify(merged));
    }
    return merged;
  });
}

/** A reusable save intent: retry reconciles the same recall, never grades it again. */
export function createNativeReviewSave(pathSlug: string, skillId: string, rating: ReviewRating, storage: Storage = AsyncStorage, now = new Date()) {
  let prepared: { before: SkillProgress | undefined; next: SkillProgress } | undefined;
  return () => serialize(storage, async () => {
    const rows = await read(storage);
    const current = rows.find(row => row.pathSlug === pathSlug && row.skillId === skillId);
    if (!prepared) {
      prepared = {
        before: current,
        next: applyReviewRating(current, { pathSlug, skillId, rating, score: rating === "again" ? 0.4 : rating === "hard" ? 0.65 : rating === "good" ? 0.85 : 1, now }),
      };
    }
    // A rejected bridge promise may follow a committed write; acknowledge that row.
    if (JSON.stringify(current) === JSON.stringify(prepared.next)) return rows;
    if (JSON.stringify(current) !== JSON.stringify(prepared.before)) {
      const error = new Error("This skill changed. Reload progress before another recall.");
      error.name = "ReviewSaveConflict";
      throw error;
    }
    const nextRows = [...rows.filter(row => !(row.pathSlug === pathSlug && row.skillId === skillId)), prepared.next];
    await storage.setItem(reviewStorageKey, JSON.stringify(nextRows));
    return nextRows;
  });
}
