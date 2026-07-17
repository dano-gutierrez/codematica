import { describe, expect, it } from "vitest";
import { buildPassiveFlashcardWindow, shufflePassiveFlashcards } from "./passive";

const cards = [
  { id: "first", title: "First" },
  { id: "second", title: "Second" },
  { id: "third", title: "Third" },
  { id: "fourth", title: "Fourth" },
];

describe("passive flashcard helpers", () => {
  it("shuffles cards deterministically for one session", () => {
    const randomValues = [0.99, 0.01, 0.5];

    expect(shufflePassiveFlashcards(cards, () => randomValues.shift() ?? 0.5).map((card) => card.id)).toEqual(["third", "second", "first", "fourth"]);
    expect(cards.map((card) => card.id)).toEqual(["first", "second", "third", "fourth"]);
  });

  it("builds an infinite window by repeating the session deck in order", () => {
    const window = buildPassiveFlashcardWindow(cards.slice(0, 2), 5);

    expect(window.map((item) => item.card.id)).toEqual(["first", "second", "first", "second", "first"]);
    expect(window.map((item) => item.sequenceIndex)).toEqual([0, 1, 2, 3, 4]);
    expect(window.map((item) => item.instanceId)).toEqual(["first-0", "second-1", "first-2", "second-3", "first-4"]);
  });

  it("returns an empty window for an empty deck", () => {
    expect(buildPassiveFlashcardWindow([], 5)).toEqual([]);
  });
});
