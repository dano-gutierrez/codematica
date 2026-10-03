import { describe, expect, it } from "vitest";
import { getContentIndex, getLanguageCharacterBySlug } from "../content/index";
import {
  checkNotebookCharacter,
  createCustomNotebook,
  createExerciseNotebook,
  createNotebookSnapshot,
  acceptNotebookCharacter,
  restartNotebookSheet,
  undoNotebookCell,
  mergeNotebookProgress,
  getNotebookPhase,
  isNotebookSheetUnlocked,
  notebookProgressSchema,
  notebookSnapshotSchema,
  getNotebookProgress,
  getNotebookGeometry,
} from "./notebook";

const index = getContentIndex();
const a = getLanguageCharacterBySlug("japanese/hiragana/a")!;
const roughA = [
  [
    [25, 37],
    [38, 38],
    [56, 33],
    [68, 31],
  ],
  [
    [52, 18],
    [48, 43],
    [49, 68],
    [54, 84],
  ],
  [
    [63, 39],
    [63, 51],
    [54, 65],
    [40, 80],
    [27, 82],
    [21, 75],
    [22, 65],
    [34, 53],
    [48, 49],
    [61, 49],
    [77, 55],
    [84, 65],
    [80, 78],
    [64, 87],
  ],
].map((points) => ({ points: points as Array<[number, number]> }));

describe("notebook shape grading", () => {
  it("accepts every published guide, including sparsely sampled curves on Easy", () => {
    for (const character of index.languageCharacters.filter(
      (c) => c.status === "published" && c.strokes.length,
    )) {
      const coarse = character.strokes.map((s) => ({
        // Sparse polygon models already contain only their essential corners.
        points: s.points.length <= 8
          ? s.points
          : s.points.filter((_, i) => i % 4 === 0 || i === s.points.length - 1),
      }));
      expect(
        checkNotebookCharacter(character, coarse, "easy").isCorrect,
        character.glyph,
      ).toBe(true);
    }
  });
  it("defaults to Easy for wider mouse-written shapes and offers progressively closer shape checks", () => {
    const mouseA = roughA.map((stroke) => ({
      points: stroke.points.map(
        ([x, y]) => [x * 1.55, y * 0.82] as [number, number],
      ),
    }));
    expect(checkNotebookCharacter(a, mouseA).isCorrect).toBe(true);
    expect(checkNotebookCharacter(a, mouseA, "easy").isCorrect).toBe(true);
    expect(checkNotebookCharacter(a, mouseA, "precise").isCorrect).toBe(false);
    expect(checkNotebookCharacter(a, a.strokes, "balanced").isCorrect).toBe(
      true,
    );
  });
  it("requires major character features at every difficulty, even with automatic submission", () => {
    for (const difficulty of ["easy", "balanced", "precise"] as const) {
      for (const name of ["a", "ha", "ma", "mu", "i"]) {
        const character = getLanguageCharacterBySlug(
          "japanese/hiragana/" + name,
        )!;
        expect(
          checkNotebookCharacter(
            character,
            character.strokes.slice(0, 1),
            difficulty,
          ).isCorrect,
          `${name}/${difficulty}`,
        ).toBe(false);
      }
      expect(
        checkNotebookCharacter(a, roughA.slice(0, 2), difficulty).isCorrect,
      ).toBe(false);
    }
  });
  it("accepts independently drawn rough あ anywhere, at different sizes, in any stroke order and direction", () => {
    for (const scale of [0.4, 1, 3]) {
      const actual = [...roughA].reverse().map((stroke) => ({
        points: [...stroke.points]
          .reverse()
          .map(
            ([x, y]) => [700 + x * scale, 900 + y * scale] as [number, number],
          ),
      }));
      const result = checkNotebookCharacter(a, actual);
      expect(result.isCorrect).toBe(true);
      expect(result.ink[0]!.points[0]).not.toEqual(a.strokes[0]!.points[0]);
      expect(
        result.ink
          .flatMap((s) => s.points)
          .every(([x, y]) => x >= 0 && x <= 100 && y >= 0 && y <= 100),
      ).toBe(true);
    }
  });
  it("accepts additional pen lifts and retains pressure", () => {
    const split = roughA.flatMap((stroke) => {
      const mid = Math.ceil(stroke.points.length / 2);
      return [
        {
          points: stroke.points.slice(0, mid),
          pressures: stroke.points.slice(0, mid).map(() => 0.3),
        },
        {
          points: stroke.points.slice(mid - 1),
          pressures: stroke.points.slice(mid - 1).map(() => 0.8),
        },
      ];
    });
    expect(checkNotebookCharacter(a, split).isCorrect).toBe(true);
    expect(checkNotebookCharacter(a, split).ink[0]!.pressures).toContain(0.3);
  });
  it("rejects empty ink, dots, unrelated scribbles, missing loop and the previous triangular あ", () => {
    const bad = [
      [],
      [
        {
          points: [
            [20, 20],
            [21, 21],
          ],
        },
      ],
      [
        {
          points: [
            [0, 0],
            [100, 100],
            [0, 100],
            [100, 0],
            [0, 0],
          ],
        },
      ],
      roughA.slice(0, 2),
      [
        ...roughA.slice(0, 2),
        {
          points: [
            [60, 47],
            [25, 67],
            [55, 90],
            [75, 47],
          ],
        },
      ],
    ];
    for (const strokes of bad)
      expect(
        checkNotebookCharacter(a, strokes as typeof roughA).isCorrect,
      ).toBe(false);
  });
  it("does not mistake one line for two or two lines for three", () => {
    for (const [target, actual] of [
      ["two", "one"],
      ["three", "two"],
    ]) {
      expect(
        checkNotebookCharacter(
          getLanguageCharacterBySlug(`japanese/kanji/${target}`)!,
          getLanguageCharacterBySlug(`japanese/kanji/${actual}`)!.strokes,
        ).isCorrect,
      ).toBe(false);
    }
  });
});

