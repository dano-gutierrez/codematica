import { describe, expect, it } from "vitest";
import { getContentIndex } from "./content";
import { searchDiscovery } from "./discovery";
import { searchContent } from "./search";
import { executeNativeSearch, parseNativeSearchMessage, prepareNativeSearch } from "./native-search";

const index = getContentIndex();

describe("local native search transport", () => {
  it.each([" N ", "Number Of Islands", "water", "qzqznotfound"])("retains full discovery ordering, metadata and destinations: %s", query => {
    const prepared = prepareNativeSearch(index, "discovery");
    expect(prepared.input.items[0]).not.toHaveProperty("route");
    expect(prepared.resolve(executeNativeSearch(prepared.input, query))).toEqual(searchDiscovery(index, query).slice(0, 40));
  });

  it.each([
    ["", {}], ["cache aside", {}], ["Runtime schemas", { track: "Programming", difficulty: "senior" as const }],
    ["sequenceDiagram", { kind: "diagram" as const }], ["qzqznotfound", {}],
  ])("retains library filters, ranking and snippets: %s", (query, filters) => {
    const prepared = prepareNativeSearch(index, "content");
    if (prepared.input.kind !== "content") throw new Error("Expected library input");
    expect(prepared.input.items[0]?.id).toBe("0");
    expect(prepared.resolve(executeNativeSearch(prepared.input, query, filters))).toEqual(searchContent(index, query, filters).slice(0, 40));
  });

  it("rejects duplicate or out-of-range rows instead of inventing a destination", () => {
    const prepared = prepareNativeSearch(index, "discovery");
    expect(() => prepared.resolve([{ index: 0, score: 1 }, { index: 0, score: 2 }])).toThrow();
    expect(() => prepared.resolve([{ index: -1, score: 1 }])).toThrow();
    expect(() => prepared.resolve([{ index: 999999, score: 1 }])).toThrow();
    expect(() => prepared.resolve([{ index: 0.5, score: 1 }])).toThrow();
    expect(() => prepared.resolve(Array.from({ length: 41 }, (_, index) => ({ index, score: 1 })))).toThrow();
    expect(() => prepareNativeSearch(index, "content").resolve([{ index: 0, score: 1 }])).toThrow();
  });

  it("parses only the local protocol with finite request and result identifiers", () => {
    const channel = "codematica-local-search-v1";
    expect(parseNativeSearchMessage(JSON.stringify({ channel, type: "ready" }))).toEqual({ channel, type: "ready" });
    expect(parseNativeSearchMessage(JSON.stringify({ channel, type: "error", id: 2 }))).toEqual({ channel, type: "error", id: 2 });
    const result = { channel, type: "result", id: 1, rows: [{ index: 0, score: 100, snippet: "Public source text" }] };
    expect(parseNativeSearchMessage(JSON.stringify(result))).toEqual(result);
    for (const value of [null, [], {}, { ...result, channel: "other" }, { ...result, type: "other" }, { ...result, id: 0 }, { ...result, id: 1.5 }, { ...result, rows: {} }, { ...result, rows: [null] }, { ...result, rows: [{ index: 0, score: null }] }, { ...result, rows: [{ index: -1, score: 1 }] }, { ...result, rows: [{ index: 0, score: 1, snippet: 4 }] }]) {
      expect(parseNativeSearchMessage(JSON.stringify(value))).toBeUndefined();
    }
    expect(parseNativeSearchMessage("malformed")).toBeUndefined();
  });
});
