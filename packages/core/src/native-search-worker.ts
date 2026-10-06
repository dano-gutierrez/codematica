import { executeNativeSearch, nativeSearchChannel, type NativeSearchInput } from "./native-search";
import type { SearchFilters } from "./search";

export type NativeSearchWorkerTarget = { __codematicaSearch?: (request: unknown) => void };

/** Opt-in startup: the module itself does not initialize a runtime or perform I/O. */
export function installNativeSearchWorker(target: NativeSearchWorkerTarget, postMessage: (data: string) => void) {
  target.__codematicaSearch = request => {
    if (typeof request !== "object" || request === null) return;
    const value = request as Record<string, unknown>;
    if (!Number.isSafeInteger(value.id) || (value.id as number) < 1) return;
    const id = value.id as number;
    try {
      const input = value.input as NativeSearchInput | undefined;
      if (!input || !["discovery", "content"].includes(input.kind) || typeof value.query !== "string") throw new Error("Invalid search request");
      const rows = executeNativeSearch(input, value.query, value.filters as SearchFilters | undefined);
      postMessage(JSON.stringify({ channel: nativeSearchChannel, type: "result", id, rows }));
    } catch {
      postMessage(JSON.stringify({ channel: nativeSearchChannel, type: "error", id }));
    }
  };
  postMessage(JSON.stringify({ channel: nativeSearchChannel, type: "ready" }));
}
