import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownRenderer } from "./MarkdownRenderer";

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
});
