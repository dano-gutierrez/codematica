import { describe, expect, it, vi } from "vitest";
import { createEditorialStore } from "./linkedin-store";
import { editorialFixture } from "./test/linkedin-fixture";

describe("editorial screen state", () => {
  const client = () => ({ isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValue(editorialFixture), review: vi.fn().mockResolvedValue(null) });
  it("does not fetch private rows until membership is checked", async () => {
    const api = client(); api.isAdmin.mockResolvedValue(false);
    const store = createEditorialStore(api);
    await store.refresh();
    expect(store.getSnapshot().phase).toBe("denied");
    expect(api.snapshot).not.toHaveBeenCalled();
  });
  it("loads, serializes writes, reloads and reports errors", async () => {
    const api = client(); const store = createEditorialStore(api); const update = vi.fn();
    const unsubscribe = store.subscribe(update);
    await store.refresh();
    expect(store.getSnapshot().data).toEqual(editorialFixture);
    const action = store.act(editorialFixture.posts[0], "refine");
    await store.act(editorialFixture.posts[0], "approve");
    await action;
    expect(api.review).toHaveBeenCalledTimes(1);
    api.review.mockRejectedValue(new Error("Stale revision"));
    await store.act(editorialFixture.posts[0], "approve");
    expect(store.getSnapshot().error).toBe("Stale revision");
    expect(store.getSnapshot().busy).toBe(false);
    expect(update).toHaveBeenCalled(); unsubscribe();
  });
  it("handles missing configuration and revocation", async () => {
    const absent = createEditorialStore(null); await absent.refresh();
    expect(absent.getSnapshot().phase).toBe("unavailable");
    const api = client(); const store = createEditorialStore(api); await store.refresh();
    api.isAdmin.mockRejectedValue(new Error("Network unavailable")); await store.refresh();
    expect(store.getSnapshot().data).toBeNull();
    expect(store.getSnapshot().error).toBe("Network unavailable");
  });
});

it("keeps an unsaved edit intact during polling", async () => {
  const api={isAdmin:vi.fn().mockResolvedValue(true),snapshot:vi.fn().mockResolvedValue(editorialFixture),review:vi.fn().mockResolvedValue(null)};
  const store=createEditorialStore(api); await store.refresh(); store.setEditing(true); await store.refresh();
  expect(api.snapshot).toHaveBeenCalledTimes(1);
  await store.act(editorialFixture.posts[0],"save",{body:"edited"});
  expect(store.getSnapshot().editing).toBe(false); expect(api.snapshot).toHaveBeenCalledTimes(2);
});

it("discards a poll already in flight when editing begins", async () => {
  let complete!: (data: typeof editorialFixture) => void;
  const api = { isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValueOnce(editorialFixture).mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; })), review: vi.fn() };
  const store = createEditorialStore(api); await store.refresh();
  const polling = store.refresh(); await Promise.resolve();
  store.setEditing(true); complete({ ...editorialFixture, posts: [] }); await polling;
  expect(store.getSnapshot().data?.posts).toHaveLength(1);
});
