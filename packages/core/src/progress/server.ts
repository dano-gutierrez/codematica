import type { ContentIndex } from "../content/schema";
import {
  createProgressDisplayItems,
  createProgressUpsertRow,
  normalizeProgressInput,
  normalizeProgressRow,
  progressInputArraySchema,
  type ProgressDisplayItem,
} from "./progress";
import { createSkillProgressUpsertRow, skillProgressBatchSchema, skillProgressSchema, type SkillProgress } from "./mastery";

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

export async function syncSkillProgress(
  client: ProgressDataClient,
  input: unknown,
): Promise<ProgressApiResult<{ synced: number } | { error: string }>> {
  const userId = await getAuthenticatedUserId(client);
  if (!userId) return { status: 401, body: { error: "Sign in to sync skill progress." } };

  const parsed = skillProgressBatchSchema.safeParse(input);
  if (!parsed.success) return { status: 422, body: { error: "Invalid skill progress payload." } };
  if (parsed.data.length === 0) return { status: 200, body: { synced: 0 } };

  const { error } = await client.from("user_skill_progress").upsert(parsed.data.map((row) => createSkillProgressUpsertRow(userId, row)), {
    onConflict: "user_id,path_slug,skill_id",
  });
  if (error) return { status: 500, body: { error: error.message ?? "Unable to sync skill progress." } };
  return { status: 200, body: { synced: parsed.data.length } };
}

export async function getSkillProgress(
  client: ProgressDataClient,
): Promise<{ isSignedIn: boolean; items: SkillProgress[] }> {
  const userId = await getAuthenticatedUserId(client);
  if (!userId) return { isSignedIn: false, items: [] };

  const { data, error } = await client
    .from("user_skill_progress")
    .select("path_slug, skill_id, best_score, attempt_count, review_box, mastery_state, last_practiced_at, next_review_at")
    .order("next_review_at", { ascending: true })
    .limit(500);

  if (error) throw new Error(error.message ?? "Unable to load skill progress.");

  const items = (data ?? []).flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const value = row as Record<string, unknown>;
    const parsed = skillProgressSchema.safeParse({
      pathSlug: value.path_slug,
      skillId: value.skill_id,
      bestScore: value.best_score,
      attemptCount: value.attempt_count,
      reviewBox: value.review_box,
      masteryState: value.mastery_state,
      lastPracticedAt: value.last_practiced_at,
      nextReviewAt: value.next_review_at,
    });
    return parsed.success ? [parsed.data] : [];
  });

  return { isSignedIn: true, items };
}

async function getAuthenticatedUserId(client: ProgressDataClient) {
  const {
    data: { user },
  } = await client.auth.getUser();

  return user?.id;
}
