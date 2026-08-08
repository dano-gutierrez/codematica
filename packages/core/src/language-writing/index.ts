import type { LanguageStroke, LanguageStrokePoint } from "../content/schema";

export type WritingStroke = {
  points: LanguageStrokePoint[];
};

export type WritingCheckInput = {
  expectedStrokes: LanguageStroke[];
  actualStrokes: WritingStroke[];
  mode: "assisted" | "free";
};

export type WritingCheckResult = {
  isCorrect: boolean;
  score: number;
  strokeCountCorrect: boolean;
  strokeOrderCorrect: boolean;
  shapeScore: number;
  feedback: string;
};

const sampleCount = 16;
const assistedCompletionThreshold = 0.6;

export function normalizeWritingStroke(stroke: WritingStroke): WritingStroke {
  return {
    points: simplifyPoints(stroke.points).map(clampPoint),
  };
}

export function checkWritingAttempt(input: WritingCheckInput): WritingCheckResult {
  const expected = input.expectedStrokes.map((stroke) => normalizeWritingStroke({ points: stroke.points }));
  const actual = input.actualStrokes.map(normalizeWritingStroke);
  const strokeCountCorrect = actual.length === expected.length;
  const strokeScores = expected.map((expectedStroke, index) => compareStroke(expectedStroke, actual[index]));
  const shapeScore = strokeScores.length ? average(strokeScores) : 0;
  const strokeOrderCorrect = strokeCountCorrect && strokeScores.every((score) => score >= 0.58);
  const threshold = input.mode === "assisted" ? 0.68 : 0.74;
  const isCorrect = strokeCountCorrect && strokeOrderCorrect && shapeScore >= threshold;

  return {
    isCorrect,
    score: Math.round(shapeScore * 100),
    strokeCountCorrect,
    strokeOrderCorrect,
    shapeScore,
    feedback: createFeedback({ isCorrect, strokeCountCorrect, strokeOrderCorrect, shapeScore }),
  };
}

export function getAssistedStrokeCompletion(expectedStroke: LanguageStroke, actualStroke: WritingStroke) {
  const expected = normalizeWritingStroke({ points: expectedStroke.points });
  const actual = normalizeWritingStroke(actualStroke);
  const score = compareStroke(expected, actual);

  return {
    score,
    shouldComplete: score >= assistedCompletionThreshold,
  };
}

function compareStroke(expected: WritingStroke, actual: WritingStroke | undefined) {
  if (!actual || expected.points.length < 2 || actual.points.length < 2) {
    return 0;
  }

  const expectedSamples = sampleStroke(expected.points, sampleCount);
  const actualSamples = sampleStroke(actual.points, sampleCount);
  const forwardDistance = averageDistance(expectedSamples, actualSamples);
  const reverseDistance = averageDistance(expectedSamples, [...actualSamples].reverse());
  const directionPenalty = reverseDistance < forwardDistance ? 0.22 : 0;
  const distance = Math.min(forwardDistance, reverseDistance + 14);
  const normalized = Math.max(0, 1 - distance / 42);

  return Math.max(0, normalized - directionPenalty);
}

function sampleStroke(points: LanguageStrokePoint[], count: number) {
  if (points.length === count) {
    return points;
  }

  if (points.length < 2) {
    return Array.from({ length: count }, () => points[0] ?? [0, 0]);
  }

  const distances = [0];
  let total = 0;

  for (let index = 1; index < points.length; index += 1) {
    total += distance(points[index - 1]!, points[index]!);
    distances.push(total);
  }

  if (total === 0) {
    return Array.from({ length: count }, () => points[0]!);
  }

  return Array.from({ length: count }, (_, sampleIndex) => {
    const targetDistance = (total * sampleIndex) / (count - 1);
    const rightIndex = distances.findIndex((value) => value >= targetDistance);
    const index = Math.max(1, rightIndex === -1 ? distances.length - 1 : rightIndex);
    const leftDistance = distances[index - 1]!;
    const rightDistance = distances[index]!;
    const segmentLength = Math.max(rightDistance - leftDistance, 1);
    const ratio = (targetDistance - leftDistance) / segmentLength;
    const left = points[index - 1]!;
    const right = points[index]!;

    return [left[0] + (right[0] - left[0]) * ratio, left[1] + (right[1] - left[1]) * ratio] satisfies LanguageStrokePoint;
  });
}

function simplifyPoints(points: LanguageStrokePoint[]) {
  return points.filter((point, index) => index === 0 || distance(point, points[index - 1]!) >= 1.5);
}

function averageDistance(left: LanguageStrokePoint[], right: LanguageStrokePoint[]) {
  return average(left.map((point, index) => distance(point, right[index] ?? point)));
}

function distance(left: LanguageStrokePoint, right: LanguageStrokePoint) {
  return Math.hypot(left[0] - right[0], left[1] - right[1]);
}

function clampPoint(point: LanguageStrokePoint): LanguageStrokePoint {
  return [Math.min(100, Math.max(0, point[0])), Math.min(100, Math.max(0, point[1]))];
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function createFeedback({
  isCorrect,
  strokeCountCorrect,
  strokeOrderCorrect,
  shapeScore,
}: {
  isCorrect: boolean;
  strokeCountCorrect: boolean;
  strokeOrderCorrect: boolean;
  shapeScore: number;
}) {
  if (isCorrect) {
    return "Correct. The stroke count, order, and shape match the target.";
  }

  if (!strokeCountCorrect) {
    return "Check the stroke count first, then try the character again.";
  }

  if (!strokeOrderCorrect) {
    return "The shape is close, but the stroke order or direction needs review.";
  }

  if (shapeScore < 0.5) {
    return "Use the guide shape and keep each stroke closer to the expected path.";
  }

  return "Almost there. Slow down and match the start and end of each stroke.";
}
