import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownRenderer } from "./MarkdownRenderer";

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

describe("MarkdownRenderer", () => {
  it("renders markdown headings with stable ids", () => {
    render(<MarkdownRenderer markdown={"## Operational Tests\n\nA paragraph."} />);

    expect(screen.getByRole("heading", { name: "Operational Tests" })).toHaveAttribute("id", "operational-tests");
    expect(screen.getByText("A paragraph.")).toBeInTheDocument();
  });

  it("does not execute raw html from markdown", () => {
    render(<MarkdownRenderer markdown={"<script>alert('no')</script>\n\nSafe text."} />);

    expect(screen.getByText("Safe text.")).toBeInTheDocument();
    expect(screen.queryByText("alert('no')")).not.toBeInTheDocument();
  });

  it("themes fenced code blocks by language", () => {
    render(<MarkdownRenderer markdown={"```python\ndef total(items):\n    return sum(items)\n```"} />);

    expect(screen.getByText("Python")).toBeVisible();
    expect(screen.getByText("total").closest("code")).toHaveTextContent("def total(items):");
  });

  it("renders complexity-flow blocks as interactive walkthroughs", () => {
    render(
      <MarkdownRenderer
        markdown={`\`\`\`complexity-flow
{
  "id": "lookup-comparison",
  "title": "Membership Lookup Tradeoff",
  "scenario": "Compare a list scan with a prebuilt set lookup.",
  "variants": [
    {
      "id": "list-scan",
      "label": "List scan",
      "complexity": "O(n)",
      "summary": "Scan each item until the answer appears.",
      "operationCounts": [1, 2],
      "code": {
        "language": "typescript",
        "label": "Linear lookup",
        "source": "permissions.includes(requiredPermission)"
      },
      "nodes": [
        {
          "id": "request",
          "label": "Request",
          "kind": "input",
          "description": "One lookup request.",
          "position": { "x": 0, "y": 0 }
        },
        {
          "id": "scan",
          "label": "Scan list",
          "kind": "operation",
          "description": "Check values one by one.",
          "position": { "x": 220, "y": 0 }
        }
      ],
      "edges": [
        { "id": "request-scan", "source": "request", "target": "scan", "label": "iterate" }
      ],
      "steps": [
        {
          "id": "start",
          "title": "Start the scan",
          "description": "The list length controls the possible work.",
          "activeNodeIds": ["request"],
          "activeEdgeIds": []
        },
        {
          "id": "compare",
          "title": "Compare values",
          "description": "Each miss adds one more operation.",
          "activeNodeIds": ["scan"],
          "activeEdgeIds": ["request-scan"]
        }
      ]
    },
    {
      "id": "set-lookup",
      "label": "Prebuilt set",
      "complexity": "O(1) per query",
      "summary": "Use an index when the same data is queried repeatedly.",
      "operationCounts": [1],
      "nodes": [
        {
          "id": "set",
          "label": "Permission set",
          "kind": "data",
          "description": "A hash-backed set.",
          "position": { "x": 0, "y": 0 }
        },
        {
          "id": "answer",
          "label": "Answer",
          "kind": "result",
          "description": "Flat lookup work.",
          "position": { "x": 220, "y": 0 }
        }
      ],
      "edges": [
        { "id": "set-answer", "source": "set", "target": "answer", "label": "hash" }
      ],
      "steps": [
        {
          "id": "lookup",
          "title": "Lookup once",
          "description": "The query does not scan every item.",
          "activeNodeIds": ["set", "answer"],
          "activeEdgeIds": ["set-answer"]
        }
      ]
    }
  ]
}
\`\`\``}
      />,
    );

    expect(screen.getByTestId("complexity-flow-block")).toHaveTextContent("Membership Lookup Tradeoff");
    expect(screen.getByRole("button", { name: "List scan" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Prebuilt set" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("complexity-flow-operation-count")).toHaveTextContent("Operations 1");
    expect(screen.getByTestId("react-flow-mock")).toBeVisible();
    expect(screen.getByText("Linear lookup").closest("figure")).toHaveTextContent("permissions.includes(requiredPermission)");
  });
});
