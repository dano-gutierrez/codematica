import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { CSSProperties, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebPlayground } from "./WebPlayground";

const sandpackMocks = vi.hoisted(() => ({
  providerProps: vi.fn(),
  consoleProps: vi.fn(),
  providerMount: vi.fn(),
  providerUnmount: vi.fn(),
  runSandpack: vi.fn(async () => undefined),
  updateFile: vi.fn(),
  resetAllFiles: vi.fn(),
  status: "running",
  error: null as null | { message: string },
  files: {} as Record<string, { code: string }>,
  activeFile: "/App.tsx",
  listener: undefined as undefined | ((message: { type: string; compilatonError?: boolean }) => void),
  unsubscribe: vi.fn(),
  failEditor: false,
}));

vi.mock("@codesandbox/sandpack-react", async () => {
  const { useEffect } = await import("react");
  return {
    SandpackProvider: ({ children, ...props }: { children: ReactNode }) => {
      sandpackMocks.providerProps(props);
      useEffect(() => {
        sandpackMocks.providerMount();
        return () => { sandpackMocks.providerUnmount(); };
      }, []);
      return <div>{children}</div>;
    },
    SandpackLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    SandpackCodeEditor: () => {
      if (sandpackMocks.failEditor) throw new Error("Editor initialization failed");
      return <div data-testid="mock-sandpack-editor" />;
    },
    SandpackPreview: ({ style }: { style?: CSSProperties }) => <div data-testid="mock-sandpack-preview" style={style} />,
    SandpackConsole: (props: unknown) => {
      sandpackMocks.consoleProps(props);
      return <div data-testid="mock-sandpack-console" />;
    },
    useSandpack: () => ({
      sandpack: {
        runSandpack: sandpackMocks.runSandpack,
        updateFile: sandpackMocks.updateFile,
        resetAllFiles: sandpackMocks.resetAllFiles,
        files: sandpackMocks.files,
        activeFile: sandpackMocks.activeFile,
        status: sandpackMocks.status,
        error: sandpackMocks.error,
      },
      listen: (listener: typeof sandpackMocks.listener) => {
        sandpackMocks.listener = listener;
        return sandpackMocks.unsubscribe;
      },
    }),
  };
});

const project = {
  runtime: "react-ts" as const,
  activeFile: "/App.tsx",
  visibleFiles: ["/App.tsx", "/styles.css"],
  files: {
    "/App.tsx": { code: "export default function App() { return <main>Hello</main>; }" },
    "/styles.css": { code: "main { min-height: 20rem; }" },
  },
  dependencies: { nanoid: "^5.0.0" },
};

afterEach(() => vi.restoreAllMocks());

beforeEach(() => {
  vi.clearAllMocks();
  sandpackMocks.files = { ...project.files };
  sandpackMocks.activeFile = project.activeFile;
  sandpackMocks.status = "running";
  sandpackMocks.error = null;
  sandpackMocks.failEditor = false;
});

