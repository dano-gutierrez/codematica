"use client";

import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";
import { Button } from "./Button";

export function RandomInterviewButton({ routes }: { routes: string[] }) {
  const router = useRouter();

  function openRandomQuestion() {
    if (routes.length === 0) {
      return;
    }

    const index = Math.min(routes.length - 1, Math.floor(Math.random() * routes.length));
    router.push(routes[index]);
  }

  return <Button label="Random question" icon={Shuffle} tone="assist" variant="primary" disabled={routes.length === 0} onClick={openRandomQuestion} data-testid="interview-random-button" />;
}
