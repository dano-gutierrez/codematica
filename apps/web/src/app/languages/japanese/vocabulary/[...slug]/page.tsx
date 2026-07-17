import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContentIndex, getLanguageVocabularyBySlug } from "@/lib/content";

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
        </section>
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
