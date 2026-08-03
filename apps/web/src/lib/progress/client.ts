"use client";

import { addAnonymousProgressItem, clearAnonymousProgressItems, getAnonymousProgressItems } from "./anonymous";
import type { ProgressDisplayItem, ProgressInput, ProgressStatus, ProgressSurface } from "./progress";

export type ProgressTarget = {
  surface: ProgressSurface;
  slug: string;
  title: string;
  summary: string;
  href: string;
  eyebrow: string;
  pathSlug?: string;
};

export async function recordProgress(target: ProgressTarget, status: ProgressStatus, position: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  const input: ProgressInput = {
    surface: target.surface,
    slug: target.slug,
    pathSlug: target.pathSlug ?? "",
    status,
    position,
  };
  const display: ProgressDisplayItem = {
    id: `${target.surface}-${target.slug}-${input.pathSlug}`,
    title: target.title,
    summary: target.summary,
    href: target.href,
    eyebrow: target.eyebrow,
    status,
    lastSeenAt: now,
  };

  try {
    const response = await fetch("/api/progress", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (response.ok) {
      return;
    }
  } catch {
    // Signed-out and offline usage fall back to the local buffer below.
  }

  addAnonymousProgressItem({ input, display });
}

export async function syncBufferedAnonymousProgress() {
  const items = getAnonymousProgressItems();

  if (items.length === 0) {
    return;
  }

  for (let offset = 0; offset < items.length; offset += 20) {
    const batch = items.slice(offset, offset + 20);
    const response = await fetch("/api/progress/sync-anonymous", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ items: batch.map((item) => item.input) }),
    });

    if (!response.ok) {
      return;
    }
  }

  clearAnonymousProgressItems();
}

export function appendPathToHref(href: string, pathSlug: string) {
  if (!pathSlug) {
    return href;
  }

  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}path=${encodeURIComponent(pathSlug)}`;
}
