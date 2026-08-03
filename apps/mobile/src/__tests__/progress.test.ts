jest.mock("@react-native-async-storage/async-storage", () => {
  const storage = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => storage.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        storage.delete(key);
      }),
      clear: jest.fn(async () => {
        storage.clear();
      }),
    },
  };
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getContentIndex } from "@codematica/core";
import { getAnonymousProgressItems, recordNativeProgress, syncNativeAnonymousProgress } from "../lib/progress";

describe("native progress retention", () => {
  afterEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("retains and syncs every local item in bounded batches", async () => {
    const documents = getContentIndex().documents.slice(0, 25);
    expect(documents).toHaveLength(25);

    for (const document of documents) {
      await recordNativeProgress(
        undefined,
        {
          surface: "document",
          slug: document.slug,
          title: document.title,
          summary: document.summary,
          href: document.route,
          eyebrow: "Document",
        },
        "started",
      );
    }

    expect(await getAnonymousProgressItems()).toHaveLength(25);

    const batches: unknown[][] = [];
    const client = {
      auth: { getUser: jest.fn(async () => ({ data: { user: { id: "user-1" } }, error: null })) },
      from: jest.fn(() => ({
        select: jest.fn(),
        upsert: jest.fn(async (payload: unknown) => {
          batches.push(payload as unknown[]);
          return { data: null, error: null };
        }),
      })),
    };

    await expect(syncNativeAnonymousProgress(client)).resolves.toEqual({ synced: 25, rejected: 0 });
    expect(batches.map((batch) => batch.length)).toEqual([20, 5]);
    expect(await getAnonymousProgressItems()).toEqual([]);
  });
});