describe("WebPlayground", () => {
  it("compiles current edits through the connected preview without replacing its console", () => {
    render(<WebPlayground project={project} projectId="connected-project" />);
    const editedFiles = { ...project.files, "/App.tsx": { code: "// revised app" } };
    sandpackMocks.files = editedFiles;
    act(() => sandpackMocks.listener?.({ type: "done", compilatonError: false }));
    fireEvent.click(screen.getByTestId("web-playground-run"));
    expect(sandpackMocks.updateFile).toHaveBeenCalledTimes(1);
    expect(sandpackMocks.updateFile).toHaveBeenCalledWith(editedFiles, undefined, true);
    expect(sandpackMocks.providerMount).toHaveBeenCalledTimes(1);
    expect(sandpackMocks.providerUnmount).not.toHaveBeenCalled();
    expect(sandpackMocks.runSandpack).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Compiling your edits");
    act(() => sandpackMocks.listener?.({ type: "start" }));
    expect(screen.getByRole("status")).toHaveTextContent("Compiling your edits");
    act(() => sandpackMocks.listener?.({ type: "done", compilatonError: false }));
    expect(screen.getByRole("status")).toHaveTextContent("Preview ready");
  });
  it("keeps authored source in the shared code renderer after editor failure and can retry", () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    sandpackMocks.failEditor = true;
    render(<WebPlayground project={project} projectId="broken-editor" />);
    const fallback = within(screen.getByTestId("web-playground-fallback"));
    const blocks = fallback.getAllByRole("figure", { hidden: true });
    expect(blocks).toHaveLength(project.visibleFiles.length);
    for (const [index, path] of project.visibleFiles.entries()) {
      expect(blocks[index]).toHaveTextContent(path);
      expect(blocks[index]).toHaveTextContent(project.files[path as keyof typeof project.files].code);
      expect(blocks[index].querySelector("code")).toBeInTheDocument();
    }
    sandpackMocks.failEditor = false;
    fireEvent.click(fallback.getByRole("button", { name: "Retry playground" }));
    expect(screen.queryByTestId("web-playground-fallback")).not.toBeInTheDocument();
    expect(screen.getByTestId("mock-sandpack-editor")).toBeVisible();
    errorLog.mockRestore();
  });

  it("starts one runtime immediately when revealed and shares its console", () => {
    render(<WebPlayground project={project} projectId="test-project" />);
    expect(sandpackMocks.providerProps).toHaveBeenLastCalledWith(expect.objectContaining({
      template: "react-ts",
      files: project.files,
      customSetup: { dependencies: project.dependencies },
      options: expect.objectContaining({ activeFile: project.activeFile, visibleFiles: project.visibleFiles, autorun: true, autoReload: false, initMode: "immediate" }),
    }));
    expect(sandpackMocks.consoleProps).toHaveBeenLastCalledWith(expect.objectContaining({ standalone: false }));
    expect(screen.getByTestId("mock-sandpack-editor")).toBeVisible();
    expect(screen.getByTestId("mock-sandpack-preview")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Starting preview");
    act(() => sandpackMocks.listener?.({ type: "connected" }));
    expect(screen.getByRole("status")).toHaveTextContent("Starting preview");
    act(() => sandpackMocks.listener?.({ type: "done", compilatonError: false }));
    expect(screen.getByRole("status")).toHaveTextContent("Preview ready");
    act(() => sandpackMocks.listener?.({ type: "start" }));
    expect(screen.getByRole("status")).toHaveTextContent("Starting preview");
  });

  it("preserves the connected client for Run and resets to authored files without a stale run", () => {
    render(<WebPlayground project={{ ...project, entry: "/App.tsx" }} projectId="test-project" />);
    sandpackMocks.files = { ...project.files, "/styles.css": { code: "main { color: red; }" } };
    sandpackMocks.activeFile = "/styles.css";
    act(() => sandpackMocks.listener?.({ type: "done", compilatonError: false }));
    fireEvent.click(screen.getByTestId("web-playground-run"));
    expect(sandpackMocks.providerMount).toHaveBeenCalledTimes(1);
    expect(sandpackMocks.providerUnmount).not.toHaveBeenCalled();
    expect(sandpackMocks.updateFile).toHaveBeenCalledWith(sandpackMocks.files, undefined, true);
    expect(sandpackMocks.providerProps).toHaveBeenLastCalledWith(expect.objectContaining({
      files: project.files,
      customSetup: { dependencies: project.dependencies, entry: "/App.tsx" },
      options: expect.objectContaining({ activeFile: project.activeFile }),
    }));
    expect(screen.getByRole("status")).toHaveTextContent("Compiling your edits");
    fireEvent.click(screen.getByTestId("web-playground-reset"));
    expect(sandpackMocks.providerMount).toHaveBeenCalledTimes(2);
    expect(sandpackMocks.providerProps).toHaveBeenLastCalledWith(expect.objectContaining({
      files: project.files,
      options: expect.objectContaining({ activeFile: project.activeFile }),
    }));
    expect(sandpackMocks.runSandpack).not.toHaveBeenCalled();
  });

  it.each(["loading", "compiling", "compile-error", "runtime-error", "timeout", "initial", "idle"])("replaces a %s preview using the current draft", (state) => {
    const { rerender } = render(<WebPlayground project={project} projectId="recover-project" />);
    sandpackMocks.files = { "/App.tsx": { code: "// recover this draft" } };
    sandpackMocks.activeFile = "/App.tsx";
    if (state !== "loading") act(() => sandpackMocks.listener?.({ type: "done", compilatonError: state === "compile-error" }));
    if (state === "compiling") fireEvent.click(screen.getByTestId("web-playground-run"));
    if (state === "runtime-error") sandpackMocks.error = { message: "Runtime error" };
    if (state === "timeout") sandpackMocks.status = "timeout";
    if (state === "initial" || state === "idle") sandpackMocks.status = state;
    rerender(<WebPlayground project={project} projectId="recover-project" />);
    fireEvent.click(screen.getByTestId("web-playground-run"));
    expect(sandpackMocks.providerMount).toHaveBeenCalledTimes(2);
    expect(sandpackMocks.providerUnmount).toHaveBeenCalledTimes(1);
    expect(sandpackMocks.updateFile).toHaveBeenCalledTimes(state === "compiling" ? 1 : 0);
    expect(sandpackMocks.providerProps).toHaveBeenLastCalledWith(expect.objectContaining({ files: sandpackMocks.files, options: expect.objectContaining({ activeFile: sandpackMocks.activeFile }) }));
    expect(sandpackMocks.runSandpack).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("web-playground-reset"));
    expect(sandpackMocks.providerMount).toHaveBeenCalledTimes(3);
    expect(sandpackMocks.providerProps).toHaveBeenLastCalledWith(expect.objectContaining({ files: project.files, options: expect.objectContaining({ activeFile: project.activeFile }) }));
  });

  it("keeps edited files available after timeout and reconnects without discarding them", () => {
    const { rerender } = render(<WebPlayground project={project} projectId="test-project" />);
    sandpackMocks.status = "timeout";
    sandpackMocks.files = { "/App.tsx": { code: "// my unfinished work" } };
    rerender(<WebPlayground project={project} projectId="test-project" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Your edits are preserved");
    expect(screen.getByTestId("mock-sandpack-editor")).toBeVisible();
    expect(screen.getByTestId("mock-sandpack-preview")).not.toBeVisible();
    sandpackMocks.status = "running";
    fireEvent.click(screen.getByRole("button", { name: "Retry preview" }));
    expect(sandpackMocks.providerMount).toHaveBeenCalledTimes(2);
    expect(sandpackMocks.providerProps).toHaveBeenLastCalledWith(expect.objectContaining({ files: sandpackMocks.files }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByTestId("mock-sandpack-preview")).toBeVisible();
  });

  it("distinguishes compilation errors from connection failures", () => {
    const { rerender } = render(<WebPlayground project={project} projectId="test-project" />);
    act(() => sandpackMocks.listener?.({ type: "done", compilatonError: true }));
    expect(screen.getByRole("status")).toHaveTextContent("code error");
    expect(screen.getByTestId("mock-sandpack-preview")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    act(() => sandpackMocks.listener?.({ type: "done", compilatonError: false }));
    sandpackMocks.error = { message: "Runtime error" };
    rerender(<WebPlayground project={project} projectId="test-project" />);
    expect(screen.getByRole("status")).toHaveTextContent("code error");
  });

  it("discards drafts when selecting another project and unsubscribes on unmount", () => {
    const { rerender, unmount } = render(<WebPlayground project={project} projectId="first" />);
    sandpackMocks.files = { "/App.tsx": { code: "// draft" } };
    fireEvent.click(screen.getByTestId("web-playground-run"));
    rerender(<WebPlayground project={project} projectId="second" />);
    expect(sandpackMocks.providerProps).toHaveBeenLastCalledWith(expect.objectContaining({ files: project.files }));
    const priorUnsubscriptions = sandpackMocks.unsubscribe.mock.calls.length;
    unmount();
    expect(sandpackMocks.unsubscribe).toHaveBeenCalledTimes(priorUnsubscriptions + 1);
  });
});
