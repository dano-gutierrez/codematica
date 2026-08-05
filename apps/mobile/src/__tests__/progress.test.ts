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
import { clearAnonymousProgressItems, getAnonymousProgressItems, getNativeProgressSummary, recordNativeProgress, syncNativeAnonymousProgress } from "../lib/progress";

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

  it("deduplicates local progress and falls back when remote writes fail", async () => {
    const target = {
      surface: "document" as const,
      slug: "system-design/cache-invalidation",
      title: "Cache Invalidation",
      summary: "Summary",
      href: "/docs/system-design/cache-invalidation",
      eyebrow: "Document",
    };
    const client = {
      auth: { getUser: jest.fn(async () => ({ data: { user: { id: "user-1" } }, error: null })) },
      from: jest.fn(() => ({ upsert: jest.fn(async () => ({ data: null, error: { message: "offline" } })) })),
    };
    await recordNativeProgress(client, target, "started");
    await recordNativeProgress(undefined, target, "completed");
    const items = await getAnonymousProgressItems();
    expect(items).toHaveLength(1);
    expect(items[0].input.status).toBe("completed");
  });

  it("prefers authenticated summaries and otherwise maps local progress", async () => {
    const rows = [{
      surface: "document", slug: "system-design/cache-invalidation", path_slug: "", status: "started",
      position: {}, last_seen_at: "2026-08-05T00:00:00.000Z", completed_at: null,
    }];
    const client = {
      auth: { getUser: jest.fn(async () => ({ data: { user: { id: "user-1" } }, error: null })) },
      from: jest.fn(() => ({ select: jest.fn(() => ({ order: jest.fn(() => ({ limit: jest.fn(async () => ({ data: rows, error: null })) })) })) })),
    };
    await expect(getNativeProgressSummary(client)).resolves.toMatchObject({ isSignedIn: true, items: [expect.objectContaining({ title: expect.stringMatching(/Cache Invalidation/) })] });

    await recordNativeProgress(undefined, {
      surface: "diagram", slug: "system-design/cache-aside", title: "Cache Aside", summary: "Summary",
      href: "/diagrams/system-design/cache-aside", eyebrow: "Diagram",
    }, "started");
    await expect(getNativeProgressSummary()).resolves.toMatchObject({ isSignedIn: false, items: [expect.objectContaining({ title: "Cache Aside" })] });
  });

  it("keeps unsynced items after a partial batch failure", async () => {
    const documents = getContentIndex().documents.slice(0, 21);
    for (const document of documents) {
      await recordNativeProgress(undefined, {
        surface: "document", slug: document.slug, title: document.title, summary: document.summary,
        href: document.route, eyebrow: "Document",
      }, "started");
    }
    let call = 0;
    const client = {
      auth: { getUser: jest.fn(async () => ({ data: { user: { id: "user-1" } }, error: null })) },
      from: jest.fn(() => ({
        upsert: jest.fn(async () => ({ data: null, error: call++ === 0 ? null : { message: "offline" } })),
      })),
    };
    await expect(syncNativeAnonymousProgress(client)).resolves.toEqual({ synced: 20, rejected: 1 });
    expect(await getAnonymousProgressItems()).toHaveLength(21);
  });

  it("handles absent clients, empty buffers, corrupt storage, and explicit clearing", async () => {
    await expect(syncNativeAnonymousProgress()).resolves.toEqual({ synced: 0, rejected: 0 });
    await expect(syncNativeAnonymousProgress({})).resolves.toEqual({ synced: 0, rejected: 0 });
    jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce("not-json");
    await expect(getAnonymousProgressItems()).resolves.toEqual([]);
    await clearAnonymousProgressItems();
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });
});
