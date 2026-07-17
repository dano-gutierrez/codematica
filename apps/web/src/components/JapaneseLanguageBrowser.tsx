"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { getJapaneseCharacterGroups, searchJapanese, type ContentIndex, type JapaneseSearchResult, type LanguageCharacter, type LanguageVocabulary } from "@codematica/core";

export function JapaneseLanguageBrowser({ index }: { index: ContentIndex }) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => getJapaneseCharacterGroups(index), [index]);
  const results = useMemo(() => searchJapanese(index, query), [index, query]);

  return (
    <main className="min-h-screen pb-12" data-testid="japanese-language-page">
      <header className="border-b-2 border-[#d5e2e8] bg-white px-4 py-4">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="text-xl font-extrabold text-[#007c78]">
            Codematica
          </Link>
          <Link href="/paths/japanese-foundations" className="rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78] px-3 py-2 text-sm font-extrabold text-white">
            Japanese path
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
        <p className="text-sm font-extrabold uppercase text-[#007c78]">Japanese</p>
        <h1 className="mt-2 max-w-4xl text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-6xl">
          Practice kana, kanji, and writing.
        </h1>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-[#68737d]">
          Search beginner Japanese characters and phrases with romaji, meanings, and IPA pronunciation support.
        </p>

        <label className="relative mt-6 block max-w-3xl">
          <span className="sr-only">Search Japanese</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#68737d]" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search あ, water, nihon, /ɲihoɴ/"
            className="min-h-14 w-full rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white py-3 pl-12 pr-4 text-base font-bold text-[#263238] outline-none focus:border-[#007c78]"
            data-testid="japanese-search-input"
          />
        </label>

        <div className="mt-7 grid gap-4" data-testid="japanese-search-results">
          {results.map((result) => (
            <JapaneseResult key={`${result.kind}-${result.item.slug}`} result={result} />
          ))}
        </div>

        {!query ? (
          <div className="mt-8 grid gap-5">
            <CharacterSection title="Hiragana" characters={groups.hiragana} />
            <CharacterSection title="Katakana" characters={groups.katakana} />
            <CharacterSection title="Starter kanji" characters={groups.kanji} />
          </div>
        ) : null}
      </section>
    </main>
  );
}

function JapaneseResult({ result }: { result: JapaneseSearchResult }) {
  if (result.kind === "character") {
    return <CharacterCard character={result.item} />;
  }

  return <VocabularyCard vocabulary={result.item} />;
}

function CharacterSection({ title, characters }: { title: string; characters: LanguageCharacter[] }) {
  return (
    <section className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4 sm:p-5">
      <h2 className="text-2xl font-extrabold tracking-normal text-[#263238]">{title}</h2>
      <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-3">
        {characters.map((character) => (
          <Link
            key={character.slug}
            href={character.route}
            className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#f6fbfc] p-2 text-center transition hover:-translate-y-0.5 hover:border-[#007c78]"
          >
            <span className="text-3xl font-extrabold leading-none text-[#263238]">{character.glyph}</span>
            <span className="mt-1 text-xs font-extrabold text-[#68737d]">{character.romaji}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CharacterCard({ character }: { character: LanguageCharacter }) {
  return (
    <Link
      href={character.route}
      className="grid gap-3 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#007c78] sm:grid-cols-[5rem_minmax(0,1fr)]"
      data-testid={`japanese-character-${character.slug.replaceAll("/", "-")}`}
    >
      <span className="text-6xl font-extrabold leading-none text-[#263238]">{character.glyph}</span>
      <span className="min-w-0">
        <span className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-[#eaf7f4] px-2.5 py-1 text-xs font-extrabold text-[#007c78]">{character.writingSystem}</span>
          <span className="rounded-lg bg-[#edf5ff] px-2.5 py-1 text-xs font-extrabold text-[#245fba]">/{character.ipa}/</span>
        </span>
        <span className="mt-2 block text-xl font-extrabold text-[#263238]">{character.title}</span>
        <span className="mt-1 block text-sm font-semibold leading-6 text-[#68737d]">{character.meanings.join(", ")}</span>
      </span>
    </Link>
  );
}

function VocabularyCard({ vocabulary }: { vocabulary: LanguageVocabulary }) {
  return (
    <Link
      href={vocabulary.route}
      className="grid gap-3 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#245fba] sm:grid-cols-[8rem_minmax(0,1fr)]"
      data-testid={`japanese-vocabulary-${vocabulary.slug.replaceAll("/", "-")}`}
    >
      <span className="text-5xl font-extrabold leading-none text-[#263238]">{vocabulary.expression}</span>
      <span className="min-w-0">
        <span className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-[#f3efff] px-2.5 py-1 text-xs font-extrabold text-[#5840b8]">Vocabulary</span>
          <span className="rounded-lg bg-[#edf5ff] px-2.5 py-1 text-xs font-extrabold text-[#245fba]">/{vocabulary.ipa}/</span>
        </span>
        <span className="mt-2 block text-xl font-extrabold text-[#263238]">{vocabulary.romaji}</span>
        <span className="mt-1 block text-sm font-semibold leading-6 text-[#68737d]">{vocabulary.meanings.join(", ")}</span>
      </span>
    </Link>
  );
}
