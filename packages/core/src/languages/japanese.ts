import type { ContentIndex, LanguageCharacter, LanguageVocabulary, LanguageWritingSystem } from "../content/schema";

export type JapaneseSearchResult =
  | {
      kind: "character";
      item: LanguageCharacter;
      score: number;
    }
  | {
      kind: "vocabulary";
      item: LanguageVocabulary;
      score: number;
    };

const systemOrder: Record<LanguageWritingSystem, number> = {
  hiragana: 0,
  katakana: 1,
  kanji: 2,
};

export function getJapaneseCharacterGroups(index: ContentIndex) {
  return {
    hiragana: index.languageCharacters.filter((item) => item.language === "ja" && item.writingSystem === "hiragana" && item.status === "published"),
    katakana: index.languageCharacters.filter((item) => item.language === "ja" && item.writingSystem === "katakana" && item.status === "published"),
    kanji: index.languageCharacters.filter((item) => item.language === "ja" && item.writingSystem === "kanji" && item.status === "published"),
  };
}

export function searchJapanese(index: ContentIndex, query: string): JapaneseSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  const characters = index.languageCharacters.filter((item) => item.language === "ja" && item.status === "published");
  const vocabulary = index.languageVocabulary.filter((item) => item.language === "ja" && item.status === "published");

  if (!normalizedQuery) {
    return [
      ...characters
        .sort((left, right) => systemOrder[left.writingSystem] - systemOrder[right.writingSystem] || left.slug.localeCompare(right.slug))
        .slice(0, 40)
        .map((item) => ({ kind: "character" as const, item, score: 1 })),
      ...vocabulary.slice(0, 20).map((item) => ({ kind: "vocabulary" as const, item, score: 1 })),
    ];
  }

  return [
    ...characters.flatMap((item) => {
      const score = scoreJapaneseCharacter(item, normalizedQuery);
      return score > 0 ? [{ kind: "character" as const, item, score }] : [];
    }),
    ...vocabulary.flatMap((item) => {
      const score = scoreJapaneseVocabulary(item, normalizedQuery);
      return score > 0 ? [{ kind: "vocabulary" as const, item, score }] : [];
    }),
  ]
    .sort((left, right) => right.score - left.score || resultTitle(left).localeCompare(resultTitle(right)))
    .slice(0, 60);
}

export function describeJapaneseReading(character: LanguageCharacter) {
  return character.readings.map((reading) => `${reading.label}: ${reading.value} /${reading.ipa}/`).join(" | ");
}

function scoreJapaneseCharacter(item: LanguageCharacter, query: string) {
  const fields = [
    item.glyph,
    item.title,
    item.romaji,
    item.ipa,
    item.writingSystem,
    ...item.meanings,
    ...item.tags,
    ...item.readings.flatMap((reading) => [reading.label, reading.value, reading.ipa]),
  ].map(normalizeSearchText);

  return scoreFields(fields, query);
}

function scoreJapaneseVocabulary(item: LanguageVocabulary, query: string) {
  const fields = [item.expression, item.reading, item.romaji, item.ipa, ...item.meanings, ...item.tags].map(normalizeSearchText);

  return scoreFields(fields, query);
}

function scoreFields(fields: string[], query: string) {
  let score = 0;

  for (const field of fields) {
    if (field === query) {
      score = Math.max(score, 10);
    } else if (field.startsWith(query)) {
      score = Math.max(score, 7);
    } else if (field.includes(query)) {
      score = Math.max(score, 4);
    }
  }

  return score;
}

function resultTitle(result: JapaneseSearchResult) {
  return result.kind === "character" ? result.item.title : result.item.expression;
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}
