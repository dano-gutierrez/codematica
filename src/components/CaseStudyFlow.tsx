"use client";

import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { Pause, Play, RotateCcw, StepBack, StepForward } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { CaseStudyFlow as CaseStudyFlowData, CaseStudyFlowNodeKind } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

const nodeKindStyles: Record<CaseStudyFlowNodeKind, string> = {
  analytics: "border-[#6dd8cf] bg-[#e8f8f6] text-[#00645f]",
  compute: "border-[#9cc7ff] bg-[#edf5ff] text-[#245fba]",
  control: "border-[#d5e2e8] bg-[#f6fbfc] text-[#263238]",
  ml: "border-[#c8b8ff] bg-[#f3efff] text-[#5840b8]",
  product: "border-[#ffd86b] bg-[#fff5d6] text-[#7a5200]",
  serving: "border-[#9cc7ff] bg-[#edf5ff] text-[#245fba]",
  source: "border-[#ffd86b] bg-[#fff5d6] text-[#7a5200]",
  storage: "border-[#d5e2e8] bg-white text-[#263238]",
  stream: "border-[#6dd8cf] bg-[#e8f8f6] text-[#00645f]",
  warehouse: "border-[#d5e2e8] bg-white text-[#263238]",
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

export function CaseStudyFlow({ flow }: { flow: CaseStudyFlowData }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const activeStep = flow.steps[activeStepIndex] ?? flow.steps[0];
  const activeNodeIds = useMemo(() => new Set(activeStep.activeNodeIds), [activeStep.activeNodeIds]);
  const activeEdgeIds = useMemo(() => new Set(activeStep.activeEdgeIds), [activeStep.activeEdgeIds]);

  useEffect(() => {
    if (!isPlaying || prefersReducedMotion || flow.steps.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveStepIndex((current) => (current + 1) % flow.steps.length);
    }, 3200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [flow.steps.length, isPlaying, prefersReducedMotion]);

  const nodes = useMemo<Node[]>(
    () =>
      flow.nodes.map((node) => {
        const isActive = activeNodeIds.has(node.id);

        return {
          id: node.id,
          position: node.position,
          draggable: false,
          selectable: false,
          className: cn(
            "w-44 rounded-lg border-2 border-b-4 px-3 py-2 text-left shadow-sm transition",
            nodeKindStyles[node.kind],
            isActive ? "scale-[1.03] shadow-[0_6px_0_#d5e2e8]" : "opacity-70",
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
    [activeNodeIds, flow.nodes],
  );

  const edges = useMemo<Edge[]>(
    () =>
      flow.edges.map((edge) => {
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
    [activeEdgeIds, flow.edges, prefersReducedMotion],
  );

  function goToStep(index: number) {
    setActiveStepIndex((index + flow.steps.length) % flow.steps.length);
  }

  return (
    <section
      id="case-study-flow"
      className="mt-8 overflow-hidden rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white"
      data-testid="case-study-flow"
    >
      <div className="grid gap-4 border-b-2 border-[#e4edf1] bg-[#f6fbfc] p-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <p className="text-xs font-extrabold uppercase text-[#007c78]">Interactive architecture walkthrough</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-normal text-[#263238]">{flow.title}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#68737d]">{flow.summary}</p>
        </div>

        <div className="rounded-lg border-2 border-[#d5e2e8] bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase text-[#68737d]">
              Step {activeStepIndex + 1} / {flow.steps.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white text-[#263238]"
                onClick={() => goToStep(0)}
                aria-label="Restart walkthrough"
                data-testid="case-study-flow-step-reset"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white text-[#263238]"
                onClick={() => goToStep(activeStepIndex - 1)}
                aria-label="Previous step"
                data-testid="case-study-flow-step-prev"
              >
                <StepBack className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white text-[#263238]"
                onClick={() => goToStep(activeStepIndex + 1)}
                aria-label="Next step"
                data-testid="case-study-flow-step-next"
              >
                <StepForward className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78] text-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => setIsPlaying((current) => !current)}
                disabled={prefersReducedMotion}
                aria-label={isPlaying ? "Pause walkthrough" : "Play walkthrough"}
                data-testid="case-study-flow-play-toggle"
              >
                {isPlaying ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
          <h3 className="mt-3 text-lg font-extrabold tracking-normal text-[#263238]">{activeStep.title}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#68737d]">{activeStep.description}</p>
        </div>
      </div>

      <div className="h-[34rem] min-h-[28rem] w-full bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.12 }}
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
    </section>
  );
}
