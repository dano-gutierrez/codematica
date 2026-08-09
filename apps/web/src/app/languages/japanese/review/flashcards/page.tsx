import { AppHeader } from "@/components/AppHeader";
import { JapaneseFlashcardPractice } from "@/components/JapaneseFlashcardPractice";
import { getJapaneseVocabulary } from "@/lib/content";

export default function JapaneseFlashcardsPage() {
  return <main className="min-h-screen pb-12"><AppHeader subtitle="Japanese flashcards" /><section className="mx-auto w-full max-w-3xl px-4 py-8"><p className="text-sm font-extrabold uppercase text-[#7a5200]">N5 cumulative review</p><h1 className="mt-2 text-4xl font-extrabold text-[#263238]">Build a 650-word foundation.</h1><p className="my-6 text-base font-semibold leading-7 text-[#53616c]">Recall the reading and meaning before revealing each card. This is an N5-aligned study deck, not an official JLPT list.</p><JapaneseFlashcardPractice vocabulary={getJapaneseVocabulary()} /></section></main>;
}
