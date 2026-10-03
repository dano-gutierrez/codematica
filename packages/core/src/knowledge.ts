import { z } from "zod";

export const resourceKinds = ["document", "section", "path", "unit", "skill", "exercise", "interview-collection", "interview-question", "solution", "diagram", "feed", "flashcard", "source", "concept", "post", "game-campaign", "game-level", "game-scenario"] as const;
export const knowledgeResourceSchema = z.object({
  id: z.string().min(1), kind: z.enum(resourceKinds), title: z.string(), text: z.string(),
  hash: z.string().regex(/^[a-f0-9]{64}$/), sourcePath: z.string(), route: z.string().optional(),
  parentId: z.string().optional(), revisionId: z.string().optional(), status: z.string(),
  postStatus: z.string().optional(), published: z.boolean().optional(),
  visibility: z.enum(["curriculum", "private"]), paths: z.array(z.string()), skills: z.array(z.string()),
  difficulty: z.string().optional(), audience: z.string().optional(), tags: z.array(z.string()).default([]),
});
export const knowledgeRelationshipSchema = z.object({
  id: z.string(), source: z.string(), target: z.string(), type: z.enum(["contains", "next", "teaches", "assesses", "requires", "cites", "illustrates", "reviews", "covers", "related", "extends", "derived_from", "duplicate"]),
  provenance: z.enum(["explicit", "inferred", "approved"]), evidence: z.array(z.object({ resourceId: z.string(), hash: z.string(), quote: z.string() })),
  origin: z.object({resourceId:z.string(),sourcePath:z.string(),hash:z.string().regex(/^[a-f0-9]{64}$/)}).optional(),
  order: z.number().int().optional(), confidence: z.number().min(0).max(1).optional(),
});
export const knowledgeSnapshotSchema = z.object({
  version: z.literal(1), id: z.string().regex(/^[a-f0-9]{64}$/), resources: z.array(knowledgeResourceSchema), relationships: z.array(knowledgeRelationshipSchema),
  counts: z.record(z.string(), z.number().int().nonnegative()), exclusions: z.array(z.object({ id: z.string(), reason: z.string() })),
  unresolved: z.array(z.object({ resourceId: z.string(), reference: z.string() })),
  sourceRevision: z.string().optional(), dirty: z.boolean().optional(), manifest: z.array(z.object({path:z.string(),hash:z.string().regex(/^[a-f0-9]{64}$/)})).default([]),
});
export const knowledgeCandidateSchema = z.object({ title: z.string().min(1).max(300).refine(v=>v.trim().length>0), body: z.string().min(10).max(100000).refine(v=>v.trim().length>=10), kind: z.enum(resourceKinds).default("document"), audience: z.string().max(1000).optional(), difficulty: z.string().max(100).optional(), preferredPath: z.string().max(300).optional(), existingId: z.string().max(500).optional(), revisionId: z.string().max(100).optional() });
export type KnowledgeResource = z.infer<typeof knowledgeResourceSchema>;
export type KnowledgeRelationship = z.infer<typeof knowledgeRelationshipSchema>;
export type KnowledgeSnapshot = z.infer<typeof knowledgeSnapshotSchema>;
export type KnowledgeCandidate = z.infer<typeof knowledgeCandidateSchema>;

const sha = z.string().regex(/^[a-f0-9]{64}$/);
const action = z.enum(["update_existing", "create_resource", "create_path", "skip_duplicate", "split", "needs_review"]);
const placement = z.object({ resource_id: z.string().optional(), section_id: z.string().optional(), path_id: z.string().optional(), unit_id: z.string().optional(), after_id: z.string().optional() });
const match = knowledgeResourceSchema.extend({ score: z.number().optional(), relation: z.string().optional(), confidence: z.number().min(0).max(1).optional() });
export const knowledgeReportSchema = z.object({
  snapshot_id: sha, candidate_hash: sha, action, explanation: z.string(), warnings: z.array(z.string()), matches: z.array(match), placement,
  relationships: z.array(knowledgeRelationshipSchema), alternatives: z.array(z.object({ action: z.string(), target_id: z.string().optional() })),
  models: z.record(z.string(), z.string()), metrics: z.object({ elapsed_ms: z.number().nonnegative(), cache_hits: z.number().nonnegative() }), semantic_complete: z.boolean(),
  overlapping_material: z.array(z.string()).optional(), missing_material: z.array(z.string()).optional(),
});
export type KnowledgeReport = z.infer<typeof knowledgeReportSchema>;
export const knowledgeContextSchema = z.object({
  snapshot_id: sha, projection_id: sha.optional(), job_id: z.uuid().optional(), candidate_hash: sha,
  action, warnings: z.array(z.string()).max(20), placement, semantic_complete: z.boolean(),
  matches: z.array(match.pick({ id: true, kind: true, title: true, hash: true, text: true, sourcePath: true, paths: true, skills: true, relation: true })).max(6),
  relationships: z.array(knowledgeRelationshipSchema).max(8),
});
export type KnowledgeContext = z.infer<typeof knowledgeContextSchema>;
export type KnowledgeJob = { id: string; status: "pending" | "running" | "succeeded" | "failed"; report?: KnowledgeReport | null; error?: string | null; reviewed?: string | null; candidate?: KnowledgeCandidate; snapshot_id?: string; candidate_hash?: string };
export type KnowledgePage = { snapshot: { id: string; counts: Record<string, number>; created_at?: string; semantic_complete?: boolean } | null; resources: KnowledgeResource[]; relationships: KnowledgeRelationship[]; next: string | null; worker?: { last_seen: string } | null };
type Rpc = { auth?: { onAuthStateChange: (callback:(event:string,session:{user:{id:string}}|null)=>void)=>{data:{subscription:{unsubscribe:()=>void}}} }; rpc: (name: string, args?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message?: string } | null }> };
export function createKnowledgeClient(client: Rpc) {
  async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
    const { data, error } = await client.rpc(name, args);
    if (error) throw new Error(error.message || "Knowledge request failed");
    return data as T;
  }
  return {
    onAccessChange: (listener:()=>void) => {
      let previous:string|null|undefined;
      const subscription=client.auth?.onAuthStateChange((_event,session)=>{
        const next=session?.user.id??null;
        if(previous!==undefined && previous!==next)listener();
        previous=next;
      }).data.subscription;
      return ()=>subscription?.unsubscribe();
    },
    isAdmin: () => rpc<boolean>("linkedin_is_admin"),
    browse: (query = "", filters: Record<string, string> = {}, cursor: string | null = null, focus: string | null = null) => rpc<KnowledgePage>("knowledge_browse", { p_query: query, p_filters: filters, p_cursor: cursor, p_focus: focus }),
    submit: async (candidate: KnowledgeCandidate, key: string) => rpc<string>("knowledge_submit", { p_candidate: knowledgeCandidateSchema.parse(candidate), p_key: key }),
    job: (id: string) => rpc<KnowledgeJob>("knowledge_job", { p_id: id }),
    review: (job: KnowledgeJob, decision: "accept" | "reject") => rpc<void>("knowledge_review", { p_id: job.id, p_hash: job.report?.candidate_hash, p_snapshot: job.report?.snapshot_id, p_decision: decision }),
    forPost: (id: string, revision: string) => rpc<KnowledgeJob | null>("knowledge_for_post", { p_post: id, p_revision: revision }),
    recent: () => rpc<KnowledgeJob[]>("knowledge_jobs_recent"),
  };
}
export type KnowledgeClient = ReturnType<typeof createKnowledgeClient>;
