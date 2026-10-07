import { z } from "zod";

const text = z.string().trim().min(1).max(100000);
const sha = z.string().regex(/^[a-f0-9]{64}$/);
const url = z.string().url().refine(v => /^https?:\/\//.test(v), "Use an HTTP or HTTPS URL");
const optionalUrl = z.union([url, z.literal("")]).default("");
export const opportunityStatuses = ["potential", "applied", "interviewing", "offer", "closed", "archived"] as const;
export const roundSchema = z.object({
  label: text.max(200), scheduledAt: z.union([z.iso.datetime({ offset: true }), z.literal("")]).default(""),
  timezone: z.string().refine(v => { try { new Intl.DateTimeFormat("en", { timeZone: v }); return true; } catch { return false; } }, "Use an IANA timezone").default("America/Los_Angeles"),
  format: z.string().max(500).default(""), interviewer: z.string().max(500).default(""),
  interviewerTitle: z.string().max(500).default(""), profileUrl: optionalUrl, notes: z.string().max(100000).default(""),
});
export const opportunityInputSchema = z.object({
  company: text.max(300), website: optionalUrl, position: text.max(300), jobUrl: optionalUrl,
  jobDescription: z.string().max(100000).default(""), notes: z.string().max(100000).default(""),
  outcome: z.string().max(100000).default(""), status: z.enum(opportunityStatuses).default("potential"), rounds: z.array(roundSchema).max(50).default([]),
});
export const profileInputSchema = z.object({ resume: z.string().max(100000), experience: z.string().max(100000) });
export const sectionLabels = { company: "Company, business and competitors", fit: "Role fit and experience stories", likelyQuestions: "Likely questions and answer approaches", questionsToAsk: "Questions to ask", studyPlan: "Study and rehearsal plan", uncertainty: "Assumptions and unresolved questions" } as const;
export const sectionsSchema = z.object({ company: text, fit: text, likelyQuestions: text, questionsToAsk: text, studyPlan: text, uncertainty: text });
export const briefSchema = z.object({
  opportunityId: z.uuid(), opportunityVersion: z.number().int().positive(), profileVersion: z.number().int().nonnegative(),
  sections: sectionsSchema,
  sources: z.array(z.object({ title: text.max(300), url, verifiedAt: z.iso.date(), kind: z.enum(["primary", "secondary", "candidate-account", "supplied"]) })).min(1).max(100),
  resources: z.array(z.object({ resourceId: text.max(500), hash: sha, quote: text.max(10000), title: text.max(300), route: z.string().regex(/^\/(?:docs|paths|practice|interviews|diagrams)\/[a-z0-9/-]+(?:\?path=[a-z0-9-]+)?$/).optional(), paths: z.array(z.string()), skills: z.array(z.string()) })).max(50),
  knowledge: z.object({ status: z.enum(["pending", "reviewed"]), snapshotId: sha.optional(), jobId: z.uuid().optional(), warnings: z.array(z.string()).max(100) }).superRefine((v,ctx) => { if(v.status === "reviewed" && (!v.snapshotId || !v.jobId)) ctx.addIssue({ code: "custom", message: "Reviewed preparation needs a saved knowledge report and snapshot" }); }),
  editing: z.object({ skill: z.literal("technical-edit"), skillHash: sha, draftHash: sha, editedHash: sha, compared: z.literal(true) }),
});
export type InterviewBrief = z.infer<typeof briefSchema>;
export type OpportunityInput = z.infer<typeof opportunityInputSchema>;
export type CandidateProfile = z.infer<typeof profileInputSchema> & { version: number };
export const opportunitySchema = opportunityInputSchema.extend({ id: z.uuid(), companyId: z.uuid(), version: z.number().int().positive(), updatedAt: z.string() });
export type Opportunity = z.infer<typeof opportunitySchema>;
export const revisionSchema = z.object({ id: z.uuid(), createdAt: z.string(), brief: briefSchema, context: opportunityInputSchema.optional() });
export const interviewSnapshotSchema = z.object({ profile: profileInputSchema.extend({ version: z.number().int().nonnegative() }), profileHistory: z.array(profileInputSchema.extend({ version: z.number().int().positive() })).optional(), graphSnapshot: sha.nullable().optional(), opportunities: z.array(opportunitySchema), revisions: z.array(revisionSchema) });
export type InterviewSnapshot = z.infer<typeof interviewSnapshotSchema>;
export function preparationState(brief: InterviewBrief | null, opportunityVersion: number, profileVersion: number, graphSnapshot?: string | null) {
  return { status: !brief ? "missing" as const : brief.knowledge.status === "reviewed" ? "prepared" as const : "draft" as const, stale: !!brief && (brief.opportunityVersion !== opportunityVersion || brief.profileVersion !== profileVersion || (brief.knowledge.status === "reviewed" && graphSnapshot !== undefined && brief.knowledge.snapshotId !== graphSnapshot)) };
}
export function exportBrief(title: string, brief: InterviewBrief) {
  return `# ${title}\n\n` + Object.entries(sectionLabels).map(([key, label]) => `## ${label}\n\n${brief.sections[key as keyof typeof sectionLabels]}\n`).join("\n") +
    `\n## Study resources\n\n` + brief.resources.map(r => `- ${r.route ? `[${r.title}](${r.route})` : r.title} — ${r.resourceId}\n  ${r.quote}`).join("\n") +
    `\n\n## Sources\n\n` + brief.sources.map(s => `- [${s.title}](${s.url}) — ${s.kind}; verified ${s.verifiedAt}`).join("\n") +
    `\n\nPreparation: ${brief.knowledge.status}; input versions ${brief.opportunityVersion}/${brief.profileVersion}.\n` + brief.knowledge.warnings.map(w => `\n- ${w}`).join("") + "\n";
}
/** Mechanical guard supplements, but cannot prove, the editor's full substance comparison. */
export function validateEditing(draft: string, edited: string) {
  const protectedValues = (s: string) => [...s.matchAll(/```[^]*?```|~~~[^]*?~~~|`[^`\n]+`|\]\(([^)]+)\)|https?:\/\/[^\s<>]+|\b\d+(?:\.\d+)?\b/g)].map(m => m[0]).sort();
  const before = protectedValues(draft); const after = protectedValues(edited);
  if (JSON.stringify(before)!==JSON.stringify(after)) throw new Error("Technical edit changed a protected code block, literal, link or number");
}
type Rpc = { rpc: (name: string, args?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message?: string } | null }>; auth?: { onAuthStateChange: (callback: (event: string, session: { user: { id: string } } | null) => void) => { data: { subscription: { unsubscribe: () => void } } } } };
export function createInterviewClient(db: Rpc) {
  async function rpc(name: string, args: Record<string, unknown> = {}) { const { data, error } = await db.rpc(name, args); if(error) throw new Error(error.message || "Interview request failed"); return data; }
  return {
    isAdmin: async () => (await rpc("linkedin_is_admin")) === true,
    snapshot: async () => interviewSnapshotSchema.parse(await rpc("interview_snapshot")),
    save: async (input: OpportunityInput, id: string | null, version: number, key: string) => z.uuid().parse(await rpc("interview_save", { p_input: opportunityInputSchema.parse(input), p_id: id, p_version: version, p_key: key })),
    saveProfile: async (profile: z.infer<typeof profileInputSchema>, version: number) => { await rpc("interview_save_profile", { p_input: profileInputSchema.parse(profile), p_version: version }); },
    importBrief: async (brief: InterviewBrief, key: string) => z.uuid().parse(await rpc("interview_import", { p_brief: briefSchema.parse(brief), p_key: key })),
    onAccessChange: (listener: () => void) => { let previous: string | null | undefined; const subscription = db.auth?.onAuthStateChange((_event,session) => { const next = session?.user.id ?? null; if(previous !== undefined && previous !== next) listener(); previous = next; }).data.subscription; return () => subscription?.unsubscribe(); },
  };
}
export type InterviewClient = ReturnType<typeof createInterviewClient>;
