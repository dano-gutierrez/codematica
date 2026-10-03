// Opt-in, real-model acceptance check. Synthetic text only; no Supabase or Buffer client.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createLocalModels, cachedModels } from "./local-models";
import { compactHandoff, prepareLocally } from "./preparation";
import { editorialFixture } from "../../packages/core/src/test/linkedin-fixture";

const root = fileURLToPath(new URL("../../",import.meta.url));
const directory = resolve(root,".local/linkedin/evaluation",String(Date.now()));
await mkdir(directory,{recursive:true,mode:0o700});
const runtime = createLocalModels(process.env.LINKEDIN_OPENJEV_URL || "http://127.0.0.1:8791",process.env.LINKEDIN_WRITER_URL || "http://127.0.0.1:8793");
await runtime.ready();
const models = cachedModels(runtime,resolve(root,".local/linkedin/cache"));
const prompt = await readFile(resolve(root,"prompts/linkedin/prepare.md"),"utf8");
const verifyPrompt = await readFile(resolve(root,"prompts/linkedin/verify.md"),"utf8");
const legacyPrompt = await readFile(resolve(root,"prompts/linkedin/refine.md"),"utf8");
const voice = {id:"40000000-0000-4000-8000-000000000001",version:"tone-v1",rules:["Use direct conversational English, concrete examples and no hype.","Preserve the author's point and never invent experience or evidence."]};
const cases = [
  {name:"rough-draft",body:"For me, a retry budget is a limit on how many retries I allow. I want a limit before I choose a delay. What I mean is that I would decide how many attempts are enough before choosing how long to wait.\n\nI keep coming back to the same question: when should this operation stop trying? That is the question I want to answer first, before the delay. What limit would you start with?"},
  {name:"practical-opinion",body:"Before adding a retry, I ask what happens if the first request actually worked.\n\nMy preference: decide how to identify the same operation, put a limit on retries, and make the final outcome visible.\n\nWhich failure would you test first?"},
  {name:"unsupported-metric",body:"We reduced production outages by 93% and saved $2 million last month by switching to a retry queue.\n\nEvery engineering team should do the same."},
];
for (const example of cases) {
  const revision = {...editorialFixture.revisions[0],body:example.body,first_comment:"",sources:[]};
  console.log(`Evaluating ${example.name} locally…`);
  const trace: unknown[] = [];
  const traced = { write: async (input: unknown) => { const candidates = await models.write(input); trace.push({ candidates }); return candidates; }, evaluate: async (state: unknown, questions: Parameters<typeof models.evaluate>[1]) => { const answers = await models.evaluate(state,questions); trace.push({state,answers}); return answers; } };
  const result = await prepareLocally({post:editorialFixture.posts[0],revision,corpus:[],voice,prompt,authorContext:"Writes practical engineering lessons",sourceIssues:[]},traced);
  await writeFile(resolve(directory,example.name+"-trace.json"),JSON.stringify(trace,null,2),{mode:0o600});
  await writeFile(resolve(directory,example.name+".json"),JSON.stringify(result,null,2),{mode:0o600});
  if(example.name === "unsupported-metric") assert.equal(result.outcome,"held","Unsupported autobiographical metrics must never advance automatically");
  else assert.equal(result.outcome,"ready","Ordinary editorial preferences should not need invented evidence");
  if(example.name === "rough-draft") assert.notEqual(result.analysis?.rewrittenPost,revision.body,"The repetitive fixture should receive a useful local edit");
  const handoff = compactHandoff({...result,id:"30000000-0000-4000-8000-000000000001",job_id:"30000000-0000-4000-8000-000000000002",post_id:revision.post_id,revision_id:revision.id,created_at:new Date().toISOString()},revision,voice);
  // Character counts are reproducible proxies, not measured Codex billing tokens.
  const fullAnalysisCharacters = JSON.stringify(result.analysis).length;
  console.log(JSON.stringify({name:example.name,outcome:result.outcome,changed:result.analysis?.rewrittenPost!==revision.body,seconds:result.metrics.elapsed_ms/1000,legacyPromptCharacters:legacyPrompt.length,verifyInputCharacters:verifyPrompt.length+JSON.stringify(handoff).length,fullAnalysisOutputCharacters:fullAnalysisCharacters,acceptOutputCharacters:JSON.stringify({preparation_id:handoff.preparation_id,candidate_hash:handoff.candidate_hash,verdict:"accept",checked:["text","meaning","facts","voice"],notes:[],toolsUsed:[]}).length,evidence:resolve(directory,example.name+".json")}));
}
