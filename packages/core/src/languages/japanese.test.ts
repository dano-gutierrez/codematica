import { describe, expect, it } from "vitest";
import { getContentIndex, getLanguageCharacterBySlug, getLanguageVocabularyBySlug } from "../content";
import { describeJapaneseReading, getJapaneseCharacterGroups, getJapaneseVocabularyForCharacter, searchJapanese } from "./japanese";

describe("Japanese language helpers", () => {
  it("loads Japanese characters and vocabulary from the generated index", () => {
    const index = getContentIndex();
    const groups = getJapaneseCharacterGroups(index);

    expect(index.schemaVersion).toBe(10);
    expect(groups.hiragana.some((item) => item.glyph === "あ" && item.ipa === "a")).toBe(true);
    expect(groups.katakana.some((item) => item.glyph === "ア" && item.ipa === "a")).toBe(true);
    expect(groups.kanji.some((item) => item.glyph === "人")).toBe(true);
    expect(getLanguageCharacterBySlug("japanese/kanji/person")?.strokes).toHaveLength(2);
    expect(getLanguageVocabularyBySlug("japanese/vocabulary/japan")?.ipa).toBe("ɲihoɴ");
    expect(getLanguageCharacterBySlug("japanese/kanji/water")?.route).toBe("/languages/japanese/characters/kanji/water");
    expect(getLanguageVocabularyBySlug("japanese/vocabulary/water")?.route).toBe("/languages/japanese/vocabulary/water");
  });

  it("orders the complete basic hiragana set by study order", () => {
    const glyphs = getJapaneseCharacterGroups(getContentIndex()).hiragana
      .filter((item) => item.tags.includes("basic-hiragana"))
      .map((item) => item.glyph)
      .join("");

    expect(glyphs).toBe("あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん");
  });

  it("orders the complete basic katakana set by study order", () => {
    const glyphs = getJapaneseCharacterGroups(getContentIndex()).katakana
      .filter((item) => item.tags.includes("basic-katakana"))
      .map((item) => item.glyph)
      .join("");

    expect(glyphs).toBe("アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン");
  });

  it("contains the exact 80 Grade-1 plus 20 A1 starter kanji set with unique study order", () => {
    const target = [..."一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六私食飲行来駅電話時分半今何店会社家母父友"];
    const catalog = getContentIndex().languageCharacters.filter((item) => item.writingSystem === "kanji" && target.includes(item.glyph));

    expect(new Set(catalog.map((item) => item.glyph))).toEqual(new Set(target));
    expect(catalog).toHaveLength(100);
    expect(new Set(catalog.map((item) => item.studyOrder))).toHaveLength(100);
  });

  it("ships the complete N5-aligned vocabulary and grammar foundation", () => {
    const index = getContentIndex();
    expect(index.languageVocabulary.filter((item) => item.status === "published" && item.jlptAlignment === "n5")).toHaveLength(650);
    expect(index.languageGrammar.filter((item) => item.status === "published" && item.jlptAlignment === "n5")).toHaveLength(60);
    expect(index.languageVocabulary.map((item) => item.studyOrder).every((order) => order > 0)).toBe(true);
  });

  it("does not publish kanji as handwriting-ready without original strokes", () => {
    const target = getContentIndex().languageCharacters.filter((item) => item.writingSystem === "kanji" && item.glyph !== "晩");
    expect(target.filter((item) => item.status === "published").every((item) => item.strokes.length > 0)).toBe(true);
  });

  it("searches by glyph, romaji, IPA, meaning, and vocabulary expression", () => {
    const index = getContentIndex();

    expect(searchJapanese(index, "あ")[0]).toMatchObject({ kind: "character", item: expect.objectContaining({ glyph: "あ" }) });
    expect(searchJapanese(index, "water")[0]).toMatchObject({ item: expect.objectContaining({ glyph: "水" }) });
    expect(searchJapanese(index, "ɲihoɴ")[0]).toMatchObject({ kind: "vocabulary", item: expect.objectContaining({ expression: "日本" }) });
    expect(searchJapanese(index, "nihon")[0]).toMatchObject({ kind: "vocabulary", item: expect.objectContaining({ expression: "日本" }) });
    expect(searchJapanese(index, "konbanha")[0]).toMatchObject({ kind: "vocabulary", item: expect.objectContaining({ expression: "こんばんは" }) });
    expect(searchJapanese(index, "konnichiha")[0]).toMatchObject({ kind: "vocabulary", item: expect.objectContaining({ expression: "こんにちは" }) });
    expect(searchJapanese(index, "koohii")[0]).toMatchObject({ kind: "vocabulary", item: expect.objectContaining({ expression: "コーヒー" }) });
  });

  it("supports browse defaults, prefix/substring ranking, related vocabulary, and reading labels", () => {
    const index = getContentIndex();
    const defaults = searchJapanese(index, "   ");
    expect(defaults.filter((result) => result.kind === "character")).toHaveLength(40);
    expect(defaults.filter((result) => result.kind === "vocabulary").length).toBeLessThanOrEqual(20);
    expect(searchJapanese(index, "kanji").length).toBeGreaterThan(0);
    expect(searchJapanese(index, "definitely-not-japanese-content")).toEqual([]);

    const person = getLanguageCharacterBySlug("japanese/kanji/person")!;
    expect(describeJapaneseReading(person)).toContain("/");
    expect(getJapaneseVocabularyForCharacter(index, person.slug).every((item) => item.characterSlugs.includes(person.slug))).toBe(true);
  });
});
