import { randomInt } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GitPullRequest } from "lucide-react";
import { PracticeCard } from "@/components/PracticeCard";
import { getContentIndex } from "@/lib/content";

type CodeReviewsPageProps = {
  searchParams: Promise<{
    exercise?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Code Reviews - Codematica",
  description: "Practice reviewing TypeScript, JavaScript, and Python snippets.",
};

export default async function CodeReviewsPage({ searchParams }: CodeReviewsPageProps) {
  const { exercise } = await searchParams;
  const requestedSlug = Array.isArray(exercise) ? exercise[0] : exercise;
  const reviews = getContentIndex().exercises.filter((item) => item.type === "code-review" && item.status === "published");
  const selectedReview = requestedSlug ? reviews.find((item) => item.slug === requestedSlug) : randomItem(reviews);

  if (!selectedReview) {
    notFound();
  }

  const reviewRoutes = reviews.map((item) => `/code-reviews?exercise=${encodeURIComponent(item.slug)}`);

  return (
    <main className="min-h-screen px-4 py-5 sm:py-8" data-testid="code-reviews-page">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Paths
          </Link>
          <span className="inline-flex items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#5840b8]">
            <GitPullRequest className="h-4 w-4" aria-hidden="true" />
            Code reviews
          </span>
        </div>

        <div className="mt-6">
          <PracticeCard exercise={selectedReview} reviewRoutes={reviewRoutes} />
        </div>
      </div>
    </main>
  );
}

function randomItem<T>(items: T[]) {
  return items.length > 0 ? items[randomInt(items.length)] : undefined;
}
