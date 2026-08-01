import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContentIndex, getLanguageCharacterBySlug, getLanguageVocabularyBySlug } from "@/lib/content";

type VocabularyPageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

export function generateStaticParams() {
  return getContentIndex().languageVocabulary.map((item) => ({
    slug: languageVocabularyRouteSlug(item.slug).split("/"),
  }));
}

export async function generateMetadata({ params }: VocabularyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const vocabulary = getLanguageVocabularyBySlug(languageVocabularyLookupSlug(slug));

  return {
    title: vocabulary ? `${vocabulary.expression} - Codematica` : "Japanese vocabulary not found - Codematica",
    description: vocabulary?.meanings.join(", "),
  };
}

export default async function JapaneseVocabularyPage({ params }: VocabularyPageProps) {
  const { slug } = await params;
  const vocabulary = getLanguageVocabularyBySlug(languageVocabularyLookupSlug(slug));

  if (!vocabulary) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:py-8" data-testid="japanese-vocabulary-page">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/languages/japanese" className="inline-flex rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]">
          Japanese
        </Link>

        <section className="mt-6 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 sm:p-7">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg bg-[#f3efff] px-2.5 py-1 text-xs font-extrabold text-[#5840b8]">Vocabulary</span>
            <span className="rounded-lg bg-[#edf5ff] px-2.5 py-1 text-xs font-extrabold text-[#245fba]">/{vocabulary.ipa}/</span>
          </div>
          <p className="mt-6 text-7xl font-extrabold leading-none text-[#263238]">{vocabulary.expression}</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-6xl">{vocabulary.romaji}</h1>
          <p className="mt-4 text-lg font-semibold leading-8 text-[#68737d]">{vocabulary.reading}</p>
          <p className="mt-4 text-2xl font-extrabold text-[#263238]">{vocabulary.meanings.join(", ")}</p>
          {vocabulary.inputSequences.length ? <p className="mt-4 text-sm font-extrabold text-[#7a5200]">IME input: {vocabulary.inputSequences.join(" or ")}</p> : null}
        </section>

        {vocabulary.segments.length ? (
          <section className="mt-5 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5" data-testid="japanese-vocabulary-breakdown">
            <h2 className="text-2xl font-extrabold tracking-normal text-[#263238]">Kanji and hiragana breakdown</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {vocabulary.segments.map((segment, index) => (
                <article key={`${segment.text}-${index}`} className="rounded-lg bg-[#f6fbfc] p-4">
                  <p className="text-3xl font-extrabold text-[#263238]">{segment.text}</p>
                  <p className="mt-1 text-sm font-bold text-[#33434b]">{segment.reading} · {segment.romaji}</p>
                  <p className="mt-2 text-sm font-semibold text-[#68737d]">{segment.meaning}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {segment.characterSlugs.flatMap((slug) => {
                      const character = getLanguageCharacterBySlug(slug);
                      return character ? [<Link key={slug} href={character.route} className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-xl font-extrabold text-[#245fba]" aria-label={`Open ${character.title}`}>{character.glyph}</Link>] : [];
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {vocabulary.examples.length ? (
          <section className="mt-5 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5" data-testid="japanese-vocabulary-examples">
            <h2 className="text-2xl font-extrabold tracking-normal text-[#263238]">Example phrases</h2>
            <div className="mt-4 grid gap-3">
              {vocabulary.examples.map((example) => (
                <article key={example.id} className="rounded-lg bg-[#f6fbfc] p-4">
                  <p className="text-2xl font-extrabold text-[#263238]">{example.japanese}</p>
                  <p className="mt-1 text-sm font-bold text-[#33434b]">{example.reading} · {example.romaji}</p>
                  {example.inputSequences.length ? <p className="mt-1 text-xs font-extrabold text-[#7a5200]">IME: {example.inputSequences.join(" or ")}</p> : null}
                  <p className="mt-2 font-extrabold text-[#263238]">{example.translation}</p>
                  <p className="mt-1 text-sm font-semibold text-[#68737d]">{example.explanation}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function languageVocabularyRouteSlug(slug: string) {
  return slug.startsWith("japanese/vocabulary/") ? slug.slice("japanese/vocabulary/".length) : slug;
}

function languageVocabularyLookupSlug(slug: string[]) {
  const joined = slug.join("/");
  return joined.startsWith("japanese/vocabulary/") ? joined : `japanese/vocabulary/${joined}`;
}
