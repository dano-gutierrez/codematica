import { z } from "zod";

export const postTextSchema = z.string().trim().min(1).max(3000);
const scoreSchema = z.object({ score: z.number().int().min(1).max(10), justification: z.string().min(1) });
export const analysisSchema = z.object({
  diagnosis: z.object({ hook: scoreSchema, clarity: scoreSchema, value: scoreSchema, storytelling: scoreSchema, readability: scoreSchema, authenticity: scoreSchema, cta: scoreSchema, algorithm: scoreSchema }),
  coreIdea: z.string().min(1),
  rewrittenPost: postTextSchema,
  alternativeHooks: z.array(z.string().min(1)).length(3),
  keyChanges: z.array(z.string().min(1)).max(6),
  postingPlan: z.object({ format: z.string().min(1), timing: z.string().min(1), firstComment: z.string().max(1248), hashtags: z.array(z.string()).max(3), engagementActions: z.array(z.string().min(1)).min(1) }),
  visualOutline: z.array(z.string()).default([]),
  verificationNotes: z.array(z.string()).default([]),
  assumptions: z.string(),
  toolsUsed: z.array(z.string()),
});
export type LinkedInAnalysis = z.infer<typeof analysisSchema>;
export const voiceProfileSchema = z.object({ id: z.uuid(), version: z.string().min(1), rules: z.array(z.string().trim().min(1).max(500)).min(1).max(20) });
export const preparationContentSchema = z.object({
  input_hash: z.string().regex(/^[a-f0-9]{64}$/), candidate_hash: z.string().regex(/^[a-f0-9]{64}$/),
  outcome: z.enum(["ready", "held", "stale"]), analysis: analysisSchema.nullable(),
  issues: z.array(z.object({ code: z.string().min(1).max(80), message: z.string().min(1).max(1000), blocking: z.boolean() })).max(40),
  related: z.array(z.object({ post_id: z.uuid(), revision_id: z.uuid(), kind: z.enum(["exact_duplicate", "near_duplicate", "follow_up", "related"]), reason: z.string().max(500) })).max(20),
  before: z.record(z.string(), z.number().min(0).max(10)), after: z.record(z.string(), z.number().min(0).max(10)),
  versions: z.object({ writer: z.string(), judge: z.string(), prompt: z.string(), voice: z.string() }),
  metrics: z.object({ rounds: z.number().int().min(0).max(2), elapsed_ms: z.number().nonnegative(), writer_tokens: z.number().nonnegative().optional() }),
});
export const preparationSchema = preparationContentSchema.extend({ id: z.uuid(), job_id: z.uuid(), post_id: z.uuid(), revision_id: z.uuid(), created_at: z.string() });
export type LinkedInPreparation = z.infer<typeof preparationSchema>;
export const verificationSchema = z.object({
  preparation_id: z.uuid(), candidate_hash: z.string().regex(/^[a-f0-9]{64}$/), verdict: z.enum(["accept", "patch", "needs_input"]),
  checked: z.array(z.enum(["text", "meaning", "facts", "voice"])).length(4).refine((v) => new Set(v).size === 4, "Check text, meaning, facts and voice"),
  patch: analysisSchema.partial().strict().optional(), notes: z.array(z.string().trim().min(1).max(1000)).max(20), toolsUsed: z.array(z.string().min(1).max(300)).max(20),
}).strict().refine((v) => v.verdict === "patch" ? Boolean(v.patch && Object.keys(v.patch).length) : !v.patch, "Only a patch verdict can contain replacements")
  .refine((v) => v.verdict !== "needs_input" || v.notes.length > 0, "Explain what needs input");
