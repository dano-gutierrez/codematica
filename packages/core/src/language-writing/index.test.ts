import { describe, expect, it } from "vitest";
import { checkWritingAttempt, getAssistedStrokeCompletion, getWritingStrokePath, normalizeWritingStroke, type WritingStroke } from ".";
import type { LanguageStroke } from "../content/schema";
import { getLanguageCharacterBySlug } from "../content";

const ichiStroke: LanguageStroke = {
  id: "main",
  points: [
    [18, 50],
    [82, 50],
  ],
};

const hitoStrokes: LanguageStroke[] = [
  {
    id: "left",
    points: [
      [48, 20],
      [34, 82],
    ],
  },
  {
    id: "right",
    points: [
      [50, 22],
      [74, 84],
    ],
  },
];

const hiraganaAStrokes = getLanguageCharacterBySlug("japanese/hiragana/a")!.strokes;

describe("language writing checks", () => {
  it("accepts a smaller, off-center beginner attempt in both practice modes", () => {
    const actualStrokes = hitoStrokes.map(({ points }) => ({
      points: points.map(([x, y]) => [50 + (x - 50) * 0.7 + 18, 50 + (y - 50) * 0.7 + 8] as [number, number]),
    }));
    for (const mode of ["assisted", "free"] as const) {
      expect(checkWritingAttempt({ expectedStrokes: hitoStrokes, actualStrokes, mode }).isCorrect).toBe(true);
    }
    expect(getAssistedStrokeCompletion(hitoStrokes[0]!, actualStrokes[0]!).shouldComplete).toBe(true);
  });

  it("does not award a stroke for a tap or a tiny mark at the right position", () => {
    for (const points of [[[50, 50], [50, 50]], [[49, 50], [51, 50]]] as Array<Array<[number, number]>>) {
      expect(getAssistedStrokeCompletion(ichiStroke, { points }).shouldComplete).toBe(false);
    }
  });

  it("preserves densely captured slow handwriting and its final point", () => {
    const points: Array<[number, number]> = Array.from({ length: 101 }, (_, index) => [index / 10, 50]);
    const normalized = normalizeWritingStroke({ points });
    expect(normalized.points.length).toBeGreaterThan(20);
    expect(normalized.points.at(-1)).toEqual([10, 50]);
  });

  it("renders fluid curves through the captured positions without replacing their endpoints", () => {
    expect(getWritingStrokePath([])).toBe("");
    expect(getWritingStrokePath([[12, 18]])).toBe("M 12 18");
    expect(getWritingStrokePath([[12, 18], [30, 50], [62, 45], [75, 70]])).toMatch(/^M 12 18 C .*75 70$/);
    expect(getWritingStrokePath([[18, 50], [82, 50]])).toBe("M 18 50 L 82 50");
  });

  it("joins curved ink with continuous direction instead of square corners", () => {
    const segments = getWritingStrokePath([[20, 20], [20, 70], [70, 70]]).split(" C ").slice(1).map((segment) => segment.split(" ").map(Number));
    const incoming = [20 - segments[0]![2]!, 70 - segments[0]![3]!];
    const outgoing = [segments[1]![0]! - 20, segments[1]![1]! - 70];
    expect(incoming[0]).toBeGreaterThan(0);
    expect(outgoing[1]).toBeGreaterThan(0);
    expect(incoming[0]! * outgoing[1]! - incoming[1]! * outgoing[0]!).toBeCloseTo(0, 1);
  });

  it("accepts matching stroke count, order, direction, and shape", () => {
    const result = checkWritingAttempt({
      expectedStrokes: hitoStrokes,
      mode: "free",
      actualStrokes: [
        { points: [[49, 21], [35, 81]] },
        { points: [[51, 23], [75, 83]] },
      ],
    });

    expect(result.isCorrect).toBe(true);
    expect(result.strokeCountCorrect).toBe(true);
    expect(result.strokeOrderCorrect).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it("rejects missing strokes before scoring the shape as correct", () => {
    const result = checkWritingAttempt({
      expectedStrokes: hitoStrokes,
      mode: "free",
      actualStrokes: [{ points: [[49, 21], [35, 81]] }],
    });

    expect(result.isCorrect).toBe(false);
    expect(result.strokeCountCorrect).toBe(false);
    expect(result.feedback).toMatch(/stroke count/i);
  });

  it("penalizes reversed stroke direction", () => {
    const result = checkWritingAttempt({
      expectedStrokes: [ichiStroke],
      mode: "free",
      actualStrokes: [{ points: [[82, 50], [18, 50]] }],
    });

    expect(result.isCorrect).toBe(false);
    expect(result.strokeOrderCorrect).toBe(false);
  });

  it("accepts a recognizable imperfect multi-stroke character in free mode", () => {
    const result = checkWritingAttempt({
      expectedStrokes: hiraganaAStrokes,
      mode: "free",
      actualStrokes: [
        { points: [[25, 37], [38, 38], [56, 33], [68, 31]] },
        { points: [[52, 18], [48, 43], [49, 68], [54, 84]] },
        { points: [[63, 39], [63, 51], [54, 65], [40, 80], [27, 82], [21, 75], [22, 65], [34, 53], [48, 49], [61, 49], [77, 55], [84, 65], [80, 78], [64, 87]] },
      ],
    });

    expect(result.strokeCountCorrect).toBe(true);
    expect(result.strokeOrderCorrect).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.isCorrect).toBe(true);
  });

  it("rejects swapped strokes and a straight shortcut across あ's loop", () => {
    const actualStrokes = hiraganaAStrokes.map(({ points }) => ({ points }));
    expect(checkWritingAttempt({ expectedStrokes: hiraganaAStrokes, actualStrokes: [actualStrokes[1]!, actualStrokes[0]!, actualStrokes[2]!], mode: "free" }).isCorrect).toBe(false);
    expect(getAssistedStrokeCompletion(hiraganaAStrokes[2]!, { points: [hiraganaAStrokes[2]!.points[0]!, hiraganaAStrokes[2]!.points.at(-1)!] }).shouldComplete).toBe(false);
  });

  it("marks assisted strokes complete only when close enough", () => {
    const closeStroke: WritingStroke = { points: [[18, 51], [80, 49]] };
    const farStroke: WritingStroke = { points: [[18, 90], [80, 93]] };

    expect(getAssistedStrokeCompletion(ichiStroke, closeStroke).shouldComplete).toBe(true);
    expect(getAssistedStrokeCompletion(ichiStroke, farStroke).shouldComplete).toBe(false);
  });

  it("accepts an imperfect assisted trace that follows the stroke direction", () => {
    const beginnerTrace: WritingStroke = {
      points: [
        [24, 64],
        [50, 65],
        [77, 62],
      ],
    };

    expect(getAssistedStrokeCompletion(ichiStroke, beginnerTrace).shouldComplete).toBe(true);
  });

  it("identifies the next assisted stroke without advancing after a miss", () => {
    const miss = getAssistedStrokeCompletion(hitoStrokes[0]!, { points: [[10, 10], [90, 10]] });
    const retry = getAssistedStrokeCompletion(hitoStrokes[0]!, { points: [[48, 20], [34, 82]] });

    expect(miss.shouldComplete).toBe(false);
    expect(retry.shouldComplete).toBe(true);
  });
});
