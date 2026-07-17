"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { anonymousProgressChangedEvent, getAnonymousProgressSummaryItems } from "@/lib/progress/anonymous";
import type { ProgressDisplayItem } from "@/lib/progress/progress";

type KeepReadingSectionProps = {
  initialItems: ProgressDisplayItem[];
  isSignedIn: boolean;
};

export function KeepReadingSection({ initialItems, isSignedIn }: KeepReadingSectionProps) {
  const [anonymousItems, setAnonymousItems] = useState<ProgressDisplayItem[]>([]);
  const items = isSignedIn ? initialItems : anonymousItems;

  useEffect(() => {
    if (isSignedIn) {
      return;
    }

    function refreshAnonymousItems() {
      setAnonymousItems(getAnonymousProgressSummaryItems());
    }

    queueMicrotask(refreshAnonymousItems);
    window.addEventListener(anonymousProgressChangedEvent, refreshAnonymousItems);

    return () => window.removeEventListener(anonymousProgressChangedEvent, refreshAnonymousItems);
  }, [isSignedIn]);

  return (
    <section className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4 sm:p-5" data-testid="keep-reading-section">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#263238]">
            <BookOpenCheck className="h-5 w-5 text-[#007c78]" aria-hidden="true" />
            Keep reading
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#68737d]">{isSignedIn ? "Synced from your latest activity." : "Saved on this device until you sign in."}</p>
        </div>
        {!isSignedIn ? (
          <Link href="/login" className="hidden rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#f6fbfc] px-3 py-2 text-sm font-extrabold text-[#245fba] sm:inline-flex">
            Sign in
          </Link>
        ) : (
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="hidden rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#f6fbfc] px-3 py-2 text-sm font-extrabold text-[#263238] sm:inline-flex"
            >
              Sign out
            </button>
          </form>
        )}
      </div>

      {items.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.slice(0, 2).map((item) => (
            <Link key={item.id} href={item.href} className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#f6fbfc] p-3 transition hover:-translate-y-0.5 hover:border-[#007c78]">
              <span className="text-xs font-extrabold uppercase text-[#007c78]">{item.eyebrow}</span>
              <span className="mt-1 block text-base font-extrabold text-[#263238]">{item.title}</span>
              <span className="mt-1 line-clamp-2 block text-xs font-bold leading-5 text-[#68737d]">{item.summary}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-[#245fba]">
                Resume
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-[#f6fbfc] p-3 text-sm font-bold text-[#68737d]">Open a lesson, diagram, practice card, or interview walkthrough to start here next time.</div>
      )}
    </section>
  );
}
