import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { AppHeader } from "@/components/AppHeader";
import { JapaneseFlashcardPractice } from "@/components/JapaneseFlashcardPractice";
import { getJapaneseVocabulary } from "@/lib/content";

export default function JapaneseFlashcardsPage() {
  return <main className="min-h-screen pb-12"><AppHeader subtitle="Japanese flashcards" /><section className="ui-page max-w-3xl"><ButtonLink href="/languages/japanese/review" label="Japanese review" icon={ArrowLeft} variant="quiet" /><p className="mt-5 text-sm font-semibold text-[#7a5200]">N5 cumulative review</p><h1 className="mt-2 text-3xl font-semibold text-[#263238]">Japanese flashcards</h1><p className="my-6 text-base font-normal leading-7 text-[#53616c]">Recall the reading and meaning before revealing each card. This is an N5-aligned study deck, not an official JLPT list.</p><JapaneseFlashcardPractice vocabulary={getJapaneseVocabulary()} /></section></main>;
}
