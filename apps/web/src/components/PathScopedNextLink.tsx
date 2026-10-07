"use client";

import { ButtonLink } from "./ButtonLink";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { appendPathToHref, recordProgress, type ProgressTarget } from "@/lib/progress/client";

type PathScopedNextLinkProps = {
  nextHrefsByPath: Record<string, string>;
  testId: string;
  wrapperClassName?: string;
  progressTarget?: Omit<ProgressTarget, "pathSlug">;
};

export function PathScopedNextLink({ nextHrefsByPath, testId, wrapperClassName = "mt-6 flex justify-end", progressTarget }: PathScopedNextLinkProps) {
  const searchParams = useSearchParams();
  const pathSlug = searchParams.get("path") ?? "";
  const href = pathSlug && Object.hasOwn(nextHrefsByPath, pathSlug) ? nextHrefsByPath[pathSlug] : undefined;

  if (!href) {
    return null;
  }

  return (
    <div className={wrapperClassName}>
      <ButtonLink
        href={href}
        label="Next activity"
        icon={ArrowRight}
        tone="success"
        variant="primary"
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
      />
    </div>
  );
}
