import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComplexityFlowBlock } from "./ComplexityFlowBlock";
import type { ComplexityFlowBlock as ComplexityFlowBlockData } from "@/lib/content/schema";

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
        <div key={node.id} data-testid={`complexity-flow-node-${node.id}`} data-active={String(node.data.isActive)}>
          {node.data.label}
        </div>
      ))}
      {edges.map((edge) => (
        <div key={edge.id} data-testid={`complexity-flow-edge-${edge.id}`} data-animated={String(edge.animated)}>
          {edge.label}
        </div>
      ))}
    </div>
  ),
}));

const flow = {
  id: "lookup-comparison",
  title: "Membership Lookup Tradeoff",
  scenario: "Compare a list scan with a prebuilt set lookup for repeated permission checks.",
  variants: [
    {
      id: "list-scan",
      label: "List scan",
      complexity: "O(n)",
      summary: "A miss may inspect every permission.",
      operationCounts: [1, 2, 3],
      code: {
        language: "typescript",
        label: "Linear lookup",
        source: "permissions.includes(requiredPermission)",
      },
      nodes: [
        {
          id: "request",
          label: "Request",
          kind: "input",
          description: "A lookup request.",
          position: { x: 0, y: 0 },
        },
        {
          id: "scan",
          label: "Scan list",
          kind: "operation",
          description: "Compare list values.",
          position: { x: 220, y: 0 },
        },
      ],
      edges: [{ id: "request-scan", source: "request", target: "scan", label: "iterate" }],
      steps: [
        {
          id: "read-request",
          title: "Read request",
          description: "The required permission arrives.",
          activeNodeIds: ["request"],
          activeEdgeIds: [],
        },
        {
          id: "compare-one",
          title: "Compare one value",
          description: "A miss keeps the scan moving.",
          activeNodeIds: ["scan"],
          activeEdgeIds: ["request-scan"],
        },
        {
          id: "finish",
          title: "Finish the scan",
          description: "Worst case reaches the end.",
          activeNodeIds: ["scan"],
          activeEdgeIds: ["request-scan"],
        },
      ],
    },
    {
      id: "set-lookup",
      label: "Prebuilt set",
      complexity: "O(1) per query",
      summary: "Build an index once and query it repeatedly.",
      operationCounts: [1],
      nodes: [
        {
          id: "set",
          label: "Set",
          kind: "data",
          description: "A hash-backed set.",
          position: { x: 0, y: 0 },
        },
        {
          id: "answer",
          label: "Answer",
          kind: "result",
          description: "Flat membership result.",
          position: { x: 220, y: 0 },
        },
      ],
      edges: [{ id: "set-answer", source: "set", target: "answer", label: "hash" }],
      steps: [
        {
          id: "lookup",
          title: "Lookup once",
          description: "The set lookup does not scan every item.",
          activeNodeIds: ["set", "answer"],
          activeEdgeIds: ["set-answer"],
        },
      ],
    },
  ],
} satisfies ComplexityFlowBlockData;

describe("ComplexityFlowBlock", () => {
  it("advances steps and updates active graph state", () => {
    render(<ComplexityFlowBlock flow={flow} />);

    expect(screen.getByTestId("complexity-flow-block")).toHaveTextContent("Membership Lookup Tradeoff");
    expect(screen.getByRole("heading", { name: "Read request" })).toBeVisible();
    expect(screen.getByTestId("complexity-flow-node-request")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("complexity-flow-edge-request-scan")).toHaveAttribute("data-animated", "false");
    expect(screen.getByTestId("complexity-flow-operation-count")).toHaveTextContent("Operations 1");

    fireEvent.click(screen.getByTestId("complexity-flow-step-next"));

    expect(screen.getByRole("heading", { name: "Compare one value" })).toBeVisible();
    expect(screen.getByTestId("complexity-flow-node-request")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("complexity-flow-node-scan")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("complexity-flow-edge-request-scan")).toHaveAttribute("data-animated", "true");
    expect(screen.getByTestId("complexity-flow-operation-count")).toHaveTextContent("Operations 2");
  });

  it("switches variants and resets to the first step", () => {
    render(<ComplexityFlowBlock flow={flow} />);

    fireEvent.click(screen.getByTestId("complexity-flow-step-next"));
    fireEvent.click(screen.getByRole("button", { name: "Prebuilt set" }));

    expect(screen.getByRole("button", { name: "Prebuilt set" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Lookup once" })).toBeVisible();
    expect(screen.getByTestId("complexity-flow-node-set")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("complexity-flow-operation-count")).toHaveTextContent("Operations 1");
    expect(screen.queryByText("permissions.includes(requiredPermission)")).not.toBeInTheDocument();
  });
});
