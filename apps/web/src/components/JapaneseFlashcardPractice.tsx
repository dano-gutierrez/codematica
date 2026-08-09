"use client";

import { useMemo, useState } from "react";
import type { LanguageVocabulary } from "@codematica/core";

export function JapaneseFlashcardPractice({ vocabulary }: { vocabulary: LanguageVocabulary[] }) {
  const ordered = useMemo(() => [...vocabulary].sort((a, b) => a.studyOrder - b.studyOrder), [vocabulary]);
  const [index, setIndex] = useState(0); const [revealed, setRevealed] = useState(false); const card = ordered[index];
  if (!card) return <p>No published N5 vocabulary is available.</p>;
  return (
    <section className="grid gap-5" data-testid="japanese-flashcard-practice">
      <p className="text-sm font-extrabold uppercase text-[#53616c]">Card {index + 1} of {ordered.length}</p>
      <button type="button" onClick={() => setRevealed((value) => !value)} className="grid min-h-[22rem] place-content-center rounded-2xl border-2 border-b-8 border-[#9cc7ff] bg-[#f5f9ff] p-8 text-center">
        <span lang="ja" className="text-6xl font-extrabold text-[#263238]">{card.expression}</span>
        {revealed ? <span className="mt-6 grid gap-2"><span lang="ja" className="text-2xl font-bold text-[#1d4e9e]">{card.reading}</span><span className="text-xl font-extrabold text-[#33434b]">{card.meanings.join(", ")}</span></span> : <span className="mt-6 text-base font-bold text-[#53616c]">Tap to reveal</span>}
      </button>
      <div className="flex justify-between gap-3">
        <button type="button" disabled={index === 0} onClick={() => { setIndex((value) => value - 1); setRevealed(false); }} className="min-h-12 rounded-lg border-2 border-b-4 border-[#b9cbd3] bg-white px-5 font-extrabold disabled:opacity-40">Previous</button>
        <button type="button" disabled={index === ordered.length - 1} onClick={() => { setIndex((value) => value + 1); setRevealed(false); }} className="min-h-12 rounded-lg border-2 border-b-4 border-[#00645f] bg-[#007c78] px-5 font-extrabold text-white disabled:opacity-40">Next</button>
      </div>
    </section>
  );
}
