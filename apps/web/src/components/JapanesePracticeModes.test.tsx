import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LanguageVocabulary } from "@codematica/core";

vi.mock("@/generated/japanese-audio", () => ({ japaneseAudioUrls: { "approved-audio": "/audio/approved.mp3" } }));

import { JapaneseAnswerInput } from "./JapaneseAnswerInput";
import { JapaneseAudioPlayer } from "./JapaneseAudioPlayer";
import { JapaneseFlashcardPractice } from "./JapaneseFlashcardPractice";

const vocabulary = [
  { expression: "水", reading: "みず", meanings: ["water"], studyOrder: 2 },
  { expression: "学生", reading: "がくせい", meanings: ["student"], studyOrder: 1 },
] as LanguageVocabulary[];

describe("Japanese web practice modes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("commits direct Japanese and keyboard-selected romaji conversions", () => {
    const onChange = vi.fn();
    const view = render(<JapaneseAnswerInput value="" onChange={onChange} />);
    const input = screen.getByTestId("questionnaire-open-answer-input");

    fireEvent.change(input, { target: { value: "学生" } });
    expect(onChange).toHaveBeenLastCalledWith("学生");
    fireEvent.keyDown(input, { key: "a" });
    fireEvent.change(input, { target: { value: "konbanha" } });
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith("今晩は");
    view.rerender(<JapaneseAnswerInput value="こんばんは" disabled onChange={onChange} />);
    expect(screen.getByTestId("questionnaire-open-answer-input")).toBeDisabled();
  });

  it("keeps unapproved audio gated and supports replay, slow speed, and transcript disclosure", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const { rerender } = render(<JapaneseAudioPlayer audioId="draft-audio" />);
    expect(screen.getByText(/awaiting Japanese-language approval/i)).toBeVisible();

    rerender(<JapaneseAudioPlayer audioId="approved-audio" revealTranscript transcript="私は学生です。" />);
    expect(screen.getByTestId("japanese-audio-player")).toHaveTextContent("AI-generated voice");
    expect(screen.getByText("私は学生です。")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Play / replay" }));
    fireEvent.click(screen.getByRole("button", { name: "0.75× slow" }));
    expect(play).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "0.75× slow" })).toHaveAttribute("aria-pressed", "true");
  });

  it("sorts, reveals, and navigates the N5 flashcard deck", () => {
    const { rerender } = render(<JapaneseFlashcardPractice vocabulary={vocabulary} />);
    expect(screen.getByText("学生")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /学生/i }));
    expect(screen.getByText("student")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("水")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByText("学生")).toBeVisible();

    rerender(<JapaneseFlashcardPractice vocabulary={[]} />);
    expect(screen.getByText(/No published N5 vocabulary/i)).toBeVisible();
  });
});
