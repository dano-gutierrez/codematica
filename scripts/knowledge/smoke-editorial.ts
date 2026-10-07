// Real local Graphiti/Qwen/OpenJev preparation with a separate agent verification step.
// The synthetic authenticated reviewer and Buffer reconciliation affect a disposable local DB only.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { fingerprint } from "./fingerprint";
import { digest } from "../linkedin/preparation";
import { createLocalKnowledge } from "./local-api";
import { synchronize } from "./worker";
import type { KnowledgeSnapshot } from "../../packages/core/src/knowledge";
const execute=promisify(execFile);
const [phase,destination,verification]=process.argv.slice(2);
assert.ok(["prepare","complete"].includes(phase),"Use prepare DIR, then complete DIR VERIFIED_JSON");
assert.ok(destination,"Supply a private evidence directory");
const dir=resolve(destination);await mkdir(dir,{recursive:true,mode:0o700});
const {stdout}=await execute("supabase",["status","--output","json",...(process.env.SUPABASE_WORKDIR?["--workdir",process.env.SUPABASE_WORKDIR]:[])]);
const local=JSON.parse(stdout);assert.equal(new URL(local.API_URL).hostname,"127.0.0.1");
// Do not inherit hosted model credentials or a live Buffer transport.
const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>["PATH","HOME","TMPDIR","LANG","LC_ALL","KNOWLEDGE_STATE","KNOWLEDGE_URL","CODEMATICA_INFERENCE_LOCK"].includes(k)));
Object.assign(env,{SUPABASE_URL:local.API_URL,SUPABASE_SERVICE_ROLE_KEY:local.SERVICE_ROLE_KEY,LINKEDIN_PRIVATE_DIR:dir});
const cli=async(...args:string[]) => (await execute(process.execPath,["--import","tsx","scripts/linkedin/cli.ts",...args],{env,maxBuffer:4*1024*1024})).stdout.trim();
const db=createClient(local.API_URL,local.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const user=createClient(local.API_URL,local.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const rpc=async(name:string,args:Record<string,unknown>={})=>{const {data,error}=await user.rpc(name,args);if(error)throw new Error(error.message);return data;};
const save=async(name:string,value:unknown)=>writeFile(resolve(dir,name),JSON.stringify(value,null,2),{mode:0o600});
if(phase==="prepare"){
  const {count,error}=await db.from("linkedin_posts").select("id",{count:"exact",head:true});if(error)throw error;assert.equal(count,0,"Reset the disposable test DB before running this joined flow");
  const email=`graph-flow-${randomUUID()}@example.test`,password=randomUUID();
  const created=await db.auth.admin.createUser({email,password,email_confirm:true});if(created.error)throw created.error;assert.ok(created.data.user);
  await cli("bootstrap",created.data.user.id);const login=await user.auth.signInWithPassword({email,password});if(login.error)throw login.error;
  const projectionId=await synchronize(db,createLocalKnowledge(resolve(process.env.KNOWLEDGE_STATE||".local/knowledge")));
  await cli("enable-preparation","--all-review");await cli("enable-knowledge","--all-review");
  const snapshot=JSON.parse(await readFile(resolve(process.env.KNOWLEDGE_STATE||".local/knowledge","catalog.json"),"utf8")) as KnowledgeSnapshot;
  const source=snapshot.resources.find(r=>r.id==="document:databases/postgres-connection-pooling");assert.ok(source);
  const sourceText=await readFile(resolve(source.sourcePath),"utf8");
  const excerpt=sourceText.split("\n").find(l=>l.includes("PgBouncer")&&!l.startsWith("#"));assert.ok(excerpt);
  const body="A connection pool gives database requests a limited set of connections to share.\n\nSetting a pool limit in one worker doesn't set a global limit. If each of 10 workers opens up to 10 connections, they can reach 100 together.\n\nBefore raising the pool size, I would count workers, reserve room for admin connections, and check whether requests are waiting for a connection. What would you measure first?";
  const seed=[{seed_key:randomUUID(),title:"Connection pool limits across workers",topic:"PostgreSQL",body,first_comment:"",sources:[{path:source.sourcePath,hash:digest(sourceText),title:source.title,excerpt,urls:[]}]}];
  await save("seed.json",seed);await cli("import",resolve(dir,"seed.json"));
  const {data:post}=await db.from("linkedin_posts").select("*").single();assert.ok(post.knowledge_required);
  assert.ok((await user.rpc("linkedin_review",{p_post_id:post.id,p_expected_revision:post.current_revision_id,p_action:"approve"})).error);
  await rpc("linkedin_review",{p_post_id:post.id,p_expected_revision:post.current_revision_id,p_action:"refine"});
  console.log("Running graph retrieval and OpenJev first review locally…");
  await cli("prepare","--all");
  let {data:prep}=await db.from("linkedin_preparations").select("*").eq("post_id",post.id).order("created_at",{ascending:false}).limit(1).single();assert.ok(prep?.knowledge);
  assert.equal(prep.knowledge_hash,fingerprint(prep.knowledge));
  if(prep.outcome==="held"){
    await rpc("linkedin_preparation_action",{p_post_id:post.id,p_expected_revision:post.current_revision_id,p_preparation_id:prep.id,p_action:"send_with_flags",p_reason:"Synthetic flow review: inspect the proposed pool arithmetic against the cited lesson; retain incomplete coverage and overlap warnings for Codex."});
    if(!prep.analysis){await cli("prepare","--all");const next=await db.from("linkedin_preparations").select("*").eq("post_id",post.id).order("created_at",{ascending:false}).limit(1).single();prep=next.data;}
  }
  assert.ok(prep?.analysis,"Local models did not produce a verifiable candidate; inspect private reports");
  const claim=JSON.parse(await cli("claim","refine"));assert.ok(claim.handoff);const handoff=JSON.parse(await readFile(claim.handoff,"utf8"));
  assert.equal(handoff.knowledge_hash,prep.knowledge_hash);assert.ok(handoff.knowledge.matches.length>0);assert.equal(handoff.knowledge.projection_id,projectionId);
  await save("state.json",{email,password,postId:post.id,originalRevision:post.current_revision_id,originalBody:body,claim,preparationId:prep.id,projectionId});
  await save("preparation.json",prep);
  console.log(JSON.stringify({phase:"awaiting-agent-verification",handoff:claim.handoff,evidence:dir,action:prep.knowledge.action,matchedResources:prep.knowledge.matches.map((r:{id:string})=>r.id),held:prep.outcome==="held"}));
}else{
  assert.ok(verification,"Supply an independently reviewed verification JSON; the smoke harness never fabricates it");
  const state=JSON.parse(await readFile(resolve(dir,"state.json"),"utf8"));const login=await user.auth.signInWithPassword({email:state.email,password:state.password});if(login.error)throw login.error;
  const verified=JSON.parse(await cli("complete",state.claim.file,resolve(verification)));assert.ok(verified.revisionId,"needs_input must remain held");
  const {data:original}=await db.from("linkedin_revisions").select("body").eq("id",state.originalRevision).single();assert.ok(original);assert.equal(original.body,state.originalBody);
  const {data:proposed}=await db.from("linkedin_revisions").select("*").eq("id",verified.revisionId).single();assert.ok(proposed.preparation_id);
  await rpc("linkedin_review",{p_post_id:state.postId,p_expected_revision:state.originalRevision,p_action:"use",p_proposal_id:verified.revisionId});
  // Only this disposable authenticated fixture performs adoption/approval; real posts still need their owner.
  await rpc("linkedin_review",{p_post_id:state.postId,p_expected_revision:verified.revisionId,p_action:"save",p_body:proposed.body,p_first_comment:proposed.first_comment,p_facts_confirmed:true});
  const {data:post}=await db.from("linkedin_posts").select("*").eq("id",state.postId).single();
  await rpc("linkedin_review",{p_post_id:state.postId,p_expected_revision:post.current_revision_id,p_action:"approve"});
  await cli("configure","000000000000000000000001","000000000000000000000002","enabled");
  const claim=JSON.parse(await cli("claim","schedule"));const begin=JSON.parse(await cli("begin",claim.file));
  assert.equal(begin.bufferArguments.text,proposed.body);assert.equal(begin.bufferArguments.mode,"addToQueue");assert.equal(begin.bufferArguments.schedulingType,"automatic");assert.equal(begin.bufferArguments.firstComment,undefined);
  await assert.rejects(cli("begin",claim.file));
  // Inert Buffer contract: verify payload and reconcile its synthetic scheduled identity. No Buffer SDK/network is imported.
  await save("inert-buffer-request.json",begin.bufferArguments);await save("publication.json",{status:"scheduled",buffer_id:`inert-${state.postId}`,scheduled_at:new Date(Date.now()+3600000).toISOString()});
  await cli("reconcile",state.postId,post.current_revision_id,resolve(dir,"publication.json"));
  const {data:pub}=await db.from("linkedin_publications").select("*").eq("post_id",state.postId).single();assert.equal(pub.status,"scheduled");assert.equal(pub.revision_id,post.current_revision_id);
  await cli("configure","000000000000000000000001","000000000000000000000002","paused");
  await save("summary.json",{graphSnapshot:state.projectionId,postId:state.postId,originalPreserved:true,agentVerification:verified.revisionId,approvedRevision:post.current_revision_id,publication:"inert-scheduled",externalPublication:false,models:"Real loopback Qwen and OpenJev; no hosted model credentials inherited"});
  console.log(JSON.stringify({phase:"passed",graphSnapshot:state.projectionId,publication:"inert-scheduled",evidence:dir}));
}
