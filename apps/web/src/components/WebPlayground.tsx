"use client";

import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { Play, RotateCcw, Terminal } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode, useState } from "react";
import type { WebExerciseProject } from "@/lib/content/schema";

export function WebPlayground({ project, projectId }: { project: WebExerciseProject; projectId: string }) {
  const [retryKey, setRetryKey] = useState(0);

  return (
    <PlaygroundErrorBoundary key={`${projectId}-${retryKey}`} project={project} onRetry={() => setRetryKey((value) => value + 1)}>
      <SandpackProvider
        key={projectId}
        template={project.runtime}
        files={project.files}
        customSetup={{ ...(project.entry ? { entry: project.entry } : {}), dependencies: project.dependencies }}
        options={{
          activeFile: project.activeFile,
          visibleFiles: project.visibleFiles,
          autorun: true,
          autoReload: false,
          recompileMode: "delayed",
          recompileDelay: 450,
          initMode: "lazy",
        }}
        theme={{
          colors: {
            surface1: "#101820",
            surface2: "#18232d",
            surface3: "#263544",
            disabled: "#68737d",
            base: "#edf5ff",
            clickable: "#9cc7ff",
            hover: "#263544",
            accent: "#6dd8cf",
            error: "#fecaca",
            errorSurface: "#511f25",
          },
          font: { body: "Inter, ui-sans-serif, system-ui, sans-serif", mono: "ui-monospace, SFMono-Regular, Menlo, monospace", size: "14px", lineHeight: "1.6" },
        }}
      >
        <PlaygroundWorkspace />
      </SandpackProvider>
    </PlaygroundErrorBoundary>
  );
}

function PlaygroundWorkspace() {
  const { sandpack } = useSandpack();

  function resetProject() {
    sandpack.resetAllFiles();
    void sandpack.runSandpack();
  }

  return (
    <section className="overflow-hidden rounded-lg border-2 border-b-4 border-[#263544] bg-[#101820]" data-testid="web-playground">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#263544] px-4 py-3 text-white">
        <div>
          <p className="text-xs font-extrabold uppercase text-[#9cc7ff]">React/TypeScript playground</p>
          <p className="mt-1 text-sm font-semibold text-[#cbd7e1]">Edit the files, then run the project in the isolated preview.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void sandpack.runSandpack()}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78] px-3 py-2 text-sm font-extrabold text-white"
            data-testid="web-playground-run"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Run
          </button>
          <button
            type="button"
            onClick={resetProject}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border-2 border-b-4 border-[#526474] bg-[#18232d] px-3 py-2 text-sm font-extrabold text-white"
            data-testid="web-playground-reset"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset solution
          </button>
        </div>
      </div>

      <SandpackLayout className="web-playground-layout">
        <SandpackCodeEditor showTabs showLineNumbers showInlineErrors showRunButton wrapContent={false} />
        <SandpackPreview
          showNavigator={false}
          showOpenInCodeSandbox={false}
          showOpenNewtab={false}
          showRefreshButton
          showRestartButton
          showSandpackErrorOverlay
        />
      </SandpackLayout>

      <details className="border-t border-[#263544] text-white">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-extrabold text-[#cbd7e1]">
          <Terminal className="h-4 w-4 text-[#6dd8cf]" aria-hidden="true" />
          Console
        </summary>
        <SandpackConsole standalone showHeader={false} showSyntaxError showSetupProgress showRestartButton resetOnPreviewRestart />
      </details>
    </section>
  );
}

class PlaygroundErrorBoundary extends Component<
  { children: ReactNode; project: WebExerciseProject; onRetry: () => void },
  { error?: Error }
> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Web playground failed to initialize", error, info);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <section className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5" data-testid="web-playground-fallback">
        <h3 className="text-xl font-extrabold text-[#263238]">The interactive runtime did not load.</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#68737d]">The explanations and source remain available. Check the network connection and retry the hosted sandbox.</p>
        <button type="button" onClick={this.props.onRetry} className="mt-4 rounded-lg border-2 border-b-4 border-[#1d4e9e] bg-[#245fba] px-4 py-2 text-sm font-extrabold text-white">
          Retry playground
        </button>
        <div className="mt-5 grid gap-3">
          {this.props.project.visibleFiles.map((path) => (
            <details key={path} className="rounded-lg border-2 border-[#d5e2e8] bg-[#f6fbfc] p-3">
              <summary className="cursor-pointer font-mono text-sm font-bold text-[#263238]">{path}</summary>
              <pre className="mt-3 overflow-x-auto whitespace-pre p-3 text-xs leading-5 text-[#263238]">{this.props.project.files[path]?.code}</pre>
            </details>
          ))}
        </div>
      </section>
    );
  }
}
