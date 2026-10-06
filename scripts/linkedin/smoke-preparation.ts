// Disposable local Supabase + fake loopback models. Never loads .env or calls Buffer.
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { analysisFixture } from "../../packages/core/src/test/linkedin-fixture";

const execute = promisify(execFile);
const {stdout} = await execute("supabase",["status","--output","json",...(process.env.SUPABASE_WORKDIR?["--workdir",process.env.SUPABASE_WORKDIR]:[])]);
const local = JSON.parse(stdout); assert.equal(new URL(local.API_URL).hostname,"127.0.0.1");
const directory = await mkdtemp(join(tmpdir(),"codematica-preparation-"));
const server = createServer(async (req,res) => {
  const chunks:Buffer[]=[]; for await(const chunk of req)chunks.push(Buffer.from(chunk));
  const request = JSON.parse(Buffer.concat(chunks).toString() || "{}");
  res.setHeader("Content-Type","application/json");
  if(req.url?.endsWith("systemone")) res.end(JSON.stringify({answers:Object.fromEntries(Object.entries(request.questions as Record<string,{type:string}>).map(([k,q])=>[k,q.type==="score"?{score:8}:q.type==="noul"?{noul:0.95}:{choice:k==="best"?"keep":"distinct",probabilities:{keep:0.95,distinct:0.95}}]))}));
  else if(req.url?.endsWith("completions")) {
    assert.equal(request.model,"default_model");
    const context = JSON.parse(request.messages[1].content);
    res.end(JSON.stringify({choices:[{finish_reason:"stop",message:{content:JSON.stringify({...analysisFixture,rewrittenPost:context.original.body,firstComment:context.original.first_comment})}}]}));
  } else res.end("{}");
});
await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
const address=server.address(); assert.ok(address && typeof address!=="string"); const endpoint=`http://127.0.0.1:${address.port}`;
const env={...process.env,SUPABASE_URL:local.API_URL,SUPABASE_SERVICE_ROLE_KEY:local.SERVICE_ROLE_KEY,LINKEDIN_OPENJEV_URL:endpoint,LINKEDIN_WRITER_URL:endpoint,LINKEDIN_PRIVATE_DIR:directory};
const cli=async(...args:string[]) => (await execute(process.execPath,["--import","tsx","scripts/linkedin/cli.ts",...args],{env})).stdout.trim();
const db=createClient(local.API_URL,local.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const user=createClient(local.API_URL,local.ANON_KEY,{auth:{persistSession:false}});
try {
  const email=`prepare-${randomUUID()}@example.test`; const password=randomUUID();
  const {data,error}=await db.auth.admin.createUser({email,password,email_confirm:true}); if(error)throw error;
  assert.ok(data.user); await cli("bootstrap",data.user.id);
  const login=await user.auth.signInWithPassword({email,password}); if(login.error)throw login.error;
  await cli("enable-preparation","--all-review");
  async function rpc(name:string,args:Record<string,unknown>) {const {data,error}=await user.rpc(name,args);if(error)throw error;return data;}
  const body=`A practical test lesson ${randomUUID()}. Keep the original and verify the proposal.`;
  const postId=await rpc("linkedin_create",{p_request_key:randomUUID(),p_title:"Local preparation smoke",p_topic:"Testing",p_body:body});
  const {data:post}=await db.from("linkedin_posts").select("*").eq("id",postId).single();
  assert.ok((await user.rpc("linkedin_review",{p_post_id:postId,p_expected_revision:post.current_revision_id,p_action:"approve"})).error);
  await cli("prepare","--all");
  const {data:report}=await db.from("linkedin_preparations").select("*").eq("post_id",postId).single();assert.equal(report.outcome,"ready");
  const claim=JSON.parse(await cli("claim","refine")); const envelope=JSON.parse(await readFile(claim.file,"utf8")); assert.equal(envelope.post.id,postId);
  const handoff=JSON.parse(await readFile(claim.handoff,"utf8")); assert.equal(handoff.candidate_hash,report.candidate_hash);assert.equal(handoff.candidate.diagnosis,undefined);
  const verification=join(directory,"verification.json");
  await writeFile(verification,JSON.stringify({preparation_id:report.id,candidate_hash:report.candidate_hash,verdict:"accept",checked:["text","meaning","facts","voice"],notes:[],toolsUsed:["Synthetic local smoke"]}),{mode:0o600});
  const result=JSON.parse(await cli("complete",claim.file,verification)); assert.ok(result.revisionId);
  const {data:unchanged}=await db.from("linkedin_posts").select("*").eq("id",postId).single(); assert.equal(unchanged.current_revision_id,post.current_revision_id);
  await rpc("linkedin_review",{p_post_id:postId,p_expected_revision:post.current_revision_id,p_action:"use",p_proposal_id:result.revisionId});
  const duplicateId=await rpc("linkedin_create",{p_request_key:randomUUID(),p_title:"Duplicate smoke",p_topic:"Testing",p_body:body});
  await cli("prepare","--all");
  const {data:held}=await db.from("linkedin_preparations").select("*").eq("post_id",duplicateId).single();assert.equal(held.outcome,"held");assert.equal(held.analysis,null);
  const {data:jobs}=await db.from("linkedin_jobs").select("*").eq("post_id",duplicateId).eq("kind","refine");assert.equal(jobs?.length,0);
  await rpc("linkedin_preparation_action",{p_post_id:duplicateId,p_expected_revision:held.revision_id,p_preparation_id:held.id,p_action:"follow_up",p_reason:"Synthetic override verifies the held pathway"});
  await cli("prepare","--all");
  const {data:overridden}=await db.from("linkedin_jobs").select("*").eq("post_id",duplicateId).eq("kind","refine");assert.equal(overridden?.length,1);assert.match(overridden![0].override_reason,/follow_up/);
  await rpc("linkedin_review",{p_post_id:duplicateId,p_expected_revision:held.revision_id,p_action:"reject"});
  const backup=join(directory,"backup.json"); await cli("export",backup); const exported=JSON.parse(await readFile(backup,"utf8")); assert.equal(exported.version,2);assert.ok(exported.preparations.length>=3);
  console.log(`Local preparation CLI smoke passed: ready/held/override, compact handoff, accept, explicit adoption, original preservation and v2 backup. No publication. Evidence: ${directory}`);
} finally { await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve())); }
