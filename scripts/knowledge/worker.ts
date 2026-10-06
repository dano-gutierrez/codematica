import type { KnowledgeCandidate } from "../../packages/core/src/knowledge";
import { createLocalKnowledge } from "./local-api";
import { fingerprint } from "./fingerprint";
import type { KnowledgeRelationship, KnowledgeResource } from "../../packages/core/src/knowledge";
type Database = { rpc: (name: string, args?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message?: string } | null }> };
export async function knowledgeRpc<T>(db: Database, name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await db.rpc(name,args); if (error) throw new Error(error.message || "Knowledge database request failed"); return data as T;
}
export async function synchronize(db: Database, engine: ReturnType<typeof createLocalKnowledge>) {
  const projection = await engine.projection(); if (!projection) throw new Error("No local snapshot to synchronize");
  const approved = await knowledgeRpc<KnowledgeRelationship[]>(db,"knowledge_approved_private");
  if (approved?.length) {
    const resources = new Map((projection.resources as KnowledgeResource[]).map(r=>[r.id,r]));
    const valid = approved.filter(e=>resources.has(e.source)&&resources.has(e.target)&&e.evidence.length>0&&e.evidence.every(v=>resources.get(v.resourceId)?.hash===v.hash&&resources.get(v.resourceId)?.text.includes(v.quote))).sort((a,b)=>a.id.localeCompare(b.id));
    projection.relationships = [...new Map([...projection.relationships as KnowledgeRelationship[],...valid].map(e=>[e.id,e])).values()];
    projection.id = fingerprint([projection.id,valid]);
  }
  return knowledgeRpc<string>(db,"knowledge_publish",{p_snapshot:projection});
}
export async function processKnowledgeJob(db: Database, engine: ReturnType<typeof createLocalKnowledge>) {
  const job = await knowledgeRpc<{ id: string; lease_token: string; candidate: KnowledgeCandidate; candidate_hash: string; snapshot_id: string; source_catalog_id: string } | null>(db,"knowledge_claim");
  if (!job) return null;
  try {
    const state = await engine.status(); if (state.snapshot_id !== job.source_catalog_id) throw new Error("Local source catalog differs from the synchronized graph");
    if(job.candidate_hash!==fingerprint(job.candidate))throw new Error("Leased candidate hash differs from its text");
    const report = await engine.evaluate(job.candidate);
    if (report.snapshot_id !== job.source_catalog_id) throw new Error("Local snapshot changed during evaluation");
    if (report.candidate_hash !== fingerprint(job.candidate)) throw new Error("Local candidate differs from the leased candidate");
    await knowledgeRpc(db,"knowledge_complete",{p_id:job.id,p_token:job.lease_token,p_report:report});
    return { id:job.id,status:"succeeded" };
  } catch(error) {
    await knowledgeRpc(db,"knowledge_fail",{p_id:job.id,p_token:job.lease_token,p_error:(error as Error).message});
    return { id:job.id,status:"failed" };
  }
}
