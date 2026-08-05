import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { QuestionnaireExercise } from "@/lib/practice/questionnaire";
import { QuestionnaireSession } from "./QuestionnaireSession";

const base = {
  id: "questionnaire-test",
  slug: "programming/questionnaire-test",
  title: "Questionnaire Test",
  documentSlug: "programming/python-runtime-model",
  concept: "Testing",
  difficulty: "practitioner" as const,
  tags: ["testing"],
  status: "published" as const,
  route: "/practice/programming/questionnaire-test",
  sourcePath: "fixture.json",
  contentHash: "hash",
  type: "questionnaire" as const,
};

function exercise(question: QuestionnaireExercise["questions"][number]): QuestionnaireExercise {
  return { ...base, questions: [question] };
}

async function ready() {
  await waitFor(() => expect(screen.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true"));
}

describe("QuestionnaireSession question kinds", () => {
  it("completes, restarts, and exposes next navigation", async () => {
    const onProgressEvent = vi.fn();
    render(<QuestionnaireSession
      exercise={exercise({
        id: "choice", kind: "choice", prompt: "Pick B", explanation: "B is correct.",
        options: [{ id: "a", label: "A", isCorrect: false }, { id: "b", label: "B", isCorrect: true }],
      })}
      nextHref="/next"
      onProgressEvent={onProgressEvent}
    />);
    await ready();
    fireEvent.click(screen.getByLabelText("B"));
    fireEvent.click(screen.getByTestId("questionnaire-check"));
    expect(screen.getByTestId("questionnaire-feedback")).toHaveTextContent("Correct");
    fireEvent.click(screen.getByTestId("questionnaire-finish"));
    expect(screen.getByTestId("questionnaire-complete")).toHaveTextContent("Refresh complete");
    expect(screen.getByRole("link", { name: /next node/i })).toHaveAttribute("href", "/next");
    expect(onProgressEvent).toHaveBeenCalledWith("completed", { questionIndex: 0, totalQuestions: 1 });
    fireEvent.click(screen.getByRole("button", { name: /restart/i }));
    expect(screen.getByTestId("questionnaire-session")).toBeVisible();
  });

  it("checks cloze input and displays the correct answer", async () => {
    render(<QuestionnaireSession exercise={exercise({
      id: "cloze", kind: "cloze", prompt: "Fill it", template: "Use {{blank}} here",
      acceptedAnswers: ["runtime validation"], explanation: "Validate boundaries.",
    })} />);
    await ready();
    fireEvent.change(screen.getByTestId("questionnaire-cloze-answer-input"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByTestId("questionnaire-check"));
    expect(screen.getByTestId("questionnaire-feedback")).toHaveTextContent("runtime validation");
  });

  it("reorders items through delegated accessible controls", async () => {
    render(<QuestionnaireSession exercise={exercise({
      id: "ordering", kind: "ordering", prompt: "Order steps", explanation: "One then two.",
      items: [{ id: "one", label: "One" }, { id: "two", label: "Two" }], correctOrder: ["two", "one"],
    })} />);
    await ready();
    fireEvent.click(screen.getByRole("button", { name: "Move One down" }));
    fireEvent.click(screen.getByTestId("questionnaire-check"));
    expect(screen.getByTestId("questionnaire-feedback")).toHaveTextContent("Correct");
  });

  it("matches paired items with the shared dropdown", async () => {
    render(<QuestionnaireSession exercise={exercise({
      id: "matching", kind: "matching", prompt: "Match terms", explanation: "Match each term.",
      pairs: [
        { id: "cache", prompt: "Cache", match: "Fast lookup" },
        { id: "queue", prompt: "Queue", match: "Ordered work" },
      ],
    })} />);
    await ready();
    const trigger = screen.getByTestId("questionnaire-match-cache");
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: "mouse" });
    fireEvent.click(await screen.findByRole("option", { name: "Fast lookup" }));
    const secondTrigger = screen.getByTestId("questionnaire-match-queue");
    fireEvent.pointerDown(secondTrigger, { button: 0, ctrlKey: false, pointerType: "mouse" });
    fireEvent.click(await screen.findByRole("option", { name: "Ordered work" }));
    fireEvent.click(screen.getByTestId("questionnaire-check"));
    expect(screen.getByTestId("questionnaire-feedback")).toHaveTextContent("Correct");
  });
});
