import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CaseStudyFlow } from "./CaseStudyFlow";
import type { CaseStudyFlow as CaseStudyFlowData } from "@/lib/content/schema";

vi.mock("@xyflow/react", () => ({
  Background: () => <div data-testid="react-flow-background" />,
  Controls: () => <div data-testid="react-flow-controls" />,
  MarkerType: { ArrowClosed: "arrowclosed" },
  ReactFlow: ({
    nodes,
    edges,
  }: {
    nodes: Array<{ id: string; data: { label: string; isActive: boolean } }>;
    edges: Array<{ id: string; label?: string; animated?: boolean }>;
  }) => (
    <div data-testid="react-flow-mock">
      {nodes.map((node) => (
        <div key={node.id} data-testid={`case-study-flow-node-${node.id}`} data-active={String(node.data.isActive)}>
          {node.data.label}
        </div>
      ))}
      {edges.map((edge) => (
        <div key={edge.id} data-testid={`case-study-flow-edge-${edge.id}`} data-animated={String(edge.animated)}>
          {edge.label}
        </div>
      ))}
    </div>
  ),
}));

const flow = {
  id: "flow-netflix",
  slug: "system-design/netflix-data-feedback-loop",
  title: "Netflix Data Feedback Loop",
  summary: "A walkthrough of streaming, warehouse, and feedback-loop architecture.",
  route: "/docs/system-design/netflix-data-feedback-loop#case-study-flow",
  sourcePath: "content/case-studies/system-design/netflix-data-feedback-loop.json",
  contentHash: "hash",
  nodes: [
    {
      id: "device-events",
      label: "Device events",
      kind: "source",
      description: "Playback, search, and impression events from member devices.",
      position: { x: 0, y: 80 },
    },
    {
      id: "keystone",
      label: "Keystone + Kafka",
      kind: "stream",
      description: "The streaming backbone that accepts and routes events.",
      position: { x: 240, y: 80 },
    },
    {
      id: "models",
      label: "Recommendation models",
      kind: "ml",
      description: "Models that turn interaction history into personalization features.",
      position: { x: 480, y: 80 },
    },
  ],
  edges: [
    { id: "events-keystone", source: "device-events", target: "keystone", label: "events" },
    { id: "keystone-models", source: "keystone", target: "models", label: "features" },
  ],
  steps: [
    {
      id: "ingest",
      title: "Ingest member behavior",
      description: "Events enter the stream before they are useful to analytics or ML.",
      activeNodeIds: ["device-events", "keystone"],
      activeEdgeIds: ["events-keystone"],
    },
    {
      id: "feedback-loop",
      title: "Retrain product decisions",
      description: "Fresh behavior becomes features for recommendation models.",
      activeNodeIds: ["keystone", "models"],
      activeEdgeIds: ["keystone-models"],
    },
  ],
} satisfies CaseStudyFlowData;

describe("CaseStudyFlow", () => {
  it("advances active nodes and animated edges through the walkthrough", () => {
    render(<CaseStudyFlow flow={flow} />);

    expect(screen.getByTestId("case-study-flow")).toHaveTextContent("Netflix Data Feedback Loop");
    expect(screen.getByRole("heading", { name: "Ingest member behavior" })).toBeVisible();
    expect(screen.getByTestId("case-study-flow-node-device-events")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("case-study-flow-edge-events-keystone")).toHaveAttribute("data-animated", "true");
    expect(screen.getByTestId("case-study-flow-edge-keystone-models")).toHaveAttribute("data-animated", "false");

    fireEvent.click(screen.getByTestId("case-study-flow-step-next"));

    expect(screen.getByRole("heading", { name: "Retrain product decisions" })).toBeVisible();
    expect(screen.getByText("Fresh behavior becomes features for recommendation models.")).toBeVisible();
    expect(screen.getByTestId("case-study-flow-node-device-events")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("case-study-flow-node-models")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("case-study-flow-edge-keystone-models")).toHaveAttribute("data-animated", "true");
  });
});
