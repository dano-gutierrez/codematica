import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJapaneseVocabularyForCharacter } from "@codematica/core";
import { JapaneseWritingPractice } from "@/components/JapaneseWritingPractice";
import { getContentIndex, getLanguageCharacterBySlug } from "@/lib/content";
import type { LanguageStrokePoint } from "@/lib/content/schema";

type CharacterPageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

export function generateStaticParams() {
  return getContentIndex().languageCharacters.map((character) => ({
    slug: languageCharacterRouteSlug(character.slug).split("/"),
  }));
}

export async function generateMetadata({ params }: CharacterPageProps): Promise<Metadata> {
  const { slug } = await params;
  const character = getLanguageCharacterBySlug(languageCharacterLookupSlug(slug));

  return {
    title: character ? `${character.title} - Codematica` : "Japanese character not found - Codematica",
    description: character?.summary,
  };
}

export default async function JapaneseCharacterPage({ params }: CharacterPageProps) {
  const { slug } = await params;
  const character = getLanguageCharacterBySlug(languageCharacterLookupSlug(slug));

  if (!character) {
    notFound();
  }
  const relatedVocabulary = getJapaneseVocabularyForCharacter(getContentIndex(), character.slug);

  return (
    <main className="min-h-screen px-4 py-5 sm:py-8" data-testid="japanese-character-page">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/languages/japanese" className="inline-flex rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]">
          Japanese
        </Link>

        <section className="mt-6 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 sm:p-7">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg bg-[#eaf7f4] px-2.5 py-1 text-xs font-extrabold text-[#007c78]">{character.writingSystem}</span>
            <span className="rounded-lg bg-[#edf5ff] px-2.5 py-1 text-xs font-extrabold text-[#245fba]">/{character.ipa}/</span>
          </div>
          <p className="mt-6 text-8xl font-extrabold leading-none text-[#263238]">{character.glyph}</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-6xl">{character.title}</h1>
          <p className="mt-4 text-lg font-semibold leading-8 text-[#68737d]">{character.summary}</p>
          <p className="mt-4 text-2xl font-extrabold text-[#263238]">{character.meanings.join(", ")}</p>
          {character.inputSequences.length ? <p className="mt-4 text-sm font-extrabold text-[#245fba]">IME input: {character.inputSequences.join(" or ")}</p> : null}
        </section>

        <section className="mt-5 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5">
          <h2 className="text-2xl font-extrabold tracking-normal text-[#263238]">Readings</h2>
          <div className="mt-4 grid gap-3">
            {character.readings.map((reading) => (
              <div key={`${reading.label}-${reading.value}`} className="rounded-lg bg-[#f6fbfc] p-3 text-sm font-bold text-[#33434b]">
                <span className="font-extrabold">{reading.label}</span>: {reading.value} /{reading.ipa}/
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5">
          <h2 className="text-2xl font-extrabold tracking-normal text-[#263238]">Stroke model</h2>
          <svg viewBox="0 0 100 100" className="mt-4 aspect-square w-full max-w-sm rounded-lg border-2 border-[#d5e2e8] bg-white">
            <path d="M 50 0 L 50 100 M 0 50 L 100 50" stroke="#e4edf1" strokeWidth="0.8" fill="none" />
            {character.strokes.map((stroke, index) => {
              const start = stroke.points[0];
              return (
                <g key={stroke.id}>
                  <path d={pointsToPath(stroke.points)} stroke="#263238" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <circle cx={start[0]} cy={start[1]} r="4.5" fill="#007c78" />
                  <text x={start[0]} y={start[1] + 1.8} textAnchor="middle" fontSize="5" fontWeight="800" fill="white">{index + 1}</text>
                </g>
              );
            })}
          </svg>
        </section>

        <section className="mt-5 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5" data-testid="japanese-character-practice">
          <h2 className="text-2xl font-extrabold tracking-normal text-[#263238]">Practice writing {character.glyph}</h2>
          <JapaneseWritingPractice characters={[character]} prompt="Trace the highlighted strokes in order, then switch to free mode and write from memory." />
        </section>

        {relatedVocabulary.length || character.examples.length ? (
          <section className="mt-5 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5" data-testid="japanese-character-examples">
            <h2 className="text-2xl font-extrabold tracking-normal text-[#263238]">Words and examples</h2>
            <div className="mt-4 grid gap-4">
              {relatedVocabulary.map((vocabulary) => (
                <article key={vocabulary.slug} className="rounded-lg bg-[#f6fbfc] p-4">
                  <Link href={vocabulary.route} className="text-2xl font-extrabold text-[#245fba]">{vocabulary.expression}</Link>
                  <p className="mt-1 text-sm font-bold text-[#33434b]">{vocabulary.reading} · {vocabulary.romaji}</p>
                  {vocabulary.inputSequences.length ? <p className="mt-1 text-xs font-extrabold text-[#7a5200]">IME: {vocabulary.inputSequences.join(" or ")}</p> : null}
                  <p className="mt-2 text-sm font-semibold text-[#68737d]">{vocabulary.meanings.join(", ")}</p>
                  {vocabulary.examples.map((example) => (
                    <div key={example.id} className="mt-3 border-t border-[#d5e2e8] pt-3">
                      <p className="font-extrabold text-[#263238]">{example.japanese}</p>
                      <p className="text-sm font-bold text-[#33434b]">{example.romaji} — {example.translation}</p>
                      <p className="mt-1 text-sm font-semibold text-[#68737d]">{example.explanation}</p>
                    </div>
                  ))}
                </article>
              ))}
              {character.examples.map((example) => (
                <article key={example.id} className="rounded-lg bg-[#f6fbfc] p-4">
                  <p className="text-xl font-extrabold text-[#263238]">{example.japanese}</p>
                  <p className="mt-1 text-sm font-bold text-[#33434b]">{example.reading} · {example.romaji} — {example.translation}</p>
                  <p className="mt-2 text-sm font-semibold text-[#68737d]">{example.explanation}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function pointsToPath(points: LanguageStrokePoint[]) {
  if (points.length === 0) {
    return "";
  }

  const [first, ...rest] = points;
  return [`M ${first[0]} ${first[1]}`, ...rest.map((point) => `L ${point[0]} ${point[1]}`)].join(" ");
}

function languageCharacterRouteSlug(slug: string) {
  return slug.startsWith("japanese/") ? slug.slice("japanese/".length) : slug;
}

function languageCharacterLookupSlug(slug: string[]) {
  const joined = slug.join("/");
  return joined.startsWith("japanese/") ? joined : `japanese/${joined}`;
}
