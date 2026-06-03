"use client";

import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { Pause, Play, RotateCcw, StepBack, StepForward } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CodeBlock } from "@/components/CodeBlock";
import type { ComplexityFlowBlock as ComplexityFlowBlockData, ComplexityFlowNodeKind } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

const nodeKindStyles: Record<ComplexityFlowNodeKind, string> = {
  data: "border-[#9cc7ff] bg-[#edf5ff] text-[#245fba]",
  decision: "border-[#ffd86b] bg-[#fff5d6] text-[#7a5200]",
  input: "border-[#6dd8cf] bg-[#e8f8f6] text-[#00645f]",
  operation: "border-[#c8b8ff] bg-[#f3efff] text-[#5840b8]",
  result: "border-[#d5e2e8] bg-white text-[#263238]",
};

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

function getReducedMotionSnapshot() {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.(reducedMotionQuery).matches);
}

function getReducedMotionServerSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeToReducedMotion, getReducedMotionSnapshot, getReducedMotionServerSnapshot);
}

export function ComplexityFlowBlock({ flow }: { flow: ComplexityFlowBlockData }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeVariant = flow.variants[activeVariantIndex] ?? flow.variants[0];
  const activeStep = activeVariant.steps[activeStepIndex] ?? activeVariant.steps[0];
  const activeNodeIds = useMemo(() => new Set(activeStep.activeNodeIds), [activeStep.activeNodeIds]);
  const activeEdgeIds = useMemo(() => new Set(activeStep.activeEdgeIds), [activeStep.activeEdgeIds]);
  const operationCount = activeVariant.operationCounts[activeStepIndex] ?? 0;
  const maxOperationCount = Math.max(...activeVariant.operationCounts, 1);
  const operationWidth = `${Math.max(8, (operationCount / maxOperationCount) * 100)}%`;

  useEffect(() => {
    if (!isPlaying || prefersReducedMotion || activeVariant.steps.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveStepIndex((current) => (current + 1) % activeVariant.steps.length);
    }, 2400);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeVariant.steps.length, isPlaying, prefersReducedMotion]);

  const nodes = useMemo<Node[]>(
    () =>
      activeVariant.nodes.map((node) => {
        const isActive = activeNodeIds.has(node.id);

        return {
          id: node.id,
          position: node.position,
          draggable: false,
          selectable: false,
          className: cn(
            "w-44 rounded-lg border-2 border-b-4 px-3 py-2 text-left shadow-sm transition",
            nodeKindStyles[node.kind],
            isActive ? "scale-[1.03] shadow-[0_6px_0_#d5e2e8]" : "opacity-65",
          ),
          data: {
            isActive,
            label: (
              <div>
                <div className="text-sm font-extrabold leading-5">{node.label}</div>
                <div className="mt-1 text-[0.68rem] font-bold uppercase leading-4 opacity-80">{node.kind}</div>
                <div className="mt-1 text-xs font-semibold leading-4 text-[#68737d]">{node.description}</div>
              </div>
            ),
          },
        };
      }),
    [activeNodeIds, activeVariant.nodes],
  );

  const edges = useMemo<Edge[]>(
    () =>
      activeVariant.edges.map((edge) => {
        const isActive = activeEdgeIds.has(edge.id);

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          type: "smoothstep",
          animated: isActive && !prefersReducedMotion,
          selectable: false,
          markerEnd: { type: MarkerType.ArrowClosed, color: isActive ? "#007c78" : "#94a3b8" },
          style: {
            stroke: isActive ? "#007c78" : "#94a3b8",
            strokeWidth: isActive ? 3 : 2,
          },
          labelStyle: {
            fill: isActive ? "#00645f" : "#68737d",
            fontWeight: 800,
          },
          labelBgStyle: {
            fill: "#ffffff",
            stroke: isActive ? "#6dd8cf" : "#d5e2e8",
            strokeWidth: 2,
          },
        };
      }),
    [activeEdgeIds, activeVariant.edges, prefersReducedMotion],
  );

  function goToStep(index: number) {
    setActiveStepIndex((index + activeVariant.steps.length) % activeVariant.steps.length);
  }

  function switchVariant(index: number) {
    setActiveVariantIndex(index);
    setActiveStepIndex(0);
    setIsPlaying(false);
  }

  return (
    <section className="my-6 overflow-hidden rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white" data-testid="complexity-flow-block">
      <div className="border-b-2 border-[#e4edf1] bg-[#f6fbfc] p-4">
        <p className="text-xs font-extrabold uppercase text-[#007c78]">Animated complexity flow</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-normal text-[#263238]">{flow.title}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#68737d]">{flow.scenario}</p>

        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label={`${flow.title} variants`}>
          {flow.variants.map((variant, index) => {
            const isActive = index === activeVariantIndex;

            return (
              <button
                key={variant.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => switchVariant(index)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-lg border-2 border-b-4 px-3 py-2 text-sm font-extrabold transition",
                  isActive
                    ? "border-[#00645f] bg-[#007c78] text-white"
                    : "border-[#d5e2e8] bg-white text-[#263238] hover:border-[#007c78]",
                )}
              >
                {variant.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 overflow-hidden rounded-lg border-2 border-[#d5e2e8] bg-white">
          <div className="h-[32rem] min-h-[26rem] w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              fitViewOptions={{ padding: 0.18 }}
              minZoom={0.2}
              maxZoom={1.4}
              nodesConnectable={false}
              nodesDraggable={false}
              elementsSelectable={false}
              panOnScroll
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#d5e2e8" gap={24} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </div>

        <aside className="grid h-fit gap-4">
          <section className="rounded-lg border-2 border-[#d5e2e8] bg-[#f6fbfc] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase text-[#68737d]">
                Step {activeStepIndex + 1} / {activeVariant.steps.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white text-[#263238]"
                  onClick={() => goToStep(0)}
                  aria-label="Restart complexity flow"
                  data-testid="complexity-flow-step-reset"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white text-[#263238]"
                  onClick={() => goToStep(activeStepIndex - 1)}
                  aria-label="Previous complexity step"
                  data-testid="complexity-flow-step-prev"
                >
                  <StepBack className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white text-[#263238]"
                  onClick={() => goToStep(activeStepIndex + 1)}
                  aria-label="Next complexity step"
                  data-testid="complexity-flow-step-next"
                >
                  <StepForward className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78] text-white disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => setIsPlaying((current) => !current)}
                  disabled={prefersReducedMotion}
                  aria-label={isPlaying ? "Pause complexity flow" : "Play complexity flow"}
                  data-testid="complexity-flow-play-toggle"
                >
                  {isPlaying ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <h3 className="mt-3 text-lg font-extrabold tracking-normal text-[#263238]">{activeStep.title}</h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#68737d]">{activeStep.description}</p>
          </section>

          <section className="rounded-lg border-2 border-[#d5e2e8] bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-extrabold uppercase text-[#68737d]">Complexity</p>
              <span className="rounded-lg bg-[#eaf7f4] px-2.5 py-1 text-xs font-extrabold text-[#007c78]">{activeVariant.complexity}</span>
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#33434b]">{activeVariant.summary}</p>
            <div className="mt-4" data-testid="complexity-flow-operation-count">
              <div className="flex items-center justify-between text-xs font-extrabold uppercase text-[#68737d]">
                <span>Operations {operationCount}</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e4edf1]">
                <div className="h-full rounded-full bg-[#245fba] transition-[width]" style={{ width: operationWidth }} />
              </div>
            </div>
          </section>

          {activeVariant.code ? (
            <CodeBlock
              code={activeVariant.code.source}
              language={activeVariant.code.language}
              label={activeVariant.code.label ?? activeVariant.code.language}
              className="max-h-80"
            />
          ) : null}
        </aside>
      </div>
    </section>
  );
}
