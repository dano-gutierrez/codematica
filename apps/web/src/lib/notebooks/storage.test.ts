import { IDBFactory } from "fake-indexeddb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCustomNotebook,
  createNotebookSnapshot,
  acceptNotebookCharacter,
  restartNotebookSheet,
  getContentIndex,
} from "@codematica/core";
const { browserClient } = vi.hoisted(() => ({
  browserClient: vi.fn(() => null),
}));
vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: browserClient,
}));
import { createWebNotebookStorage } from "./storage";

beforeEach(() => {
  browserClient.mockReturnValue(null);
  vi.stubGlobal("indexedDB", new IDBFactory());
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ isSignedIn: false, items: [] }),
    })),
  );
});
describe("device notebook storage", () => {
  it("restores ink, pressure, active sheet and unlocks, and clears only the restarted page", async () => {
    const notebook = createCustomNotebook("あい", getContentIndex()),
      storage = createWebNotebookStorage("guest");
    let state = createNotebookSnapshot(notebook);
    for (let i = 0; i < 48; i++)
      state = acceptNotebookCharacter(notebook, state, notebook.sheets[0]!.id, {
        token: `cell-${i}`,
        strokes: [
          {
            points: [
              [10, 20],
              [70, 80],
            ],
            pressures: [0.2, 0.9],
          },
        ],
      });
    await storage.saveDefinition(notebook);
    await storage.save(state);
    expect(await storage.load(notebook)).toEqual(state);
    expect(await storage.list()).toEqual([notebook]);
    const restarted = restartNotebookSheet(
      notebook,
      state,
      notebook.sheets[0]!.id,
    );
    await storage.save(restarted);
    expect(
      (await storage.load(notebook))!.pages[notebook.sheets[0]!.id],
    ).toMatchObject({ cells: [], bestCount: 48 });
    expect(
      await createWebNotebookStorage("other-user").load(notebook),
    ).toBeUndefined();
  });
  it("syncs only bounded progress and returns remote milestones without sending ink", async () => {
    const notebook = createCustomNotebook("あ", getContentIndex()),
      state = createNotebookSnapshot(notebook);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, options) => ({
        ok: true,
        json: async () =>
          options?.method === "POST"
            ? { synced: 3 }
            : {
                isSignedIn: true,
                userId: "user-a",
                items: [
                  {
                    notebookId: notebook.id,
                    sheetId: notebook.sheets[0]!.id,
                    prompt: "あ",
                    bestCount: 24,
                  },
                ],
              },
      })),
    );
    const storage = createWebNotebookStorage();
    const remote = await storage.sync!(notebook, state);
    expect(remote[0]!.bestCount).toBe(24);
    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[1]![1]!.body as string).items[0],
    ).toMatchObject({ bestCount: 24 });
    expect(vi.mocked(fetch).mock.calls[1]![1]!.body).not.toContain("strokes");
    expect(await storage.load(notebook)).toBeUndefined();
  });
  it("surfaces unavailable storage and failed remote writes", async () => {
    const notebook = createCustomNotebook("あ", getContentIndex());
    vi.stubGlobal("indexedDB", undefined);
    await expect(
      createWebNotebookStorage("guest").load(notebook),
    ).rejects.toThrow(/storage/);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, options) => ({
        ok: options?.method !== "POST",
        json: async () => ({ isSignedIn: true, userId: "a", items: [] }),
      })),
    );
    await expect(
      createWebNotebookStorage().sync!(
        notebook,
        createNotebookSnapshot(notebook),
      ),
    ).rejects.toThrow(/sync/);
  });
});
it("discovers a remotely completed custom notebook without any local ink", async () => {
  const notebook = createCustomNotebook("おはよう", getContentIndex());
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        isSignedIn: true,
        userId: "remote-owner",
        items: [
          {
            notebookId: notebook.id,
            sheetId: notebook.sheets[0]!.id,
            prompt: "おはよう",
            bestCount: 96,
          },
          {
            notebookId: "custom-unsupported-v1",
            sheetId: "a",
            prompt: "ABC",
            bestCount: 0,
          },
        ],
      }),
    })),
  );
  const storage = createWebNotebookStorage();
  expect(await storage.list()).toEqual([notebook]);
  expect(await storage.load(notebook)).toBeUndefined();
});

it("uses the cached account identity to open local ink during a network outage", async () => {
  const n = createCustomNotebook("あ", getContentIndex()),
    state = createNotebookSnapshot(n);
  await createWebNotebookStorage("offline-owner").save(state);
  browserClient.mockReturnValue({
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: "offline-owner" } } },
      }),
    },
  } as never);
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  expect(await createWebNotebookStorage().load(n)).toEqual(state);
});
