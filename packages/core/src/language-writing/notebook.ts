import { z } from "zod";
import type {
  ContentIndex,
  LanguageCharacter,
  WritingExercise,
} from "../content/schema";
import type { WritingStroke } from "./index";
import {
  buildWritingPracticeSheets,
  type WritingPracticeSheet,
} from "./practice";
import type { NotebookDifficulty } from "./shape";
export {
  checkNotebookCharacter,
  notebookDifficultyOptions,
  type NotebookDifficulty,
} from "./shape";

export type NotebookPhase = "Trace" | "Copy" | "Recall";
export type NotebookSheet = Omit<WritingPracticeSheet, "kind"> & {
  kind: "characters" | "word" | "phrase" | "custom";
  required: boolean;
  phases: NotebookPhase[];
};
export type WritingNotebook = {
  id: string;
  title: string;
  sheets: NotebookSheet[];
};
export type NotebookCell = { token: string; strokes: WritingStroke[] };
export type NotebookPage = {
  cells: NotebookCell[];
  bestCount: number;
  replaying: boolean;
};
export type NotebookSnapshot = {
  version: 1;
  notebookId: string;
  activeSheetId: string;
  difficulty?: NotebookDifficulty;
  pages: Record<string, NotebookPage>;
};
export type NotebookStorage = {
  loadRomajiPreference?: () => Promise<boolean>;
  saveRomajiPreference?: (showRomaji: boolean) => Promise<void>;
  load: (notebook: WritingNotebook) => Promise<NotebookSnapshot | undefined>;
  save: (snapshot: NotebookSnapshot) => Promise<void>;
  list: () => Promise<WritingNotebook[]>;
  saveDefinition: (notebook: WritingNotebook) => Promise<void>;
  sync?: (
    notebook: WritingNotebook,
    snapshot: NotebookSnapshot,
  ) => Promise<NotebookProgress[]>;
};

/** Preview authored prompts, preserving phrase readings and avoiding custom-sheet duplicates. */
export function getNotebookCatalogPreview(notebook: WritingNotebook) {
  const seen = new Set<string>();
  return notebook.sheets.filter(sheet => {
    if (seen.has(sheet.label)) return false;
    seen.add(sheet.label);
    return true;
  }).slice(0, 5).map(({ label, romaji }) => ({ label, romaji }));
}

const idSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9/-]+$/);
const promptSchema = z
  .string()
  .transform((s) => s.normalize("NFC"))
  .refine(
    (s) => [...s].length >= 1 && [...s].length <= 5 && !/\s/u.test(s),
    "Use 1–5 characters.",
  );
export const notebookProgressSchema = z
  .object({
    notebookId: idSchema,
    sheetId: idSchema,
    prompt: promptSchema,
    bestCount: z.number().int().min(0).max(120),
  })
  .strict()
  .refine(
    (row) => row.bestCount <= 24 * [...row.prompt].length,
    "Progress exceeds the sheet length.",
  );
export const notebookProgressBatchSchema = z
  .array(notebookProgressSchema)
  .max(20);
export type NotebookProgress = z.infer<typeof notebookProgressSchema>;
export const notebookSnapshotSchema = z.object({
  version: z.literal(1),
  notebookId: idSchema,
  activeSheetId: idSchema,
  difficulty: z.enum(["easy", "balanced", "precise"]).default("easy"),
  pages: z.record(
    z.string(),
    z.object({
      cells: z
        .array(
          z.object({
            token: z.string(),
            strokes: z.array(
              z.object({
                points: z.array(
                  z.tuple([
                    z.number().min(0).max(100),
                    z.number().min(0).max(100),
                  ]),
                ),
                pressures: z.array(z.number().min(0).max(1)).optional(),
              }),
            ),
          }),
        )
        .max(120),
      bestCount: z.number().int().min(0).max(120),
      replaying: z.boolean(),
    }),
  ),
});
const key = (text: string) =>
  [...text].map((c) => c.codePointAt(0)!.toString(16)).join("-");
const mixed: NotebookPhase[] = [
  ...Array<NotebookPhase>(8).fill("Trace"),
  ...Array<NotebookPhase>(8).fill("Copy"),
  ...Array<NotebookPhase>(8).fill("Recall"),
];

