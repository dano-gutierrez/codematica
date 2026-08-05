import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getContentIndex, getLearningPathBySlug } from "@codematica/core";
import { JapaneseReview } from "./JapaneseReview";

describe("JapaneseReview", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("keeps every skill card available and persists a review rating", async () => {
    const path = getLearningPathBySlug("japanese-foundations")!;
    render(<JapaneseReview index={getContentIndex()} learningPath={path} />);
    await act(async () => undefined);

    expect(screen.getByTestId("japanese-review-browser")).toBeVisible();
    expect(screen.getByRole("link", { name: /Browse all flashcards/ })).toHaveAttribute("href", "/paths/japanese-foundations/flashcards");
    expect(screen.getAllByText("Kana sounds and rhythm").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Good" }));

    const saved = JSON.parse(window.localStorage.getItem("codematica:japanese-skill-progress:v1") ?? "[]");
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ skillId: "kana-listening", reviewBox: 1, attemptCount: 1 });
  });

  it("recovers from malformed local review state", async () => {
    window.localStorage.setItem("codematica:japanese-skill-progress:v1", "{");
    const path = getLearningPathBySlug("japanese-foundations")!;
    render(<JapaneseReview index={getContentIndex()} learningPath={path} />);
    await act(async () => undefined);
    expect(screen.getByText("0 due now")).toBeVisible();
  });

  it("merges signed-in progress and syncs the local review copy", async () => {
    const remote = {
      pathSlug: "japanese-foundations", skillId: "kana-listening", bestScore: 0.9,
      attemptCount: 3, reviewBox: 2, masteryState: "learning",
      lastPracticedAt: "2026-08-04T00:00:00.000Z", nextReviewAt: "2026-08-05T00:00:00.000Z",
    };
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ isSignedIn: true, items: [remote] }), { status: 200 }))
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const path = getLearningPathBySlug("japanese-foundations")!;
    render(<JapaneseReview index={getContentIndex()} learningPath={path} />);

    await waitFor(() => expect(screen.getByText(/Box 2 · learning/i)).toBeVisible());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/progress/skills", expect.objectContaining({ method: "POST" })));
  });
});
