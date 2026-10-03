import type { LanguageCharacter, LanguageStrokePoint } from "../content/schema";
import type { WritingStroke } from "./index";

type Sample = { point: LanguageStrokePoint; stroke: number };
export type NotebookDifficulty = "easy" | "balanced" | "precise";
export const notebookDifficultyOptions: {
  value: NotebookDifficulty;
  label: string;
  description: string;
}[] = [
  {
    value: "easy",
    label: "Easy",
    description: "More room for uneven mouse and finger drawing.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Practice the shape with a little more precision.",
  },
  {
    value: "precise",
    label: "Precise",
    description: "Aim for a closer match to the example.",
  },
];
const rules = {
  easy: {
    tolerance: 19,
    expected: 0.8,
    actual: 0.7,
    feature: 0.6,
    minLength: 0.5,
    maxLength: 2.7,
  },
  balanced: {
    tolerance: 16,
    expected: 0.86,
    actual: 0.75,
    feature: 0.62,
    minLength: 0.52,
    maxLength: 2.55,
  },
  precise: {
    tolerance: 13,
    expected: 0.92,
    actual: 0.8,
    feature: 0.65,
    minLength: 0.55,
    maxLength: 2.4,
  },
};
const distance = (a: LanguageStrokePoint, b: LanguageStrokePoint) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);
const length = (strokes: WritingStroke[]) =>
  strokes.reduce(
    (total, stroke) =>
      total +
      stroke.points
        .slice(1)
        .reduce((sum, p, i) => sum + distance(p, stroke.points[i]!), 0),
    0,
  );

/** Align the entire character together, preserving proportions and the learner's ink. */
function align(strokes: WritingStroke[]): WritingStroke[] {
  const points = strokes.flatMap((s) => s.points);
  const xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1]);
  const left = Math.min(...xs),
    right = Math.max(...xs),
    top = Math.min(...ys),
    bottom = Math.max(...ys);
  const scale = 80 / Math.max(right - left, bottom - top, 1);
  return strokes.map((stroke) => ({
    points: stroke.points.map(([x, y]) => [
      +(50 + (x - (left + right) / 2) * scale).toFixed(2),
      +(50 + (y - (top + bottom) / 2) * scale).toFixed(2),
    ]),
    ...(stroke.pressures
      ? { pressures: stroke.pressures.map((p) => Math.min(1, Math.max(0, p))) }
      : {}),
  }));
}

function sample(strokes: WritingStroke[]): Sample[] {
  return strokes.flatMap((stroke, strokeIndex) =>
    stroke.points.slice(1).flatMap((end, index) => {
      const start = stroke.points[index]!;
      const count = Math.max(1, Math.ceil(distance(start, end) / 2));
      return Array.from({ length: count }, (_, i) => ({
        stroke: strokeIndex,
        point: [
          start[0] + (end[0] - start[0]) * (i / count),
          start[1] + (end[1] - start[1]) * (i / count),
        ] as LanguageStrokePoint,
      }));
    }),
  );
}

/** Small gaps and pen lifts may join, but a loop cannot be replaced by a V or a large scribble. */
function closedRegions(samples: Sample[]) {
  const size = 100,
    pixels = new Uint8Array(size * size);
  for (const {
    point: [x, y],
  } of samples) {
    for (let dx = -2; dx <= 2; dx++)
      for (let dy = -2; dy <= 2; dy++) {
        if (dx * dx + dy * dy > 5) continue;
        const px = Math.round(x) + dx,
          py = Math.round(y) + dy;
        if (px >= 0 && px < size && py >= 0 && py < size)
          pixels[py * size + px] = 1;
      }
  }
  const areas: number[] = [];
  for (let start = 0; start < pixels.length; start++) {
    if (pixels[start]) continue;
    const queue = [start];
    pixels[start] = 2;
    let border = false;
    for (let i = 0; i < queue.length; i++) {
      const p = queue[i]!,
        x = p % size,
        y = Math.floor(p / size);
      if (x === 0 || y === 0 || x === size - 1 || y === size - 1) border = true;
      for (const [nx, ny] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nx! < 0 || ny! < 0 || nx! >= size || ny! >= size) continue;
        const next = ny! * size + nx!;
        if (!pixels[next]) {
          pixels[next] = 2;
          queue.push(next);
        }
      }
    }
    if (!border && queue.length >= 25) areas.push(queue.length);
  }
  return areas;
}

