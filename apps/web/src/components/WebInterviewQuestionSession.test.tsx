import { fireEvent, render, screen } from "@testing-library/react";
import { getInterviewQuestionBySlug } from "@codematica/core";
import { describe, expect, it, vi } from "vitest";
import { WebInterviewQuestionSession } from "./WebInterviewQuestionSession";

vi.mock("next/dynamic", () => ({
  default: () => ({ project, projectId }: { project: { activeFile: string }; projectId: string }) => (
    <div data-testid="mock-web-playground" data-project-id={projectId}>{project.activeFile}</div>
  ),
}));

vi.mock("@/lib/progress/client", () => ({ recordProgress: vi.fn() }));

describe("WebInterviewQuestionSession", () => {
  it("shows the evaluation guide and switches among all runnable approaches", () => {
    const question = getInterviewQuestionBySlug("real-world", "mondrian-composition-generator");
    expect(question?.kind).toBe("web");

    render(<WebInterviewQuestionSession question={question as Extract<NonNullable<typeof question>, { kind: "web" }>} />);

    expect(screen.getByTestId("interview-evaluation-guide")).toHaveTextContent("ambiguous visual request");
    expect(screen.getByText("Hardcodes one painting")).toBeVisible();
    expect(screen.getByTestId("web-solution-detail")).toHaveTextContent("Weighted CSS Grid");
    expect(screen.getByTestId("mock-web-playground")).toHaveTextContent("/App.tsx");

    fireEvent.click(screen.getByTestId("web-solution-tab-recursive-rectangular-subdivision"));
    expect(screen.getByTestId("web-solution-detail")).toHaveTextContent("Recursive Rectangular Subdivision");

    fireEvent.click(screen.getByTestId("web-solution-tab-responsive-svg-geometry"));
    expect(screen.getByTestId("web-solution-detail")).toHaveTextContent("Responsive SVG Geometry");
    expect(screen.getByText(/precise invariants/i)).toBeVisible();
  });
});
