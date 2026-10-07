import { describe, expect, it, vi } from "vitest";
import { getContentIndex } from "./content";
import { executeNativeSearch, nativeSearchChannel, prepareNativeSearch } from "./native-search";
import { installNativeSearchWorker } from "./native-search-worker";

describe("local search worker", () => {
  it("announces readiness and acknowledges the exact request with core results", () => {
    const target = {} as Parameters<typeof installNativeSearchWorker>[0];
    const post = vi.fn();
    installNativeSearchWorker(target, post);
    expect(JSON.parse(post.mock.calls[0]![0])).toEqual({ channel: nativeSearchChannel, type: "ready" });
    const input = prepareNativeSearch(getContentIndex(), "discovery").input;
    target.__codematicaSearch!({ id: 7, input, query: "Number Of Islands" });
    expect(JSON.parse(post.mock.calls[1]![0])).toEqual({ channel: nativeSearchChannel, type: "result", id: 7, rows: executeNativeSearch(input, "Number Of Islands") });
  });
  it("preserves library filter payloads and reports failures without leaking input", () => {
    const target = {} as Parameters<typeof installNativeSearchWorker>[0];
    const post = vi.fn(); installNativeSearchWorker(target, post); post.mockClear();
    const input = prepareNativeSearch(getContentIndex(), "content").input;
    const filters = { kind: "diagram" as const };
    target.__codematicaSearch!({ id: 8, input, query: "cache", filters });
    expect(JSON.parse(post.mock.calls[0]![0]).rows).toEqual(executeNativeSearch(input, "cache", filters));
    target.__codematicaSearch!({ id: 9, input: { kind: "discovery", items: null }, query: "private query" });
    expect(JSON.parse(post.mock.calls[1]![0])).toEqual({ channel: nativeSearchChannel, type: "error", id: 9 });
    expect(post.mock.calls[1]![0]).not.toContain("private query");
  });
  it("ignores malformed request identities and reports a known malformed request", () => {
    const target = {} as Parameters<typeof installNativeSearchWorker>[0];
    const post = vi.fn(); installNativeSearchWorker(target, post); post.mockClear();
    for (const request of [null, {}, { id: 0 }, { id: 1.5 }]) target.__codematicaSearch!(request);
    expect(post).not.toHaveBeenCalled();
    for (const request of [{ id: 1 }, { id: 2, query: 5, input: {} }, { id: 3, query: "", input: { kind: "other", items: [] } }]) target.__codematicaSearch!(request);
    expect(post.mock.calls.map(([data]) => JSON.parse(data))).toEqual([1, 2, 3].map(id => ({ channel: nativeSearchChannel, type: "error", id })));
  });
});
