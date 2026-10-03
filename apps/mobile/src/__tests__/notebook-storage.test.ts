jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  default: require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
}));
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  acceptNotebookCharacter,
  createCustomNotebook,
  createNotebookSnapshot,
  getContentIndex,
  restartNotebookSheet,
} from "@codematica/core";
import { createNativeNotebookStorage } from "../lib/notebook-storage";

afterEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
it("keeps ink in separate cell records and restores every page, pressure, difficulty and progress", async () => {
  const notebook = createCustomNotebook("あ", getContentIndex()),
    storage = createNativeNotebookStorage();
  let state = createNotebookSnapshot(notebook);
  state.difficulty = "precise";
  for (let i = 0; i < 24; i++)
    state = acceptNotebookCharacter(notebook, state, notebook.sheets[0]!.id, {
      token: "cell-" + i,
      strokes: [
        {
          points: [
            [10, 10],
            [80, 70],
          ],
          pressures: [0.2, 0.9],
        },
      ],
    });
  await storage.saveDefinition(notebook);
  await storage.save(state);
  expect(await storage.load(notebook)).toEqual(state);
  expect(await storage.list()).toEqual([notebook]);
  expect(
    (await AsyncStorage.getAllKeys()).filter((key) => key.includes(":cell:"))
      .length,
  ).toBe(24);
  await storage.save(
    restartNotebookSheet(notebook, state, notebook.sheets[0]!.id),
  );
  expect(
    (await storage.load(notebook))!.pages[notebook.sheets[0]!.id],
  ).toMatchObject({ cells: [], bestCount: 24 });
  expect(
    (await AsyncStorage.getAllKeys()).filter((key) => key.includes(":cell:"))
      .length,
  ).toBe(0);
  expect(await storage.sync!(notebook, state)).toEqual([]);
});
it("keeps the committed manifest when a save fails and detects missing ink", async () => {
  const notebook = createCustomNotebook("あ", getContentIndex()),
    storage = createNativeNotebookStorage();
  const state = createNotebookSnapshot(notebook);
  await storage.save(state);
  jest.spyOn(AsyncStorage, "multiSet").mockRejectedValueOnce(new Error("full"));
  const next = acceptNotebookCharacter(
    notebook,
    state,
    notebook.sheets[0]!.id,
    {
      token: "new",
      strokes: [
        {
          points: [
            [1, 1],
            [50, 50],
          ],
        },
      ],
    },
  );
  await expect(storage.save(next)).rejects.toThrow("full");
  expect(await storage.load(notebook)).toEqual(state);
  await storage.save(next);
  const cell = (await AsyncStorage.getAllKeys()).find((key) =>
    key.includes(":cell:"),
  )!;
  await AsyncStorage.removeItem(cell);
  await expect(storage.load(notebook)).rejects.toThrow(/ink/);
});
it("discovers remote custom notebooks, syncs bounded milestones without ink and surfaces remote failures", async () => {
  const notebook = createCustomNotebook("あ", getContentIndex()),
    upsert = jest.fn(async () => ({ error: null }));
  const client = {
    auth: {
      getUser: jest.fn(async () => ({ data: { user: { id: "learner" } } })),
    },
    from: jest.fn(() => ({
      select: () => ({
        eq: async () => ({
          data: [
            {
              notebook_id: notebook.id,
              sheet_id: notebook.sheets[0]!.id,
              prompt: "あ",
              best_count: 24,
            },
          ],
          error: null,
        }),
      }),
      upsert,
    })),
  };
  const storage = createNativeNotebookStorage(client);
  expect(await storage.list()).toEqual([notebook]);
  const state = createNotebookSnapshot(notebook);
  const remote = await storage.sync!(notebook, state);
  expect(remote[0]!.bestCount).toBe(24);
  expect(upsert).toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({ best_count: 24, user_id: "learner" }),
    ]),
    expect.anything(),
  );
  expect(JSON.stringify(upsert.mock.calls)).not.toContain("strokes");
  upsert.mockResolvedValueOnce({ error: "offline" } as never);
  await expect(storage.sync!(notebook, state)).rejects.toThrow("sync");
});
it("restores signed-in local ink even when remote progress is unavailable", async () => {
  let unavailable = false;
  const n = createCustomNotebook("あ", getContentIndex()),
    state = createNotebookSnapshot(n);
  const client = {
    auth: {
      getUser: async () => ({ data: { user: { id: "offline-learner" } } }),
    },
    from: () => ({
      select: () => ({
        eq: async () => ({ data: [], error: unavailable ? "offline" : null }),
      }),
      upsert: async () => ({ error: null }),
    }),
  };
  await createNativeNotebookStorage(client).save(state);
  unavailable = true;
  await expect(createNativeNotebookStorage(client).load(n)).resolves.toEqual(
    state,
  );
});
