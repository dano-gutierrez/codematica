"use client";

import Link from "next/link";
import { BookOpen, Library, Layers, Pencil, RotateCcw, Search, X } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { getJapaneseCharacterGroups, searchJapanese, type ContentIndex, type JapaneseSearchResult, type LanguageCharacter, type LanguageVocabulary } from "@codematica/core";
import { Button } from "./Button";
import { AppHeader } from "@/components/AppHeader";

export function JapaneseLanguageBrowser({ index }: { index: ContentIndex }) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const groups = useMemo(() => getJapaneseCharacterGroups(index), [index]);
  const results = useMemo(() => searchJapanese(index, query), [index, query]);
  const flashcards = index.passiveFlashcardFeeds.find((feed) => feed.pathSlug === "japanese-foundations" && feed.status === "published");

  return (
    <main className="min-h-screen pb-12" data-testid="japanese-language-page">
      <AppHeader subtitle="Japanese" />

      <section className="ui-page">
        <h1 className="mt-2 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-[#263238] sm:text-4xl">
          Japanese
        </h1>
        <p className="mt-4 max-w-3xl text-base font-normal leading-7 text-[#68737d]">
          Find beginner Japanese characters and phrases with romaji, meanings, and IPA pronunciation.
        </p>
        <nav className="ui-columns mt-5" aria-label="Japanese study tools" data-testid="japanese-study-tools">
          <StudyToolLink href="/paths/japanese-foundations" label="Learn" description="Open Pre-A1 and A1 roadmap" icon={<BookOpen className="h-5 w-5" aria-hidden="true" />} testId="japanese-path-link" />
          <StudyToolLink href="/languages/japanese/notebooks" label="Notebook practice" description="Repeated handwriting · your own pages" icon={<Pencil className="h-5 w-5" aria-hidden="true" />} testId="japanese-notebooks-link" />
          <StudyToolLink href="/languages/japanese/review" label="Review" description="Due queue and all cards" icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />} testId="japanese-review-link" />
          <StudyToolLink href="#dictionary" label="Dictionary" description="Characters, words, and writing" icon={<Search className="h-5 w-5" aria-hidden="true" />} testId="japanese-dictionary-link" />
          <StudyToolLink href="#resources" label="Resources" description="Trusted free learning links" icon={<Library className="h-5 w-5" aria-hidden="true" />} testId="japanese-resources-link" />
        </nav>

        <div className="mt-4 flex flex-wrap gap-3" aria-label="Always available Japanese resources">
          {flashcards ? <StudyToolLink href={flashcards.route} label="Open flashcards" description="Recall kana at any time" icon={<Layers className="h-5 w-5" aria-hidden="true" />} testId="japanese-flashcards-link" /> : null}
          <StudyToolLink href="/practice/languages/japanese-hiragana-vowels-writing?path=japanese-foundations" label="Hiragana writing" description="Trace, copy, recall, and match" icon={<Pencil className="h-5 w-5" aria-hidden="true" />} testId="japanese-writing-sheets-link" />
          <StudyToolLink href="/practice/languages/japanese-katakana-vowels-writing?path=japanese-foundations" label="Katakana writing" description="Repeat characters and short words" icon={<Pencil className="h-5 w-5" aria-hidden="true" />} testId="japanese-katakana-sheets-link" />
          <StudyToolLink href="/docs/languages/japanese-hiragana-foundations?path=japanese-foundations" label="Hiragana guide" description="All 46 basic characters" icon={<span className="text-xl" aria-hidden="true">あ</span>} testId="japanese-hiragana-guide-link" />
          <StudyToolLink href="/docs/languages/japanese-katakana-foundations?path=japanese-foundations" label="Katakana guide" description="All 46 basic characters" icon={<span className="text-xl" aria-hidden="true">ア</span>} testId="japanese-katakana-guide-link" />
        </div>

        <div id="dictionary" className="ui-search-row mt-8 scroll-mt-6">
          <label className="ui-field min-w-0 flex-1">
            <span>Search Japanese</span>
            <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="あ, coffee, nihon, /ɲihoɴ/" className="ui-input" data-testid="japanese-search-input" />
          </label>
          {query ? <Button label="Clear search" icon={X} iconOnly onClick={() => { setQuery(""); searchRef.current?.focus(); }} /> : null}
        </div>
        {query ? <p className="mt-3 text-sm text-[#52616c]" role="status">{results.length ? `${results.length} matches` : "No matches. Try a character, word or romaji."}</p> : null}

        {query ? (
          <div className="mt-7 grid gap-4" data-testid="japanese-search-results">
            {results.map((result) => (
              <JapaneseResult key={`${result.kind}-${result.item.slug}`} result={result} />
            ))}
          </div>
        ) : null}

        {!query ? (
          <div className="mt-8 grid gap-5">
            <CharacterSection title="Basic hiragana" characters={groups.hiragana.filter((character) => character.tags.includes("basic-hiragana"))} />
            <CharacterSection title="Hiragana IME and sound extras" characters={groups.hiragana.filter((character) => character.tags.includes("supplement"))} />
            <CharacterSection title="Basic katakana" characters={groups.katakana.filter((character) => character.tags.includes("basic-katakana"))} />
            <CharacterSection title="Katakana sound extras" characters={groups.katakana.filter((character) => character.tags.includes("supplement"))} />
            <CharacterSection title="Starter kanji" characters={groups.kanji} />
            <VocabularySection title="Beginner words and greetings" vocabulary={index.languageVocabulary.filter((item) => item.language === "ja" && item.status === "published")} />
          </div>
        ) : null}

        <section id="resources" className="mt-8 scroll-mt-6 border-t border-[#d5e2e8] pt-6" data-testid="japanese-resource-shelf">
          <p className="text-sm font-semibold uppercase text-[#7a5200]">Trusted, always available</p>
          <h2 className="mt-1 text-3xl font-semibold text-[#263238]">Learning resources</h2>
          <p className="mt-2 max-w-3xl text-base font-normal leading-7 text-[#53616c]">Materials link to their publishers’ sites. Access and reuse labels show what Codematica may link to or redistribute.</p>
          <div className="ui-columns mt-5">
            {index.languageResources.map((resource) => (
              <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" className="min-w-0 rounded-xl border border-[#d2bd76] bg-white p-4 [overflow-wrap:anywhere] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#007c78]">
                <span className="block [overflow-wrap:anywhere] text-lg font-semibold text-[#263238]">{resource.title}</span>
                <span className="mt-1 block [overflow-wrap:anywhere] text-sm font-normal leading-6 text-[#53616c]">{resource.description}</span>
                <span className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase text-[#654400]">
                  <span className="rounded-md bg-[#fff0b8] px-2 py-1">{resource.access}</span>
                  <span className="rounded-md bg-[#edf5ff] px-2 py-1">{resource.proficiencyLevels.join(" · ").toUpperCase()}</span>
                  <span className="rounded-md bg-[#f0edf9] px-2 py-1">{resource.reusePolicy === "link-only" ? "Link only" : "Licensed embed"}</span>
                </span>
                <span className="mt-3 block text-sm font-medium text-[#53616c]">Publisher: {resource.publisher}</span>
              </a>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function StudyToolLink({ href, label, description, icon, testId }: { href: string; label: string; description: string; icon: ReactNode; testId: string }) {
  return (
    <Link href={href} className="flex min-h-20 w-full min-w-0 items-center gap-3 rounded-xl border border-[#d5e2e8] bg-white px-4 py-3 transition-colors hover:border-[#7a5200] sm:w-auto" data-testid={testId}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff5d6] font-semibold text-[#7a5200]">{icon}</span>
      <span className="min-w-0">
        <span className="block [overflow-wrap:anywhere] text-sm font-semibold text-[#263238]">{label}</span>
        <span className="mt-0.5 block [overflow-wrap:anywhere] text-xs font-medium text-[#68737d]">{description}</span>
      </span>
    </Link>
  );
}

function VocabularySection({ title, vocabulary }: { title: string; vocabulary: LanguageVocabulary[] }) {
  return (
    <details className="ui-disclosure min-w-0" data-testid="japanese-vocabulary-disclosure">
      <summary><h2 className="inline text-xl font-semibold text-[#263238]">{title}</h2> <span className="text-sm text-[#52616c]">({vocabulary.length})</span></summary>
      <div className="ui-columns mt-4">
        {vocabulary.map((item) => <VocabularyCard key={item.slug} vocabulary={item} />)}
      </div>
    </details>
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
    <section className="min-w-0 border-t border-[#d5e2e8] pt-5">
      <h2 className="text-2xl font-semibold tracking-tight text-[#263238]">{title}</h2>
      <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-3">
        {characters.map((character) => (
          <Link
            key={character.slug}
            href={character.route}
            className="flex min-h-20 flex-col items-center justify-center rounded-xl border border-[#d5e2e8] bg-[#f6fbfc] p-2 text-center transition-colors hover:border-[#7a5200]"
          >
            <span lang="ja" className="text-3xl font-normal leading-none text-[#263238]">{character.glyph}</span>
            <span className="mt-1 text-xs font-semibold text-[#68737d]">{character.romaji}</span>
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
      className="ui-result-row grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3"
      data-testid={`japanese-character-${character.slug.replaceAll("/", "-")}`}
    >
      <span lang="ja" className="text-6xl font-normal leading-none text-[#263238]">{character.glyph}</span>
      <span className="min-w-0">
        <span className="flex flex-wrap gap-2">
          <span className="rounded-xl bg-[#fff5d6] px-2.5 py-1 text-xs font-semibold text-[#7a5200]">{character.writingSystem}</span>
          <span className="min-w-0 max-w-full rounded-xl bg-[#edf5ff] px-2.5 py-1 text-xs font-semibold text-[#245fba] [overflow-wrap:anywhere]">/{character.ipa}/</span>
        </span>
        <span className="mt-2 block text-xl font-semibold text-[#263238]">{character.title}</span>
        <span className="mt-1 block text-sm font-normal leading-6 text-[#68737d]">{character.meanings.join(", ")}</span>
      </span>
    </Link>
  );
}

function VocabularyCard({ vocabulary }: { vocabulary: LanguageVocabulary }) {
  return (
    <Link
      href={vocabulary.route}
      className="ui-result-row grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3"
      data-testid={`japanese-vocabulary-${vocabulary.slug.replaceAll("/", "-")}`}
    >
      <span lang="ja" className="text-5xl font-normal leading-none text-[#263238]">{vocabulary.expression}</span>
      <span className="min-w-0">
        <span className="flex flex-wrap gap-2">
          <span className="rounded-xl bg-[#fff5d6] px-2.5 py-1 text-xs font-semibold text-[#7a5200]">Vocabulary</span>
          <span className="min-w-0 max-w-full rounded-xl bg-[#edf5ff] px-2.5 py-1 text-xs font-semibold text-[#245fba] [overflow-wrap:anywhere]">/{vocabulary.ipa}/</span>
        </span>
        <span className="mt-2 block text-xl font-semibold text-[#263238]">{vocabulary.romaji}</span>
        <span className="mt-1 block text-sm font-normal leading-6 text-[#68737d]">{vocabulary.meanings.join(", ")}</span>
      </span>
    </Link>
  );
}