describe("notebook progression", () => {
  it("restores older snapshots with Easy difficulty and validates saved choices", () => {
    const notebook = createCustomNotebook("あ", index);
    const snapshot = createNotebookSnapshot(notebook);
    const legacy = { ...snapshot };
    delete legacy.difficulty;
    expect(notebookSnapshotSchema.parse(legacy).difficulty).toBe("easy");
    expect(notebookSnapshotSchema.parse({ ...snapshot, difficulty: "precise" }).difficulty).toBe("precise");
    expect(notebookSnapshotSchema.safeParse({ ...snapshot, difficulty: "unsupported" }).success).toBe(false);
  });
  it("keeps all character cells safely to the right of the red notebook margin at phone and tablet widths", () => {
    for (const width of [280, 320, 507, 900]) {
      for (const glyphs of [1, 2, 5]) {
        const geometry = getNotebookGeometry(width, glyphs);
        expect(geometry.cells.every((c) => c.x >= 48)).toBe(true);
        expect(geometry.cells.every((c) => c.x + c.size <= width - 12)).toBe(
          true,
        );
        expect(geometry.cellSize).toBeGreaterThanOrEqual(44);
      }
    }
  });
  it("normalizes custom input and provides three 24-repetition sheets with fading guidance", () => {
    const notebook = createCustomNotebook(" あ い ", index);
    expect(
      notebook.sheets.map((s) => s.characters.map((c) => c.glyph).join("")),
    ).toEqual(["あい", "あい", "あい"]);
    expect(
      notebook.sheets.map((s) => s.phases.filter((p) => p === "Trace").length),
    ).toEqual([8, 0, 0]);
    expect(
      notebook.sheets.map((s) => s.phases.filter((p) => p === "Copy").length),
    ).toEqual([8, 12, 0]);
    expect(
      notebook.sheets.map((s) => s.phases.filter((p) => p === "Recall").length),
    ).toEqual([8, 12, 24]);
    expect(createCustomNotebook("か\u3099", index).sheets[0]!.label).toBe("が");
    expect(() => createCustomNotebook("", index)).toThrow(/1–5/);
    expect(() => createCustomNotebook("あいうえおか", index)).toThrow(/1–5/);
    expect(() => createCustomNotebook("あ🚀", index)).toThrow(/🚀/);
  });
  it("requires the full prompt 24 times, ignores duplicate acceptance, and unlocks only the next page", () => {
    const notebook = createCustomNotebook("あい", index);
    let state = createNotebookSnapshot(notebook);
    const first = notebook.sheets[0]!;
    expect(isNotebookSheetUnlocked(notebook, state, 1)).toBe(false);
    for (let cell = 0; cell < 48; cell++) {
      const next = acceptNotebookCharacter(notebook, state, first.id, {
        token: `ink-${cell}`,
        strokes: roughA,
      });
      expect(
        acceptNotebookCharacter(notebook, next, first.id, {
          token: `ink-${cell}`,
          strokes: roughA,
        }),
      ).toBe(next);
      state = next;
      expect(isNotebookSheetUnlocked(notebook, state, 1)).toBe(cell === 47);
    }
    expect(isNotebookSheetUnlocked(notebook, state, 2)).toBe(false);
    expect(getNotebookPhase(first, 0)).toBe("Trace");
    expect(getNotebookPhase(first, 16)).toBe("Copy");
    expect(getNotebookPhase(first, 32)).toBe("Recall");
    expect(
      acceptNotebookCharacter(notebook, state, first.id, {
        token: "overflow",
        strokes: roughA,
      }),
    ).toBe(state);
    expect(
      acceptNotebookCharacter(notebook, state, notebook.sheets[2]!.id, {
        token: "locked",
        strokes: roughA,
      }),
    ).toBe(state);
    const replay = restartNotebookSheet(notebook, state, first.id);
    expect(replay.pages[first.id]!.cells).toEqual([]);
    expect(replay.pages[first.id]!.bestCount).toBe(48);
    expect(isNotebookSheetUnlocked(notebook, replay, 1)).toBe(true);
    expect(undoNotebookCell(replay, first.id)).toBe(replay);
  });
  it("undoes a cell, preserves earned progress, and merges remote completion without importing ink", () => {
    const notebook = createCustomNotebook("あ", index);
    const sheet = notebook.sheets[0]!;
    let state = acceptNotebookCharacter(
      notebook,
      createNotebookSnapshot(notebook),
      sheet.id,
      { token: "one", strokes: roughA },
    );
    state = undoNotebookCell(state, sheet.id);
    expect(state.pages[sheet.id]!.cells).toHaveLength(0);
    expect(state.pages[sheet.id]!.bestCount).toBe(1);
    const remote = {
      notebookId: notebook.id,
      sheetId: sheet.id,
      prompt: sheet.label,
      bestCount: 24,
    };
    state = mergeNotebookProgress(notebook, state, [remote]);
    expect(isNotebookSheetUnlocked(notebook, state, 1)).toBe(true);
    expect(
      state.pages[sheet.id]!.cells.every((cell) => cell.strokes.length === 0),
    ).toBe(true);
    const replay = restartNotebookSheet(notebook, state, sheet.id);
    expect(
      mergeNotebookProgress(notebook, replay, [remote]).pages[sheet.id]!.cells,
    ).toHaveLength(0);
    expect(getNotebookProgress(notebook, state)[0]).toEqual(remote);
    expect(
      mergeNotebookProgress(notebook, state, [{ ...remote, bestCount: 1 }])
        .pages[sheet.id]!.bestCount,
    ).toBe(24);
  });
  it("builds stable curated sheets, respects allowed modes, validates progress bounds and lays out five glyphs on a phone", () => {
    const exercise = index.exercises.find(
      (e) => e.slug === "languages/japanese-hiragana-vowels-writing",
    )!;
    if (exercise.type !== "writing") throw new Error("fixture");
    const notebook = createExerciseNotebook(exercise, index);
    expect(
      notebook.sheets.filter((s) => s.required).map((s) => s.label),
    ).toEqual(["あい", "うえ", "お"]);
    expect(notebook.sheets.some((s) => s.kind === "word")).toBe(true);
    expect(
      createExerciseNotebook({ ...exercise, modes: ["free"] }, index).sheets[0]!
        .phases,
    ).not.toContain("Trace");
    const row = {
      notebookId: notebook.id,
      sheetId: notebook.sheets[0]!.id,
      prompt: "あい",
      bestCount: 48,
    };
    expect(notebookProgressSchema.safeParse(row).success).toBe(true);
    expect(
      notebookProgressSchema.safeParse({ ...row, bestCount: 49 }).success,
    ).toBe(false);
    const geometry = getNotebookGeometry(280, 5);
    expect(geometry.cells).toHaveLength(120);
    expect(geometry.cells.every((c) => c.x + c.size <= 280)).toBe(true);
    expect(geometry.cellSize).toBeGreaterThanOrEqual(44);
  });
});
