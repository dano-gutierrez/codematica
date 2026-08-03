import { afterEach, describe, expect, it, vi } from "vitest";
import { addAnonymousProgressItem, getAnonymousProgressItems } from "./anonymous";
import { syncBufferedAnonymousProgress } from "./client";

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

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ synced: 20, rejected: 0 }), { status: 200 }));

    await syncBufferedAnonymousProgress();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const batchSizes = fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)).items.length);
    expect(batchSizes).toEqual([20, 5]);
    expect(getAnonymousProgressItems()).toEqual([]);
  });
});
