import type { LanguageStroke, LanguageStrokePoint } from "../content/schema";

export type WritingStroke = {
  points: LanguageStrokePoint[];
  pressures?: number[];
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
const assistedCompletionThreshold = 0.5;
const minimumOrderedStrokeScore = 0.5;
const assistedAttemptThreshold = assistedCompletionThreshold;
const freeAttemptThreshold = assistedCompletionThreshold;

export function normalizeWritingStroke(stroke: WritingStroke): WritingStroke {
  return {
    points: simplifyPoints(stroke.points).map(clampPoint),
  };
}

/** A light cubic interpolation keeps the learner's positions and endpoints intact. */
export function getWritingStrokePath(points: LanguageStrokePoint[], clampControls = true): string {
  if (!points.length) return "";
  const [first] = points;
  const start = `M ${first![0]} ${first![1]}`;
  if (points.length < 3) return [start, ...points.slice(1).map(([x, y]) => `L ${x} ${y}`)].join(" ");
  const segments = points.slice(1).map((end, index) => {
    const begin = points[index]!;
    const previous = points[Math.max(0, index - 1)]!;
    const next = points[Math.min(points.length - 1, index + 2)]!;
    // Keep tangent direction at each join; cap handle length to avoid spikes
    // when consecutive pointer samples are unevenly spaced.
    const maxHandle = distance(begin, end) / 3;
    const control = (anchor: LanguageStrokePoint, tangent: LanguageStrokePoint, sign: number) => {
      const scale = Math.min(1 / 6, maxHandle / Math.max(Math.hypot(...tangent), Number.EPSILON));
      const point: LanguageStrokePoint = [anchor[0] + sign * tangent[0] * scale, anchor[1] + sign * tangent[1] * scale];
      return (clampControls ? clampPoint(point) : point).map((value) => Math.round(value * 100) / 100);
    };
    const c1 = control(begin, [end[0] - previous[0], end[1] - previous[1]], 1);
    const c2 = control(end, [next[0] - begin[0], next[1] - begin[1]], -1);
    return `C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${end[0]} ${end[1]}`;
  });
  return [start, ...segments].join(" ");
}

export function checkWritingAttempt(input: WritingCheckInput): WritingCheckResult {
  const expected = input.expectedStrokes.map((stroke) => normalizeWritingStroke({ points: stroke.points }));
  const actual = input.actualStrokes.map(normalizeWritingStroke);
  const strokeCountCorrect = actual.length === expected.length;
  const strokeScores = expected.map((expectedStroke, index) => compareStroke(expectedStroke, actual[index]));
  const shapeScore = strokeScores.length ? average(strokeScores) : 0;
  const strokeOrderCorrect = strokeCountCorrect && strokeScores.every((score) => score >= minimumOrderedStrokeScore);
  const threshold = input.mode === "assisted" ? assistedAttemptThreshold : freeAttemptThreshold;
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
  const lengthRatio = strokeLength(actual.points) / Math.max(strokeLength(expected.points), 0.1);
  // A dot or a short chord across a loop is not a completed stroke.
  if (lengthRatio < 0.35 || lengthRatio > 2.5) return 0;
  const forwardDistance = averageDistance(expectedSamples, actualSamples);
  const reverseDistance = averageDistance(expectedSamples, [...actualSamples].reverse());
  if (reverseDistance + 6 < forwardDistance) return 0;
  const offset: LanguageStrokePoint = [
    average(expectedSamples.map(([x]) => x)) - average(actualSamples.map(([x]) => x)),
    average(expectedSamples.map(([, y]) => y)) - average(actualSamples.map(([, y]) => y)),
  ];
  // Allow modest placement drift, while retaining the stroke's size and shape.
  const adjustment = Math.min(1, 12 / Math.max(Math.hypot(...offset), 0.1));
  const aligned = actualSamples.map(([x, y]) => [x + offset[0] * adjustment, y + offset[1] * adjustment] satisfies LanguageStrokePoint);
  return Math.max(0, 1 - averageDistance(expectedSamples, aligned) / 44);
}

function strokeLength(points: LanguageStrokePoint[]) {
  return points.slice(1).reduce((total, point, index) => total + distance(points[index]!, point), 0);
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
    const segmentLength = Math.max(rightDistance - leftDistance, Number.EPSILON);
    const ratio = (targetDistance - leftDistance) / segmentLength;
    const left = points[index - 1]!;
    const right = points[index]!;

    return [left[0] + (right[0] - left[0]) * ratio, left[1] + (right[1] - left[1]) * ratio] satisfies LanguageStrokePoint;
  });
}

function simplifyPoints(points: LanguageStrokePoint[]) {
  const kept: LanguageStrokePoint[] = [];
  points.forEach((point, index) => {
    if (!kept.length || index === points.length - 1 || distance(point, kept.at(-1)!) >= 0.2) kept.push(point);
  });
  return kept;
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
    return "Nicely done. Your strokes follow the character. They don't need to be exact.";
  }

  if (!strokeCountCorrect) {
    return "Check the stroke count, then try the character again.";
  }

  if (!strokeOrderCorrect) {
    return "Follow the numbered strokes in their general direction. A rough shape is enough.";
  }

  if (shapeScore < 0.5) {
    return "Follow the guide shape and keep each stroke closer to its expected path.";
  }

  return "Almost there. Slow down and match the start and end of each stroke.";
}
