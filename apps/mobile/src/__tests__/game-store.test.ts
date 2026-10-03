import { getContentIndex } from "@codematica/core";
import { awardScenario } from "@codematica/core/game";
const mockMemory = new Map<string, string>();
const mockRpc = jest.fn(),
  mockGetSession = jest.fn(),
  mockSubscribe = jest.fn();
let mockClient: unknown;
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: async (k: string) => mockMemory.get(k) ?? null,
  setItem: async (k: string, v: string) => {
    mockMemory.set(k, v);
  },
}));
jest.mock("../lib/supabase", () => ({
  createNativeSupabaseClient: () => mockClient,
}));
import { nativeGameStore } from "../lib/game-store";
it("loads and merges account-scoped progress, including offline retry", async () => {
  mockClient = {
    auth: { getSession: mockGetSession, onAuthStateChange: mockSubscribe },
    rpc: mockRpc,
  };
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: "alice" } } },
  });
  mockRpc.mockResolvedValue({ data: null, error: null });
  const c = getContentIndex().gameCampaigns[0],
    store = nativeGameStore(c);
  expect(nativeGameStore(c)).toBe(store);
  await store.load();
  await store.save(
    awardScenario(store.getSnapshot(), c, c.levels[0].id, "main", "standard"),
  );
  expect(mockRpc).toHaveBeenCalledWith(
    "merge_game_progress",
    expect.objectContaining({ expected_user: "alice" }),
  );
  mockRpc.mockResolvedValueOnce({ error: Error("offline") });
  await store.load();
  mockRpc
    .mockResolvedValueOnce({ data: null })
    .mockResolvedValueOnce({ error: Error("offline") });
  await store.load();
  expect(Object.keys(store.getSnapshot().awards)).toHaveLength(1);
  mockGetSession.mockResolvedValue({ data: { session: null } });
  await store.load();
  expect(store.isAnonymous()).toBe(true);
  await mockSubscribe.mock.calls[0][0]();
  await Promise.resolve();
});
it("runs without a Supabase client", async () => {
  mockClient = null;
  const c = { ...getContentIndex().gameCampaigns[0], id: "local-test" };
  const store = nativeGameStore(c);
  await store.load();
  expect(store.isAnonymous()).toBe(true);
});
