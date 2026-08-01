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

  it("shows learner romaji and distinct IME input", () => {
    const character = getLanguageCharacterBySlug("japanese/hiragana/wo");
    render(<JapaneseWritingPractice characters={[character!]} prompt="Write the particle." />);

    expect(screen.getByText("o /o/")).toBeVisible();
    expect(screen.getByText("IME: wo")).toBeVisible();
  });
});
