import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createProgressDisplayItem,
  createStoredProgressRow,
  getContentIndex,
  getProgressSummary,
  normalizeProgressInput,
  syncAnonymousProgress,
  upsertProgress,
  type ProgressDataClient,
  type ProgressDisplayItem,
  type ProgressInput,
  type ProgressStatus,
} from "@codematica/core";
import type { ProgressTarget } from "@codematica/ui";

const storageKey = "codematica:anonymous-progress:v1";

type AnonymousProgressItem = {
  input: ProgressInput;
  lastSeenAt: string;
};

export async function getNativeProgressSummary(client?: unknown): Promise<{ isSignedIn: boolean; items: ProgressDisplayItem[] }> {
  const index = getContentIndex();
  const progressClient = client as ProgressDataClient | undefined;

  if (progressClient) {
    try {
      const summary = await getProgressSummary(progressClient, index);

      if (summary.isSignedIn) {
        return summary;
      }
    } catch {
      // Offline and unconfigured usage falls back to the local buffer.
    }
  }

  return {
    isSignedIn: false,
    items: await getAnonymousProgressSummaryItems(),
  };
}

export async function recordNativeProgress(client: unknown, target: ProgressTarget, status: ProgressStatus, position: Record<string, unknown> = {}) {
  const input: ProgressInput = normalizeProgressInput(
    {
      surface: target.surface,
      slug: target.slug,
      pathSlug: target.pathSlug ?? "",
      status,
      position,
    },
    getContentIndex(),
  );

  const progressClient = client as ProgressDataClient | undefined;

  if (progressClient) {
    try {
      const result = await upsertProgress(progressClient, input, getContentIndex());

      if (result.status === 200) {
        return;
      }
    } catch {
      // Signed-out and offline usage fall back to the local buffer below.
    }
  }

  await addAnonymousProgressItem(input);
}

export async function syncNativeAnonymousProgress(client?: unknown) {
  const progressClient = client as ProgressDataClient | undefined;

  if (!progressClient) {
    return { synced: 0, rejected: 0 };
  }

  const items = await getAnonymousProgressItems();

  if (items.length === 0) {
    return { synced: 0, rejected: 0 };
  }

  let synced = 0;
  let rejected = 0;

  for (let offset = 0; offset < items.length; offset += 20) {
    const batch = items.slice(offset, offset + 20);
    const result = await syncAnonymousProgress(
      progressClient,
      batch.map((item) => item.input),
      getContentIndex(),
    );

    if (result.status !== 200 || !("synced" in result.body)) {
      return { synced, rejected: rejected + items.length - offset };
    }

    synced += result.body.synced;
    rejected += result.body.rejected;
  }

  await clearAnonymousProgressItems();
  return { synced, rejected };
}

async function getAnonymousProgressSummaryItems() {
  const index = getContentIndex();
  const items = await getAnonymousProgressItems();

  return items.flatMap((item) => {
    const row = {
      ...createStoredProgressRow(item.input, new Date(item.lastSeenAt)),
      lastSeenAt: item.lastSeenAt,
    };
    const display = createProgressDisplayItem(row, index);
    return display ? [display] : [];
  });
}

async function addAnonymousProgressItem(input: ProgressInput) {
  const key = createAnonymousProgressKey(input);
  const nextItems = [
    { input, lastSeenAt: new Date().toISOString() },
    ...(await getAnonymousProgressItems()).filter((item) => createAnonymousProgressKey(item.input) !== key),
  ];

  await AsyncStorage.setItem(storageKey, JSON.stringify(nextItems));
}

export async function getAnonymousProgressItems(): Promise<AnonymousProgressItem[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as AnonymousProgressItem[]) : [];
  } catch {
    return [];
  }
}

export async function clearAnonymousProgressItems() {
  await AsyncStorage.removeItem(storageKey);
}

function createAnonymousProgressKey(input: ProgressInput) {
  return `${input.surface}:${input.slug}:${input.pathSlug}`;
}
