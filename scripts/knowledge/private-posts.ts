import type { buildKnowledgeCatalog } from "./catalog";
type Row=Record<string,unknown>;
/** An inconsistent source export must fail rather than silently omit a draft or sent post. */
export function privatePostCollection(posts:Row[],revisions:Row[],publications:Row[]):NonNullable<Parameters<typeof buildKnowledgeCatalog>[1]> {
 const byId=new Map(revisions.map(r=>[r.id,r]));
 return posts.flatMap(p=>{
  const current=byId.get(p.current_revision_id);
  if(!current||current.post_id!==p.id)throw new Error(`Missing or foreign current revision for post ${p.id}; retry the source export`);
  const published=publications.filter(v=>v.post_id===p.id&&v.status==="sent").map(v=>{
   const r=byId.get(v.revision_id);
   if(!r||r.post_id!==p.id)throw new Error(`Missing or foreign published revision for post ${p.id}; retry the source export`);
   return r;
  });
  const unique=[...new Map([current,...published].map(r=>[r.id,r])).values()];
  return unique.map(r=>({id:String(p.id)+(r.id===p.current_revision_id?"":"@published:"+r.id),revisionId:String(r.id),title:String(p.title),body:String(r.body)+(r.first_comment?"\n\n"+r.first_comment:""),status:String(p.status),published:published.some(v=>v.id===r.id)}));
 });
}
