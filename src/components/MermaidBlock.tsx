"use client";

import { AlertTriangle, Code2 } from "lucide-react";
import { useEffect, useId, useState } from "react";

type MermaidState =
  | { status: "loading" }
  | { status: "ready"; svg: string }
  | { status: "error"; message: string };

export function MermaidBlock({ source, title }: { source: string; title?: string }) {
  const reactId = useId();
  const diagramId = `codematica-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [state, setState] = useState<MermaidState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        setState({ status: "loading" });
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          themeVariables: {
            background: "#ffffff",
            primaryColor: "#e8f8f6",
            primaryTextColor: "#263238",
            primaryBorderColor: "#007c78",
            lineColor: "#2f80ed",
            secondaryColor: "#f6fbfc",
            secondaryBorderColor: "#2f80ed",
            tertiaryColor: "#fff2c2",
            tertiaryBorderColor: "#c48600",
          },
        });

        const result = await mermaid.render(diagramId, source);

        if (!cancelled) {
          setState({ status: "ready", svg: result.svg });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Mermaid could not render this diagram.",
          });
        }
      }
    }

    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [diagramId, source]);

  return (
    <figure className="my-6 overflow-hidden rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white" data-testid="mermaid-block">
      {title ? (
        <figcaption className="border-b-2 border-[#e4edf1] bg-[#f6fbfc] px-4 py-3 text-sm font-extrabold text-[#263238]">{title}</figcaption>
      ) : null}
      <div className="min-h-44 overflow-x-auto p-4">
        {state.status === "loading" ? (
          <div className="flex min-h-36 items-center justify-center text-sm font-bold text-[#68737d]">Rendering diagram</div>
        ) : null}
        {state.status === "ready" ? (
          <div
            className="min-w-[38rem] [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
            data-testid="mermaid-diagram"
            dangerouslySetInnerHTML={{ __html: state.svg }}
          />
        ) : null}
        {state.status === "error" ? (
          <div className="flex min-h-36 flex-col justify-center gap-3 text-sm text-[#d83a52]" data-testid="mermaid-error">
            <span className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Diagram error
            </span>
            <span className="text-[#68737d]">{state.message}</span>
          </div>
        ) : null}
      </div>
      <details className="border-t-2 border-[#e4edf1] px-4 py-3 text-sm text-[#68737d]">
        <summary className="inline-flex cursor-pointer items-center gap-2 font-extrabold text-[#263238]">
          <Code2 className="h-4 w-4" aria-hidden="true" />
          Source
        </summary>
        <pre className="mt-3 max-h-80 overflow-auto rounded-lg border-2 border-[#d5e2e8] bg-[#f6fbfc] p-3 text-xs leading-6 text-[#263238]">
          <code>{source}</code>
        </pre>
      </details>
    </figure>
  );
}
