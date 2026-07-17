"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { appendPathToHref, recordProgress, type ProgressTarget } from "@/lib/progress/client";

const nextLinkClassName =
  "inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#1d4e9e] bg-[#245fba] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5";

type PathScopedNextLinkProps = {
  nextHrefsByPath: Record<string, string>;
  testId: string;
  wrapperClassName?: string;
  progressTarget?: Omit<ProgressTarget, "pathSlug">;
};

export function PathScopedNextLink({ nextHrefsByPath, testId, wrapperClassName = "mt-6 flex justify-end", progressTarget }: PathScopedNextLinkProps) {
  const searchParams = useSearchParams();
  const pathSlug = searchParams.get("path") ?? "";
  const href = pathSlug ? nextHrefsByPath[pathSlug] : undefined;

  if (!href) {
    return null;
  }

  return (
    <div className={wrapperClassName}>
      <Link
        href={href}
        className={nextLinkClassName}
        data-testid={testId}
        onClick={() => {
          if (!progressTarget) {
            return;
          }

          void recordProgress(
            {
              ...progressTarget,
              pathSlug,
              href: appendPathToHref(progressTarget.href, pathSlug),
            },
            "completed",
            { nextNode: true },
          );
        }}
      >
        Next node
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
