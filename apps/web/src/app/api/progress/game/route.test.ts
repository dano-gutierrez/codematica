import { beforeEach, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { emptyGameProgress } from "@codematica/core/game";
const mocks = vi.hoisted(() => ({
  client: vi.fn(),
  user: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.client,
}));
beforeEach(() => {
  mocks.client.mockResolvedValue({
    auth: { getUser: mocks.user },
    rpc: mocks.rpc,
  });
  mocks.user.mockResolvedValue({ data: { user: { id: "alice" } } });
  mocks.rpc.mockResolvedValue({ data: emptyGameProgress(), error: null });
});
const request = (body?: unknown, account = "alice") =>
  new Request("http://localhost/api/progress/game", {
    method: body === undefined ? "GET" : "POST",
    headers: { "x-game-account": account },
    ...(body === undefined
      ? {}
      : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });
it("loads only the expected signed-in account and reports backend failure", async () => {
  expect((await GET(request())).status).toBe(200);
  expect(mocks.rpc).toHaveBeenCalledWith("get_game_progress");
  expect((await GET(request(undefined, "bob"))).status).toBe(409);
  mocks.rpc.mockResolvedValue({ error: Error("offline") });
  expect((await GET(request())).status).toBe(503);
});
it("allows local browsing without auth and refuses unauthenticated mutations", async () => {
  mocks.client.mockResolvedValue(null);
  expect(await (await GET(request())).json()).toBeNull();
  expect((await POST(request({}))).status).toBe(401);
  mocks.client.mockResolvedValue({ auth: { getUser: mocks.user } });
  mocks.user.mockResolvedValue({ data: { user: null } });
  expect(await (await GET(request())).json()).toBeNull();
  expect((await POST(request({}))).status).toBe(401);
});
it("validates bounded snapshots before the transactional merge", async () => {
  expect((await POST(request(emptyGameProgress()))).status).toBe(200);
  expect(mocks.rpc).toHaveBeenCalledWith("merge_game_progress", {
    payload: emptyGameProgress(),
    expected_user: "alice",
  });
  expect((await POST(request({}, "bob"))).status).toBe(409);
  expect((await POST(request("x".repeat(200001)))).status).toBe(413);
  expect((await POST(request("{broken"))).status).toBe(400);
  expect((await POST(request({ version: 99 }))).status).toBe(400);
  mocks.rpc.mockResolvedValue({ error: Error("offline") });
  expect((await POST(request(emptyGameProgress()))).status).toBe(503);
});
