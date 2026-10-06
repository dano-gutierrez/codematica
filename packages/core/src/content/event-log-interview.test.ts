import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { getDocumentBySlug, getExerciseBySlug, getInterviewQuestionBySlug, getNextPathNodeRoute, getPassiveFlashcardFeedByPathSlug } from ".";
import { interviewCollectionFileSchema } from "./schema";
import { checkQuestionAnswer } from "../practice/questionnaire";

const raw = interviewCollectionFileSchema.parse(JSON.parse(readFileSync("content/interviews/real-world.json", "utf8")));
const question = raw.questions.find((item) => item.slug === "partitioned-event-log");
type Entry = { id: bigint; key: string; value: unknown };
type Cursor = { next: (limit?: number) => Entry[]; readonly nextOffset: bigint };
type Log = {
  append: (key: string, value: unknown) => bigint;
  read: (offset?: bigint, limit?: number) => Entry[];
  readKey: (key: string, offset?: bigint, limit?: number) => Entry[];
  cursor: (key: string, offset?: bigint) => Cursor;
  addNode: () => number;
  stats: () => { id: number; eventCount: number; keys: string[] }[];
};
type Store = { append: (event: Entry) => void; reader: (offset: bigint) => () => Entry | undefined };
type Module = { EventLog: new (options?: { blockSize?: number; autoThreshold?: number; cooldown?: number; maxNodes?: number }) => Log; KeyStore: new (blockSize: number) => Store };
function tracks() {
  if (question?.kind !== "web") throw new Error("Missing partitioned-event-log exercise");
  return question.solutionTracks;
}
function load(code: string): Module {
  const exports = {};
  const compiled = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } });
  // Expose the authored internal store for probe-only complexity tests.
  runInNewContext(compiled.outputText + "\nexports.KeyStore = KeyStore;", { exports }, { timeout: 2000 });
  return exports as Module;
}
const ids = (events: Entry[]) => Array.from(events, (event) => Number(event.id));

