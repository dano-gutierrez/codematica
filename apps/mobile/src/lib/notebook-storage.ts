import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createCustomNotebook,
  getContentIndex,
  getNotebookProgress,
  mergeNotebookProgressRows,
  notebookSnapshotSchema,
  readNotebookProgress,
  syncNotebookProgress,
  type NotebookDataClient,
  type NotebookSnapshot,
  type NotebookStorage,
  type WritingNotebook,
} from "@codematica/core";

/** The manifest is committed after immutable cell records, so failed writes retain the last page. */
export function createNativeNotebookStorage(
  client?: NotebookDataClient,
): NotebookStorage {
  let account: ReturnType<typeof readNotebookProgress> | undefined;
  let needsRemote = true;
  function owner(): ReturnType<typeof readNotebookProgress> {
    return (account ??= (async () => {
      if (!client) return { isSignedIn: false, items: [] };
      const user = client.auth.getSession
        ? (await client.auth.getSession()).data.session?.user
        : (await client.auth.getUser()).data.user;
      if (!user) return { isSignedIn: false, items: [] };
      return { isSignedIn: true, userId: user.id, items: [] };
    })());
  }
  async function prefix() {
    const user = await owner();
    return `writing-notebooks:${user.userId ?? "guest"}:`;
  }
  return {
    async loadRomajiPreference() {
      return await AsyncStorage.getItem("codematica:notebook-romaji:v1") !== "false";
    },
    async saveRomajiPreference(show) {
      await AsyncStorage.setItem("codematica:notebook-romaji:v1", String(show));
    },
    async load(notebook) {
      const base = await prefix(),
        raw = await AsyncStorage.getItem(base + "sheet:" + notebook.id);
      if (!raw) return undefined;
      const manifest = JSON.parse(raw) as NotebookSnapshot;
      const keys = Object.values(manifest.pages).flatMap((page) =>
        page.cells.map(
          (cell) => base + "cell:" + notebook.id + ":" + cell.token,
        ),
      );
      const records = new Map(await AsyncStorage.multiGet(keys));
      for (const page of Object.values(manifest.pages))
        page.cells = page.cells.map((cell) => {
          const ink = records.get(
            base + "cell:" + notebook.id + ":" + cell.token,
          );
          if (!ink) throw new Error("Saved ink is unavailable.");
          return JSON.parse(ink);
        });
      return notebookSnapshotSchema.parse(manifest);
    },
    async save(snapshot) {
      const base = await prefix(),
        cellPrefix = base + "cell:" + snapshot.notebookId + ":";
      const entries = Object.values(snapshot.pages).flatMap((page) =>
        page.cells.map(
          (cell) =>
            [cellPrefix + cell.token, JSON.stringify(cell)] as [string, string],
        ),
      );
      if (entries.length) await AsyncStorage.multiSet(entries);
      const manifest = {
        ...snapshot,
        pages: Object.fromEntries(
          Object.entries(snapshot.pages).map(([id, page]) => [
            id,
            {
              ...page,
              cells: page.cells.map((cell) => ({ token: cell.token })),
            },
          ]),
        ),
      };
      await AsyncStorage.setItem(
        base + "sheet:" + snapshot.notebookId,
        JSON.stringify(manifest),
      );
      const retained = new Set(entries.map(([key]) => key));
      const obsolete = (await AsyncStorage.getAllKeys()).filter(
        (key) => key.startsWith(cellPrefix) && !retained.has(key),
      );
      if (obsolete.length) await AsyncStorage.multiRemove(obsolete);
    },
    async saveDefinition(notebook) {
      await AsyncStorage.setItem(
        (await prefix()) + "definition:" + notebook.id,
        JSON.stringify(notebook),
      );
    },
    async list() {
      const base = (await prefix()) + "definition:",
        keys = (await AsyncStorage.getAllKeys()).filter((key) =>
          key.startsWith(base),
        );
      const local = (await AsyncStorage.multiGet(keys)).flatMap(([, raw]) =>
        raw ? [JSON.parse(raw) as WritingNotebook] : [],
      );
      let summary = await owner();
      if (client && summary.isSignedIn && needsRemote) {
        try {
          summary = await withSyncTimeout(readNotebookProgress(client));
          account = Promise.resolve(summary);
          needsRemote = false;
        } catch {
          /* Saved device pages stay available offline. */
        }
      }
      const discovered = summary.items.flatMap((row) => {
        if (!row.notebookId.startsWith("custom-")) return [];
        try {
          const n = createCustomNotebook(row.prompt, getContentIndex());
          return n.id === row.notebookId ? [n] : [];
        } catch {
          return [];
        }
      });
      return [
        ...new Map([...discovered, ...local].map((n) => [n.id, n])).values(),
      ];
    },
    async sync(notebook, snapshot) {
      let user = await owner();
      if (!client || !user.isSignedIn) return [];
      if (needsRemote) {
        user = await withSyncTimeout(readNotebookProgress(client));
        account = Promise.resolve(user);
        needsRemote = false;
      }
      const merged = mergeNotebookProgressRows(
        getNotebookProgress(notebook, snapshot),
        user.items,
      );
      for (let i = 0; i < merged.length; i += 20) {
        const result = await withSyncTimeout(
          syncNotebookProgress(
            client,
            merged.slice(i, i + 20),
            getContentIndex(),
          ),
        );
        if (result.status !== 200) throw new Error("Notebook sync failed.");
      }
      const remote = user.items;
      account = Promise.resolve({ ...user, items: merged });
      return remote;
    },
  };
}

function withSyncTimeout<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error("Notebook sync timed out.")),
      3000,
    );
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}
