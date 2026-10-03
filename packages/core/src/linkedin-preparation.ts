import { analysisSchema, verificationSchema, type LinkedInPreparation, type LinkedInPost, type EditorialSnapshot } from "./linkedin";

export function applyVerification(report: LinkedInPreparation, input: unknown) {
  const result = verificationSchema.parse(input);
  if (result.preparation_id !== report.id || result.candidate_hash !== report.candidate_hash || !report.analysis) throw new Error("Verification does not match the prepared candidate");
  if (result.verdict === "needs_input") return null;
  const merged = analysisSchema.parse({ ...report.analysis, ...result.patch });
  return { ...merged, verificationNotes: [...new Set([...merged.verificationNotes, ...result.notes])], toolsUsed: [...new Set([...report.analysis.toolsUsed, ...result.toolsUsed])] };
}

export function preparationLabel(post: LinkedInPost, jobs: EditorialSnapshot["jobs"], reports: LinkedInPreparation[]) {
  const currentJobs = jobs.filter((j) => j.post_id === post.id && j.revision_id === post.current_revision_id && ["prepare", "refine"].includes(j.kind)).sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
  const active = currentJobs.find((j) => ["pending", "running"].includes(j.status) && ["prepare", "refine"].includes(j.kind));
  if (active) return active.kind === "prepare" ? (active.status === "running" ? "Preparing" : "Waiting locally") : "Waiting for Codex";
  if (jobs.some((j) => j.post_id === post.id && j.kind === "refine" && j.status === "succeeded" && j.result_revision_id === post.current_revision_id)) return "Verified revision";
  const latestJob = currentJobs[0];
  if (latestJob && (latestJob.verification?.verdict === "needs_input" || latestJob.review_verdict === "needs_input" || latestJob.status === "failed")) return "Needs attention";
  if (currentJobs.some((j) => j.kind === "refine" && j.result_revision_id)) return "Codex proposal";
  const latest = reports.filter((r) => r.post_id === post.id && r.revision_id === post.current_revision_id).at(-1);
  return (latest?.outcome ?? post.preparation_outcome) === "held" ? "Needs attention" : (latest?.outcome ?? post.preparation_outcome) === "ready" ? "Prepared" : "Not prepared";
}
