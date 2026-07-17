import type { ProgressDisplayItem, ProgressInput } from "./progress";

const storageKey = "codematica:anonymous-progress:v1";
const maxBufferedItems = 20;

export const anonymousProgressChangedEvent = "codematica:anonymous-progress-changed";

export type AnonymousProgressItem = {
  input: ProgressInput;
  display: ProgressDisplayItem;
};

export function getAnonymousProgressItems(): AnonymousProgressItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as AnonymousProgressItem[]) : [];
  } catch {
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
    ...getAnonymousProgressItems().filter((storedItem) => createAnonymousProgressKey(storedItem.input) !== key),
  ].slice(0, maxBufferedItems);

  window.localStorage.setItem(storageKey, JSON.stringify(nextItems));
  window.dispatchEvent(new CustomEvent(anonymousProgressChangedEvent));
}

export function clearAnonymousProgressItems() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(storageKey);
  window.dispatchEvent(new CustomEvent(anonymousProgressChangedEvent));
}

function createAnonymousProgressKey(input: ProgressInput) {
  return `${input.surface}:${input.slug}:${input.pathSlug}`;
}