describe("partitioned event log interview", () => {
  it("publishes three complete TS/Python pairs and connects the study path", () => {
    expect(tracks()).toHaveLength(3);
    const slug = "partitioned-event-log";
    expect(getDocumentBySlug(`system-design/${slug}`)?.status).toBe("published");
    expect(getInterviewQuestionBySlug("real-world", slug)?.solutionTracks).toHaveLength(3);
    expect(getNextPathNodeRoute(slug, { kind: "document", slug: `system-design/${slug}` })).toBe(`/interviews/real-world/${slug}?path=${slug}`);
    expect(getNextPathNodeRoute(slug, { kind: "interview", slug: `real-world/${slug}` })).toBe(`/practice/system-design/${slug}-questionnaire?path=${slug}`);
    expect(getNextPathNodeRoute(slug, { kind: "exercise", slug: `system-design/${slug}-questionnaire` })).toBe(`/paths/${slug}/flashcards`);
    const quiz = getExerciseBySlug(`system-design/${slug}-questionnaire`);
    expect(quiz?.type).toBe("questionnaire");
    if (quiz?.type !== "questionnaire") throw new Error("Missing quiz");
    expect(quiz.questions).toHaveLength(8);
    const correctLabels = [
      "[2, 9]",
      "Lower-bound by global ID, then advance at most r positions.",
      "In separate cursor objects or records keyed by consumer identity and key.",
      "Linear traversal after seeking; arbitrary offsets still need a scan or an index.",
      "ID allocation, event publication and index updates must be coordinated together.",
      "Move the whole key or place other keys elsewhere; it cannot split that user across nodes.",
      "Commit nextOffset=10 only after successful processing; distinguish fetched from acknowledged progress.",
      "The last block and end slot, plus the requested global lower bound.",
    ];
    for (const item of quiz.questions) {
      if (item.kind !== "choice") throw new Error("Expected trace/contract choices");
      expect(item.options.filter((option) => option.isCorrect)).toHaveLength(1);
      const expected = correctLabels[Number(item.id.split("-").at(-1)) - 1];
      expect(item.options.find((option) => option.isCorrect)?.label).toBe(expected);
      for (const option of item.options) expect(checkQuestionAnswer(item, { kind: "choice", selectedOptionId: option.id }).isCorrect).toBe(option.label === expected);
    }
    const feed = getPassiveFlashcardFeedByPathSlug(slug);
    expect(feed?.cards).toHaveLength(14);
    for (const card of feed!.cards) expect(getDocumentBySlug(card.sourceDocSlug!)?.status).toBe("published");
  });

  it("strictly typechecks every authored TypeScript file", { timeout: 30_000 }, () => {
    const files = new Map<string, string>();
    for (const track of tracks()) for (const [path, file] of Object.entries(track.project.files)) if (path.endsWith(".ts")) files.set(`${process.cwd()}/__event_log__/${track.id}${path}`, file.code);
    const options: ts.CompilerOptions = { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, lib: ["lib.es2022.d.ts", "lib.dom.d.ts"], types: [] };
    const host = ts.createCompilerHost(options), read = host.readFile, exists = host.fileExists, dir = host.directoryExists!, source = host.getSourceFile;
    host.fileExists = (path) => files.has(path) || exists(path);
    host.readFile = (path) => files.get(path) ?? read(path);
    host.directoryExists = (path) => [...files.keys()].some((file) => file.startsWith(`${path}/`)) || dir(path);
    host.getSourceFile = (file, version, onError, fresh) => files.has(file) ? ts.createSourceFile(file, files.get(file)!, version, true) : source(file, version, onError, fresh);
    expect(ts.getPreEmitDiagnostics(ts.createProgram([...files.keys()], options, host)).map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"))).toEqual([]);
  });

  it("executes exact solutions against an independent interleaved-log oracle", () => {
    for (const track of tracks()) {
      const { EventLog } = load(track.project.files["/log.ts"].code);
      const log = new EventLog({ blockSize: 4 });
      const oracle: Entry[] = [];
      for (let i = 0; i < 127; i++) {
        const key = `user-${(i * 17) % 7}`;
        expect(log.append(key, { i })).toBe(BigInt(i));
        oracle.push({ id: BigInt(i), key, value: { i } });
        if (i % 19 === 0) log.addNode();
      }
      for (let offset = 0; offset <= 130; offset++) for (const limit of [0, 1, 3, 100]) {
        expect(log.read(BigInt(offset), limit)).toEqual(oracle.filter((event) => event.id >= BigInt(offset)).slice(0, limit));
        for (const key of ["user-0", "user-6", "missing"]) expect(log.readKey(key, BigInt(offset), limit)).toEqual(oracle.filter((event) => event.key === key && event.id >= BigInt(offset)).slice(0, limit));
      }
      const stats = log.stats();
      expect(stats.reduce((sum, node) => sum + node.eventCount, 0)).toBe(127);
      const keys = stats.flatMap((node) => node.keys);
      expect(keys).toHaveLength(7);
      expect(new Set(keys).size).toBe(7);
      expect(log.read(2n ** 70n)).toEqual([]);
      expect(log.readKey("user-0", 2n ** 70n)).toEqual([]);
      expect(track.project.files["/log.ts"].code).not.toMatch(/\.(?:filter|slice)\(/);
    }
  });

  it("keeps consumer positions independent through empty reads, appends and migration", () => {
    for (const track of tracks()) {
      const { EventLog } = load(track.project.files["/log.ts"].code);
      const log = new EventLog({ blockSize: 2 });
      const early = log.cursor("a"), future = log.cursor("a", 8n);
      expect(early.next()).toEqual([]);
      expect(early.nextOffset).toBe(0n);
      for (let i = 0; i < 8; i++) log.append(i % 2 ? "b" : "a", i);
      const second = log.cursor("a", 1n);
      expect(ids(early.next(2))).toEqual([0, 2]);
      expect(early.nextOffset).toBe(3n);
      expect(ids(second.next(1))).toEqual([2]);
      expect(future.next()).toEqual([]);
      expect(future.nextOffset).toBe(8n);
      log.addNode();
      expect(log.stats()[1].keys).toHaveLength(1);
      expect(ids(early.next())).toEqual([4, 6]);
      expect(ids(second.next())).toEqual([4, 6]);
      expect(early.next()).toEqual([]);
      log.append("a", 8);
      expect(ids(early.next())).toEqual([8]);
      expect(ids(future.next())).toEqual([8]);
      expect(future.nextOffset).toBe(9n);
      const partial = new EventLog({ blockSize: 4 });
      partial.append("a", 0);
      const pending = partial.cursor("a", 3n);
      expect(pending.next()).toEqual([]);
      for (let i = 1; i < 5; i++) partial.append("a", i);
      expect(ids(pending.next())).toEqual([3, 4]);
    }
  });

  it("seeks near a large tail without reading the whole prefix", () => {
    for (const track of tracks()) {
      const { KeyStore } = load(track.project.files["/log.ts"].code);
      const store = new KeyStore(32);
      let inspected = 0;
      for (let i = 0; i < 10_000; i++) store.append({ get id() { inspected++; return BigInt(i * 3); }, key: "a", value: i });
      inspected = 0;
      const next = store.reader(29990n);
      expect([next()!.id, next()!.id, next()!.id]).toEqual([29991n, 29994n, 29997n]);
      expect(next()).toBeUndefined();
      expect(inspected).toBeLessThan(100);
    }
  });

  it("rejects invalid requests without consuming IDs and bounds automatic growth", async () => {
    for (const track of tracks()) {
      const { EventLog } = load(track.project.files["/log.ts"].code);
      expect(() => new EventLog({ blockSize: 0 })).toThrow();
      const log = new EventLog({ blockSize: 3, autoThreshold: 4, cooldown: 2, maxNodes: 3 });
      expect(() => log.append("", null)).toThrow();
      expect(() => log.read(-1n)).toThrow();
      expect(() => log.read(0n, -1)).toThrow();
      expect(() => log.read(0n, 10_001)).toThrow();
      expect(() => log.read(0n, 1.5)).toThrow();
      expect(() => log.readKey("", 0n)).toThrow();
      const results = await Promise.all(Array.from({ length: 60 }, (_, i) => Promise.resolve().then(() => log.append(`u${i % 6}`, i))));
      expect(new Set(results).size).toBe(60);
      expect(ids(log.read())).toEqual(Array.from({ length: 60 }, (_, i) => i));
      expect(log.stats().length).toBeGreaterThan(1);
      expect(log.stats().length).toBeLessThanOrEqual(3);
      const hot = new EventLog({ autoThreshold: 2, cooldown: 1 });
      for (let i = 0; i < 20; i++) hot.append("hot", i);
      expect(hot.stats()).toHaveLength(1);
      expect(new EventLog().append("x", null)).toBe(0n);
    }
  });

  it("runs Python threads and matches the shared scenario in both languages", { timeout: 30_000 }, () => {
    const python = JSON.parse(execFileSync(process.env.CODEMATICA_PYTHON ?? "python3", ["scripts/content/verify-event-log.py", "--json"], { encoding: "utf8" }));
    for (const track of tracks()) {
      const { EventLog } = load(track.project.files["/log.ts"].code), log = new EventLog({ blockSize: 2 });
      log.append("user-1", "click"); log.append("user-2", "view"); log.append("user-1", "purchase");
      const reader = log.cursor("user-1", 1n);
      const first = ids(reader.next(1));
      log.addNode(); log.append("user-1", "refund");
      expect(python[track.id]).toEqual({ global: ids(log.read()), key: ids(log.readKey("user-1", 1n)), first, later: ids(reader.next()), nextOffset: "4" });
    }
  });

  it("enforces the growth threshold, cooldown, cap and exact whole-key transfer", () => {
    for (const track of tracks()) {
      const { EventLog } = load(track.project.files["/log.ts"].code);
      const automatic = new EventLog({ autoThreshold: 4, cooldown: 10, maxNodes: 3 });
      for (let i = 0; i < 4; i++) automatic.append(`u${i}`, i);
      expect(automatic.stats()).toHaveLength(1); // Exactly at the threshold.
      automatic.append("u0", 4);
      expect(automatic.stats()).toHaveLength(2); // First check: nextId 5.
      for (let i = 5; i < 14; i++) automatic.append(`u${i % 4}`, i);
      expect(automatic.stats()).toHaveLength(2); // One append before cooldown ends.
      automatic.append("u2", 14);
      expect(automatic.stats()).toHaveLength(3); // nextId 15: eligible again.
      for (let i = 15; i < 50; i++) automatic.append(`u${i % 4}`, i);
      expect(automatic.stats()).toHaveLength(3);
      expect(automatic.addNode()).toBe(3); // The cap applies only to automatic growth.

      const manual = new EventLog({ blockSize: 2 });
      for (const [key, count] of [["a", 6], ["b", 3], ["c", 1]] as const) {
        for (let i = 0; i < count; i++) manual.append(key, i);
      }
      const reader = manual.cursor("b");
      expect(ids(reader.next(1))).toEqual([6]);
      expect(manual.addNode()).toBe(1);
      expect(manual.stats()).toEqual([
        { id: 0, eventCount: 7, keys: ["a", "c"] },
        { id: 1, eventCount: 3, keys: ["b"] },
      ]);
      expect(manual.append("b", "after movement")).toBe(10n);
      expect(ids(reader.next())).toEqual([7, 8, 10]);
      manual.append("new", null);
      expect(manual.stats()).toEqual([
        { id: 0, eventCount: 7, keys: ["a", "c"] },
        { id: 1, eventCount: 5, keys: ["b", "new"] },
      ]);
      const empty = new EventLog();
      expect(empty.addNode()).toBe(1);
      expect(empty.stats()).toEqual([{ id: 0, eventCount: 0, keys: [] }, { id: 1, eventCount: 0, keys: [] }]);
    }
  });

  it("validates every request surface and returns the full allowed page", () => {
    for (const track of tracks()) {
      const { EventLog } = load(track.project.files["/log.ts"].code);
      for (const blockSize of [0, 65537, 1.5, NaN]) expect(() => new EventLog({ blockSize })).toThrow();
      for (const maxNodes of [0, 1025, 1.5]) expect(() => new EventLog({ maxNodes })).toThrow();
      for (const cooldown of [0, 1.5, Infinity]) expect(() => new EventLog({ cooldown })).toThrow();
      for (const autoThreshold of [0, 1.5, NaN]) expect(() => new EventLog({ autoThreshold })).toThrow();
      const log = new EventLog({ blockSize: 1 });
      const reader = log.cursor("a");
      for (const limit of [-1, 1.5, NaN, Infinity, 10001]) {
        for (const call of [() => log.read(0n, limit), () => log.readKey("a", 0n, limit), () => reader.next(limit)]) expect(call).toThrow();
      }
      for (const call of [() => log.read(-1n), () => log.readKey("a", -1n), () => log.cursor("a", -1n), () => log.cursor("")]) expect(call).toThrow();
      expect(log.stats()[0].keys).toEqual([]);
      expect(reader.nextOffset).toBe(0n);
      for (let i = 0; i < 10001; i++) log.append("a", i);
      expect(reader.next(0)).toEqual([]);
      expect(reader.nextOffset).toBe(0n);
      for (const page of [log.read(0n, 10000), log.readKey("a", 0n, 10000), reader.next(10000)]) {
        expect(ids(page)).toEqual(Array.from({ length: 10000 }, (_, i) => i));
      }
      expect(ids(reader.next())).toEqual([10000]);
      expect(log.read()).toHaveLength(100);
      expect(log.readKey("a")).toHaveLength(100);
    }
  });

  it("visits newly skipped events once while a cursor waits for a future offset", () => {
    for (const track of tracks()) {
      const { KeyStore } = load(track.project.files["/log.ts"].code);
      const store = new KeyStore(32);
      let inspected = 0;
      const append = (id: number) => store.append({ get id() { inspected++; return BigInt(id); }, key: "a", value: id });
      append(0);
      const take = store.reader(2000n);
      expect(take()).toBeUndefined();
      for (let i = 1; i <= 1000; i++) append(i);
      inspected = 0;
      expect(take()).toBeUndefined();
      expect(inspected).toBeGreaterThanOrEqual(1000); // Empty output can still require a scan.
      expect(inspected).toBeLessThanOrEqual(1001);
      inspected = 0;
      expect(take()).toBeUndefined();
      expect(inspected).toBe(0); // The skipped prefix is not scanned again.
      append(2000);
      expect(take()!.id).toBe(2000n);
    }
  });
});
