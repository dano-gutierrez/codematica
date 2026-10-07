import type { ProgressDisplayItem, ProgressInput } from "./progress";

const storageKey = "codematica:anonymous-progress:v1";

export const anonymousProgressChangedEvent = "codematica:anonymous-progress-changed";

export type AnonymousProgressItem = {
  input: ProgressInput;
  display: ProgressDisplayItem;
};

export function getAnonymousProgressItems({ strict = false }: { strict?: boolean } = {}): AnonymousProgressItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) throw new Error("Saved progress could not be read.");
    return parsed as AnonymousProgressItem[];
  } catch (error) {
    if (strict) throw error;
    return [];
  }
}

export function getAnonymousProgressSummaryItems(): ProgressDisplayItem[] {
  return getAnonymousProgressItems().map((item) => item.display);
}

export function addAnonymousProgressItem(item: AnonymousProgressItem) {
  if (typeof window === "undefined") {
    return;
  }

  const key = createAnonymousProgressKey(item.input);
  const nextItems = [
    item,
    ...getAnonymousProgressItems({ strict: true }).filter((storedItem) => createAnonymousProgressKey(storedItem.input) !== key),
  ];

  window.localStorage.setItem(storageKey, JSON.stringify(nextItems));
  window.dispatchEvent(new CustomEvent(anonymousProgressChangedEvent));
}

/** Acknowledge only unchanged submitted records; later activity stays buffered. */
export function clearAnonymousProgressItems(submitted?: AnonymousProgressItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  const acknowledged = submitted && new Set(submitted.map(item => JSON.stringify(item)));
  const remaining = acknowledged ? getAnonymousProgressItems({ strict: true }).filter(item => !acknowledged.has(JSON.stringify(item))) : [];
  if (remaining.length) window.localStorage.setItem(storageKey, JSON.stringify(remaining));
  else window.localStorage.removeItem(storageKey);
  window.dispatchEvent(new CustomEvent(anonymousProgressChangedEvent));
}

function createAnonymousProgressKey(input: ProgressInput) {
  return `${input.surface}:${input.slug}:${input.pathSlug}`;
}
