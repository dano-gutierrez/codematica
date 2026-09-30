import { execFileSync } from "node:child_process";
import { runInNewContext } from "node:vm";
import { readFileSync } from "node:fs";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { interviewCollectionFileSchema, type InterviewWebSolutionTrack } from "@codematica/core/content/schema";

const collection = interviewCollectionFileSchema.parse(JSON.parse(readFileSync("content/interviews/frontend-practice.json", "utf8")));
const tracks = collection.questions.flatMap((question) => question.kind === "web" ? question.solutionTracks.map((track) => ({ topic: question.slug, track })) : []);
type Cell = "R" | "Y" | null;
type Game = { cells: Cell[][]; player: string; winner: Cell; moves: number; draw: boolean };
type FileNode = { id: string; name: string; type: string; children?: FileNode[] };
type Row = { id: string; name: string; depth: number };
type Selection = { selected: string[]; query: string; open: boolean };
type Option = { id: string; label: string; disabled?: boolean };
type UserCell = { name: string; cell: number; count: number | null; error: string | null };
type Fetcher = (url: string, init: { signal: AbortSignal }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;
type Model = {
  createBoard: (r: number, c: number) => number[][];
  createMatrix: (r: number, c: number, k: number, random?: () => number) => number[][];
  seeded: (seed: number) => () => number;
  createGame: () => Game;
  boardOf: (game: Game) => Cell[][];
  move: (game: Game, r: number, c: number) => Game;
  ROWS: number; COLUMNS: number;
  normalize?: (nodes: FileNode[]) => unknown;
  visibleRows: (nodes: unknown, expanded: Set<string>) => Row[];
  toggle?: (expanded: Set<string>, node: FileNode) => Set<string>;
  toggleLocal?: (expanded: boolean, node: FileNode) => boolean;
  initialState: () => Selection;
  reduce: (state: Selection, action: { type: string; value?: string; id?: string }, options: Option[]) => Selection;
  visibleOptions: (options: Option[], state: Selection) => Option[];
  placeUsers: (names: string[], random: () => number) => UserCell[];
  countRepos: (name: string, fetcher: Fetcher, signal: AbortSignal) => Promise<number>;
  loadMatrix: (fetcher: Fetcher, random: () => number, signal: AbortSignal, onUpdate: (cells: UserCell[]) => void) => Promise<UserCell[]>;
};

// Only vetted, repository-authored modules are evaluated. No network/module I/O is supplied.
function loadProject(track: InterviewWebSolutionTrack) {
  const cache = new Map<string, Record<string, unknown>>();
  function load(path: string): Record<string, unknown> {
    if (cache.has(path)) return cache.get(path)!;
    const file = track.project.files[path];
    if (!file) throw new Error(`Missing authored module ${path}`);
    const result = ts.transpileModule(file.code, { fileName: path, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }, reportDiagnostics: true });
    expect(result.diagnostics?.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)).toEqual([]);
    const exports: Record<string, unknown> = {};
    cache.set(path, exports);
    function require(id: string): unknown {
      if (id === "react") return React;
      if (id === "react/jsx-runtime") return jsxRuntime;
      if (id.endsWith(".css")) return {};
      if (id.startsWith("./")) return load(`/${id.slice(2)}.ts`);
      throw new Error(`Unexpected import ${id}`);
    }
    runInNewContext(result.outputText, { exports, require, console, setTimeout, clearTimeout, AbortController, DOMException, Response, URL, Node, document }, { timeout: 2000 });
    return exports;
  }
  return { model: load("/model.ts") as unknown as Model, App: () => load("/App.tsx").default as React.ComponentType };
}
const tree: FileNode[] = [{ id: "root", name: "src", type: "folder", children: [{ id: "child", name: "src", type: "folder", children: [{ id: "file", name: "x", type: "file" }] }, { id: "empty", name: "empty", type: "folder", children: [] }] }];
const options: Option[] = [{ id: "ts", label: "TypeScript" }, { id: "js", label: "JavaScript" }, { id: "next", label: "Next.js", disabled: true }];
function oracle(board: Cell[][]): Cell {
  const lines = [...board, ...board[0].map((_, c) => board.map((row) => row[c]))];
  for (const line of lines) for (let i = 0; i <= line.length - 4; i++) {
    const segment = line.slice(i, i + 4);
    if (segment[0] && segment.every((cell) => cell === segment[0])) return segment[0];
  }
  return null;
}
afterEach(cleanup);

