import { resolve } from "node:path";
import type { LinkedInPost,LinkedInRevision } from "../../packages/core/src/linkedin";
import { knowledgeContextSchema, type KnowledgeReport } from "../../packages/core/src/knowledge";
import { createLocalKnowledge } from "../knowledge/local-api";
export function compactKnowledge(report: KnowledgeReport, saved?: { id: string; snapshot_id: string; candidate_hash: string }) {
  return knowledgeContextSchema.parse({ snapshot_id:report.snapshot_id, candidate_hash:saved?.candidate_hash||report.candidate_hash,
    ...(saved ? { job_id:saved.id, projection_id:saved.snapshot_id } : {}), action:report.action,warnings:report.warnings,placement:report.placement,semantic_complete:report.semantic_complete,
    matches:report.matches.slice(0,6).map(r=>({id:r.id,kind:r.kind,title:r.title,relation:r.relation,hash:r.hash,text:Array.from(r.text).slice(0,900).join(""),sourcePath:r.sourcePath,paths:r.paths,skills:r.skills})),relationships:report.relationships.slice(0,8) });
}
export async function assessPostKnowledge(post:LinkedInPost,revision:LinkedInRevision) {
  const engine=createLocalKnowledge(resolve(process.env.KNOWLEDGE_STATE||".local/knowledge"),process.env.KNOWLEDGE_URL);
  return engine.evaluate({title:post.title,body:revision.body+(revision.first_comment?"\n\n"+revision.first_comment:""),kind:"post",existingId:"post:"+post.id,revisionId:revision.id});
}
