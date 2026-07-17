import type { ContentIndex } from "../content/schema";
import {
  createProgressDisplayItems,
  createProgressUpsertRow,
  normalizeProgressInput,
  normalizeProgressRow,
  progressInputArraySchema,
  type ProgressDisplayItem,
} from "./progress";

type AuthUser = {
  id: string;
};

type QueryResult<T> = Promise<{
  data: T | null;
  error: { message?: string } | null;
}>;

export type ProgressDataClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: AuthUser | null };
      error: unknown;
    }>;
  };
  from: (table: "user_progress_items" | string) => {
    select: (columns: string) => {
      order: (column: string, options: { ascending: boolean }) => {
        limit: (count: number) => QueryResult<unknown[]>;
      };
    };
    upsert: (payload: unknown, options: { onConflict: string }) => QueryResult<unknown>;
  };
};

export type ProgressApiResult<T> = {
  status: number;
  body: T;
};

export async function getProgressSummary(client: ProgressDataClient, index: ContentIndex): Promise<{ isSignedIn: boolean; items: ProgressDisplayItem[] }> {
  const userId = await getAuthenticatedUserId(client);

  if (!userId) {
    return {
      isSignedIn: false,
      items: [],
    };
  }

  const { data, error } = await client
    .from("user_progress_items")
    .select("surface, slug, path_slug, status, position, last_seen_at, completed_at")
    .order("last_seen_at", { ascending: false })
    .limit(6);

  if (error) {
    throw new Error(error.message ?? "Unable to load progress.");
  }

  const rows = (data ?? []).flatMap((row) => {
    try {
      return [normalizeProgressRow(row)];
    } catch {
      return [];
    }
  });

  return {
    isSignedIn: true,
    items: createProgressDisplayItems(rows, index),
  };
}

export async function upsertProgress(
  client: ProgressDataClient,
  input: unknown,
  index: ContentIndex,
): Promise<ProgressApiResult<{ ok: true } | { error: string }>> {
  const userId = await getAuthenticatedUserId(client);

  if (!userId) {
    return {
      status: 401,
      body: { error: "Sign in to sync progress." },
    };
  }

  let normalized;

  try {
    normalized = normalizeProgressInput(input, index);
  } catch {
    return {
      status: 422,
      body: { error: "Invalid progress item." },
    };
  }

  const { error } = await client.from("user_progress_items").upsert(createProgressUpsertRow(userId, normalized), {
    onConflict: "user_id,surface,slug,path_slug",
  });

  if (error) {
    return {
      status: 500,
      body: { error: error.message ?? "Unable to save progress." },
    };
  }

  return {
    status: 200,
    body: { ok: true },
  };
}

export async function syncAnonymousProgress(
  client: ProgressDataClient,
  input: unknown,
  index: ContentIndex,
): Promise<ProgressApiResult<{ synced: number; rejected: number } | { error: string }>> {
  const userId = await getAuthenticatedUserId(client);

  if (!userId) {
    return {
      status: 401,
      body: { error: "Sign in to sync progress." },
    };
  }

  let parsedInputs;

  try {
    parsedInputs = progressInputArraySchema.parse(input);
  } catch {
    return {
      status: 422,
      body: { error: "Invalid progress sync payload." },
    };
  }

  const now = new Date();
  const rows = [];
  let rejected = 0;

  for (const item of parsedInputs) {
    try {
      rows.push(createProgressUpsertRow(userId, normalizeProgressInput(item, index), now));
    } catch {
      rejected += 1;
    }
  }

  if (rows.length === 0) {
    return {
      status: 200,
      body: { synced: 0, rejected },
    };
  }

  const { error } = await client.from("user_progress_items").upsert(rows, {
    onConflict: "user_id,surface,slug,path_slug",
  });

  if (error) {
    return {
      status: 500,
      body: { error: error.message ?? "Unable to sync progress." },
    };
  }

  return {
    status: 200,
    body: { synced: rows.length, rejected },
  };
}

async function getAuthenticatedUserId(client: ProgressDataClient) {
  const {
    data: { user },
  } = await client.auth.getUser();

  return user?.id;
}
