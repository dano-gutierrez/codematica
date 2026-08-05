import type { SupabaseClient } from "@supabase/supabase-js";
import { createSkillProgressUpsertRow, skillProgressBatchSchema, skillProgressSchema, type SkillProgress } from "@codematica/core";

export async function loadNativeSkillProgress(client: SupabaseClient | undefined) {
  if (!client) return [];
  const { data: { user } } = await client.auth.getUser();
  if (!user) return [];
  const { data, error } = await client
    .from("user_skill_progress")
    .select("path_slug, skill_id, best_score, attempt_count, review_box, mastery_state, last_practiced_at, next_review_at")
    .order("next_review_at", { ascending: true })
    .limit(500);
  if (error) return [];
  return (data ?? []).flatMap((row) => {
    const parsed = skillProgressSchema.safeParse({
      pathSlug: row.path_slug,
      skillId: row.skill_id,
      bestScore: row.best_score,
      attemptCount: row.attempt_count,
      reviewBox: row.review_box,
      masteryState: row.mastery_state,
      lastPracticedAt: row.last_practiced_at,
      nextReviewAt: row.next_review_at,
    });
    return parsed.success ? [parsed.data] : [];
  });
}

export async function syncNativeSkillProgress(client: SupabaseClient | undefined, rows: SkillProgress[]) {
  if (!client) return false;
  const { data: { user } } = await client.auth.getUser();
  if (!user) return false;

  for (let offset = 0; offset < rows.length; offset += 20) {
    const batch = skillProgressBatchSchema.parse(rows.slice(offset, offset + 20));
    const { error } = await client.from("user_skill_progress").upsert(batch.map((row) => createSkillProgressUpsertRow(user.id, row)), { onConflict: "user_id,path_slug,skill_id" });
    if (error) return false;
  }
  return true;
}