export const sourceSchema = z.object({ path: z.string().min(1), hash: z.string().min(1), title: z.string().min(1), excerpt: z.string().min(1), urls: z.array(z.url()).default([]) });
export const revisionSchema = z.object({
  id: z.uuid(), post_id: z.uuid(), parent_revision_id: z.uuid().nullable(), body: postTextSchema,
  first_comment: z.string().max(1248), sources: z.array(sourceSchema), analysis: analysisSchema.nullable(),
  facts_confirmed: z.boolean(), prompt_hash: z.string().nullable(), preparation_id: z.uuid().nullable().optional(), kind: z.enum(["initial", "edit", "refine"]), created_at: z.string(),
});
export type LinkedInRevision = z.infer<typeof revisionSchema>;
export const postSchema = z.object({
  id: z.uuid(), origin: z.enum(["material", "manual"]).default("material"), seed_key: z.string(), title: z.string(), topic: z.string(), status: z.enum(["review", "approved", "rejected", "withdrawing"]),
  current_revision_id: z.uuid(), approved_revision_id: z.uuid().nullable(), approved_at: z.string().nullable(), preparation_required: z.boolean().optional(), preparation_outcome: z.enum(["ready","held","stale"]).nullable().optional(), created_at: z.string(), updated_at: z.string(),
});
export type LinkedInPost = z.infer<typeof postSchema>;
export const jobSchema = z.object({ id: z.uuid(), post_id: z.uuid(), revision_id: z.uuid(), kind: z.enum(["prepare", "refine", "schedule", "cancel"]), status: z.enum(["pending", "running", "succeeded", "failed", "cancelled", "uncertain"]), attempts: z.number(), error: z.string().nullable(), created_at: z.string(), result_revision_id: z.uuid().nullable(), preparation_id: z.uuid().nullable().optional(), override_reason: z.string().nullable().optional(), verification: verificationSchema.nullable().optional(), review_verdict: z.enum(["accept","patch","needs_input"]).nullable().optional() });
export const publicationSchema = z.object({ id: z.uuid(), post_id: z.uuid(), revision_id: z.uuid(), buffer_id: z.string().nullable(), status: z.enum(["scheduling", "scheduled", "sent", "error", "unknown", "cancelled"]), scheduled_at: z.string().nullable(), sent_at: z.string().nullable(), url: z.string().nullable(), error: z.string().nullable() });
export const settingsSchema = z.object({ author_context: z.string(), buffer_channel_id: z.string().nullable(), buffer_organization_id: z.string().nullable(), timezone: z.string(), publishing_enabled: z.boolean(), worker_last_seen: z.string().nullable(), worker_message: z.string().nullable(), local_preparation_enabled: z.boolean().optional(), voice_profile: voiceProfileSchema.optional() });
export const snapshotSchema = z.object({ posts: z.array(postSchema), revisions: z.array(revisionSchema), jobs: z.array(jobSchema), publications: z.array(publicationSchema), settings: settingsSchema, preparations: z.array(preparationSchema).optional(), version: z.string().optional() });
export type EditorialSnapshot = z.infer<typeof snapshotSchema>;
export type ReviewAction = "save" | "refine" | "use" | "approve" | "reject" | "withdraw";

export function canApprove(revision: { body: string; analysis: Pick<LinkedInAnalysis, "verificationNotes"> | null; facts_confirmed: boolean; prompt_hash?: string | null; preparation_id?: string | null }, requiresAnalysis = false, requiresPreparation = false) {
  return (!requiresPreparation || Boolean(revision.preparation_id)) && (!(requiresAnalysis || requiresPreparation) || Boolean(revision.analysis && revision.prompt_hash)) && postTextSchema.safeParse(revision.body).success && !/\[(?:ADD|VERIFY|TODO)\b[^\]]*\]/i.test(revision.body) && (!revision.analysis?.verificationNotes.length || revision.facts_confirmed);
}

export function filterPosts<T extends { title: string; topic: string; status: string }>(posts: T[], search: string, topic: string, status: string) {
  const query = search.trim().toLocaleLowerCase();
  return posts.filter((post) => (topic === "all" || post.topic === topic) && (status === "all" || post.status === status) && `${post.title} ${post.topic}`.toLocaleLowerCase().includes(query));
}

export const manualPostSchema = z.object({ title: z.string().trim().min(1).max(200), topic: z.string().trim().min(1).max(100), body: postTextSchema });
export type ManualPost = z.infer<typeof manualPostSchema>;

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
    overview: async () => snapshotSchema.parse(await rpc("linkedin_overview")),
    detail: async (postId: string) => snapshotSchema.parse(await rpc("linkedin_detail", { p_post_id: z.uuid().parse(postId) })),
    preparationAction: (postId: string, revisionId: string, preparationId: string, action: "follow_up" | "send_with_flags", reason: string) => rpc("linkedin_preparation_action", { p_post_id: z.uuid().parse(postId), p_expected_revision: z.uuid().parse(revisionId), p_preparation_id: z.uuid().parse(preparationId), p_action: action, p_reason: z.string().trim().min(5).max(1000).parse(reason) }),
    setVoice: (rules: string[]) => rpc("linkedin_set_voice", { p_rules: voiceProfileSchema.shape.rules.parse(rules) }),
    create: (requestKey: string, input: ManualPost) => {
      const post = manualPostSchema.parse(input);
      return rpc("linkedin_create", { p_request_key: requestKey, p_title: post.title, p_topic: post.topic, p_body: post.body }).then((id) => z.uuid().parse(id));
    },
    review: (postId: string, revisionId: string, action: ReviewAction, fields: { body?: string; firstComment?: string; proposalId?: string; factsConfirmed?: boolean } = {}) => rpc("linkedin_review", {
      p_post_id: postId, p_expected_revision: revisionId, p_action: action,
      ...(fields.body !== undefined ? { p_body: postTextSchema.parse(fields.body) } : {}),
      ...(fields.firstComment !== undefined ? { p_first_comment: z.string().max(1248).parse(fields.firstComment) } : {}),
      ...(fields.proposalId !== undefined ? { p_proposal_id: fields.proposalId } : {}),
      ...(fields.factsConfirmed !== undefined ? { p_facts_confirmed: fields.factsConfirmed } : {}),
    }),
  };
}
type FullEditorialClient = ReturnType<typeof createEditorialClient>;
export type EditorialClient = Pick<FullEditorialClient, "isAdmin" | "snapshot" | "create" | "review"> & Partial<Pick<FullEditorialClient, "overview" | "detail" | "preparationAction" | "setVoice">>;
