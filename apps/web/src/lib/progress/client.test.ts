import { afterEach, describe, expect, it, vi } from "vitest";
import { addAnonymousProgressItem, getAnonymousProgressItems } from "./anonymous";
import { appendPathToHref, recordProgress, syncBufferedAnonymousProgress } from "./client";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("anonymous progress sync", () => {
  it("syncs every retained item in bounded batches before clearing the local copy", async () => {
    for (let index = 0; index < 25; index += 1) {
      addAnonymousProgressItem({
        input: {
          surface: "diagram",
          slug: `system-design/cache-aside-${index}`,
          pathSlug: "",
          status: "started",
          position: {},
        },
        display: {
          id: `diagram-${index}`,
          title: `Diagram ${index}`,
          summary: "Diagram summary.",
          href: `/diagrams/system-design/cache-aside-${index}`,
          eyebrow: "Diagram",
          status: "started",
          lastSeenAt: "2026-08-03T12:00:00.000Z",
        },
      });
    }

    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ synced: 20, rejected: 0 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ synced: 5, rejected: 0 }), { status: 200 }));

    expect(await syncBufferedAnonymousProgress()).toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const batchSizes = fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)).items.length);
    expect(batchSizes).toEqual([20, 5]);
    expect(getAnonymousProgressItems()).toEqual([]);
  });

  it("does nothing when no local progress is buffered", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    expect(await syncBufferedAnonymousProgress()).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retains buffered progress when a sync batch fails", async () => {
    addAnonymousProgressItem({
      input: { surface: "document", slug: "system-design/cache-invalidation", pathSlug: "", status: "started", position: {} },
      display: { id: "document-cache", title: "Cache", summary: "Summary", href: "/docs/cache", eyebrow: "Document", status: "started", lastSeenAt: "2026-08-05T00:00:00.000Z" },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 503 }));
    expect(await syncBufferedAnonymousProgress()).toBe(false);
    expect(getAnonymousProgressItems()).toHaveLength(1);
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("offline"));
    expect(await syncBufferedAnonymousProgress()).toBe(false);
    expect(getAnonymousProgressItems()).toHaveLength(1);
  });

  it("records remotely when available and buffers failed or offline requests", async () => {
    const target = { surface: "document" as const, slug: "system-design/cache-invalidation", title: "Cache", summary: "Summary", href: "/docs/cache", eyebrow: "Document" };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 200 }));
    await recordProgress(target, "started");
    expect(getAnonymousProgressItems()).toEqual([]);

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 })).mockRejectedValueOnce(new Error("offline"));
    await recordProgress(target, "started", { scrollRatio: 0.25 });
    await recordProgress({ ...target, slug: "system-design/cache-aside" }, "started");
    expect(getAnonymousProgressItems()).toHaveLength(2);
  });

  it("appends encoded path scope to clean and queried hrefs", () => {
    expect(appendPathToHref("/docs/cache", "")).toBe("/docs/cache");
    expect(appendPathToHref("/docs/cache", "system design")).toBe("/docs/cache?path=system%20design");
    expect(appendPathToHref("/docs/cache?mode=read", "path")).toBe("/docs/cache?mode=read&path=path");
  });
});

it("retains new and updated learning recorded while an older snapshot is syncing", async () => {
  const item = { input: { surface: "document" as const, slug: "system-design/cache-invalidation", pathSlug: "", status: "started" as const, position: {} }, display: { id: "cache", title: "Cache", summary: "Summary", href: "/docs/cache", eyebrow: "Document", status: "started" as const, lastSeenAt: "2026-10-03T00:00:00Z" } };
  addAnonymousProgressItem(item);
  let finish!: (value: Response) => void;
  vi.spyOn(globalThis, "fetch").mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const pending = syncBufferedAnonymousProgress();
  addAnonymousProgressItem({ ...item, input: { ...item.input, status: "completed" } });
  addAnonymousProgressItem({ ...item, input: { ...item.input, slug: "system-design/cache-aside" } });
  finish(new Response('{"synced":1,"rejected":0}', { status: 200 }));
  expect(await pending).toBe(true);
  expect(getAnonymousProgressItems()).toHaveLength(2);
  expect(getAnonymousProgressItems().find(row => row.input.slug === item.input.slug)?.input.status).toBe("completed");
});

it.each([
  { synced: 0, rejected: 1 },
  { synced: 0, rejected: 0 },
  {},
])("keeps the local copy when HTTP success does not acknowledge the whole batch: %j", async body => {
  addAnonymousProgressItem({
    input: { surface: "document", slug: "system-design/cache-invalidation", pathSlug: "", status: "started", position: {} },
    display: { id: "cache", title: "Cache", summary: "Summary", href: "/docs/cache", eyebrow: "Document", status: "started", lastSeenAt: "2026-10-03T00:00:00Z" },
  });
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
  expect(await syncBufferedAnonymousProgress()).toBe(false);
  expect(getAnonymousProgressItems()).toHaveLength(1);
});

it("reports failed sync without sending a request when the local snapshot cannot be read", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => { throw new Error("storage unavailable"); });
  const fetchMock = vi.spyOn(globalThis, "fetch");
  expect(await syncBufferedAnonymousProgress()).toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
});

it("retains the local bytes when storage cannot be read for sync acknowledgment", async () => {
  const key = "codematica:anonymous-progress:v1";
  addAnonymousProgressItem({
    input: { surface: "document", slug: "system-design/cache-invalidation", pathSlug: "", status: "started", position: {} },
    display: { id: "cache", title: "Cache", summary: "Summary", href: "/docs/cache", eyebrow: "Document", status: "started", lastSeenAt: "2026-10-03T00:00:00Z" },
  });
  const original = window.localStorage.getItem(key);
  let finish!: (response: Response) => void;
  vi.spyOn(globalThis, "fetch").mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const pending = syncBufferedAnonymousProgress();
  vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => { throw new Error("storage unavailable"); });
  finish(new Response('{"synced":1,"rejected":0}', { status: 200 }));
  expect(await pending).toBe(false);
  expect(window.localStorage.getItem(key)).toBe(original);
});