describe("exact authored frontend solutions", () => {
  it("strictly typechecks every complete authored TypeScript project", () => {
    const files = new Map<string, string>();
    for (const { topic, track } of tracks) for (const [path, file] of Object.entries(track.project.files)) {
      if (/\.tsx?$/.test(path)) files.set(`${process.cwd()}/__authored__/${topic}/${track.id}${path}`, file.code);
    }
    const options: ts.CompilerOptions = { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, types: ["react"], lib: ["lib.es2022.d.ts", "lib.dom.d.ts"] };
    const host = ts.createCompilerHost(options), originalRead = host.readFile, originalExists = host.fileExists, originalDir = host.directoryExists!, originalSource = host.getSourceFile;
    host.fileExists = (path) => files.has(path) || originalExists(path);
    host.readFile = (path) => files.get(path) ?? originalRead(path);
    host.directoryExists = (path) => [...files.keys()].some((file) => file.startsWith(`${path}/`)) || originalDir(path);
    host.getSourceFile = (file, version, onError, createNew) => files.has(file) ? ts.createSourceFile(file, files.get(file)!, version, true) : originalSource(file, version, onError, createNew);
    const program = ts.createProgram([...files.keys()], options, host);
    const errors = ts.getPreEmitDiagnostics(program).map((diagnostic) => `${diagnostic.file?.fileName}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`);
    expect(errors).toEqual([]);
  });

  it("matches all 21 Python companions on shared fixtures and runs the Python regression suite", () => {
    const python = JSON.parse(execFileSync(process.env.CODEMATICA_PYTHON ?? "python3", ["scripts/content/verify-frontend-python.py", "--json"], { encoding: "utf8" }));
    const actual: Record<string, unknown> = {};
    for (const { topic, track } of tracks) {
      const m = loadProject(track).model;
      const key = `${topic}/${track.id}`;
      if (topic === "dynamic-board") actual[key] = m.createBoard(2, 3);
      if (topic === "random-matrix") actual[key] = m.createMatrix(3, 5, 6, m.seeded(123));
      if (topic === "click-board" || topic === "column-game") {
        let game = m.createGame();
        for (const [r, c] of [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2], [0, 3]]) game = m.move(game, r, c);
        actual[key] = { board: m.boardOf(game), winner: game.winner, player: game.player, moves: game.moves };
      }
      if (topic === "file-explorer") actual[key] = m.visibleRows(m.normalize ? m.normalize(tree) : tree, new Set(["root", "child"]));
      if (topic === "multi-select") actual[key] = m.reduce(m.initialState(), { type: "select", id: "ts" }, options);
      if (topic === "user-matrix") actual[key] = m.placeUsers(["ada", "grace", "linus"], m.seeded(42));
    }
    expect(Object.keys(actual)).toHaveLength(21);
    expect(JSON.parse(JSON.stringify(actual))).toEqual(python);
  });

  for (const { topic, track } of tracks) {
    it(`${topic}/${track.id}: validates the model and actual React interaction`, async () => {
      const project = loadProject(track), m = project.model;
      const App = project.App();
      if (topic === "dynamic-board") {
        expect(m.createBoard(0, 3)).toEqual([]);
        expect(m.createBoard(3, 0)).toEqual([[], [], []]);
        expect(() => m.createBoard(-1, 2)).toThrow();
        const board = m.createBoard(2, 3); board[0][0] = 99;
        expect(board[1]).toEqual([3, 4, 5]);
        render(<App />);
        fireEvent.change(screen.getByLabelText("Rows"), { target: { value: "2" } });
        fireEvent.change(screen.getByLabelText("Columns"), { target: { value: "3" } });
        expect(screen.getByText("1,2")).toBeVisible();
        expect(screen.queryByText("2,2")).not.toBeInTheDocument();
      } else if (topic === "random-matrix") {
        for (let seed = 0; seed < 20; seed++) for (let k = 0; k <= 6; k++) {
          const matrix = m.createMatrix(2, 3, k, m.seeded(seed));
          expect(matrix.flat().filter((value) => value === 0)).toHaveLength(k);
          expect(matrix[0]).not.toBe(matrix[1]);
        }
        expect(() => m.createMatrix(2, 3, 7)).toThrow();
        render(<App />);
        expect(screen.getByRole("status")).toHaveTextContent("10 zeros");
        fireEvent.change(screen.getByLabelText("Zero count"), { target: { value: "100" } });
        expect(screen.getByRole("status")).toHaveTextContent("10 zeros");
        fireEvent.click(screen.getByRole("button", { name: "Generate" }));
        expect(screen.getByRole("status")).toHaveTextContent("100 zeros");
      } else if (topic === "click-board" || topic === "column-game") {
        for (let seed = 0; seed < 20; seed++) {
          let game = m.createGame();
          for (let step = 0; step < 80; step++) {
            const before = JSON.stringify(game);
            const next = m.move(game, (step * 3 + seed) % m.ROWS, (step * 5 + Math.floor(step / 3) + seed) % m.COLUMNS);
            expect(JSON.stringify(game)).toBe(before);
            expect(next.winner).toBe(oracle(m.boardOf(next)));
            if (game.winner || game.draw || next.moves === game.moves) expect(next).toBe(game);
            game = next;
          }
        }
        let draw = m.createGame();
        for (let r = 0; r < m.ROWS; r++) for (let c = 0; c < m.COLUMNS; c++) draw = m.move(draw, r, c);
        expect(draw.draw).toBe(true);
        expect(m.move(draw, 0, 0)).toBe(draw);
        render(<App />);
        fireEvent.click(screen.getByRole("button", { name: "Row 1, column 1: empty" }));
        expect(screen.getByRole("status")).toHaveTextContent("Y's turn");
        expect(screen.getByRole("button", { name: `Row ${topic === "column-game" ? 6 : 1}, column 1: R` })).toBeVisible();
        fireEvent.click(screen.getByRole("button", { name: "Reset game" }));
        expect(screen.getByRole("status")).toHaveTextContent("R's turn");
      } else if (topic === "file-explorer") {
        expect(m.visibleRows(m.normalize ? m.normalize([]) : [], new Set())).toEqual([]);
        if (m.normalize) expect(() => m.normalize!(tree.concat(tree))).toThrow();
        render(<App />);
        fireEvent.click(screen.getByRole("button", { name: /src/ }));
        fireEvent.click(screen.getByRole("button", { name: /components/ }));
        expect(screen.getByText("FileExplorer.tsx")).toBeVisible();
        fireEvent.click(screen.getByRole("button", { name: /src/ }));
        expect(screen.queryByText("FileExplorer.tsx")).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /src/ }));
        if (track.id === "local-recursion") expect(screen.queryByText("FileExplorer.tsx")).not.toBeInTheDocument();
        else expect(screen.getByText("FileExplorer.tsx")).toBeVisible();
        fireEvent.click(screen.getByRole("button", { name: /▸ empty/ }));
        expect(screen.getByText("Empty folder")).toBeVisible();
        fireEvent.click(screen.getByRole("button", { name: "Toggle empty data" }));
        expect(screen.getByText("No files")).toBeVisible();
      } else if (topic === "multi-select") {
        const state = m.initialState();
        expect(m.reduce(state, { type: "select", id: "next" }, options)).toBe(state);
        expect(m.reduce(state, { type: "select", id: "missing" }, options)).toBe(state);
        const selected = m.reduce(state, { type: "select", id: "ts" }, options);
        expect(m.reduce(selected, { type: "select", id: "ts" }, options)).toBe(selected);
        render(<App />);
        const input = screen.getByLabelText("Skills");
        fireEvent.focus(input);
        expect(screen.getByRole("button", { name: "Next.js (unavailable)" })).toBeDisabled();
        fireEvent.change(input, { target: { value: "SCRIPT" } });
        fireEvent.click(screen.getByRole("button", { name: "TypeScript" }));
        expect(input).toHaveValue("");
        expect(screen.queryByRole("button", { name: "TypeScript" })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Remove TypeScript" }));
        expect(screen.getByRole("button", { name: "TypeScript" })).toBeVisible();
        fireEvent.change(input, { target: { value: "zzzzz" } });
        expect(screen.getByText("No results")).toBeVisible();
        fireEvent.keyDown(input, { key: "Escape" });
        expect(screen.queryByText("No results")).not.toBeInTheDocument();
        fireEvent.focus(input);
        fireEvent.pointerDown(screen.getByRole("button", { name: "Outside control" }));
        expect(screen.queryByText("No results")).not.toBeInTheDocument();
      } else if (topic === "user-matrix") {
        let active = 0, maximum = 0;
        const fetcher: Fetcher = async (url) => {
          if (url === "/userList") return { ok: true, status: 200, json: async () => [{ name: "ada" }, { name: "grace" }, { name: "linus" }] };
          active++; maximum = Math.max(maximum, active);
          await Promise.resolve(); active--;
          const parsed = new URL(url), name = parsed.pathname.split("/")[2], page = Number(parsed.searchParams.get("page"));
          return { ok: name !== "grace", status: name === "grace" ? 429 : 200, json: async () => Array(name === "ada" ? page === 1 ? 100 : 3 : 2).fill({ id: 1 }) };
        };
        const updates: UserCell[][] = [];
        const result = await m.loadMatrix(fetcher, m.seeded(42), new AbortController().signal, (cells) => updates.push(cells));
        expect(result.map((cell) => cell.count)).toEqual([103, null, 2]);
        expect(result[1].error).toBe("HTTP 429");
        expect(new Set(result.map((cell) => cell.cell)).size).toBe(3);
        expect(maximum).toBe({ sequential: 1, parallel: 3, bounded: 2 }[track.id]);
        for (const update of updates) expect(update.map((cell) => cell.cell)).toEqual(result.map((cell) => cell.cell));
        const controller = new AbortController();
        let published = false;
        await expect(m.loadMatrix(async () => { controller.abort(); return { ok: true, status: 200, json: async () => [] }; }, m.seeded(1), controller.signal, () => { published = true; })).rejects.toThrow("Cancelled");
        expect(published).toBe(false);
        // A transport may ignore abort after the user list has already rendered.
        const staleController = new AbortController();
        let releasePage!: () => void;
        let pageStarted!: () => void;
        const started = new Promise<void>((resolve) => { pageStarted = resolve; });
        const delayed: Fetcher = async (url) => {
          if (url === "/userList") return { ok: true, status: 200, json: async () => [{ name: "ada" }] };
          pageStarted();
          await new Promise<void>((resolve) => { releasePage = resolve; });
          return { ok: true, status: 200, json: async () => [{ id: 1 }] };
        };
        const staleUpdates: UserCell[][] = [];
        const oldLoad = m.loadMatrix(delayed, m.seeded(9), staleController.signal, (cells) => staleUpdates.push(cells));
        const cancellation = expect(oldLoad).rejects.toThrow("Cancelled");
        await started;
        const beforeCancel = staleUpdates.length;
        staleController.abort();
        const fresh = await m.loadMatrix(fetcher, m.seeded(10), new AbortController().signal, () => undefined);
        releasePage();
        await cancellation;
        expect(staleUpdates).toHaveLength(beforeCancel);
        expect(fresh[0].count).toBe(103);
        render(<App />);
        await waitFor(() => expect(screen.getByText("ada: 103 repositories")).toBeVisible());
        expect(screen.getByText("grace: HTTP 429")).toBeVisible();
        expect(screen.getByText("linus: 2 repositories")).toBeVisible();
      }
    });
  }
});
