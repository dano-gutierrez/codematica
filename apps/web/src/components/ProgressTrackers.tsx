"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { appendPathToHref, recordProgress, type ProgressTarget } from "@/lib/progress/client";

type PageProgressTarget = Omit<ProgressTarget, "pathSlug">;

export function DocumentProgressTracker({ target }: { target: PageProgressTarget }) {
  const searchParams = useSearchParams();
  const pathSlug = searchParams.get("path") ?? "";
  const startedRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    const scopedTarget = createScopedTarget(target, pathSlug);

    if (!startedRef.current) {
      startedRef.current = true;
      void recordProgress(scopedTarget, "started", { scrollRatio: getScrollRatio() });
    }

    function handleScroll() {
      if (completedRef.current) {
        return;
      }

      const scrollRatio = getScrollRatio();

      if (scrollRatio >= 0.8) {
        completedRef.current = true;
        void recordProgress(scopedTarget, "completed", { scrollRatio });
      }
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathSlug, target]);

  return null;
}

export function DiagramProgressTracker({ target }: { target: PageProgressTarget }) {
  const searchParams = useSearchParams();
  const pathSlug = searchParams.get("path") ?? "";

  useEffect(() => {
    void recordProgress(createScopedTarget(target, pathSlug), "completed", { viewed: true });
  }, [pathSlug, target]);

  return null;
}

function createScopedTarget(target: PageProgressTarget, pathSlug: string): ProgressTarget {
  return {
    ...target,
    pathSlug,
    href: appendPathToHref(target.href, pathSlug),
  };
}

function getScrollRatio() {
  const documentElement = document.documentElement;
  const scrollableHeight = Math.max(documentElement.scrollHeight - window.innerHeight, 1);
  return Math.min(1, Math.max(0, window.scrollY / scrollableHeight));
}
