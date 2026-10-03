import { beforeEach, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
const { create, read, sync } = vi.hoisted(() => ({
  create: vi.fn(),
  read: vi.fn(),
  sync: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: create,
}));
vi.mock("@codematica/core", async (original) => ({
  ...(await original<typeof import("@codematica/core")>()),
  readNotebookProgress: read,
  syncNotebookProgress: sync,
}));
beforeEach(() => {
  vi.resetAllMocks();
});
it("works anonymously without remote configuration and refuses remote writes", async () => {
  create.mockResolvedValue(undefined);
  expect(await (await GET()).json()).toEqual({ isSignedIn: false, items: [] });
  expect(
    (
      await POST(
        new Request("http://localhost", { method: "POST", body: "{}" }),
      )
    ).status,
  ).toBe(401);
  expect(sync).not.toHaveBeenCalled();
});
it("reads owned progress and returns read failures", async () => {
  create.mockResolvedValue({});
  read.mockResolvedValue({ isSignedIn: true, userId: "owner", items: [] });
  expect(await (await GET()).json()).toEqual({
    isSignedIn: true,
    userId: "owner",
    items: [],
  });
  read.mockRejectedValue(new Error("offline"));
  expect((await GET()).status).toBe(500);
});
it("validates and syncs submitted completion without ink, including malformed JSON", async () => {
  const client = {};
  create.mockResolvedValue(client);
  sync.mockResolvedValue({ status: 200, body: { synced: 1 } });
  const items = [
    {
      notebookId: "custom-3042-v1",
      sheetId: "3042-mixed",
      prompt: "あ",
      bestCount: 24,
    },
  ];
  expect(
    await (
      await POST(
        new Request("http://localhost", {
          method: "POST",
          body: JSON.stringify({ items }),
        }),
      )
    ).json(),
  ).toEqual({ synced: 1 });
  expect(sync).toHaveBeenCalledWith(
    client,
    items,
    expect.objectContaining({ languageCharacters: expect.any(Array) }),
  );
  sync.mockResolvedValue({ status: 400, body: { error: "Invalid" } });
  expect(
    (
      await POST(
        new Request("http://localhost", { method: "POST", body: "broken" }),
      )
    ).status,
  ).toBe(400);
  expect(sync).toHaveBeenLastCalledWith(client, undefined, expect.anything());
});
