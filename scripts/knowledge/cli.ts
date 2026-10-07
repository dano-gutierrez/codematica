import { interviewSnapshotSchema } from "../../packages/core/src/interview-preparation";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createLocalKnowledge } from "./local-api";
import { processKnowledgeJob, synchronize } from "./worker";
import { exportCatalog,writeCatalog } from "./export-catalog";
import { applyReviewed } from "./apply";
import { knowledgeRpc } from "./worker";
import { privatePostCollection } from "./private-posts";
const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for the server-only worker");
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const state=resolve(process.env.KNOWLEDGE_STATE||".local/knowledge"), engine=createLocalKnowledge(state,process.env.KNOWLEDGE_URL);
async function privatePosts() {
  async function rows(table:string) { const out: Record<string,unknown>[]=[]; for(let offset=0;;offset+=500){const {data,error}=await db.from(table).select("*").order("id").range(offset,offset+499);if(error)throw error;out.push(...data);if(data.length<500)return out;} }
  const posts=await rows("linkedin_posts"), revisions=await rows("linkedin_revisions"), publications=await rows("linkedin_publications");
  return privatePostCollection(posts,revisions,publications);
}
const [command]=process.argv.slice(2);
if(command==="sync") console.log(JSON.stringify({snapshot:await synchronize(db,engine)}));
else if(command==="worker") {
  await synchronize(db,engine);
  const once=process.argv.includes("--once");
  do { const result=await processKnowledgeJob(db,engine); if(result) console.log(JSON.stringify(result)); if(!once) await new Promise(r=>setTimeout(r,5000)); } while(!once);
} else if(["export-with-posts","export-with-private"].includes(command)) {
  const root=resolve(process.env.KNOWLEDGE_CONTENT_ROOT||process.cwd());
  const collection=await privatePosts();
  const snapshot=await exportCatalog(root,collection,command==="export-with-private"?interviewSnapshotSchema.parse(await knowledgeRpc(db,"interview_snapshot")):null);
  await writeCatalog(resolve(state,"catalog.json"),snapshot);console.log(JSON.stringify({snapshot:snapshot.id,counts:snapshot.counts}));
} else if(command==="apply-reviewed") {
  const {data,error}=await db.from("knowledge_jobs").select("*").eq("reviewed","accept").is("applied_at",null);if(error)throw error;
  const root=resolve(process.env.KNOWLEDGE_CONTENT_ROOT||process.cwd());
  const snapshot=JSON.parse(await readFile(resolve(state,"catalog.json"),"utf8")) as import("../../packages/core/src/knowledge").KnowledgeSnapshot;
  if (snapshot.resources.some(r=>r.kind==="post" && (r.postStatus===undefined || r.published===undefined))) throw new Error("Re-export private posts to preserve their source status before applying reviews");
  const results=await applyReviewed(root,snapshot,data,{
    current:async()=>exportCatalog(root,snapshot.resources.some(r=>r.kind==="post")?await privatePosts():[],snapshot.resources.some(r=>r.kind==="interview-preparation")?interviewSnapshotSchema.parse(await knowledgeRpc(db,"interview_snapshot")):null),
    privateEdges:id=>knowledgeRpc<number>(db,"knowledge_apply_private",{p_id:id}),
    mark:async id=>{const result=await db.from("knowledge_jobs").update({applied_at:new Date().toISOString()}).eq("id",id).eq("reviewed","accept").is("applied_at",null);if(result.error)throw result.error;},
  });
  for(const result of results)console.log(JSON.stringify(result));
} else throw new Error("Use sync, worker [--once], export-with-posts, export-with-private, or apply-reviewed");
