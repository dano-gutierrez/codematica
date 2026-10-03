import { beforeEach, expect, it, vi } from "vitest";
import { getContentIndex } from "@codematica/core";
import { awardScenario, emptyGameProgress } from "@codematica/core/game";
const auth = vi.hoisted(() => ({
  client: vi.fn(),
  session: vi.fn(),
  listener: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: auth.client,
}));
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  auth.client.mockReturnValue(null);
  vi.stubGlobal("fetch", vi.fn());
});
it("keeps anonymous progress local and reuses a store per campaign", async () => {
  const { webGameStore } = await import("./store"),
    c = getContentIndex().gameCampaigns[0],
    store = webGameStore(c);
  expect(webGameStore(c)).toBe(store);
  await store.load();
  await store.save(
    awardScenario(emptyGameProgress(), c, c.levels[0].id, "main", "standard"),
  );
  expect(fetch).not.toHaveBeenCalled();
  expect(localStorage.getItem("codematica.game.v1")).toContain(c.levels[0].id);
});
it("binds sync requests to the current account and retains local state on HTTP failure", async () => {
  auth.client.mockReturnValue({
    auth: { getSession: auth.session, onAuthStateChange: auth.listener },
  });
  auth.session.mockResolvedValue({
    data: { session: { user: { id: "alice" } } },
  });
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => null,
  } as Response);
  const { webGameStore } = await import("./store"),
    c = getContentIndex().gameCampaigns[0],
    store = webGameStore(c);
  await store.load();
  expect(fetch).toHaveBeenCalledWith(
    "/api/progress/game",
    expect.objectContaining({ headers: { "x-game-account": "alice" } }),
  );
  vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
  await store.load();
  await store.save(
    awardScenario(store.getSnapshot(), c, c.levels[0].id, "main", "standard"),
  );
  expect(Object.keys(store.getSnapshot().awards)).toHaveLength(1);
  vi.mocked(fetch)
    .mockResolvedValueOnce({ ok: true, json: async () => null } as Response)
    .mockResolvedValueOnce({ ok: false } as Response);
  await store.load();
  expect(auth.listener).toHaveBeenCalled();
  await auth.listener.mock.calls.at(-1)![0]();
  window.dispatchEvent(new Event("online"));
  await Promise.resolve();
});
