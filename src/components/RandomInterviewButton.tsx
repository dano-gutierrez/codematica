"use client";

import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";

export function RandomInterviewButton({ routes }: { routes: string[] }) {
  const router = useRouter();

  function openRandomQuestion() {
    if (routes.length === 0) {
      return;
    }

    const index = Math.min(routes.length - 1, Math.floor(Math.random() * routes.length));
    router.push(routes[index]);
  }

  return (
    <button
      type="button"
      onClick={openRandomQuestion}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-b-4 border-[#7a5200] bg-[#f7cf5d] px-4 py-2 text-sm font-extrabold text-[#263238] transition hover:-translate-y-0.5"
      data-testid="interview-random-button"
    >
      <Shuffle className="h-4 w-4" aria-hidden="true" />
      Random question
    </button>
  );
}