/** Undirected coverage permits reordering and pen lifts, but each model stroke needs its own evidence. */
export function checkNotebookCharacter(
  character: LanguageCharacter,
  strokes: WritingStroke[],
  difficulty: NotebookDifficulty = "easy",
) {
  const rule = rules[difficulty];
  const invalid = strokes.some((s) =>
    s.points.some((p) => !p.every(Number.isFinite)),
  );
  const points = strokes.flatMap((s) => s.points);
  if (points.length > 20000)
    return {
      isCorrect: false,
      score: 0,
      ink: [] as WritingStroke[],
      feedback: "Clear this character and try a smaller amount of ink.",
    };
  const span = points.length
    ? Math.max(
        Math.max(...points.map((p) => p[0])) -
          Math.min(...points.map((p) => p[0])),
        Math.max(...points.map((p) => p[1])) -
          Math.min(...points.map((p) => p[1])),
      )
    : 0;
  if (invalid || span < 8 || length(strokes) < 12 || !character.strokes.length)
    return {
      isCorrect: false,
      score: 0,
      ink: [] as WritingStroke[],
      feedback: "Write the whole character. A tiny mark isn't enough.",
    };
  const ink = align(strokes);
  const expected = align(character.strokes);
  const ratio = length(ink) / Math.max(1, length(expected));
  if (ratio < rule.minLength || ratio > rule.maxLength)
    return {
      isCorrect: false,
      score: 0,
      ink,
      feedback: "Add the missing shape, or clear this character and try again.",
    };
  const model = sample(expected),
    actual = sample(ink);
  if (!model.length || !actual.length)
    return {
      isCorrect: false,
      score: 0,
      ink,
      feedback: "Add the remaining parts of the character.",
    };
  const tolerance = rule.tolerance;
  const assigned = actual.map((item) => {
    let nearest = model[0]!,
      best = Infinity;
    for (const candidate of model) {
      const d = distance(item.point, candidate.point);
      if (d < best) {
        best = d;
        nearest = candidate;
      }
    }
    return { ...item, modelStroke: nearest.stroke, distance: best };
  });
  const coverage = model.map((item) => {
    const candidates = assigned.filter((a) => a.modelStroke === item.stroke);
    return candidates.some((a) => distance(item.point, a.point) <= tolerance);
  });
  const expectedCoverage = coverage.filter(Boolean).length / model.length;
  const actualCoverage =
    assigned.filter((s) => s.distance <= tolerance).length / actual.length;
  const individual = expected.map((_, stroke) => {
    const entries = model
      .map((s, i) => (s.stroke === stroke ? coverage[i] : undefined))
      .filter((c) => c !== undefined);
    return entries.filter(Boolean).length / Math.max(1, entries.length);
  });
  const covered =
    expectedCoverage >= rule.expected &&
    actualCoverage >= rule.actual &&
    individual.every((c) => c >= rule.feature);
  const loops = covered ? closedRegions(model) : [];
  const drawnLoops = loops.length ? closedRegions(actual) : [];
  const isCorrect =
    covered &&
    (!loops.length ||
      (drawnLoops.length >= loops.length &&
        drawnLoops.reduce((sum, area) => sum + area, 0) <=
          3 * loops.reduce((sum, area) => sum + area, 0)));
  return {
    isCorrect,
    score: Math.round(100 * Math.min(expectedCoverage, actualCoverage)),
    ink,
    feedback: isCorrect
      ? "Nicely done! Your handwriting doesn't need to be exact."
      : "Add the missing shape, or clear this character and try again. Stroke order doesn't affect your result.",
  };
}
