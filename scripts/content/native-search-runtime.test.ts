import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it } from "vitest";
import { getContentIndex } from "../../packages/core/src/content";
import { prepareNativeSearch, parseNativeSearchMessage } from "../../packages/core/src/native-search";
import { searchDiscovery } from "../../packages/core/src/discovery";
import { searchContent } from "../../packages/core/src/search";

const moduleText = readFileSync("apps/mobile/src/generated/search-worker.ts", "utf8");
const source = JSON.parse(moduleText.match(/export const nativeSearchWorkerSource = (.*);\s*$/s)![1]!) as string;

it.each(["discovery", "content"] as const)("starts the bundled %s runtime without a host SDK and returns canonical results", kind => {
  const sent: string[] = [];
  const target = { ReactNativeWebView: { postMessage: (data: string) => sent.push(data) } } as {
    ReactNativeWebView: { postMessage: (data: string) => void };
    __codematicaSearch: (request: unknown) => void;
  };
  runInNewContext(source, target, { timeout: 5000 });
  expect(parseNativeSearchMessage(sent.shift()!)).toMatchObject({ type: "ready" });
  const index = getContentIndex(); const prepared = prepareNativeSearch(index, kind);
  const query = kind === "discovery" ? "Number Of Islands" : "cache aside";
  const filters = kind === "content" ? { kind: "diagram" as const } : {};
  target.__codematicaSearch({ id: 3, input: prepared.input, query, filters });
  const reply = parseNativeSearchMessage(sent.shift()!);
  expect(reply).toMatchObject({ type: "result", id: 3 });
  if (reply?.type !== "result") throw new Error("No result from packaged search");
  const expected = kind === "discovery" ? searchDiscovery(index, query).slice(0, 40) : searchContent(index, query, filters).slice(0, 40);
  expect(prepared.resolve(reply.rows)).toEqual(expected);
  expect(source).toContain("Fuse.js");
  const require = createRequire(import.meta.url);
  const license = readFileSync(resolve(dirname(dirname(require.resolve("fuse.js"))), "LICENSE"), "utf8");
  expect(source).toContain(license.replaceAll("*/", "* /"));
});
