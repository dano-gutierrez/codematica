import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getContentIndex } from "@codematica/core";
import { JapaneseLanguageBrowser } from "./JapaneseLanguageBrowser";

describe("JapaneseLanguageBrowser", () => {
  it("keeps the path, flashcards, and alphabet guides available from the hub", () => {
    render(<JapaneseLanguageBrowser index={getContentIndex()} />);

    expect(screen.getByTestId("japanese-study-tools")).toBeVisible();
    expect(screen.getByTestId("japanese-path-link")).toHaveAttribute("href", "/paths/japanese-foundations");
    expect(screen.getByTestId("japanese-flashcards-link")).toHaveAttribute("href", "/paths/japanese-foundations/flashcards");
    expect(screen.getByTestId("japanese-hiragana-guide-link")).toHaveAttribute("href", "/docs/languages/japanese-hiragana-foundations?path=japanese-foundations");
    expect(screen.getByTestId("japanese-katakana-guide-link")).toHaveAttribute("href", "/docs/languages/japanese-katakana-foundations?path=japanese-foundations");
  });

  it("separates the complete basic katakana set from sound extras", () => {
    render(<JapaneseLanguageBrowser index={getContentIndex()} />);

    expect(screen.getByRole("heading", { name: "Basic katakana" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Katakana sound extras" })).toBeVisible();
    expect(screen.getByRole("link", { name: "ンn" })).toBeVisible();
    expect(screen.getByRole("link", { name: "ーlong vowel" })).toBeVisible();
  });
});
