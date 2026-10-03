"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
export function GameLessonReturn() {
  const value = useSearchParams().get("returnTo");
  return value && /^\/play\/[a-z0-9-]+\/[a-z0-9-]+$/.test(value) ? (
    <Link
      className="game-return game-button"
      href={value}
      data-testid="game-return"
    >
      Return to your challenge →
    </Link>
  ) : null;
}
