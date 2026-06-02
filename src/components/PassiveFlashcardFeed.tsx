"use client";

import Link from "next/link";
import { ArrowLeft, Briefcase, Code2, Lightbulb, MessagesSquare } from "lucide-react";
import type { UIEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { CodeBlock } from "@/components/CodeBlock";
import { DifficultyPill } from "@/components/DifficultyPill";
import type { PassiveFlashcardCard, PassiveFlashcardFeed as PassiveFlashcardFeedType, PassiveFlashcardType } from "@/lib/content/schema";
import { buildPassiveFlashcardWindow, shufflePassiveFlashcards } from "@/lib/flashcards/passive";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    __codematicaPassiveFlashcardRandom?: () => number;
  }
}

const cardTypeLabels: Record<PassiveFlashcardType, string> = {
  concept: "Concept",
  practical: "Practical",
  snippet: "Snippet",
  interview: "Interview",
};

export function PassiveFlashcardFeed({
  feed,
  initialVisibleCount = 12,
  appendCount = 12,
}: {
  feed: PassiveFlashcardFeedType;
  initialVisibleCount?: number;
  appendCount?: number;
}) {
  const [deck, setDeck] = useState(() => shufflePassiveFlashcards(feed.cards, () => 0.999999));
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [isReady, setIsReady] = useState(false);
  const visibleCards = useMemo(() => buildPassiveFlashcardWindow(deck, visibleCount), [deck, visibleCount]);

  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (!isMounted) {
        return;
      }

      setDeck(shufflePassiveFlashcards(feed.cards, passiveFlashcardRandom));
      setVisibleCount(initialVisibleCount);
      setIsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, [feed.cards, initialVisibleCount]);

  function appendWhenNearEnd(event: UIEvent<HTMLElement>) {
    const element = event.currentTarget;
    const remainingScroll = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (remainingScroll < element.clientHeight * 2) {
      setVisibleCount((currentCount) => currentCount + appendCount);
    }
  }

  return (
    <main
      className="h-[100svh] overflow-y-auto scroll-smooth bg-[#f6fbfc] snap-y snap-mandatory"
      data-ready={isReady ? "true" : "false"}
      data-testid="passive-flashcard-feed"
      onScroll={appendWhenNearEnd}
    >
      <header className="fixed inset-x-0 top-0 z-20 border-b-2 border-[#d5e2e8] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <Link
            href={`/paths/${feed.pathSlug}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Path
          </Link>
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-extrabold text-[#007c78]">{feed.title}</p>
            <p className="truncate text-xs font-bold text-[#68737d]">Passive refresh</p>
          </div>
        </div>
      </header>

      {visibleCards.map(({ card, instanceId, sequenceIndex }) => (
        <PassiveFlashcard key={instanceId} card={card} sequenceIndex={sequenceIndex} />
      ))}
    </main>
  );
}

function PassiveFlashcard({ card, sequenceIndex }: { card: PassiveFlashcardCard; sequenceIndex: number }) {
  const typeMeta = getCardTypeMeta(card.type);

  return (
    <article
      className={cn(
        "flex min-h-[100svh] snap-start flex-col justify-center px-4 pb-8 pt-24",
        typeMeta.backgroundClass,
      )}
      data-testid={`passive-flashcard-card-${sequenceIndex}`}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
        <div className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 shadow-[0_8px_0_#e3edf2] sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border-2 border-b-4 px-2.5 py-1 text-xs font-extrabold uppercase",
                typeMeta.pillClass,
              )}
            >
              {typeMeta.icon}
              {cardTypeLabels[card.type]}
            </span>
            <DifficultyPill difficulty={card.difficulty} />
          </div>

          <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-5xl">{card.title}</h1>
          <p className="mt-5 text-xl font-extrabold leading-8 text-[#33434b] sm:text-2xl sm:leading-9">{card.prompt}</p>
          <p className="mt-5 text-base font-semibold leading-7 text-[#68737d] sm:text-lg sm:leading-8">{card.explanation}</p>

          {card.code ? <CodeBlock code={card.code} language="python" className="mt-5" /> : null}

          <div className="mt-6 flex flex-wrap gap-2">
            {card.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="rounded-lg bg-[#eaf7f4] px-2.5 py-1 text-xs font-extrabold text-[#007c78]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function getCardTypeMeta(type: PassiveFlashcardType) {
  if (type === "practical") {
    return {
      icon: <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />,
      pillClass: "border-[#6dd8cf] bg-[#e8f8f6] text-[#007c78]",
      backgroundClass: "bg-[#f6fbfc]",
    };
  }

  if (type === "snippet") {
    return {
      icon: <Code2 className="h-3.5 w-3.5" aria-hidden="true" />,
      pillClass: "border-[#9cc7ff] bg-[#edf5ff] text-[#245fba]",
      backgroundClass: "bg-[#f4f8ff]",
    };
  }

  if (type === "interview") {
    return {
      icon: <MessagesSquare className="h-3.5 w-3.5" aria-hidden="true" />,
      pillClass: "border-[#f7cf5d] bg-[#fff5d6] text-[#7a5200]",
      backgroundClass: "bg-[#fffaf0]",
    };
  }

  return {
    icon: <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />,
    pillClass: "border-[#c8b8ff] bg-[#f3efff] text-[#5840b8]",
    backgroundClass: "bg-[#fbf8ff]",
  };
}

function passiveFlashcardRandom() {
  return window.__codematicaPassiveFlashcardRandom?.() ?? Math.random();
}
