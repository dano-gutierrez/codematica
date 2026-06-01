import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PracticeCard } from "./PracticeCard";

const baseExercise = {
  id: "practice-1",
  slug: "system-design/cache-practice",
  title: "Cache Practice",
  documentSlug: "system-design/cache-invalidation",
  concept: "Cache invalidation",
  difficulty: "senior" as const,
  tags: ["caching"],
  status: "published" as const,
  route: "/practice/system-design/cache-practice",
  sourcePath: "content/exercises/system-design/cache-practice.json",
  contentHash: "hash",
};

describe("PracticeCard", () => {
  it("reveals flashcard answers on demand", () => {
    render(
      <PracticeCard
        exercise={{
          ...baseExercise,
          type: "flashcard",
          prompt: "What makes cache invalidation a product contract?",
          answer: "The acceptable stale state is a user-facing tradeoff.",
          explanation: "Freshness, latency, cost, and ownership define the product behavior.",
        }}
      />,
    );

    expect(screen.queryByText("The acceptable stale state is a user-facing tradeoff.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));

    expect(screen.getByText("The acceptable stale state is a user-facing tradeoff.")).toBeVisible();
    expect(screen.getByText("Freshness, latency, cost, and ownership define the product behavior.")).toBeVisible();
  });

  it("checks cloze answers case-insensitively after trimming", () => {
    render(
      <PracticeCard
        exercise={{
          ...baseExercise,
          type: "cloze",
          prompt: "Fill the gap.",
          template: "Use {{blank}} when derived cache deletion is unreliable.",
          acceptedAnswers: ["versioned keys"],
          explanation: "Versioned keys avoid needing to delete every derived key.",
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Answer"), { target: { value: "  VERSIONED KEYS  " } });
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Correct")).toBeVisible();
    expect(screen.getByText("Versioned keys avoid needing to delete every derived key.")).toBeVisible();
  });
});
