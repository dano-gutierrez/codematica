import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { getContentIndex, getLearningPathBySlug } from "@codematica/core";
import { JapaneseReview } from "./JapaneseReview";

describe("JapaneseReview", () => {
  beforeEach(() => window.localStorage.clear());

  it("keeps every skill card available and persists a review rating", () => {
    const path = getLearningPathBySlug("japanese-foundations")!;
    render(<JapaneseReview index={getContentIndex()} learningPath={path} />);

    expect(screen.getByTestId("japanese-review-browser")).toBeVisible();
    expect(screen.getByRole("link", { name: /Browse all flashcards/ })).toHaveAttribute("href", "/paths/japanese-foundations/flashcards");
    expect(screen.getAllByText("Kana sounds and rhythm").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Good" }));

    const saved = JSON.parse(window.localStorage.getItem("codematica:japanese-skill-progress:v1") ?? "[]");
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ skillId: "kana-listening", reviewBox: 1, attemptCount: 1 });
  });
});
