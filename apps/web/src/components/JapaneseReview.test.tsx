import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLearningPathBySlug } from "@codematica/core";
import { JapaneseReview } from "./JapaneseReview";

describe("JapaneseReview", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("keeps every skill card available and exposes substantive N5 practice modes", async () => {
    const path = getLearningPathBySlug("japanese-foundations")!;
    render(<JapaneseReview learningPath={path} />);
    await act(async () => undefined);

    expect(screen.getByTestId("japanese-review-browser")).toBeVisible();
    expect(screen.getByRole("link", { name: /flashcards/i })).toHaveAttribute("href", "/languages/japanese/review/flashcards");
    expect(screen.getByRole("link", { name: /open-answer writing/i })).toHaveAttribute("href", "/languages/japanese/review/writing");
    expect(screen.queryByRole("link", { name: /audio/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("Kana sounds and rhythm").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Good" }));

    const saved = JSON.parse(window.localStorage.getItem("codematica:japanese-skill-progress:v1") ?? "[]");
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ skillId: "kana-listening", reviewBox: 1, attemptCount: 1 });
    expect(screen.getByRole("button", { name: "Good" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Again" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("status")).toHaveTextContent(/Good saved/i);
  });

  it("counts one rating per recall and requires an explicit reset before another attempt", async () => {
    const path = getLearningPathBySlug("japanese-foundations")!;
    render(<JapaneseReview learningPath={path} />);
    await act(async () => undefined);

    const good = screen.getByRole("button", { name: "Good" });
    fireEvent.click(good);
    fireEvent.click(good);

    expect(good).toBeDisabled();
    expect(JSON.parse(window.localStorage.getItem("codematica:japanese-skill-progress:v1") ?? "[]")[0]).toMatchObject({
      reviewBox: 1,
      attemptCount: 1,
    });

    fireEvent.click(screen.getByRole("button", { name: "Practice again" }));
    expect(screen.getByRole("button", { name: "Good" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Good" })).toHaveAttribute("aria-pressed", "false");
  });

  it("recovers from malformed local review state", async () => {
    window.localStorage.setItem("codematica:japanese-skill-progress:v1", "{");
    const path = getLearningPathBySlug("japanese-foundations")!;
    render(<JapaneseReview learningPath={path} />);
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
    render(<JapaneseReview learningPath={path} />);

    await waitFor(() => expect(screen.getByText(/Box 2 · learning/i)).toBeVisible());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/progress/skills", expect.objectContaining({ method: "POST" })));
  });

  it("does not let a delayed remote snapshot overwrite a rating made on the open screen", async () => {
    let resolveRemote!: (response: Response) => void;
    const remoteResponse = new Promise<Response>((resolve) => {
      resolveRemote = resolve;
    });
    vi.spyOn(globalThis, "fetch")
      .mockReturnValueOnce(remoteResponse)
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const path = getLearningPathBySlug("japanese-foundations")!;
    render(<JapaneseReview learningPath={path} />);
    await act(async () => undefined);

    fireEvent.click(screen.getByRole("button", { name: "Good" }));
    resolveRemote(new Response(JSON.stringify({
      isSignedIn: true,
      items: [{
        pathSlug: "japanese-foundations", skillId: "kana-listening", bestScore: 0.6,
        attemptCount: 3, reviewBox: 2, masteryState: "learning",
        lastPracticedAt: "2026-08-04T00:00:00.000Z", nextReviewAt: "2026-08-05T00:00:00.000Z",
      }],
    }), { status: 200 }));

    await waitFor(() => expect(screen.getByText(/Best 85% · box 1/i)).toBeVisible());
    expect(JSON.parse(window.localStorage.getItem("codematica:japanese-skill-progress:v1") ?? "[]")[0]).toMatchObject({
      bestScore: 0.85,
      reviewBox: 1,
    });
  });

it("keeps a failed local rating in memory and retries saving without counting another recall", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 401 }));
  const write = window.Storage.prototype.setItem;
  let fail = true;
  const set = vi.spyOn(window.Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
    if (key === "codematica:japanese-skill-progress:v1" && fail) { fail = false; throw new Error("full"); }
    write.call(this, key, value);
  });
  render(<JapaneseReview learningPath={getLearningPathBySlug("japanese-foundations")!} />);
  await act(async () => undefined);
  fireEvent.click(screen.getByRole("button", { name: "Good" }));
  expect(set.mock.calls.filter(([key]) => key === "codematica:japanese-skill-progress:v1")).toHaveLength(1);
  expect(screen.getByRole("status")).toHaveTextContent(/couldn't save on this device/i);
  expect(screen.getByRole("status")).not.toHaveTextContent(/Good saved/);
  expect(screen.getByRole("button", { name: "Good" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Retry saving" }));
  expect(set.mock.calls.filter(([key]) => key === "codematica:japanese-skill-progress:v1")).toHaveLength(2);
  const saved = JSON.parse(localStorage.getItem("codematica:japanese-skill-progress:v1") ?? "[]");
  expect(saved[0]).toMatchObject({ attemptCount: 1, reviewBox: 1 });
  expect(screen.getByRole("status")).toHaveTextContent(/Good saved/);
});

});
