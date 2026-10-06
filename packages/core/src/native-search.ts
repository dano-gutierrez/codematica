import type { ContentIndex } from "./content/schema";
import { createDiscoveryItems, searchDiscoveryItems, type DiscoveryResult, type DiscoverySearchItem } from "./discovery";
import { createSearchItems, searchContentItems, toSearchResult, type SearchableItem, type SearchFilters, type SearchResult } from "./search";

export const nativeSearchChannel = "codematica-local-search-v1";
export type NativeSearchInput =
  | { kind: "discovery"; items: (DiscoverySearchItem & { sourceIndex: number })[] }
  | { kind: "content"; items: SearchableItem[] };
export type NativeSearchRow = { index: number; score: number; snippet?: string };
export type NativeSearchMessage =
  | { channel: typeof nativeSearchChannel; type: "ready" }
  | { channel: typeof nativeSearchChannel; type: "error"; id: number }
  | { channel: typeof nativeSearchChannel; type: "result"; id: number; rows: NativeSearchRow[] };
export type PreparedNativeSearch<T> = { input: NativeSearchInput; resolve: (rows: NativeSearchRow[]) => T[] };

export function prepareNativeSearch(index: ContentIndex, kind: "discovery"): PreparedNativeSearch<DiscoveryResult>;
export function prepareNativeSearch(index: ContentIndex, kind: "content"): PreparedNativeSearch<SearchResult>;
export function prepareNativeSearch(index: ContentIndex, kind: "discovery" | "content"): PreparedNativeSearch<DiscoveryResult | SearchResult>;
export function prepareNativeSearch(index: ContentIndex, kind: "discovery" | "content"): PreparedNativeSearch<DiscoveryResult | SearchResult> {
  if (kind === "discovery") {
    const source = createDiscoveryItems(index);
    return {
      input: { kind, items: source.map(({ title, tags, eyebrow, summary, searchText }, sourceIndex) => ({ title, tags, eyebrow, summary, searchText, sourceIndex })) },
      resolve: rows => {
        validateRows(rows, source.length);
        return rows.map(row => ({ ...source[row.index]!, score: row.score }));
      },
    };
  }
  const source = createSearchItems(index);
  return {
    // Position IDs cross the bridge; canonical IDs/routes stay with the host.
    input: { kind, items: source.map((item, position) => ({ ...item, id: String(position) })) },
    resolve: rows => {
      validateRows(rows, source.length);
      return rows.map(row => {
        if (typeof row.snippet !== "string") throw new Error("Invalid search snippet");
        return toSearchResult(source[row.index]!, row.snippet, row.score);
      });
    },
  };
}

/** Executed by the bundled local browser engine, using the same core functions. */
export function executeNativeSearch(input: NativeSearchInput, query: string, filters: SearchFilters = {}): NativeSearchRow[] {
  if (input.kind === "discovery") {
    return searchDiscoveryItems(input.items, query).slice(0, 40).map(item => ({ index: item.sourceIndex, score: item.score }));
  }
  return searchContentItems(input.items, query, filters).slice(0, 40).map(item => ({ index: Number(item.id), score: item.score, snippet: item.snippet }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isRow(value: unknown): value is NativeSearchRow {
  return isRecord(value) && Number.isInteger(value.index) && (value.index as number) >= 0
    && typeof value.score === "number" && Number.isFinite(value.score)
    && (value.snippet === undefined || typeof value.snippet === "string");
}
function validateRows(rows: NativeSearchRow[], length: number) {
  const seen = new Set<number>();
  if (rows.length > 40) throw new Error("Too many search results");
  for (const row of rows) {
    if (!isRow(row) || row.index >= length || seen.has(row.index)) throw new Error("Invalid search result");
    seen.add(row.index);
  }
}

export function parseNativeSearchMessage(data: string): NativeSearchMessage | undefined {
  let value: unknown;
  try { value = JSON.parse(data); } catch { return undefined; }
  if (!isRecord(value) || value.channel !== nativeSearchChannel) return undefined;
  if (value.type === "ready") return { channel: nativeSearchChannel, type: "ready" };
  if (!Number.isInteger(value.id) || (value.id as number) < 1) return undefined;
  if (value.type === "error") return { channel: nativeSearchChannel, type: "error", id: value.id as number };
  if (value.type !== "result" || !Array.isArray(value.rows) || value.rows.length > 40 || !value.rows.every(isRow)) return undefined;
  return { channel: nativeSearchChannel, type: "result", id: value.id as number, rows: value.rows };
}
