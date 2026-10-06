import type { KnowledgeRelationship,KnowledgeReport,KnowledgeSnapshot } from "../../packages/core/src/knowledge";
export function approvedCurriculumRelationships(snapshot:KnowledgeSnapshot,report:KnowledgeReport) {
  if(report.snapshot_id!==snapshot.id) throw new Error("Stale reviewed snapshot");
  const byId=new Map(snapshot.resources.map(r=>[r.id,r]));
  return report.relationships.filter(e=>byId.get(e.source)?.visibility==="curriculum"&&byId.get(e.target)?.visibility==="curriculum").map(e=>{
    if(!e.evidence.length||e.evidence.some(v=>!v.quote||byId.get(v.resourceId)?.hash!==v.hash||!byId.get(v.resourceId)?.text.includes(v.quote)))throw new Error("Stale relationship evidence");
    return {...e,provenance:"approved"} satisfies KnowledgeRelationship;
  });
}
