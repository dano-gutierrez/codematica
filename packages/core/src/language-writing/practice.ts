import type { ContentIndex, LanguageCharacter } from "../content/schema";

export type WritingPracticeSheet = {
  id: string;
  kind: "characters" | "word";
  label: string;
  romaji: string;
  meaning: string;
  characters: LanguageCharacter[];
};

/** Small, repeatable sheets; words use catalog-authored kana readings. */
export function buildWritingPracticeSheets(characters: LanguageCharacter[], index: ContentIndex): WritingPracticeSheet[] {
  if (!characters.length) return [];
  const sheets: WritingPracticeSheet[] = [];
  for (let offset = 0; offset < characters.length; offset += 2) {
    const pair = characters.slice(offset, offset + 2);
    sheets.push({ id: `characters-${offset / 2}`, kind: "characters", label: pair.map((item) => item.glyph).join(" · "), romaji: pair.map((item) => item.romaji).join(" · "), meaning: "A little at a time. Write each character three times.", characters: pair });
  }
  const systems = new Set(characters.map((item) => item.writingSystem));
  const focusedGlyphs = new Set(characters.map((item) => item.glyph));
  const catalog = new Map(index.languageCharacters.filter((item) => item.status === "published" && item.language === "ja" && item.writingSystem !== "kanji" && systems.has(item.writingSystem)).map((item) => [item.glyph, item]));
  const seen = new Set<string>();
  for (const word of [...index.languageVocabulary].sort((a, b) => Number(b.tags.includes("writing-starter")) - Number(a.tags.includes("writing-starter")) || a.reading.length - b.reading.length || a.studyOrder - b.studyOrder || a.slug.localeCompare(b.slug))) {
    const glyphs = [...word.reading];
    if (word.language !== "ja" || word.status !== "published" || glyphs.length < 2 || glyphs.length > 4 || seen.has(word.reading) || (/[0-9]/.test(word.romaji) || !/[a-z]/i.test(word.romaji)) || (!word.tags.includes("writing-starter") && !glyphs.some((glyph) => focusedGlyphs.has(glyph))) || !glyphs.every((glyph) => catalog.has(glyph))) continue;
    seen.add(word.reading);
    sheets.push({ id: `word-${word.slug.replaceAll("/", "-")}`, kind: "word", label: word.reading, romaji: word.romaji, meaning: word.meanings.join(", "), characters: glyphs.map((glyph) => catalog.get(glyph)!) });
    if (seen.size === 4) break;
  }
  return sheets;
}

export function createWritingPracticeSteps(sheet: WritingPracticeSheet, modes: Array<"assisted" | "free">) {
  return (["Trace", "Copy", "Recall"] as const).flatMap((phase, round) => sheet.characters.map((character, characterIndex) => ({
    character, characterIndex, round, phase,
    mode: (phase === "Trace" && modes.includes("assisted") || !modes.includes("free") ? "assisted" : "free") as "assisted" | "free",
  })));
}

export function getWritingMatchPairs(sheets: WritingPracticeSheet[]) {
  const labels = new Set<string>();
  const readings = new Set<string>();
  // Individual kana plus whole words mirror the two-column recognition exercise.
  const characters = sheets.filter((sheet) => sheet.kind === "characters").flatMap((sheet) => sheet.characters.map((character, index) => ({ id: `${sheet.id}-${index}`, label: character.glyph, romaji: character.romaji })));
  const candidates = [...characters.slice(0, 2), ...sheets.filter((sheet) => sheet.kind === "word"), ...characters.slice(2)];
  return candidates.filter((pair) => {
    if (labels.has(pair.label) || readings.has(pair.romaji)) return false;
    labels.add(pair.label);
    readings.add(pair.romaji);
    return true;
  }).slice(0, 5);
}
