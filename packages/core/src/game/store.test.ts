import { expect, it, vi } from "vitest";
import source from "../../../../content/game/restore-the-signal.json";
import { gameCampaignSchema } from "./schema";
import { GameStore } from "./store";
import {
  awardScenario,
  emptyGameProgress,
  GAME_STORAGE_KEY,
  gameTotals,
} from "./progress";
const campaign = gameCampaignSchema.parse(source);
const won = awardScenario(
  emptyGameProgress(),
  campaign,
  campaign.levels[0].id,
  "main",
  "standard",
);
const memory = () => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
  };
};
it("isolates account progress and claims the anonymous buffer only once", async () => {
  const storage = memory();
  storage.values.set(GAME_STORAGE_KEY, JSON.stringify(won));
  let account: string | null = "alice";
  const remote = {
    account: async () => account,
    load: vi.fn().mockResolvedValue(null),
    save: vi.fn(async (p) => p),
  };
  const store = new GameStore(campaign, storage, remote);
  await store.load();
  expect(gameTotals(store.getSnapshot()).stars).toBe(1);
  account = "bob";
  await store.load();
  expect(gameTotals(store.getSnapshot()).stars).toBe(0);
  expect(remote.save).toHaveBeenLastCalledWith(
    expect.objectContaining({ awards: {} }),
    "bob",
  );
  account = "alice";
  await store.load();
  expect(gameTotals(store.getSnapshot()).stars).toBe(1);
  account = null;
  await store.load();
  expect(remote.load).toHaveBeenCalledTimes(3);
});
it("never uploads a stale account snapshot after sign-out", async () => {
  const storage = memory();
  let account: string | null = "alice";
  const remote = {
    account: async () => account,
    load: async () => null,
    save: vi.fn(async (p) => p),
  };
  const store = new GameStore(campaign, storage, remote);
  await store.load();
  remote.save.mockClear();
  account = "bob";
  await store.save(won);
  expect(remote.save).not.toHaveBeenCalledWith(
    expect.objectContaining({ awards: won.awards }),
    "bob",
  );
  expect(gameTotals(store.getSnapshot()).stars).toBe(0);
});
it("preserves incompatible storage before a new save and survives storage failure", async () => {
  const storage = memory();
  storage.values.set(GAME_STORAGE_KEY, "{broken");
  const store = new GameStore(campaign, storage);
  await store.load();
  await store.save(won);
  expect(storage.values.get(`${GAME_STORAGE_KEY}:recovery`)).toBe("{broken");
  const denied = new GameStore(campaign, {
    getItem: () => {
      throw Error("denied");
    },
    setItem: () => {
      throw Error("quota");
    },
  });
  await expect(denied.load()).resolves.toBeUndefined();
  await expect(denied.save(won)).resolves.toBeUndefined();
  expect(gameTotals(denied.getSnapshot()).stars).toBe(1);
});
it("records a success once per attempt, rather than on each visit to its completed screen", async () => {
  const { GameSession } = await import("./session");
  const session = new GameSession(campaign.levels[0]);
  session.submit({ passed: true, reasons: [], events: [] });
  expect(session.takeAward()).toMatchObject({
    scenario: "main",
    mode: "standard",
  });
  expect(session.takeAward()).toBeNull();
  session.reset();
  expect(session.takeAward()).toBeNull();
  session.submit({ passed: true, reasons: [], events: [] });
  expect(session.takeAward()).not.toBeNull();
});
it("keeps a pending award when navigation reloads the same account store", async () => {
  const storage = memory();
  const store = new GameStore(campaign, storage);
  await store.load();
  const saving = store.save(won);
  await store.load();
  await saving;
  const reopened = new GameStore(campaign, storage);
  await reopened.load();
  expect(gameTotals(reopened.getSnapshot()).stars).toBe(1);
});

