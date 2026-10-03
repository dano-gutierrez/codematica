import type { ContentIndex } from "../content/schema";
import {
  notebookProgressBatchSchema,
  notebookProgressSchema,
  resolveNotebookCharacters,
  type NotebookProgress,
} from "../language-writing/notebook";

export type NotebookDataClient = {
  auth: {
    getSession?: () => Promise<{
      data: { session: { user: { id: string } } | null };
    }>;
    getUser: () => Promise<{ data: { user: { id: string } | null } }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => PromiseLike<{ data: unknown[] | null; error: unknown }>;
    };
    upsert: (
      rows: Record<string, unknown>[],
      options: { onConflict: string },
    ) => PromiseLike<{ error: unknown }>;
  };
};

export function mergeNotebookProgressRows(
  local: NotebookProgress[],
  remote: NotebookProgress[],
): NotebookProgress[] {
  const rows = new Map<string, NotebookProgress>();
  for (const row of [...remote, ...local]) {
    const id = `${row.notebookId}:${row.sheetId}`,
      old = rows.get(id);
    rows.set(
      id,
      old ? { ...old, bestCount: Math.max(old.bestCount, row.bestCount) } : row,
    );
  }
  return [...rows.values()];
}
export async function readNotebookProgress(
  client: NotebookDataClient,
): Promise<{
  isSignedIn: boolean;
  userId?: string;
  items: NotebookProgress[];
}> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { isSignedIn: false, items: [] };
  const { data, error } = await client
    .from("user_writing_notebook_progress")
    .select("notebook_id, sheet_id, prompt, best_count")
    .eq("user_id", user.id);
  if (error) throw new Error("Unable to load notebook progress.");
  const items = (data ?? []).flatMap((value) => {
    const row = value as Record<string, unknown>;
    const parsed = notebookProgressSchema.safeParse({
      notebookId: row.notebook_id,
      sheetId: row.sheet_id,
      prompt: row.prompt,
      bestCount: row.best_count,
    });
    return parsed.success ? [parsed.data] : [];
  });
  return { isSignedIn: true, userId: user.id, items };
}
export async function syncNotebookProgress(
  client: NotebookDataClient,
  input: unknown,
  index: ContentIndex,
) {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user)
    return {
      status: 401,
      body: { error: "Sign in to sync notebook progress." },
    };
  const parsed = notebookProgressBatchSchema.safeParse(input);
  if (!parsed.success)
    return { status: 400, body: { error: "Invalid notebook progress." } };
  try {
    for (const row of parsed.data) resolveNotebookCharacters(row.prompt, index);
  } catch {
    return { status: 400, body: { error: "Unsupported notebook prompt." } };
  }
  const rows = parsed.data.map((row) => ({
    user_id: user.id,
    notebook_id: row.notebookId,
    sheet_id: row.sheetId,
    prompt: row.prompt,
    best_count: row.bestCount,
  }));
  const { error } = await client
    .from("user_writing_notebook_progress")
    .upsert(rows, { onConflict: "user_id,notebook_id,sheet_id" });
  return error
    ? { status: 500, body: { error: "Unable to sync notebook progress." } }
    : { status: 200, body: { synced: rows.length } };
}
