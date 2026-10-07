"use client";

import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  type SandpackFiles,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { Play, RotateCcw, Terminal } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from "react";
import type { WebExerciseProject } from "@/lib/content/schema";
import { CodeBlock } from "@/components/CodeBlock";
import { Button } from "@/components/Button";

export function WebPlayground({ project, projectId }: { project: WebExerciseProject; projectId: string }) {
  return <PlaygroundSession key={projectId} project={project} />;
}

type PlaygroundDraft = { files: SandpackFiles; activeFile: string };

function PlaygroundSession({ project }: { project: WebExerciseProject }) {
  const [session, setSession] = useState({
    files: project.files as SandpackFiles,
    activeFile: project.activeFile,
    attempt: 0,
  });

  // A fresh provider also replaces the iframe's connection and listeners. Reset
  // must not call runSandpack in the same event as resetAllFiles: that callback
  // still closes over the previous render's edited files.
  function startSession(draft: PlaygroundDraft) {
    setSession((current) => ({ ...draft, attempt: current.attempt + 1 }));
  }

  function resetProject() {
    startSession({ files: project.files, activeFile: project.activeFile });
  }

  return (
    <PlaygroundErrorBoundary key={session.attempt} project={project} onRetry={resetProject}>
      <SandpackProvider
        template={project.runtime}
        files={session.files}
        customSetup={{ ...(project.entry ? { entry: project.entry } : {}), dependencies: project.dependencies }}
        options={{
          activeFile: session.activeFile,
          visibleFiles: project.visibleFiles,
          autorun: true,
          autoReload: false,
          recompileMode: "delayed",
          recompileDelay: 450,
          // The lesson already defers mounting until the solution is revealed.
          initMode: "immediate",
        }}
        theme={{
          colors: {
            surface1: "#101820",
            surface2: "#18232d",
            surface3: "#263544",
            disabled: "#94a3b8",
            base: "#edf5ff",
            clickable: "#9cc7ff",
            hover: "#263544",
            accent: "#6dd8cf",
            error: "#fecaca",
            errorSurface: "#511f25",
          },
          syntax: {
            plain: "#d9e7ef",
            comment: { color: "#94a3b8", fontStyle: "italic" },
            keyword: "#7dd3fc",
            tag: "#fca5a5",
            punctuation: "#b7c3cc",
            definition: "#93c5fd",
            property: "#c4b5fd",
            static: "#f9a8d4",
            string: "#a7f3d0",
          },
          font: { body: "Inter, ui-sans-serif, system-ui, sans-serif", mono: "ui-monospace, SFMono-Regular, Menlo, monospace", size: "14px", lineHeight: "1.6" },
        }}
      >
        <PlaygroundWorkspace onRun={startSession} onReset={resetProject} />
      </SandpackProvider>
    </PlaygroundErrorBoundary>
  );
}

function PlaygroundWorkspace({ onRun, onReset }: { onRun: (draft: PlaygroundDraft) => void; onReset: () => void }) {
  const { sandpack, listen } = useSandpack();
  const [phase, setPhase] = useState<"loading" | "compiling" | "ready" | "error">("loading");
  const timedOut = sandpack.status === "timeout";

  useEffect(() => listen((message) => {
    if (message.type === "start") setPhase((current) => current === "compiling" ? "compiling" : "loading");
    if (message.type === "done") setPhase(message.compilatonError ? "error" : "ready");
  }), [listen]);

  function runProject() {
    if (sandpack.status === "running" && phase === "ready" && !sandpack.error) {
      setPhase("compiling");
      sandpack.updateFile(sandpack.files, undefined, true);
      return;
    }
    onRun({ files: sandpack.files, activeFile: sandpack.activeFile });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#263544] bg-[#101820]" data-testid="web-playground">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#263544] px-4 py-3 text-white">
        <div>
          <p className="text-xs font-semibold uppercase text-[#9cc7ff]">React/TypeScript playground</p>
          <p className="mt-1 text-sm font-semibold text-[#cbd7e1]" role="status" data-testid="web-playground-status">
            {timedOut ? "Preview connection timed out."
              : sandpack.error || phase === "error" ? "Preview has a code error. Check the preview or console, then Run again."
                : phase === "ready" ? "Preview ready. Edit the files, then press Run."
                  : phase === "compiling" ? "Compiling your edits in the connected preview."
                  : "Starting preview… Connecting to the hosted runtime."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            label="Run" icon={Play} tone="success" variant="primary"
            onClick={runProject}
            data-testid="web-playground-run"
          />
          <Button
            label="Reset solution" icon={RotateCcw} tone="warning"
            onClick={onReset}
            data-testid="web-playground-reset"
          />
        </div>
      </div>

      <SandpackLayout className="web-playground-layout">
        <SandpackCodeEditor showTabs showLineNumbers showInlineErrors showRunButton={false} wrapContent={false} />
        {/* Keep the failed preview registered until retry. Unmounting it here
            changes Sandpack's timeout status back to idle. */}
        <SandpackPreview
          style={timedOut ? { display: "none" } : undefined}
          showNavigator={false}
          showOpenInCodeSandbox={false}
          showOpenNewtab={false}
          showRefreshButton
          showRestartButton
          showSandpackErrorOverlay
        />
        {timedOut && (
          <div className="flex flex-1 flex-col items-start justify-center gap-4 bg-[#101820] p-6 text-[#edf5ff]" role="alert" data-testid="web-playground-connection-error">
            <h3 className="text-lg font-semibold">The preview couldn’t connect.</h3>
            <p className="text-sm leading-6">Your edits are preserved. The preview needs internet access to its hosted runtime. Retry to reconnect.</p>
            <Button label="Retry preview" icon={RotateCcw} tone="warning" onClick={runProject} />
          </div>
        )}
      </SandpackLayout>

      <details className="border-t border-[#263544] text-white" data-testid="web-playground-console">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-[#cbd7e1]">
          <Terminal className="h-4 w-4 text-[#6dd8cf]" aria-hidden="true" />
          Console
        </summary>
        <SandpackConsole standalone={false} showHeader={false} showSyntaxError showSetupProgress showRestartButton resetOnPreviewRestart />
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
      <section className="rounded-xl border border-[#d5e2e8] bg-white p-5" data-testid="web-playground-fallback">
        <h3 className="text-xl font-semibold text-[#263238]">The interactive runtime did not load.</h3>
        <p className="mt-2 text-sm font-normal leading-6 text-[#68737d]">The explanations and source are still available. Check your connection and retry the hosted sandbox.</p>
        <Button label="Retry playground" icon={RotateCcw} tone="warning" onClick={this.props.onRetry} className="mt-4" />
        <div className="mt-5 grid gap-3">
          {this.props.project.visibleFiles.map((path) => (
            <details key={path} className="rounded-xl border border-[#d5e2e8] bg-[#f6fbfc] p-3">
              <summary className="min-h-12 cursor-pointer font-mono text-sm font-medium text-[#263238]">{path}</summary>
              <CodeBlock code={this.props.project.files[path].code} language={path.split(".").pop()} label={path} className="mt-3" />
            </details>
          ))}
        </div>
      </section>
    );
  }
}
