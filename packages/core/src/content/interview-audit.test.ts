import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";

type Track = { id: string; languages: Record<string, { code: string }> };
function code(company: string, question: string, track: string) {
  const file = JSON.parse(fs.readFileSync(path.resolve(`content/interviews/${company}.json`), "utf8"));
  return file.questions.find((q: {slug: string}) => q.slug === question).solutionTracks.find((t: Track) => t.id === track).languages.typescript.code;
}
function run(source: string, assertion: string) {
  const js = ts.transpile(source + "\n" + assertion, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
  vm.runInNewContext(js, { exports: {}, expect }, { timeout: 2000 });
}

describe("audited interview examples execute the published contract", () => {
  it("preserves non-BMP characters while removing unmatched parentheses", () => {
    run(code("meta", "minimum-remove-balanced-parentheses", "stack-indexes"), `expect(cleanParentheses('🙂)a(')).toBe('🙂a');`);
  });
  it.each(["path-trie", "flat-map-index"])("implements every filesystem method: %s", (track) => {
    run(code("airbnb", "in-memory-file-system", track), `const f = new ${track === "path-trie" ? "FileSystem" : "FileSystemMap"}(); f.mkdir('/a'); f.addContentToFile('/a/x', 'hi'); f.addContentToFile('/a/x', '!'); expect(f.readContentFromFile('/a/x')).toBe('hi!'); expect(f.ls('/a')).toEqual(['x']);`);
  });
  it.each(["value-and-min-stacks", "encoded-delta-stack"])("supports top and restores duplicate minima: %s", (track) => {
    run(code("microsoft", "min-stack", track), `const s = new ${track === "encoded-delta-stack" ? "MinStackEncoded" : "MinStack"}(); s.push(4); s.push(-2); s.push(-2); expect(s.top()).toBe(-2); s.pop(); expect(s.getMin()).toBe(-2); s.pop(); expect(s.top()).toBe(4); expect(s.getMin()).toBe(4);`);
  });
  it.each(["preorder-null-markers", "level-order-markers"])("round trips sparse trees: %s", (track) => {
    const suffix = track === "level-order-markers" ? "Level" : "";
    run(code("microsoft", "serialize-deserialize-binary-tree", track), `for (const tree of [null, {val:-1,left:null,right:{val:7,left:null,right:null}}]) expect(deserialize${suffix}(serialize${suffix}(tree))).toEqual(tree);`);
  });
  it("expires reads and protects replacements from old expiry events", () => {
    run(code("netflix", "auto-expire-cache", "heap-cleanup"), `const c = new ExpiringCacheHeap(); c.set('x',1,2,0); c.set('x',2,10,1); expect(c.get('x',2)).toBe(2); expect(c.get('x',11)).toBeUndefined();`);
  });
  it("handles identical ladder endpoints", () => {
    run(code("google", "word-ladder", "bidirectional-bfs"), `expect(ladderLengthBi('hit','hit',[])).toBe(1); expect(ladderLengthBi('hit','cog',['hot','dot','dog','lot','log','cog'])).toBe(5);`);
  });
  it("supports all three delimiter types in the second parentheses approach", () => {
    run(code("apple", "validate-parentheses-stream", "single-type-counter"), `expect(validByReduction('([{}])')).toBe(true); expect(validByReduction('([)]')).toBe(false);`);
  });
  it.each(["dijkstra-priority-queue", "unweighted-bfs"])("honors weights and unreachable targets: %s", (track) => {
    run(code("uber", "shortest-path-weighted-road-graph", track), `const g = new Map([['a',[['b',10],['c',1]]],['c',[['b',1]]]]); expect(shortestPath(g,'a','b')).toBe(2); expect(shortestPath(g,'a','z')).toBe(-1); expect(shortestPath(g,'a','a')).toBe(0);`);
  });
  it("returns no items when k is zero", () => {
    run(code("amazon", "top-k-frequent-items", "frequency-buckets"), `expect(topKBucket([1,1,2],0)).toEqual([]);`);
  });
});
