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
