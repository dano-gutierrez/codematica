import { describe, expect, it } from "vitest";
import { checkWritingAttempt, getAssistedStrokeCompletion, type WritingStroke } from ".";
import type { LanguageStroke } from "../content/schema";

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

describe("language writing checks", () => {
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

  it("marks assisted strokes complete only when close enough", () => {
    const closeStroke: WritingStroke = { points: [[18, 51], [80, 49]] };
    const farStroke: WritingStroke = { points: [[18, 75], [80, 78]] };

    expect(getAssistedStrokeCompletion(ichiStroke, closeStroke).shouldComplete).toBe(true);
    expect(getAssistedStrokeCompletion(ichiStroke, farStroke).shouldComplete).toBe(false);
  });
});