export function resolveNotebookCharacters(
  text: string,
  index: Pick<ContentIndex, "languageCharacters">,
): LanguageCharacter[] {
  const prompt = text.normalize("NFC").replace(/\s/gu, "");
  if ([...prompt].length < 1 || [...prompt].length > 5)
    throw new Error("Use 1–5 written Japanese characters.");
  const catalog = new Map(
    index.languageCharacters
      .filter((c) => c.status === "published" && c.strokes.length > 0)
      .map((c) => [c.glyph, c]),
  );
  const unsupported = [...new Set([...prompt].filter((c) => !catalog.has(c)))];
  if (unsupported.length)
    throw new Error(
      `No writing guide for: ${unsupported.join(" ")}. Choose supported Japanese characters.`,
    );
  return [...prompt].map((c) => catalog.get(c)!);
}

export function createCustomNotebook(
  text: string,
  index: ContentIndex,
): WritingNotebook {
  const characters = resolveNotebookCharacters(text, index),
    label = characters.map((c) => c.glyph).join("");
  const id = `custom-${key(label)}-v1`;
  const schedules = [
    mixed,
    [
      ...Array<NotebookPhase>(12).fill("Copy"),
      ...Array<NotebookPhase>(12).fill("Recall"),
    ],
    Array<NotebookPhase>(24).fill("Recall"),
  ];
  return {
    id,
    title: `${label} · my notebook`,
    sheets: schedules.map((phases, i) => ({
      id: `${key(label)}-${["mixed", "copy", "recall"][i]}`,
      kind: "custom",
      label,
      romaji: characters.map((c) => c.romaji).join(" "),
      meaning: "Your chosen practice text",
      characters,
      required: true,
      phases: [...phases],
    })),
  };
}

export function createExerciseNotebook(
  exercise: WritingExercise,
  index: ContentIndex,
): WritingNotebook {
  const characters = exercise.characterSlugs.flatMap((slug) => {
    const c = index.languageCharacters.find((c) => c.slug === slug);
    return c ? [c] : [];
  });
  const source = exercise.notebookPrompts?.length
    ? exercise.notebookPrompts.map((p) => ({
        ...p,
        label: p.text,
        characters: resolveNotebookCharacters(p.text, index),
      }))
    : buildWritingPracticeSheets(characters, index);
  return {
    id: `${exercise.slug}-notebook-v1`,
    title: exercise.title,
    sheets: source.map((s, i) => ({
      id:
        exercise.notebookPrompts?.[i]?.id ??
        `${key(s.characters.map((c) => c.glyph).join(""))}-${s.kind}`,
      kind: s.kind,
      label: s.characters.map((c) => c.glyph).join(""),
      romaji: s.romaji,
      meaning:
        s.kind === "characters"
          ? "Repeat the full prompt 24 times."
          : s.meaning,
      characters: s.characters,
      required: exercise.notebookPrompts?.length
        ? true
        : s.kind === "characters",
      phases: mixed.map((p) =>
        !exercise.modes.includes("free")
          ? "Trace"
          : !exercise.modes.includes("assisted") && p === "Trace"
            ? "Copy"
            : p,
      ),
    })),
  };
}

export function createCharacterNotebook(
  characters: LanguageCharacter[],
  index: ContentIndex,
): WritingNotebook {
  return createExerciseNotebook(
    {
      slug: `characters/${characters.map((c) => key(c.glyph)).join("-")}`,
      title: "Japanese writing notebook",
      characterSlugs: characters.map((c) => c.slug),
      modes: ["assisted", "free"],
    } as WritingExercise,
    index,
  );
}

