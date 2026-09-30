import { z } from "zod";

export const postTextSchema = z.string().trim().min(1).max(3000);
const scoreSchema = z.object({ score: z.number().int().min(1).max(10), justification: z.string().min(1) });
export const analysisSchema = z.object({
  diagnosis: z.object({ hook: scoreSchema, clarity: scoreSchema, value: scoreSchema, storytelling: scoreSchema, readability: scoreSchema, authenticity: scoreSchema, cta: scoreSchema, algorithm: scoreSchema }),
  coreIdea: z.string().min(1),
  rewrittenPost: postTextSchema,
  alternativeHooks: z.array(z.string().min(1)).length(3),
  keyChanges: z.array(z.string().min(1)).min(3).max(6),
  postingPlan: z.object({ format: z.string().min(1), timing: z.string().min(1), firstComment: z.string().max(1248), hashtags: z.array(z.string()).max(3), engagementActions: z.array(z.string().min(1)).min(1) }),
  visualOutline: z.array(z.string()).default([]),
  verificationNotes: z.array(z.string()).default([]),
  assumptions: z.string(),
  toolsUsed: z.array(z.string()),
});
export type LinkedInAnalysis = z.infer<typeof analysisSchema>;
export const sourceSchema = z.object({ path: z.string().min(1), hash: z.string().min(1), title: z.string().min(1), excerpt: z.string().min(1), urls: z.array(z.url()).default([]) });
export const revisionSchema = z.object({
  id: z.uuid(), post_id: z.uuid(), parent_revision_id: z.uuid().nullable(), body: postTextSchema,
  first_comment: z.string().max(1248), sources: z.array(sourceSchema).min(1), analysis: analysisSchema.nullable(),
  facts_confirmed: z.boolean(), prompt_hash: z.string().nullable(), kind: z.enum(["initial", "edit", "refine"]), created_at: z.string(),
});
export type LinkedInRevision = z.infer<typeof revisionSchema>;
export const postSchema = z.object({
  id: z.uuid(), seed_key: z.string(), title: z.string(), topic: z.string(), status: z.enum(["review", "approved", "rejected", "withdrawing"]),
  current_revision_id: z.uuid(), approved_revision_id: z.uuid().nullable(), approved_at: z.string().nullable(), created_at: z.string(), updated_at: z.string(),
});
export type LinkedInPost = z.infer<typeof postSchema>;
export const jobSchema = z.object({ id: z.uuid(), post_id: z.uuid(), revision_id: z.uuid(), kind: z.enum(["refine", "schedule", "cancel"]), status: z.enum(["pending", "running", "succeeded", "failed", "cancelled", "uncertain"]), attempts: z.number(), error: z.string().nullable(), created_at: z.string(), result_revision_id: z.uuid().nullable() });
export const publicationSchema = z.object({ id: z.uuid(), post_id: z.uuid(), revision_id: z.uuid(), buffer_id: z.string().nullable(), status: z.enum(["scheduling", "scheduled", "sent", "error", "unknown", "cancelled"]), scheduled_at: z.string().nullable(), sent_at: z.string().nullable(), url: z.string().nullable(), error: z.string().nullable() });
export const settingsSchema = z.object({ author_context: z.string(), buffer_channel_id: z.string().nullable(), buffer_organization_id: z.string().nullable(), timezone: z.string(), publishing_enabled: z.boolean(), worker_last_seen: z.string().nullable(), worker_message: z.string().nullable() });
export const snapshotSchema = z.object({ posts: z.array(postSchema), revisions: z.array(revisionSchema), jobs: z.array(jobSchema), publications: z.array(publicationSchema), settings: settingsSchema });
export type EditorialSnapshot = z.infer<typeof snapshotSchema>;
export type ReviewAction = "save" | "refine" | "use" | "approve" | "reject" | "withdraw";

export function canApprove(revision: { body: string; analysis: Pick<LinkedInAnalysis, "verificationNotes"> | null; facts_confirmed: boolean }) {
  return postTextSchema.safeParse(revision.body).success && !/\[(?:ADD|VERIFY|TODO)\b[^\]]*\]/i.test(revision.body) && (!revision.analysis?.verificationNotes.length || revision.facts_confirmed);
}

export function filterPosts<T extends { title: string; topic: string; status: string }>(posts: T[], search: string, topic: string, status: string) {
  const query = search.trim().toLocaleLowerCase();
  return posts.filter((post) => (topic === "all" || post.topic === topic) && (status === "all" || post.status === status) && `${post.title} ${post.topic}`.toLocaleLowerCase().includes(query));
}

// Structural interface keeps the shared module independent of either Supabase SDK or React.
export type EditorialTransport = { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }> };
export function createEditorialClient(transport: EditorialTransport) {
  async function rpc(name: string, args: Record<string, unknown> = {}) {
    const result = await transport.rpc(name, args);
    if (result.error) throw new Error(result.error.message);
    return result.data;
  }
  return {
    isAdmin: async () => (await rpc("linkedin_is_admin")) === true,
    snapshot: async () => snapshotSchema.parse(await rpc("linkedin_snapshot")),
    review: (postId: string, revisionId: string, action: ReviewAction, fields: { body?: string; firstComment?: string; proposalId?: string; factsConfirmed?: boolean } = {}) => rpc("linkedin_review", {
      p_post_id: postId, p_expected_revision: revisionId, p_action: action,
      ...(fields.body !== undefined ? { p_body: postTextSchema.parse(fields.body) } : {}),
      ...(fields.firstComment !== undefined ? { p_first_comment: z.string().max(1248).parse(fields.firstComment) } : {}),
      ...(fields.proposalId !== undefined ? { p_proposal_id: fields.proposalId } : {}),
      ...(fields.factsConfirmed !== undefined ? { p_facts_confirmed: fields.factsConfirmed } : {}),
    }),
  };
}
export type EditorialClient = ReturnType<typeof createEditorialClient>;
