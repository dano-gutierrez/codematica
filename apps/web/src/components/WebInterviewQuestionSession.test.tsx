import { fireEvent, render, screen } from "@testing-library/react";
import { getInterviewQuestionBySlug } from "@codematica/core";
import { describe, expect, it, vi } from "vitest";
import { WebInterviewQuestionSession } from "./WebInterviewQuestionSession";

vi.mock("next/dynamic", () => ({
  default: () => ({ project, projectId }: { project: { activeFile: string }; projectId: string }) => (
    <div data-testid="mock-web-playground" data-project-id={projectId}>{project.activeFile}</div>
  ),
}));

vi.mock("@/lib/progress/client", () => ({ recordProgress: vi.fn(), appendPathToHref: (href: string, path?: string) => path ? `${href}?path=${path}` : href }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("path=frontend-interview-practice") }));

describe("WebInterviewQuestionSession", () => {
  it("renders each event-log recipe and complete Python companion through the shared controls", () => {
    const question = getInterviewQuestionBySlug("real-world", "partitioned-event-log");
    if (question?.kind !== "web") throw new Error("Missing event-log exercise");
    render(<WebInterviewQuestionSession question={question} />);
    for (const track of question.solutionTracks) {
      fireEvent.click(screen.getByTestId(`web-solution-tab-${track.id}`));
      expect(screen.getByTestId("web-recipe-position")).toHaveTextContent("Step 1 of 5");
      fireEvent.click(screen.getByRole("button", { name: "Show full solution" }));
      fireEvent.click(screen.getByRole("button", { name: "TypeScript" }));
      expect(screen.getByTestId("mock-web-playground")).toHaveTextContent("/log.ts");
      fireEvent.click(screen.getByRole("button", { name: "Python" }));
      expect(screen.getByTestId("web-python-companion")).toHaveTextContent("class EventLog:");
      expect(screen.getByTestId("web-python-companion")).toHaveTextContent("class KeyStore:");
    }
  });

  it("shows the evaluation guide and switches among all runnable approaches", () => {
    const question = getInterviewQuestionBySlug("real-world", "mondrian-composition-generator");
    expect(question?.kind).toBe("web");

    render(<WebInterviewQuestionSession question={question as Extract<NonNullable<typeof question>, { kind: "web" }>} />);

    expect(screen.getByTestId("interview-evaluation-guide")).toHaveTextContent("ambiguous visual request");
    expect(screen.getByText("Hardcodes one painting")).toBeVisible();
    expect(screen.getByTestId("web-solution-detail")).toHaveTextContent("Weighted CSS Grid");
    fireEvent.click(screen.getByRole("button", { name: "Show full solution" }));
    expect(screen.getByTestId("mock-web-playground")).toHaveTextContent("/App.tsx");

    fireEvent.click(screen.getByTestId("web-solution-tab-recursive-rectangular-subdivision"));
    expect(screen.getByTestId("web-solution-detail")).toHaveTextContent("Recursive Rectangular Subdivision");

    fireEvent.click(screen.getByTestId("web-solution-tab-responsive-svg-geometry"));
    expect(screen.getByTestId("web-solution-detail")).toHaveTextContent("Responsive SVG Geometry");
    fireEvent.click(screen.getByRole("button", { name: "Show full solution" }));
    expect(screen.getByText(/precise invariants/i)).toBeVisible();
  });

  it("reveals a recipe, switches language, and links to its path checkpoint", () => {
    const question = getInterviewQuestionBySlug("frontend-practice", "dynamic-board");
    if (question?.kind !== "web") throw new Error("Missing frontend challenge");
    render(<WebInterviewQuestionSession question={question} nextHrefsByPath={{ "frontend-interview-practice": "/practice/frontend/interview-dynamic-board-questionnaire?path=frontend-interview-practice" }} />);
    expect(screen.getByTestId("web-recipe-position")).toHaveTextContent("Step 1 of 4");
    expect(screen.queryByTestId("mock-web-playground")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next step" }));
    expect(screen.getByTestId("web-recipe-position")).toHaveTextContent("Step 2 of 4");
    fireEvent.click(screen.getByRole("button", { name: "Previous step" }));
    expect(screen.getByTestId("web-recipe-position")).toHaveTextContent("Step 1 of 4");
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole("button", { name: "Next step" }));
    fireEvent.click(screen.getByRole("button", { name: "Reveal solution" }));
    expect(screen.getByTestId("web-recipe-position")).toHaveTextContent("Full solution");
    fireEvent.click(screen.getByRole("button", { name: "Python" }));
    expect(screen.getByTestId("web-python-companion")).toHaveTextContent("def create_board");
    expect(screen.queryByTestId("mock-web-playground")).not.toBeInTheDocument();
    expect(screen.getByTestId("interview-next-node")).toHaveAttribute("href", expect.stringContaining("interview-dynamic-board-questionnaire"));
    fireEvent.click(screen.getByRole("button", { name: "TypeScript" }));
    expect(screen.getByTestId("mock-web-playground")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Restart recipe" }));
    expect(screen.queryByTestId("mock-web-playground")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("web-solution-tab-flat-indexes"));
    expect(screen.getByTestId("web-recipe-position")).toHaveTextContent("Step 1 of 4");
  });
});
