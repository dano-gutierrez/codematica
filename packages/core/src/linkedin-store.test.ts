import { describe, expect, it, vi } from "vitest";
import { createEditorialStore } from "./linkedin-store";
import { editorialFixture } from "./test/linkedin-fixture";

describe("editorial screen state", () => {
  const client = () => ({ isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValue(editorialFixture), create: vi.fn().mockResolvedValue("10000000-0000-4000-8000-000000000001"), review: vi.fn().mockResolvedValue(null) });
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
  const api={isAdmin:vi.fn().mockResolvedValue(true),snapshot:vi.fn().mockResolvedValue(editorialFixture),create: vi.fn().mockResolvedValue("10000000-0000-4000-8000-000000000001"), review:vi.fn().mockResolvedValue(null)};
  const store=createEditorialStore(api); await store.refresh(); store.setEditing(true); await store.refresh();
  expect(api.snapshot).toHaveBeenCalledTimes(1);
  await store.act(editorialFixture.posts[0],"save",{body:"edited"});
  expect(store.getSnapshot().editing).toBe(false); expect(api.snapshot).toHaveBeenCalledTimes(2);
});

it("discards a poll already in flight when editing begins", async () => {
  let complete!: (data: typeof editorialFixture) => void;
  const api = { isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValueOnce(editorialFixture).mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; })), create: vi.fn().mockResolvedValue("10000000-0000-4000-8000-000000000001"), review: vi.fn() };
  const store = createEditorialStore(api); await store.refresh();
  const polling = store.refresh(); await Promise.resolve();
  store.setEditing(true); complete({ ...editorialFixture, posts: [] }); await polling;
  expect(store.getSnapshot().data?.posts).toHaveLength(1);
});

it("serializes creation, preserves retry identity after failure and refreshes on success", async () => {
  const api = { isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn().mockResolvedValue(editorialFixture), review: vi.fn(), create: vi.fn().mockRejectedValueOnce(new Error("Connection interrupted")).mockResolvedValue(editorialFixture.posts[0].id) };
  const store = createEditorialStore(api); const input = { title: "Manual", topic: "Systems", body: "Lesson" };
  expect(await store.create(input)).toBeNull(); await store.refresh(); store.startCreate();
  expect(await store.create(input)).toBeNull();
  expect(store.getSnapshot()).toMatchObject({ editing: true, busy: false, error: "Connection interrupted" });
  const retry = store.create(input); expect(await store.create(input)).toBeNull();
  expect(await retry).toBe(editorialFixture.posts[0].id);
  expect(api.create.mock.calls[0][0]).toBe(api.create.mock.calls[1][0]);
  expect(store.getSnapshot().editing).toBe(false);
  await store.create(input); expect(api.create.mock.calls[2][0]).not.toBe(api.create.mock.calls[1][0]);
});

it("polls summaries, fetches only selected details and ignores unchanged versions", async () => {
  const api = { isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn(), create: vi.fn(), review: vi.fn(), overview: vi.fn().mockResolvedValue({ ...editorialFixture, revisions: [], version: "1" }), detail: vi.fn().mockResolvedValue(editorialFixture) };
  const store = createEditorialStore(api); await store.refresh();
  expect(api.snapshot).not.toHaveBeenCalled(); expect(store.getSnapshot().data?.revisions).toEqual([]);
  await store.selectPost(editorialFixture.posts[0].id);
  expect(api.detail).toHaveBeenCalledWith(editorialFixture.posts[0].id);
  await store.refresh(); expect(api.detail).toHaveBeenCalledTimes(1);
  expect(store.getSnapshot().data?.revisions).toEqual(editorialFixture.revisions);
  api.overview.mockResolvedValue({ ...editorialFixture, revisions: [], version: "2" });
  await store.refresh(); expect(api.detail).toHaveBeenCalledTimes(2);
});

it("discards a detail response after selection changes or editing starts", async () => {
  let complete!: (v: typeof editorialFixture) => void;
  const api = { isAdmin: vi.fn().mockResolvedValue(true), snapshot: vi.fn(), create: vi.fn(), review: vi.fn(), overview: vi.fn().mockResolvedValue({ ...editorialFixture, revisions: [], version: "1" }), detail: vi.fn().mockImplementation(() => new Promise((resolve) => { complete=resolve; })) };
  const store=createEditorialStore(api); await store.refresh();
  const pending=store.selectPost(editorialFixture.posts[0].id); store.setEditing(true); complete(editorialFixture); await pending;
  expect(store.getSnapshot().data?.revisions).toEqual([]);
});

it("serializes override and voice mutations, preserves failed input and reports detail failures", async () => {
  const api={isAdmin:vi.fn().mockResolvedValue(true),snapshot:vi.fn().mockResolvedValue(editorialFixture),create:vi.fn(),review:vi.fn(),detail:vi.fn().mockRejectedValue(new Error("Detail unavailable")),preparationAction:vi.fn().mockRejectedValue(new Error("Reason rejected")),setVoice:vi.fn().mockRejectedValue("offline")};
  const store=createEditorialStore(api);
  await store.preparationAction(editorialFixture.posts[0],"report","follow_up","New angle"); expect(api.preparationAction).not.toHaveBeenCalled();
  await store.refresh(); await store.selectPost(editorialFixture.posts[0].id); expect(store.getSnapshot().error).toBe("Detail unavailable");
  store.setEditing(true); await store.preparationAction(editorialFixture.posts[0],"report","follow_up","New angle"); expect(api.preparationAction).not.toHaveBeenCalled();
  const voice=store.setVoice(["Direct"]); await store.setVoice(["Other"]); await voice;
  expect(api.setVoice).toHaveBeenCalledTimes(1);expect(store.getSnapshot()).toMatchObject({editing:true,busy:false,error:"Unable to save voice rules"});
  api.setVoice.mockResolvedValue(null);await store.setVoice(["Direct"]); expect(store.getSnapshot().editing).toBe(false);
  await store.preparationAction(editorialFixture.posts[0],"report","follow_up","New angle"); expect(store.getSnapshot().error).toBe("Reason rejected");
  api.preparationAction.mockResolvedValue(null); await store.preparationAction(editorialFixture.posts[0],"report","follow_up","New angle");expect(store.getSnapshot().busy).toBe(false);
  api.detail.mockRejectedValue("oops");await store.selectPost(editorialFixture.posts[0].id,true);expect(store.getSnapshot().error).toBe("Unable to load this post");
});
