import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import ts from "typescript";
import { getDocumentBySlug, getExerciseBySlug } from "@codematica/core/content";
import { checkQuestionAnswer } from "@codematica/core/practice/questionnaire";

type Item = { id: string; label: string; status: "pending" | "saved" | "error" };
type Save = (item: Item, outcome: "success" | "failure") => Promise<void>;
function examples() {
  const markdown = readFileSync("content/knowledge/frontend/react-state-async-callbacks.md", "utf8");
  return unified().use(remarkParse).parse(markdown).children.filter((node) => node.type === "code" && node.lang === "tsx");
}
function loadExample(name: string): React.ComponentType<{ save?: Save }> {
  const example = examples().find((node) => node.type === "code" && node.meta === name);
  if (!example || example.type !== "code") throw new Error(`Missing ${name}`);
  const { outputText } = ts.transpileModule(example.value, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } });
  const exports: { default?: React.ComponentType<{ save?: Save }> } = {};
  let id = 0;
  // Execute only this repository-authored example, with no network/module access.
  runInNewContext(outputText, {
    exports, setTimeout, clearTimeout, console, crypto: { randomUUID: () => String(++id) },
    require: (name: string) => {
      if (name === "react") return React;
      if (name === "react/jsx-runtime") return jsxRuntime;
      throw new Error(`Unexpected import ${name}`);
    },
  }, { timeout: 2000 });
  return exports.default!;
}
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("React async state lesson", () => {
  it("publishes the lesson and a six-question checkpoint with valid answers", () => {
    const document = getDocumentBySlug("frontend/react-state-async-callbacks");
    expect(document?.status).toBe("published");
    expect(document?.sourceRefs).toContain("react-state-snapshot");
    const quiz = getExerciseBySlug("frontend/react-state-async-questionnaire");
    expect(quiz?.type).toBe("questionnaire");
    if (quiz?.type !== "questionnaire") throw new Error("Missing checkpoint");
    expect(quiz.documentSlug).toBe(document?.slug);
    expect(quiz.questions).toHaveLength(6);
    for (const question of quiz.questions) {
      if (question.kind !== "choice") throw new Error("Expected choice question");
      for (const option of question.options) {
        expect(checkQuestionAnswer(question, { kind: "choice", selectedOptionId: option.id }).isCorrect).toBe(option.isCorrect);
      }
    }
  });

  it("strictly typechecks the exact complete React examples", () => {
    const files = new Map(examples().map((node) => {
      if (node.type !== "code") throw new Error("Expected code");
      return [`${process.cwd()}/__authored__/${node.meta}`, node.value];
    }));
    const options: ts.CompilerOptions = { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, types: ["react"], lib: ["lib.es2022.d.ts", "lib.dom.d.ts"] };
    const host = ts.createCompilerHost(options);
    const originalRead = host.readFile, originalExists = host.fileExists, originalDir = host.directoryExists!, originalSource = host.getSourceFile;
    host.fileExists = (path) => files.has(path) || originalExists(path);
    host.readFile = (path) => files.get(path) ?? originalRead(path);
    host.directoryExists = (path) => [...files.keys()].some((file) => file.startsWith(`${path}/`)) || originalDir(path);
    host.getSourceFile = (file, version, onError, createNew) => files.has(file) ? ts.createSourceFile(file, files.get(file)!, version, true) : originalSource(file, version, onError, createNew);
    expect(ts.getPreEmitDiagnostics(ts.createProgram([...files.keys()], options, host)).map((error) => ts.flattenDiagnosticMessageText(error.messageText, "\n"))).toEqual([]);
  });

  it("reproduces the stale callback erasing the newly added item", async () => {
    vi.useFakeTimers();
    const Broken = loadExample("BrokenExample.tsx");
    render(<Broken />);
    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("preserves two same-render additions while failure finishes before success", async () => {
    vi.useFakeTimers();
    const Working = loadExample("WorkingExample.tsx");
    render(<React.StrictMode><Working /></React.StrictMode>);
    act(() => {
      screen.getByRole("button", { name: "Add slow success" }).click();
      screen.getByRole("button", { name: "Add fast failure" }).click();
    });
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Success — pending", "Failure — pending"]);
    await act(() => vi.advanceTimersByTimeAsync(250));
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Success — pending", "Failure — error"]);
    await act(() => vi.advanceTimersByTimeAsync(750));
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Success — saved", "Failure — error"]);
  });

  it.each(["resolve", "reject"] as const)("ignores an in-flight %s after Clear and preserves new work", async (outcome) => {
    vi.useFakeTimers();
    let resolve!: () => void, reject!: (error: Error) => void;
    const pending = new Promise<void>((ok, fail) => { resolve = ok; reject = fail; });
    const save = vi.fn<Save>().mockReturnValueOnce(pending).mockResolvedValue(undefined);
    const Working = loadExample("WorkingExample.tsx");
    const onRender = vi.fn();
    render(<React.Profiler id="items" onRender={onRender}><Working save={save} /></React.Profiler>);
    fireEvent.click(screen.getByRole("button", { name: "Add slow success" }));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    fireEvent.click(screen.getByRole("button", { name: "Clear items" }));
    fireEvent.click(screen.getByRole("button", { name: "Add slow success" }));
    const commitsBeforeResult = onRender.mock.calls.length;
    await act(async () => { if (outcome === "resolve") resolve(); else reject(new Error("late failure")); await pending.catch(() => {}); });
    expect(onRender).toHaveBeenCalledTimes(commitsBeforeResult);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Success — pending"]);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Success — saved"]);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("cancels timers on Clear and unmount before starting a request", async () => {
    vi.useFakeTimers();
    const save = vi.fn<Save>().mockResolvedValue(undefined);
    const Working = loadExample("WorkingExample.tsx");
    const { unmount } = render(<Working save={save} />);
    fireEvent.click(screen.getByRole("button", { name: "Add slow success" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear items" }));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Add fast failure" }));
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(save).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
