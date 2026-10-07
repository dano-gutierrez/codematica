"use client";

import Link from "next/link";
import { ArrowLeft, Briefcase, Code2, Lightbulb, MessagesSquare } from "lucide-react";
import type { UIEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CodeBlock } from "@/components/CodeBlock";
import { ButtonLink } from "@/components/ButtonLink";
import { DifficultyPill } from "@/components/DifficultyPill";
import type { PassiveFlashcardCard, PassiveFlashcardFeed as PassiveFlashcardFeedType, PassiveFlashcardType } from "@/lib/content/schema";
import { buildPassiveFlashcardWindow, shufflePassiveFlashcards } from "@/lib/flashcards/passive";
import { recordProgress } from "@/lib/progress/client";
import type { ProgressStatus } from "@/lib/progress/progress";
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
  onProgressEvent,
}: {
  feed: PassiveFlashcardFeedType;
  initialVisibleCount?: number;
  appendCount?: number;
  onProgressEvent?: (status: ProgressStatus, position: Record<string, unknown>) => void;
}) {
  const [deck, setDeck] = useState(() => shufflePassiveFlashcards(feed.cards, () => 0.999999));
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [isReady, setIsReady] = useState(false);
  const visibleCards = useMemo(() => buildPassiveFlashcardWindow(deck, visibleCount), [deck, visibleCount]);

  const emitProgress = useCallback(
    (status: ProgressStatus, position: Record<string, unknown>) => {
      if (onProgressEvent) {
        onProgressEvent(status, position);
        return;
      }

      void recordProgress(
        {
          surface: "passive-feed",
          slug: feed.pathSlug,
          title: feed.title,
          summary: feed.summary,
          href: feed.route,
          eyebrow: "Flashcards",
        },
        status,
        position,
      );
    },
    [feed.pathSlug, feed.route, feed.summary, feed.title, onProgressEvent],
  );

  useEffect(() => {
    let isMounted = true;

    queueMicrotask(() => {
      if (!isMounted) {
        return;
      }

      setDeck(shufflePassiveFlashcards(feed.cards, passiveFlashcardRandom));
      setVisibleCount(initialVisibleCount);
      setIsReady(true);
      emitProgress("started", { sequenceIndex: 0, cardId: feed.cards[0]?.id });
    });

    return () => {
      isMounted = false;
    };
  }, [emitProgress, feed.cards, initialVisibleCount]);

  function appendWhenNearEnd(event: UIEvent<HTMLElement>) {
    const element = event.currentTarget;
    const remainingScroll = element.scrollHeight - element.scrollTop - element.clientHeight;
    const sequenceIndex = Math.max(0, Math.min(visibleCards.length - 1, Math.round(element.scrollTop / Math.max(element.clientHeight, 1))));
    const visibleCard = visibleCards[sequenceIndex];

    if (remainingScroll < element.clientHeight * 2) {
      setVisibleCount((currentCount) => currentCount + appendCount);
    }

    emitProgress("started", { sequenceIndex, cardId: visibleCard?.card.id });
  }

  return (
    <main
      className="passive-feed overflow-y-auto bg-[#f6fbfc] snap-y snap-proximity"
      tabIndex={0}
      aria-label={feed.title}
      data-ready={isReady ? "true" : "false"}
      data-testid="passive-flashcard-feed"
      onScroll={appendWhenNearEnd}
    >
      <header className="border-b border-[#d5e2e8] bg-white px-4 py-3">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <ButtonLink href={`/paths/${feed.pathSlug}`} label="Path" icon={ArrowLeft} />
          <div className="min-w-0 text-right">
            <h1 className="text-sm font-semibold text-[#00645f]">{feed.title}</h1>
          </div>
        </div>
      </header>

      {visibleCards.map(({ card, instanceId, sequenceIndex }) => (
        <PassiveFlashcard key={instanceId} card={card} sequenceIndex={sequenceIndex} pathSlug={feed.pathSlug} />
      ))}
    </main>
  );
}

function PassiveFlashcard({ card, sequenceIndex, pathSlug }: { card: PassiveFlashcardCard; sequenceIndex: number; pathSlug: string }) {
  const typeMeta = getCardTypeMeta(card.type);

  return (
    <article
      className={cn(
        "passive-feed-card flex min-w-0 snap-start flex-col justify-center px-4 py-8",
        typeMeta.backgroundClass,
      )}
      data-testid={`passive-flashcard-card-${sequenceIndex}`}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
        <div className="rounded-xl border border-[#d5e2e8] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs font-semibold uppercase",
                typeMeta.pillClass,
              )}
            >
              {typeMeta.icon}
              {cardTypeLabels[card.type]}
            </span>
            <DifficultyPill difficulty={card.difficulty} />
          </div>

          <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-[#263238] sm:text-4xl">{card.title}</h2>
          <p className="mt-5 text-xl font-normal leading-8 text-[#33434b] sm:text-2xl sm:leading-9">{card.prompt}</p>
          <p className="mt-5 text-base font-normal leading-7 text-[#68737d] sm:text-lg sm:leading-8">{card.explanation}</p>

          {card.code ? <CodeBlock code={card.code} language={card.codeLanguage} className="mt-5" /> : null}

          {card.sourceDocSlug ? <Link href={`/docs/${card.sourceDocSlug}?path=${encodeURIComponent(pathSlug)}`} className="mt-4 inline-flex min-h-11 items-center font-semibold text-[#1d4e9e] underline" data-testid={`passive-flashcard-source-${sequenceIndex}`}>Review the lesson</Link> : null}

          <div className="mt-6 flex flex-wrap gap-2">
            {card.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="rounded-xl bg-[#eaf7f4] px-2.5 py-1 text-xs font-semibold text-[#007c78]">
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