export function createNotebookSnapshot(
  notebook: WritingNotebook,
): NotebookSnapshot {
  return {
    version: 1,
    notebookId: notebook.id,
    activeSheetId: notebook.sheets[0]?.id ?? "empty",
    difficulty: "easy",
    pages: Object.fromEntries(
      notebook.sheets.map((s) => [
        s.id,
        { cells: [], bestCount: 0, replaying: false },
      ]),
    ),
  };
}
export function isNotebookSheetUnlocked(
  notebook: WritingNotebook,
  state: NotebookSnapshot,
  index: number,
): boolean {
  return (
    index >= 0 &&
    index < notebook.sheets.length &&
    notebook.sheets
      .slice(0, index)
      .every(
        (s) => (state.pages[s.id]?.bestCount ?? 0) >= 24 * s.characters.length,
      )
  );
}
export function getNotebookPhase(
  sheet: NotebookSheet,
  cellCount: number,
): NotebookPhase {
  return sheet.phases[
    Math.min(23, Math.floor(cellCount / sheet.characters.length))
  ]!;
}
export function acceptNotebookCharacter(
  notebook: WritingNotebook,
  state: NotebookSnapshot,
  sheetId: string,
  cell: NotebookCell,
): NotebookSnapshot {
  const sheetIndex = notebook.sheets.findIndex((s) => s.id === sheetId),
    sheet = notebook.sheets[sheetIndex],
    page = state.pages[sheetId];
  if (
    !sheet ||
    !page ||
    !isNotebookSheetUnlocked(notebook, state, sheetIndex) ||
    page.cells.length >= 24 * sheet.characters.length ||
    Object.values(state.pages).some((p) =>
      p.cells.some((c) => c.token === cell.token),
    )
  )
    return state;
  const cells = [...page.cells, cell];
  return {
    ...state,
    pages: {
      ...state.pages,
      [sheetId]: {
        ...page,
        cells,
        bestCount: Math.max(page.bestCount, cells.length),
      },
    },
  };
}
export function restartNotebookSheet(
  notebook: WritingNotebook,
  state: NotebookSnapshot,
  sheetId: string,
): NotebookSnapshot {
  if (
    !isNotebookSheetUnlocked(
      notebook,
      state,
      notebook.sheets.findIndex((s) => s.id === sheetId),
    )
  )
    return state;
  return {
    ...state,
    activeSheetId: sheetId,
    pages: {
      ...state.pages,
      [sheetId]: { ...state.pages[sheetId]!, cells: [], replaying: true },
    },
  };
}
export function undoNotebookCell(
  state: NotebookSnapshot,
  sheetId: string,
): NotebookSnapshot {
  const page = state.pages[sheetId];
  if (!page?.cells.length) return state;
  return {
    ...state,
    pages: {
      ...state.pages,
      [sheetId]: { ...page, cells: page.cells.slice(0, -1), replaying: true },
    },
  };
}
export function getNotebookProgress(
  notebook: WritingNotebook,
  state: NotebookSnapshot,
): NotebookProgress[] {
  return notebook.sheets.map((s) => ({
    notebookId: notebook.id,
    sheetId: s.id,
    prompt: s.label,
    bestCount: state.pages[s.id]?.bestCount ?? 0,
  }));
}
export function mergeNotebookProgress(
  notebook: WritingNotebook,
  state: NotebookSnapshot,
  rows: NotebookProgress[],
): NotebookSnapshot {
  const pages = { ...state.pages };
  for (const row of rows) {
    const sheet = notebook.sheets.find((s) => s.id === row.sheetId);
    if (
      row.notebookId !== notebook.id ||
      !sheet ||
      row.prompt !== sheet.label ||
      !notebookProgressSchema.safeParse(row).success
    )
      continue;
    const page = pages[sheet.id]!,
      bestCount = Math.max(page.bestCount, row.bestCount);
    const cells = page.replaying
      ? page.cells
      : [
          ...page.cells,
          ...Array.from(
            { length: Math.max(0, bestCount - page.cells.length) },
            (_, i) => ({
              token: `remote-${sheet.id}-${page.cells.length + i}`,
              strokes: [],
            }),
          ),
        ];
    pages[sheet.id] = { ...page, bestCount, cells };
  }
  return { ...state, pages };
}
export function getNotebookGeometry(width: number, glyphCount: number) {
  const leftMargin = 48,
    rightMargin = 12,
    groupGap = 24;
  const usable = Math.max(220, width - leftMargin - rightMargin);
  const columns =
    [8, 4, 2, 1].find(
      (n) => n * glyphCount * 52 + (n - 1) * groupGap <= usable,
    ) ?? 1;
  const cellSize = Math.min(
    68,
    (usable - (columns - 1) * groupGap) / (columns * glyphCount),
  );
  const rowHeight = cellSize + 28;
  const cells = Array.from({ length: 24 * glyphCount }, (_, i) => {
    const repetition = Math.floor(i / glyphCount),
      characterIndex = i % glyphCount;
    return {
      x:
        leftMargin +
        (repetition % columns) * (glyphCount * cellSize + groupGap) +
        characterIndex * cellSize,
      y: 110 + Math.floor(repetition / columns) * rowHeight,
      size: cellSize,
      repetition,
      characterIndex,
    };
  });
  return {
    width,
    height: 142 + Math.ceil(24 / columns) * rowHeight,
    columns,
    cellSize,
    cells,
  };
}
