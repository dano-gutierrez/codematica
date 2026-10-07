import { readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { knowledgeRelationshipSchema, type KnowledgeReport, type KnowledgeSnapshot } from "../../packages/core/src/knowledge";
import { z } from "zod";
import { approvedCurriculumRelationships } from "./review";
import { fingerprint } from "./fingerprint";
import { withInferenceLock } from "../linkedin/inference";

type Review = {id:string; report:KnowledgeReport};
/** Serializes sidecar writers and revalidates sources separately for each reviewed job. */
export async function applyReviewed(root:string, snapshot:KnowledgeSnapshot, jobs:Review[], hooks:{ current:()=>Promise<KnowledgeSnapshot>; privateEdges:(id:string)=>Promise<number>; mark:(id:string)=>Promise<void> }) {
  return withInferenceLock(async()=>{
    const path=resolve(root,"content/relationships.json"), results=[];
    for(const job of jobs){
      if(job.report.snapshot_id!==snapshot.id || (await hooks.current()).id!==snapshot.id){results.push({id:job.id,status:"stale"});continue;}
      // Validate every curriculum edge before committing private edges or filesystem changes.
      const accepted=approvedCurriculumRelationships(snapshot,job.report);
      const privateAdded=await hooks.privateEdges(job.id);
      if(accepted.length){
        let existing:ReturnType<typeof knowledgeRelationshipSchema.parse>[]=[];
        try{existing=z.array(knowledgeRelationshipSchema).parse(JSON.parse(await readFile(path,"utf8")));}catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;}
        if((await hooks.current()).id!==snapshot.id) throw new Error("Sources changed while applying relationships; reindex before retrying");
        const edges=[...new Map([...existing,...accepted].map(e=>[e.id,e])).values()];
        await writeFile(path+".tmp",JSON.stringify(edges,null,2)+"\n");await rename(path+".tmp",path);
      }
      const known=accepted.length+privateAdded;
      if(known>0 && known===job.report.relationships.length) await hooks.mark(job.id);
      results.push({id:job.id,status:known?"relationships-applied":"awaiting-authored-content",sidecarHash:accepted.length?fingerprint(await readFile(path,"utf8")):undefined});
    }
    return results;
  },resolve(root,".local/knowledge/relationships.lock"));
}
