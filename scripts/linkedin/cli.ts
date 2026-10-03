import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { analysisSchema, jobSchema, postSchema, revisionSchema, settingsSchema } from "../../packages/core/src/linkedin";
import { createPublishArguments, prepareRefinement, publicationResultSchema, validateSeed } from "./worker";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const privateRoot = resolve(root, ".local/linkedin");
const envelopeSchema = z.object({ job: jobSchema.extend({ lease_token: z.uuid() }), post: postSchema, revision: revisionSchema, settings: settingsSchema, publication: z.unknown(), prompt: z.string() });
async function json(path: string) { return JSON.parse(await readFile(path, "utf8")) as unknown; }
async function privateFile(path: string, value: unknown) { await mkdir(dirname(path), { recursive: true, mode: 0o700 }); await writeFile(path, JSON.stringify(value, null, 2) + "\n", { mode: 0o600, flag: "wx" }); return path; }

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "schema") { console.log(JSON.stringify(z.toJSONSchema(analysisSchema), null, 2)); return; }
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
  } else if (command === "claim") {
    const kind = z.enum(["refine","schedule","cancel"]).parse(args[0]);
    const result = await rpc("linkedin_claim", { p_kind: kind });
    if (!result) { console.log("No eligible job"); return; }
    const envelope = envelopeSchema.parse({ ...result, prompt: await readFile(resolve(root,"prompts/linkedin/refine.md"),"utf8") });
    const path = await privateFile(resolve(privateRoot, "jobs", `${envelope.job.id}-${envelope.job.lease_token}.json`), envelope);
    console.log(JSON.stringify({ jobId: envelope.job.id, kind, file: path }));
  } else if (["complete","renew","begin","fail"].includes(command)) {
    const envelope = envelopeSchema.parse(await json(args[0])); const lease = { p_job_id: envelope.job.id, p_token: envelope.job.lease_token };
    if (command === "complete") {
      if (envelope.job.kind !== "refine") throw new Error("Expected refinement job");
      const result = prepareRefinement(await json(args[1]), envelope.prompt);
      console.log(JSON.stringify({ revisionId: await rpc("linkedin_complete_refine", { ...lease, p_analysis: result.analysis, p_prompt_hash: result.promptHash }) }));
    } else if (command === "begin") {
      const bufferArguments = createPublishArguments(envelope.post, envelope.revision, envelope.settings);
      const publicationId = await rpc("linkedin_begin_publish", lease);
      console.log(JSON.stringify({ publicationId, bufferArguments },null,2));
    } else if (command === "renew") { await rpc("linkedin_renew", lease); console.log("Lease renewed"); }
    else { await rpc("linkedin_fail", { ...lease, p_error: args[1] || "Worker failed", p_uncertain: envelope.job.kind !== "refine" }); console.log("Failure recorded"); }
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
    const backup: Record<string, unknown> = { version: 1, exportedAt: new Date().toISOString() };
    for (const name of ["posts","revisions","jobs","publications","settings"]) backup[name] = await rows(`linkedin_${name}`);
    console.log(await privateFile(resolve(args[0] || resolve(privateRoot,"exports",`${Date.now()}.json`)),backup));
  } else if (command === "restore") {
    const backup = z.object({ version: z.literal(1), posts: z.array(z.unknown()), revisions: z.array(z.unknown()), jobs: z.array(z.unknown()), publications: z.array(z.unknown()), settings: z.array(z.unknown()) }).parse(await json(args[0]));
    await rpc("linkedin_restore", { p_backup: backup }); console.log("Restored into an empty collection; publishing remains paused");
  } else throw new Error("Commands: status, claim refine|schedule|cancel, complete JOB_FILE RESULT_FILE, renew JOB_FILE, begin JOB_FILE, fail JOB_FILE REASON, reconcile POST REVISION RESULT_FILE, import FILE, validate-seed FILE, schema, bootstrap USER_UUID, configure CHANNEL ORG enabled|paused [TIMEZONE], heartbeat [MESSAGE], export [FILE], restore FILE");
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Editorial command failed"); process.exitCode = 1; });
