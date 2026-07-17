import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PassiveFlashcardFeed } from "./PassiveFlashcardFeed";
import type { PassiveFlashcardFeed as PassiveFlashcardFeedType } from "@/lib/content/schema";

declare global {
  interface Window {
    __codematicaPassiveFlashcardRandom?: () => number;
  }
}

const feed: PassiveFlashcardFeedType = {
  id: "feed-1",
  slug: "python-for-ts-js-engineers",
  pathSlug: "python-for-ts-js-engineers",
  title: "Python Flashcard Feed",
  summary: "Passive Python flashcards for short mobile refresh sessions.",
  audience: "TypeScript and JavaScript engineers refreshing senior Python concepts.",
  status: "published",
  route: "/paths/python-for-ts-js-engineers/flashcards",
  sourcePath: "content/flashcard-feeds/python-for-ts-js-engineers.json",
  contentHash: "hash",
  cards: [
    {
      id: "names-bind-objects",
      type: "concept",
      title: "Names Bind Objects",
      prompt: "Python variables are names bound to objects, not typed storage boxes.",
      explanation: "Assignment rebinds a name. Mutating a list through one name changes the shared object.",
      difficulty: "senior",
      tags: ["runtime", "objects"],
      sourceDocSlug: "programming/python-runtime-model",
    },
    {
      id: "annotations-are-metadata",
      type: "interview",
      title: "Annotations Are Metadata",
      prompt: "Do Python annotations enforce input values at runtime?",
      explanation: "No. Type checkers and tools use annotations, but runtime validation must be explicit.",
      difficulty: "senior",
      tags: ["typing", "validation"],
      sourceDocSlug: "programming/python-types-and-contracts",
      code: "def load_user(user_id: int) -> User:\n    ...",
    },
    {
      id: "blocking-io",
      type: "practical",
      title: "Blocking I/O In Async Code",
      prompt: "A blocking call inside an async handler can stall unrelated coroutines.",
      explanation: "Move blocking work to an executor or use an async-aware library when the event loop matters.",
      difficulty: "senior",
      tags: ["asyncio", "production"],
      sourceDocSlug: "programming/python-async-testing-production",
    },
  ],
};

afterEach(() => {
  delete window.__codematicaPassiveFlashcardRandom;
});

describe("PassiveFlashcardFeed", () => {
  it("renders passive cards without interactive practice controls", async () => {
    window.__codematicaPassiveFlashcardRandom = () => 0.99;

    render(<PassiveFlashcardFeed feed={feed} initialVisibleCount={2} appendCount={2} />);

    await waitFor(() => expect(screen.getByTestId("passive-flashcard-feed")).toHaveAttribute("data-ready", "true"));

    expect(screen.getByText("Names Bind Objects")).toBeVisible();
    expect(screen.getByText("Annotations Are Metadata")).toBeVisible();
    expect(screen.getByText("load_user").closest("code")).toHaveTextContent("def load_user(user_id: int) -> User:");
    expect(screen.queryByRole("button", { name: /reveal answer/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /check answer/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/question \d+ of/i)).not.toBeInTheDocument();
  });

  it("appends more passive cards as the user scrolls near the end", async () => {
    window.__codematicaPassiveFlashcardRandom = () => 0.99;
    const onProgressEvent = vi.fn();

    render(<PassiveFlashcardFeed feed={feed} initialVisibleCount={2} appendCount={2} onProgressEvent={onProgressEvent} />);

    const scroller = screen.getByTestId("passive-flashcard-feed");
    await waitFor(() => expect(scroller).toHaveAttribute("data-ready", "true"));

    Object.defineProperty(scroller, "scrollHeight", { configurable: true, value: 1200 });
    Object.defineProperty(scroller, "clientHeight", { configurable: true, value: 600 });
    Object.defineProperty(scroller, "scrollTop", { configurable: true, value: 500 });
    fireEvent.scroll(scroller);

    expect(screen.getByTestId("passive-flashcard-card-3")).toBeVisible();
    expect(onProgressEvent).toHaveBeenCalledWith("started", expect.objectContaining({ sequenceIndex: 1 }));
  });
});
