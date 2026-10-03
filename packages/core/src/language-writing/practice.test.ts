import { describe, expect, it } from "vitest";
import { getContentIndex, getLanguageCharacterBySlug } from "../content/index";
import { buildWritingPracticeSheets, createWritingPracticeSteps, getWritingMatchPairs } from "./practice";

const index = getContentIndex();
const vowels = ["a", "i", "u", "e", "o"].map((sound) => getLanguageCharacterBySlug(`japanese/hiragana/${sound}`)!);

describe("Japanese repetition sheets", () => {
  it("keeps a focused pair together for trace, copy, and recall before moving on", () => {
    const sheets = buildWritingPracticeSheets(vowels, index);
    expect(sheets.filter((sheet) => sheet.kind === "characters").map((sheet) => sheet.label)).toEqual(["あ · い", "う · え", "お"]);
    const steps = createWritingPracticeSteps(sheets[0]!, ["assisted", "free"]);
    expect(steps.map((step) => [step.character.glyph, step.phase, step.mode])).toEqual([
      ["あ", "Trace", "assisted"], ["い", "Trace", "assisted"],
      ["あ", "Copy", "free"], ["い", "Copy", "free"],
      ["あ", "Recall", "free"], ["い", "Recall", "free"],
    ]);
  });

  it("uses published short kana words with complete stroke models, using authored kana readings", () => {
    const sheets = buildWritingPracticeSheets(vowels, index);
    const words = sheets.filter((sheet) => sheet.kind === "word");
    expect(words.map((word) => word.label)).toEqual(["あき", "えき", "した", "すき"]);
    expect(words.length).toBeLessThanOrEqual(4);
    for (const word of words) {
      expect(word.characters.map((character) => character.glyph).join("")).toBe(word.label);
      expect(word.characters.length).toBeGreaterThanOrEqual(2);
      expect(word.characters.length).toBeLessThanOrEqual(4);
      expect(word.characters.every((character) => character.writingSystem === "hiragana")).toBe(true);
    }
    const kanji = getLanguageCharacterBySlug("japanese/kanji/one")!;
    expect(buildWritingPracticeSheets([kanji], index).map((sheet) => sheet.kind)).toEqual(["characters"]);
  });

  it("offers authored katakana starter words and skips romaji placeholders", () => {
    const character = getLanguageCharacterBySlug("japanese/katakana/a")!;
    const words = buildWritingPracticeSheets([character], index).filter((sheet) => sheet.kind === "word");
    expect(words.slice(0, 2).map((word) => [word.label, word.romaji])).toEqual([["パン", "pan"], ["カメラ", "kamera"]]);
    expect(words.every((word) => word.characters.every((item) => item.writingSystem === "katakana"))).toBe(true);
    const placeholder = { ...index.languageVocabulary[0]!, expression: "アア", reading: "アア", romaji: "n5-123", tags: ["writing-starter"] };
    expect(buildWritingPracticeSheets([character], { ...index, languageVocabulary: [placeholder] })).toHaveLength(1);
  });

  it("does not mix scripts, drafts, unsupported glyphs, or duplicate words into a sheet", () => {
    const source = index.languageVocabulary.find((word) => word.expression === "いえ") ?? index.languageVocabulary[0]!;
    const vocabulary = [
      { ...source, expression: "あい", reading: "あい", romaji: "ai", slug: "ai", status: "published" as const },
      { ...source, expression: "あい", reading: "あい", romaji: "ai", slug: "duplicate", status: "published" as const },
      { ...source, expression: "あい", reading: "あい", slug: "draft", status: "draft" as const },
      { ...source, expression: "あア", reading: "あア", slug: "mixed" },
      { ...source, expression: "あー", reading: "あー", slug: "unsupported" },
      { ...source, expression: "愛", reading: "愛", slug: "kanji" },
    ];
    const sheets = buildWritingPracticeSheets(vowels, { ...index, languageVocabulary: vocabulary });
    expect(sheets.filter((sheet) => sheet.kind === "word").map((sheet) => sheet.label)).toEqual(["あい"]);
    expect(buildWritingPracticeSheets([], index)).toEqual([]);
  });

  it("honors restricted modes and produces unambiguous kana/romaji matching pairs", () => {
    const sheet = buildWritingPracticeSheets([vowels[0]!], index)[0]!;
    expect(createWritingPracticeSteps(sheet, ["free"]).every((step) => step.mode === "free")).toBe(true);
    expect(createWritingPracticeSteps(sheet, ["assisted"]).every((step) => step.mode === "assisted")).toBe(true);
    const sheets = buildWritingPracticeSheets(vowels, index);
    const pairs = getWritingMatchPairs([...sheets, sheets[0]!, { ...sheets[1]!, id: "same-reading", romaji: sheets[0]!.romaji }]);
    expect(new Set(pairs.map((pair) => pair.romaji)).size).toBe(pairs.length);
    expect(new Set(pairs.map((pair) => pair.label)).size).toBe(pairs.length);
    expect(pairs.length).toBeLessThanOrEqual(5);
  });
});
