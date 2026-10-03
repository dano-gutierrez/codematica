"use client";
import {
  createCustomNotebook,
  getContentIndex,
  getNotebookProgress,
  mergeNotebookProgressRows,
  notebookProgressSchema,
  notebookSnapshotSchema,
  type NotebookProgress,
  type NotebookSnapshot,
  type NotebookStorage,
  type WritingNotebook,
} from "@codematica/core";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type StoredRecord =
  | { kind: "definition"; scope: string; notebook: WritingNotebook }
  | { kind: "snapshot"; scope: string; snapshot: NotebookSnapshot };
type Account = {
  isSignedIn: boolean;
  userId?: string;
  items: NotebookProgress[];
};

export function createWebNotebookStorage(
  explicitScope?: string,
): NotebookStorage {
  let database: Promise<IDBDatabase> | undefined,
    identity: Promise<Account> | undefined;
  function open() {
    if (!database)
      database = new Promise<IDBDatabase>((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
          reject(new Error("Notebook storage is unavailable."));
          return;
        }
        const request = indexedDB.open("codematica-writing-notebooks", 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore("records");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(new Error("Unable to open notebook storage."));
        request.onblocked = () =>
          reject(
            new Error(
              "Notebook storage is busy. Close other notebook tabs and retry.",
            ),
          );
      }).catch((error) => {
        database = undefined;
        throw error;
      });
    return database;
  }
  async function account() {
    identity ??= fetch("/api/progress/writing-notebooks", {
      signal: AbortSignal.timeout(3000),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load notebook sync.");
        const body = await response.json();
        return {
          isSignedIn: body.isSignedIn === true,
          userId: body.userId,
          items: (body.items ?? []).flatMap((item: unknown) => {
            const parsed = notebookProgressSchema.safeParse(item);
            return parsed.success ? [parsed.data] : [];
          }),
        } as Account;
      })
      .catch(async () => {
        const user = (
          await createBrowserSupabaseClient()
            ?.auth.getSession()
            .catch(() => undefined)
        )?.data.session?.user;
        return { isSignedIn: Boolean(user), userId: user?.id, items: [] };
      });
    return identity;
  }
  const scope = async () =>
    explicitScope ?? (await account()).userId ?? "guest";
  async function request<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest,
  ): Promise<T> {
    const db = await open();
    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction("records", mode),
        result = operation(transaction.objectStore("records"));
      let value: T;
      result.onsuccess = () => {
        value = result.result as T;
      };
      transaction.oncomplete = () => resolve(value);
      transaction.onabort = transaction.onerror = () =>
        reject(new Error("Unable to save or read notebook storage."));
    });
  }
  return {
    async load(notebook) {
      const owner = await scope();
      const record = await request<StoredRecord | undefined>(
        "readonly",
        (store) => store.get(awaitedKey("state", notebook.id, owner)),
      );
      return record?.kind === "snapshot"
        ? notebookSnapshotSchema.parse(record.snapshot)
        : undefined;
    },
    async save(snapshot) {
      const owner = await scope();
      await request("readwrite", (store) =>
        store.put(
          { kind: "snapshot", scope: owner, snapshot },
          awaitedKey("state", snapshot.notebookId, owner),
        ),
      );
    },
    async saveDefinition(notebook) {
      const owner = await scope();
      await request("readwrite", (store) =>
        store.put(
          { kind: "definition", scope: owner, notebook },
          awaitedKey("definition", notebook.id, owner),
        ),
      );
    },
    async list() {
      const owner = await scope(),
        records = await request<StoredRecord[]>("readonly", (store) =>
          store.getAll(),
        );
      const local = records
        .filter(
          (r): r is Extract<StoredRecord, { kind: "definition" }> =>
            r.kind === "definition" && r.scope === owner,
        )
        .map((r) => r.notebook);
      const remote = (explicitScope ? [] : (await account()).items).flatMap(
        (row) => {
          if (!row.notebookId.startsWith("custom-")) return [];
          try {
            const n = createCustomNotebook(row.prompt, getContentIndex());
            return n.id === row.notebookId ? [n] : [];
          } catch {
            return [];
          }
        },
      );
      return [...new Map([...remote, ...local].map((n) => [n.id, n])).values()];
    },
    async sync(notebook, snapshot) {
      const summary = await account();
      if (!summary.isSignedIn) return [];
      const remote = summary.items.filter(
        (row) => row.notebookId === notebook.id,
      );
      const merged = mergeNotebookProgressRows(
        getNotebookProgress(notebook, snapshot),
        remote,
      );
      for (let offset = 0; offset < merged.length; offset += 20) {
        const response = await fetch("/api/progress/writing-notebooks", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ items: merged.slice(offset, offset + 20) }),
          signal: AbortSignal.timeout(3000),
        });
        if (!response.ok) throw new Error("Unable to sync notebook progress.");
      }
      summary.items = mergeNotebookProgressRows(summary.items, merged);
      return remote;
    },
  };
}
function awaitedKey(kind: string, id: string, scope: string) {
  return `${scope}:${kind}:${id}`;
}
