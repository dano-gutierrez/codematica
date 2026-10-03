import { assessPostKnowledge, compactKnowledge } from "./knowledge";
import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { analysisSchema, jobSchema, postSchema, revisionSchema, settingsSchema, preparationSchema, verificationSchema, voiceProfileSchema } from "../../packages/core/src/linkedin";
import { applyVerification } from "../../packages/core/src/linkedin-preparation";
import { compactHandoff, digest, prepareLocally, type CorpusEntry } from "./preparation";
import { createLocalModels, cachedModels, sourceIssues } from "./local-models";
import { createPublishArguments, prepareRefinement, publicationResultSchema, validateSeed } from "./worker";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const privateRoot = resolve(process.env.LINKEDIN_PRIVATE_DIR || resolve(root, ".local/linkedin"));
const envelopeSchema = z.object({ job: jobSchema.extend({ lease_token: z.uuid() }), post: postSchema, revision: revisionSchema, settings: settingsSchema, publication: z.unknown(), preparation: preparationSchema.nullable().optional(), prompt: z.string() });
async function json(path: string) { return JSON.parse(await readFile(path, "utf8")) as unknown; }
async function privateFile(path: string, value: unknown) { await mkdir(dirname(path), { recursive: true, mode: 0o700 }); await writeFile(path, JSON.stringify(value, null, 2) + "\n", { mode: 0o600, flag: "wx" }); return path; }

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "schema") { console.log(JSON.stringify(z.toJSONSchema(args[0] === "verification" ? verificationSchema : analysisSchema), null, 2)); return; }
  if (command === "validate-seed") { const posts = validateSeed(await json(args[0])); console.log(JSON.stringify({ count: posts.length, topics: [...new Set(posts.map((p) => p.topic))] })); return; }
  const url = process.env.SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY locally; never use public env names for the service key.");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  async function rpc(name: string, input: Record<string, unknown> = {}) { const { data, error } = await db.rpc(name, input); if (error) throw new Error(error.message); return data; }
  async function rows(table: string) { const all: unknown[] = []; for (let offset = 0; ; offset += 500) { const { data, error } = await db.from(table).select("*").order("id").range(offset, offset + 499); if (error) throw new Error(error.message); all.push(...data); if (data.length < 500) break; } return all; }
  if (command === "status") {
    const { data: settings, error } = await db.from("linkedin_settings").select("*").single(); if (error) throw new Error(error.message);
    const { data: jobs, error: jobsError } = await db.from("linkedin_jobs").select("id,kind,status,post_id,revision_id,error,created_at").in("status",["pending","running","failed","uncertain"]).order("created_at").limit(100);
    if (jobsError) throw new Error(jobsError.message);
    const { data: publications, error: publicationsError } = await db.from("linkedin_publications").select("*").neq("status","cancelled").neq("status","sent");
    if (publicationsError) throw new Error(publicationsError.message);
    console.log(JSON.stringify({ settings, jobs, publications },null,2));
  } else if (command === "enable-preparation") {
    if (args[0] !== "--all-review") throw new Error("Use enable-preparation --all-review after migration/client rollout; this enrolls all unapproved review drafts.");
    const backup: Record<string, unknown> = { version: 2, exportedAt: new Date().toISOString() };
    for (const name of ["posts","revisions","jobs","publications","settings","preparations","voice_profiles"]) backup[name] = await rows(`linkedin_${name}`);
    const path = await privateFile(resolve(privateRoot,"exports",`${Date.now()}-before-preparation.json`),backup);
    console.log(JSON.stringify({ backup: path, enqueued: await rpc("linkedin_enable_preparation") }));
  } else if (command === "enable-knowledge") {
    if (args[0] !== "--all-review") throw new Error("Use enable-knowledge --all-review after indexing, synchronization and local preparation activation");
    const backup: Record<string, unknown> = { version: 2, exportedAt: new Date().toISOString() };
    for (const name of ["posts","revisions","jobs","publications","settings","preparations","voice_profiles"]) backup[name] = await rows(`linkedin_${name}`);
    const path = await privateFile(resolve(privateRoot,"exports",`${Date.now()}-before-knowledge.json`),backup);
    console.log(JSON.stringify({backup:path,enrolled:await rpc("linkedin_enable_knowledge")}));
  } else if (command === "prepare") {
    const limit = args[0] === "--all" ? 10000 : z.coerce.number().int().min(1).max(100).parse(args[0] || "5");
    const runtime = createLocalModels(process.env.LINKEDIN_OPENJEV_URL || "http://127.0.0.1:8791", process.env.LINKEDIN_WRITER_URL || "http://127.0.0.1:8793");
    await runtime.ready();
    const models = cachedModels(runtime, resolve(privateRoot,"cache"));
    const prompt = await readFile(resolve(root,"prompts/linkedin/prepare.md"),"utf8");
    const posts = z.array(postSchema).parse(await rows("linkedin_posts"));
    const revisions: z.infer<typeof revisionSchema>[] = [];
    for (let offset = 0; offset < posts.length; offset += 100) {
      const { data, error } = await db.from("linkedin_revisions").select("*").in("id",posts.slice(offset,offset+100).map((p) => p.current_revision_id));
      if (error) throw new Error(error.message); revisions.push(...z.array(revisionSchema).parse(data));
    }
    const corpus: CorpusEntry[] = posts.flatMap((post) => { const revision = revisions.find((r) => r.id === post.current_revision_id); return revision ? [{ post, revision }] : []; });
    const { count, error } = await db.from("linkedin_jobs").select("id", { count: "exact", head: true }).eq("kind","prepare").in("status",["pending","running"]).lte("available_at",new Date().toISOString());
    if (error) throw error;
    let completed = 0; let held = 0; let failed = 0;
    for (let index=0; index<Math.min(limit,count || 0); index++) {
      const claimed = await rpc("linkedin_claim",{p_kind:"prepare"}); if (!claimed) break;
      const envelope = envelopeSchema.parse({ ...claimed, prompt });
      const lease = { p_job_id: envelope.job.id, p_token: envelope.job.lease_token };
      const renew = setInterval(() => { void rpc("linkedin_renew",lease).catch(() => undefined); },60_000);
      try {
        const voice = voiceProfileSchema.parse(envelope.settings.voice_profile);
        const assessment = envelope.post.knowledge_required ? await assessPostKnowledge(envelope.post,envelope.revision) : undefined;
        const saved = assessment ? await rpc("knowledge_save_post",{p_post:envelope.post.id,p_revision:envelope.revision.id,p_report:assessment}) : undefined;
        const knowledge = assessment ? compactKnowledge(assessment,saved) : undefined;
        const report = await prepareLocally({ post: envelope.post, revision: envelope.revision, corpus, voice, authorContext: envelope.settings.author_context, prompt, knowledge, sourceIssues: await sourceIssues(root,envelope.revision), overrideReason: envelope.job.override_reason }, models);
        await privateFile(resolve(privateRoot,"results",`${envelope.job.id}-${envelope.job.lease_token}-local.json`),report);
        await rpc("linkedin_complete_prepare",{ ...lease,p_report:report }); completed++; if(report.outcome==='held') held++;
        console.log(JSON.stringify({ jobId: envelope.job.id, outcome: report.outcome, rounds: report.metrics.rounds, elapsedMs: report.metrics.elapsed_ms }));
      } catch (error) {
        failed++;
        await privateFile(resolve(privateRoot,"results",`${envelope.job.id}-${envelope.job.lease_token}-error.json`), { message: error instanceof Error ? error.message : "Local preparation failed" }).catch(() => undefined);
        await rpc("linkedin_fail",{ ...lease,p_error:"Local preparation failed. Check local model readiness, source provenance and private results; retry is bounded.",p_uncertain:false }).catch(() => undefined);
        console.log(JSON.stringify({ jobId: envelope.job.id, outcome: "failed" }));
      } finally { clearInterval(renew); }
    }
    await rpc("linkedin_heartbeat",{p_message:`Local preparation: ${completed} completed, ${held} held, ${failed} failed.`});
    console.log(JSON.stringify({ completed,held,failed }));
    if(failed) process.exitCode=1;
  } else if (command === "context") {
    const postId = z.uuid().parse(args[0]);
    const { data: post, error: postError } = await db.from("linkedin_posts").select("*").eq("id", postId).single(); if (postError) throw new Error(postError.message);
    const { data: revision, error: revisionError } = await db.from("linkedin_revisions").select("id,body,first_comment,sources").eq("post_id",postId).eq("id",args[1] ? z.uuid().parse(args[1]) : post.current_revision_id).single(); if (revisionError) throw new Error(revisionError.message);
    console.log(await privateFile(resolve(privateRoot,"context",`${postId}-${Date.now()}.json`), { post: { id: post.id, title: post.title, topic: post.topic, status: post.status }, revision }));
  } else if (command === "claim") {
    const kind = z.enum(["prepare","refine","schedule","cancel"]).parse(args[0]);
    const result = await rpc("linkedin_claim", { p_kind: kind });
    if (!result) { console.log("No eligible job"); return; }
    const envelope = envelopeSchema.parse({ ...result, prompt: await readFile(resolve(root, result.preparation ? "prompts/linkedin/verify.md" : "prompts/linkedin/refine.md"),"utf8") });
    const path = await privateFile(resolve(privateRoot, "jobs", `${envelope.job.id}-${envelope.job.lease_token}.json`), envelope);
    const handoff = envelope.preparation && envelope.settings.voice_profile ? await privateFile(resolve(privateRoot, "jobs", `${envelope.job.id}-${envelope.job.lease_token}-handoff.json`), { prompt: envelope.prompt, ...compactHandoff(envelope.preparation, envelope.revision, envelope.settings.voice_profile), overrideReason: envelope.job.override_reason }) : null;
    console.log(JSON.stringify({ jobId: envelope.job.id, kind, file: path, ...(handoff ? { handoff } : {}) }));
  } else if (["complete","renew","begin","fail"].includes(command)) {
    const envelope = envelopeSchema.parse(await json(args[0])); const lease = { p_job_id: envelope.job.id, p_token: envelope.job.lease_token };
    if (command === "complete") {
      if (envelope.job.kind !== "refine") throw new Error("Expected refinement job");
      if (envelope.preparation) {
        const verification = verificationSchema.parse(await json(args[1]));
        applyVerification(envelope.preparation, verification);
        console.log(JSON.stringify({ revisionId: await rpc("linkedin_complete_verified", { ...lease, p_review: verification, p_prompt_hash: digest(envelope.prompt) }) }));
      } else {
        const result = prepareRefinement(await json(args[1]), envelope.prompt);
        console.log(JSON.stringify({ revisionId: await rpc("linkedin_complete_refine", { ...lease, p_analysis: result.analysis, p_prompt_hash: result.promptHash }) }));
      }
    } else if (command === "begin") {
      const bufferArguments = createPublishArguments(envelope.post, envelope.revision, envelope.settings);
      const publicationId = await rpc("linkedin_begin_publish", lease);
      console.log(JSON.stringify({ publicationId, bufferArguments },null,2));
    } else if (command === "renew") { await rpc("linkedin_renew", lease); console.log("Lease renewed"); }
    else { await rpc("linkedin_fail", { ...lease, p_error: args[1] || "Worker failed", p_uncertain: ["schedule", "cancel"].includes(envelope.job.kind) }); console.log("Failure recorded"); }
  } else if (command === "reconcile") {
    await rpc("linkedin_reconcile", { p_post_id: z.uuid().parse(args[0]), p_revision_id: z.uuid().parse(args[1]), p_result: publicationResultSchema.parse(await json(args[2])) }); console.log("Publication reconciled");
  } else if (command === "import") {
    const posts = validateSeed(await json(args[0])); console.log(JSON.stringify({ inserted: await rpc("linkedin_import", { p_posts: posts }), totalInFile: posts.length }));
  } else if (command === "bootstrap") {
    await rpc("linkedin_bootstrap_admin", { p_user_id: z.uuid().parse(args[0]) }); console.log("Verified account granted editorial admin access");
  } else if (command === "configure") {
    await rpc("linkedin_configure", { p_channel: z.string().regex(/^[a-f0-9]{24}$/).parse(args[0]), p_organization: z.string().regex(/^[a-f0-9]{24}$/).parse(args[1]), p_enabled: args[2] === "enabled", p_timezone: args[3] || "America/Los_Angeles" }); console.log("Editorial settings saved");
  } else if (command === "heartbeat") { await rpc("linkedin_heartbeat", { p_message: args[0] || null }); console.log("Heartbeat recorded");
  } else if (command === "export") {
    const backup: Record<string, unknown> = { version: 2, exportedAt: new Date().toISOString() };
    for (const name of ["posts","revisions","jobs","publications","settings","preparations","voice_profiles"]) backup[name] = await rows(`linkedin_${name}`);
    console.log(await privateFile(resolve(args[0] || resolve(privateRoot,"exports",`${Date.now()}.json`)),backup));
  } else if (command === "restore") {
    const backup = z.object({ version: z.union([z.literal(1),z.literal(2)]), preparations: z.array(z.unknown()).optional(), voice_profiles: z.array(z.unknown()).optional(), posts: z.array(z.unknown()), revisions: z.array(z.unknown()), jobs: z.array(z.unknown()), publications: z.array(z.unknown()), settings: z.array(z.unknown()) }).parse(await json(args[0]));
    await rpc("linkedin_restore", { p_backup: backup }); console.log("Restored into an empty collection; publishing remains paused");
  } else throw new Error("Commands: status, enable-preparation --all-review, prepare [COUNT|--all], context POST_UUID [REVISION_UUID], claim prepare|refine|schedule|cancel, complete JOB_FILE RESULT_FILE, renew JOB_FILE, begin JOB_FILE, fail JOB_FILE REASON, reconcile POST REVISION RESULT_FILE, import FILE, validate-seed FILE, schema, bootstrap USER_UUID, configure CHANNEL ORG enabled|paused [TIMEZONE], heartbeat [MESSAGE], export [FILE], restore FILE");
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Editorial command failed"); process.exitCode = 1; });
