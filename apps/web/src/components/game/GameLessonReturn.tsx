"use client";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "../ButtonLink";
export function GameLessonReturn() {
  const value = useSearchParams().get("returnTo");
  return value && /^\/play\/[a-z0-9-]+\/[a-z0-9-]+$/.test(value) ? (
    <div className="ui-page py-3"><ButtonLink href={value} label="Return to your challenge" icon={ArrowLeft} tone="info" data-testid="game-return" /></div>
  ) : null;
}
