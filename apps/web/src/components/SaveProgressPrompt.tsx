"use client";

import { LogIn, X } from "lucide-react";
import { Button } from "@/components/Button";
import { ButtonLink } from "@/components/ButtonLink";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { anonymousProgressChangedEvent, getAnonymousProgressItems } from "@/lib/progress/anonymous";
import {GAME_STORAGE_KEY,gameProgressSchema,gameTotals} from "@codematica/core/game";
import { syncBufferedAnonymousProgress } from "@/lib/progress/client";

type SaveProgressPromptProps = {
  isAuthConfigured: boolean;
};

export function SaveProgressPrompt({ isAuthConfigured }: SaveProgressPromptProps) {
  const [hasAnonymousProgress, setHasAnonymousProgress] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const pathname = usePathname();
  const [nextPath, setNextPath] = useState(() => (typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`));

  useEffect(() => {
    queueMicrotask(() => setNextPath(`${window.location.pathname}${window.location.search}`));
  }, [pathname]);

  useEffect(() => {
    function refreshAnonymousProgress() {
      let gameStars=0;try{const parsed=gameProgressSchema.safeParse(JSON.parse(localStorage.getItem(GAME_STORAGE_KEY)??"null"));if(parsed.success&&!localStorage.getItem(`${GAME_STORAGE_KEY}:claimed`))gameStars=gameTotals(parsed.data).stars;}catch { /* Unreadable local data does not trigger the prompt. */ }
      setHasAnonymousProgress(getAnonymousProgressItems().length > 0 || gameStars>0);
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
    let authVersion = 0;
    const client = createBrowserSupabaseClient();
    const subscription = client?.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      authVersion++;
      setIsSignedIn(!!session?.user);
    }).data.subscription;
    const initialVersion = authVersion;

    fetch("/api/progress/summary")
      .then((response) => (response.ok ? response.json() : undefined))
      .then((summary: { isSignedIn?: boolean } | undefined) => {
        if (!isMounted || authVersion !== initialVersion) {
          return;
        }

        setIsSignedIn(!!summary?.isSignedIn);
        if (summary?.isSignedIn) void syncBufferedAnonymousProgress();
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [isAuthConfigured]);

  if (isSignedIn || !hasAnonymousProgress || isDismissed) {
    return null;
  }

  return (
    <aside
      className="save-progress-banner"
      data-testid="save-progress-prompt"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#263238]">{isAuthConfigured ? "Save progress across devices" : "Progress saved on this device"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {isAuthConfigured ? <ButtonLink href={`/login?next=${encodeURIComponent(nextPath)}`} label="Save progress" icon={LogIn} tone="info" /> : null}
        <Button label="Dismiss" aria-label="Dismiss save progress prompt" icon={X} variant="quiet" onClick={() => setIsDismissed(true)} />
      </div>
    </aside>
  );
}
