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

const hiraganaAStrokes: LanguageStroke[] = [
  { id: "top", points: [[32, 28], [68, 28]] },
  { id: "stem", points: [[48, 18], [42, 70]] },
  { id: "loop", points: [[72, 40], [52, 86], [25, 66], [60, 46]] },
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

  it("accepts a recognizable imperfect multi-stroke character in free mode", () => {
    const result = checkWritingAttempt({
      expectedStrokes: hiraganaAStrokes,
      mode: "free",
      actualStrokes: [
        { points: [[28, 44], [63, 42]] },
        { points: [[60, 25], [54, 74]] },
        { points: [[76, 54], [60, 80], [38, 75], [67, 57]] },
      ],
    });

    expect(result.strokeCountCorrect).toBe(true);
    expect(result.strokeOrderCorrect).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.isCorrect).toBe(true);
  });

  it("marks assisted strokes complete only when close enough", () => {
    const closeStroke: WritingStroke = { points: [[18, 51], [80, 49]] };
    const farStroke: WritingStroke = { points: [[18, 75], [80, 78]] };

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
