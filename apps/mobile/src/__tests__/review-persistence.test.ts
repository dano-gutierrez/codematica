import { applyReviewRating } from "@codematica/core";
import { createNativeReviewSave, mergeNativeReviewProgress, reviewStorageKey } from "../lib/review-persistence";

const now = new Date("2026-10-04T12:00:00.000Z");
const path = "japanese-foundations";
const row = (skillId = "kana-reading") => applyReviewRating(undefined, { pathSlug: path, skillId, rating: "good", score: 0.85, now });
function storage(initial: string | null = null) {
  let value = initial;
  return {
    getItem: jest.fn(async (_key: string) => value),
    setItem: jest.fn(async (_key: string, next: string) => { value = next; }),
    value: () => value,
  };
}

it("acknowledges only a completed write and serializes concurrent skills", async () => {
  const device = storage();
  let finish!: () => void;
  device.setItem.mockImplementationOnce(async (_key, value) => {
    await new Promise<void>(resolve => { finish = resolve; });
    await device.setItem(reviewStorageKey, value);
  });
  const first = createNativeReviewSave(path, "kana-reading", "good", device, now)();
  await new Promise<void>(resolve => setImmediate(resolve));
  const second = createNativeReviewSave(path, "kana-writing", "easy", device, now)();
  let acknowledged = false;
  void first.then(() => { acknowledged = true; });
  await new Promise<void>(resolve => setImmediate(resolve));
  expect(acknowledged).toBe(false);
  expect(device.getItem).toHaveBeenCalledTimes(1);
  finish();
  await first;
  const rows = await second;
  expect(rows).toEqual(expect.arrayContaining([row(), expect.objectContaining({ skillId: "kana-writing", attemptCount: 1 })]));
  expect(JSON.parse(device.value()!)).toHaveLength(2);
});

it.each([false, true])("reconciles a rejected write (committed=%s) without another recall", async committed => {
  const device = storage();
  device.setItem.mockImplementationOnce(async (_key, value) => {
    if (committed) await device.setItem(reviewStorageKey, value);
    throw new Error("bridge rejected");
  });
  const save = createNativeReviewSave(path, "kana-reading", "good", device, now);
  await expect(save()).rejects.toThrow("bridge rejected");
  // An unrelated skill may arrive between failure and retry.
  const other = row("kana-writing");
  const existing = JSON.parse(device.value() ?? "[]");
  await device.setItem(reviewStorageKey, JSON.stringify([...existing, other]));
  const rows = await save();
  expect(rows).toEqual(expect.arrayContaining([row(), other]));
  expect(rows.find(value => value.skillId === "kana-reading")?.attemptCount).toBe(1);
  const calls = device.setItem.mock.calls.length;
  await save();
  expect(device.setItem).toHaveBeenCalledTimes(calls);
});

it("preserves a changed same-skill record and reports a concrete reload conflict", async () => {
  const device = storage();
  device.setItem.mockRejectedValueOnce(new Error("disk"));
  const save = createNativeReviewSave(path, "kana-reading", "hard", device, now);
  await expect(save()).rejects.toThrow("disk");
  const newer = row();
  await device.setItem(reviewStorageKey, JSON.stringify([newer]));
  await expect(save()).rejects.toMatchObject({ name: "ReviewSaveConflict" });
  expect(JSON.parse(device.value()!)).toEqual([newer]);
  expect(device.setItem).toHaveBeenCalledTimes(2);
});

it.each(["invalid JSON", "{}", '[{"attemptCount":1}]', JSON.stringify([row(), row()])])("retains unreadable or ambiguous persisted data: %s", async value => {
  const device = storage(value);
  await expect(mergeNativeReviewProgress([], device)).rejects.toThrow();
  await expect(createNativeReviewSave(path, "kana-reading", "good", device, now)()).rejects.toThrow();
  expect(device.value()).toBe(value);
  expect(device.setItem).not.toHaveBeenCalled();
});

it("merges remote progress with the current acknowledged local snapshot", async () => {
  const device = storage();
  const first = createNativeReviewSave(path, "kana-reading", "good", device, now)();
  const remote = row("kana-writing");
  const merge = mergeNativeReviewProgress([remote], device);
  await first;
  expect(await merge).toEqual(expect.arrayContaining([row(), remote]));
  const calls = device.setItem.mock.calls.length;
  await mergeNativeReviewProgress([remote], device);
  expect(device.setItem).toHaveBeenCalledTimes(calls);
  await expect(createNativeReviewSave(path, "kana-reading", "easy", device, now)()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ skillId: "kana-reading", attemptCount: 2, reviewBox: 3 })]));
});

it("lets a read failure retry and keeps a merge-write rejection visible", async () => {
  const device = storage();
  device.getItem.mockRejectedValueOnce(new Error("read failed"));
  const save = createNativeReviewSave(path, "kana-reading", "again", device, now);
  await expect(save()).rejects.toThrow("read failed");
  await expect(save()).resolves.toEqual([expect.objectContaining({ attemptCount: 1, reviewBox: 0, bestScore: 0.4 })]);
  device.setItem.mockRejectedValueOnce(new Error("merge failed"));
  await expect(mergeNativeReviewProgress([row("kana-writing")], device)).rejects.toThrow("merge failed");
  expect(JSON.parse(device.value()!)).toHaveLength(1);
});
