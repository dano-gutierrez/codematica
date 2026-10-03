import { render, screen, within } from "@testing-library/react";
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
    expect(screen.getByTestId("japanese-review-link")).toHaveAttribute("href", "/languages/japanese/review");
    expect(screen.getByTestId("japanese-dictionary-link")).toHaveAttribute("href", "#dictionary");
    expect(screen.getByTestId("japanese-resources-link")).toHaveAttribute("href", "#resources");
  });

  it("separates the complete basic katakana set from sound extras", () => {
    render(<JapaneseLanguageBrowser index={getContentIndex()} />);

    const basicHeading = screen.getByRole("heading", { name: "Basic katakana" });
    const extrasHeading = screen.getByRole("heading", { name: "Katakana sound extras" });
    expect(basicHeading).toBeVisible();
    expect(extrasHeading).toBeVisible();
    const basic = within(basicHeading.parentElement!);
    const extras = within(extrasHeading.parentElement!);
    expect(basic.getAllByRole("link")).toHaveLength(46);
    expect(basic.getByRole("link", { name: "ンn" })).toBeVisible();
    expect(basic.queryByRole("link", { name: "ーlong vowel" })).not.toBeInTheDocument();
    expect(extras.getByRole("link", { name: "ーlong vowel" })).toBeVisible();
    expect(extras.queryByRole("link", { name: "ンn" })).not.toBeInTheDocument();
  });

  it("shows trusted resources with access and reuse metadata", () => {
    render(<JapaneseLanguageBrowser index={getContentIndex()} />);

    const resources = screen.getByTestId("japanese-resource-shelf");
    expect(resources).toBeVisible();
    const irodori = within(resources).getByRole("link", { name: /Irodori/ });
    expect(irodori).toHaveAttribute("href", "https://www.irodori.jpf.go.jp/en/");
    expect(irodori).toHaveTextContent("Link only");
  });
});
