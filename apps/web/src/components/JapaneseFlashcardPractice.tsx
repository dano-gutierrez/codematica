"use client";

import { Button } from "./Button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { LanguageVocabulary } from "@codematica/core";

export function JapaneseFlashcardPractice({ vocabulary }: { vocabulary: LanguageVocabulary[] }) {
  const ordered = useMemo(() => [...vocabulary].sort((a, b) => a.studyOrder - b.studyOrder), [vocabulary]);
  const [index, setIndex] = useState(0); const [revealed, setRevealed] = useState(false); const card = ordered[index];
  if (!card) return <p>No published N5 vocabulary is available.</p>;
  return (
    <section className="grid gap-5" data-testid="japanese-flashcard-practice">
      <p className="text-sm font-semibold uppercase text-[#53616c]">Card {index + 1} of {ordered.length}</p>
      <button type="button" onClick={() => setRevealed((value) => !value)} aria-expanded={revealed} aria-label={`${revealed ? "Hide" : "Reveal"} reading and meaning for ${card.expression}`} className="grid min-w-0 min-h-[22rem] place-content-center rounded-2xl border border-[#7d8b94] bg-white p-4 text-center sm:p-8">
        <span lang="ja" className="text-6xl font-semibold text-[#263238]">{card.expression}</span>
        {revealed ? <span className="mt-6 grid gap-2"><span lang="ja" className="text-2xl font-medium text-[#1d4e9e]">{card.reading}</span><span className="text-xl font-semibold text-[#33434b]">{card.meanings.join(", ")}</span></span> : <span className="mt-6 text-base font-medium text-[#53616c]">Tap to reveal</span>}
      </button>
      <div className="flex flex-wrap justify-between gap-3">
        <Button label="Previous" icon={ArrowLeft} tone="neutral" disabled={index === 0} onClick={() => { setIndex((value) => value - 1); setRevealed(false); }} />
        <Button label="Next" icon={ArrowRight} tone="success" disabled={index === ordered.length - 1} onClick={() => { setIndex((value) => value + 1); setRevealed(false); }} />
      </div>
    </section>
  );
}
