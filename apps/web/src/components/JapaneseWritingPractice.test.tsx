import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLanguageCharacterBySlug } from "@codematica/core";
import { JapaneseWritingPractice } from "./JapaneseWritingPractice";

describe("JapaneseWritingPractice", () => {
  beforeEach(() => {
    vi.spyOn(SVGSVGElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, toJSON: () => ({}),
    });
    Object.defineProperty(SVGSVGElement.prototype, "setPointerCapture", { configurable: true, value: vi.fn() });
    Object.defineProperty(SVGSVGElement.prototype, "hasPointerCapture", { configurable: true, value: vi.fn(() => false) });
  });

  afterEach(() => vi.restoreAllMocks());

  it("rejects a missed assisted stroke without advancing", () => {
    const character = getLanguageCharacterBySlug("japanese/kanji/one");
    expect(character).toBeDefined();
    render(<JapaneseWritingPractice characters={[character!]} prompt="Write one." />);

    const pad = screen.getByTestId("writing-pad");
    fireEvent.pointerDown(pad, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(pad, { pointerId: 1, clientX: 90, clientY: 10 });
    fireEvent.pointerUp(pad, { pointerId: 1, clientX: 90, clientY: 10 });

    expect(screen.getByTestId("writing-assisted-feedback")).toHaveTextContent("Try stroke 1 again");
    expect(screen.getByTestId("writing-check")).toBeDisabled();
  });

  it("accepts a rough assisted trace and includes the pointer release position", () => {
    const character = getLanguageCharacterBySlug("japanese/kanji/one");
    render(<JapaneseWritingPractice characters={[character!]} prompt="Write one." />);

    const pad = screen.getByTestId("writing-pad");
    fireEvent.pointerDown(pad, { pointerId: 1, clientX: 24, clientY: 64 });
    fireEvent.pointerMove(pad, { pointerId: 1, clientX: 50, clientY: 65 });
    fireEvent.pointerUp(pad, { pointerId: 1, clientX: 77, clientY: 62 });

    expect(screen.queryByTestId("writing-assisted-feedback")).not.toBeInTheDocument();
    expect(screen.getByTestId("writing-check")).toBeEnabled();
  });

  it("shows learner romaji and distinct IME input", () => {
    const character = getLanguageCharacterBySlug("japanese/hiragana/wo");
    render(<JapaneseWritingPractice characters={[character!]} prompt="Write the particle." />);

    expect(screen.getByText("o /o/")).toBeVisible();
    expect(screen.getByText("IME: wo")).toBeVisible();
  });

  it("completes free-mode characters, supports undo, and advances", () => {
    const character = getLanguageCharacterBySlug("japanese/kanji/one")!;
    const onProgressEvent = vi.fn();
    render(<JapaneseWritingPractice characters={[character, character]} prompt="Write one twice." onProgressEvent={onProgressEvent} nextHref="/next" />);
    fireEvent.click(screen.getByTestId("writing-mode-free"));

    const drawStroke = () => {
      const pad = screen.getByTestId("writing-pad");
      fireEvent.pointerDown(pad, { pointerId: 2, clientX: 18, clientY: 50 });
      fireEvent.pointerMove(pad, { pointerId: 2, clientX: 82, clientY: 50 });
      fireEvent.pointerUp(pad, { pointerId: 2, clientX: 82, clientY: 50 });
    };

    drawStroke();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByTestId("writing-check")).toBeDisabled();
    drawStroke();
    fireEvent.click(screen.getByTestId("writing-check"));
    expect(screen.getByTestId("writing-feedback")).toHaveTextContent("Correct");
    fireEvent.click(screen.getByTestId("writing-next-character"));
    expect(onProgressEvent).toHaveBeenCalledWith("started", expect.objectContaining({ characterSlug: character.slug }));

    drawStroke();
    fireEvent.click(screen.getByTestId("writing-check"));
    expect(onProgressEvent).toHaveBeenCalledWith("completed", expect.objectContaining({ passed: true }));
    expect(screen.getByRole("link", { name: /next node/i })).toHaveAttribute("href", "/next");
  });

  it("accepts a recognizable imperfect multi-stroke character in free mode", () => {
    const character = getLanguageCharacterBySlug("japanese/hiragana/a")!;
    render(<JapaneseWritingPractice characters={[character]} prompt="Write a." />);
    fireEvent.click(screen.getByTestId("writing-mode-free"));

    const pad = screen.getByTestId("writing-pad");
    const drawStroke = (points: Array<[number, number]>, pointerId: number) => {
      fireEvent.pointerDown(pad, { pointerId, clientX: points[0]![0], clientY: points[0]![1] });
      points.slice(1, -1).forEach(([clientX, clientY]) => fireEvent.pointerMove(pad, { pointerId, clientX, clientY }));
      const [clientX, clientY] = points.at(-1)!;
      fireEvent.pointerUp(pad, { pointerId, clientX, clientY });
    };

    drawStroke([[28, 44], [63, 42]], 1);
    drawStroke([[60, 25], [54, 74]], 2);
    drawStroke([[76, 54], [60, 80], [38, 75], [67, 57]], 3);
    fireEvent.click(screen.getByTestId("writing-check"));

    expect(screen.getByTestId("writing-feedback")).toHaveTextContent("Correct");
  });

  it("renders a stable empty state when a writing exercise has no characters", () => {
    render(<JapaneseWritingPractice characters={[]} prompt="Nothing to write." />);
    expect(screen.getByText(/no available characters/i)).toBeVisible();
  });
});
