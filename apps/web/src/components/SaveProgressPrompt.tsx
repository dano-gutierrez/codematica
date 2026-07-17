"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { anonymousProgressChangedEvent, getAnonymousProgressItems } from "@/lib/progress/anonymous";
import { syncBufferedAnonymousProgress } from "@/lib/progress/client";

type SaveProgressPromptProps = {
  isAuthConfigured: boolean;
};

export function SaveProgressPrompt({ isAuthConfigured }: SaveProgressPromptProps) {
  const [hasAnonymousProgress, setHasAnonymousProgress] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [nextPath] = useState(() => (typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`));

  useEffect(() => {
    function refreshAnonymousProgress() {
      setHasAnonymousProgress(getAnonymousProgressItems().length > 0);
    }

    queueMicrotask(refreshAnonymousProgress);
    window.addEventListener(anonymousProgressChangedEvent, refreshAnonymousProgress);

    return () => window.removeEventListener(anonymousProgressChangedEvent, refreshAnonymousProgress);
  }, []);

  useEffect(() => {
    if (!isAuthConfigured) {
      return;
    }

    let isMounted = true;

    fetch("/api/progress/summary")
      .then((response) => (response.ok ? response.json() : undefined))
      .then((summary: { isSignedIn?: boolean } | undefined) => {
        if (!isMounted || !summary?.isSignedIn) {
          return;
        }

        setIsSignedIn(true);
        void syncBufferedAnonymousProgress();
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [isAuthConfigured]);

  if (isSignedIn || !hasAnonymousProgress || isDismissed) {
    return null;
  }

  return (
    <aside
      className="fixed right-3 top-3 z-50 grid w-[min(15rem,calc(100vw-1.5rem))] grid-cols-[minmax(0,1fr)_2.5rem] gap-3 rounded-lg border-2 border-b-4 border-[#00645f] bg-white p-3 shadow-[0_8px_0_rgba(0,100,95,0.18)]"
      data-testid="save-progress-prompt"
    >
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-[#263238]">Save progress across devices</p>
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="mt-1 inline-flex text-sm font-extrabold text-[#245fba]">
          Save progress
        </Link>
      </div>
      <button
        type="button"
        aria-label="Dismiss save progress prompt"
        onClick={() => setIsDismissed(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-[#f6fbfc] text-[#263238]"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </aside>
  );
}