it.each([3, 4])("does not upload the next account's progress after interrupted identity check %i", async (interruptedCheck) => {
  const storage = memory();
  storage.values.set(`${GAME_STORAGE_KEY}:account:bob`, JSON.stringify(won));
  let account = "alice", release!: (account: string) => void, reads = 0;
  const remote = {
    account: vi.fn(() => ++reads === interruptedCheck ? new Promise<string>((done) => { release = done; }) : Promise.resolve(account)),
    load: vi.fn(async () => account === "alice" ? awardScenario(won, campaign, campaign.levels[0].id, "mastery-1", "standard") : null),
    save: vi.fn(async (p) => p),
  };
  const store = new GameStore(campaign, storage, remote);
  const alice = store.load();
  await vi.waitFor(() => expect(reads).toBe(interruptedCheck));
  account = "bob";
  await store.load();
  release("alice");
  await alice;
  expect(remote.save).not.toHaveBeenCalledWith(expect.anything(), "alice");
  expect(remote.save).toHaveBeenCalledWith(expect.objectContaining({ awards: won.awards }), "bob");
  expect(storage.values.has(`${GAME_STORAGE_KEY}:account:alice`)).toBe(false);
  expect(store.getSnapshot().awards).toEqual(won.awards);
});

it("does not let an obsolete anonymous claim steal ownership from the current account", async () => {
  const storage = memory();
  storage.values.set(GAME_STORAGE_KEY, JSON.stringify(won));
  let account = "alice", release!: (value: string | null) => void;
  const originalGet = storage.getItem;
  const getItem = vi.fn((key: string): string | null | Promise<string | null> =>
    key === `${GAME_STORAGE_KEY}:claimed` && account === "alice"
      ? new Promise<string | null>((done) => { release = done; })
      : originalGet(key));
  const remote = { account: async () => account, load: async () => null, save: vi.fn(async (p) => p) };
  const store = new GameStore(campaign, { ...storage, getItem }, remote);
  const alice = store.load();
  await vi.waitFor(() => expect(release).toBeDefined());
  account = "bob";
  const bob = store.load();
  await vi.waitFor(() => expect(getItem).toHaveBeenCalledWith(`${GAME_STORAGE_KEY}:account:bob`));
  release(null);
  await Promise.all([alice, bob]);
  expect(storage.values.get(`${GAME_STORAGE_KEY}:claimed`)).toBe("bob");
  expect(storage.values.has(`${GAME_STORAGE_KEY}:account:alice`)).toBe(false);
  expect(gameTotals(store.getSnapshot()).stars).toBe(1);
  expect(remote.save).toHaveBeenCalledTimes(1);
  expect(remote.save).toHaveBeenCalledWith(expect.objectContaining({ awards: won.awards }), "bob");
});

it("serializes anonymous ownership claims across an account switch during storage I/O", async () => {
  const storage = memory();
  storage.values.set(GAME_STORAGE_KEY, JSON.stringify(won));
  let account = "alice", release!: () => void;
  const getItem = vi.fn(storage.getItem);
  const setItem = vi.fn(async (key: string, value: string) => {
    if (key === `${GAME_STORAGE_KEY}:claimed` && value === "alice")
      await new Promise<void>((done) => { release = done; });
    storage.setItem(key, value);
  });
  const remote = { account: async () => account, load: async () => null, save: vi.fn(async (p) => p) };
  const store = new GameStore(campaign, { ...storage, getItem, setItem }, remote);
  const alice = store.load();
  await vi.waitFor(() => expect(release).toBeDefined());
  account = "bob";
  const bob = store.load();
  await vi.waitFor(() => expect(store.getSnapshot().awards).toEqual({}));
  await vi.waitFor(() => expect(getItem).toHaveBeenCalledWith(`${GAME_STORAGE_KEY}:account:bob`));
  // Let the account load drain its microtasks while the first claim is held.
  await new Promise<void>(done => setTimeout(done, 0));
  expect(getItem.mock.calls.filter(([key]) => key === `${GAME_STORAGE_KEY}:claimed`)).toHaveLength(1);
  release();
  await Promise.all([alice, bob]);
  expect(storage.values.get(`${GAME_STORAGE_KEY}:claimed`)).toBe("alice");
  expect(gameTotals(store.getSnapshot()).stars).toBe(0);
  expect(remote.save).not.toHaveBeenCalledWith(expect.objectContaining({ awards: won.awards }), "bob");
});
