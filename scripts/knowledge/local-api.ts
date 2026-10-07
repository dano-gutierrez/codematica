import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { knowledgeCandidateSchema, knowledgeReportSchema, type KnowledgeCandidate, type KnowledgeJob, type KnowledgeReport } from "../../packages/core/src/knowledge";
export function localKnowledgeOrigin(value: string) {
  const url = new URL(value);
  if (url.protocol !== "http:" || !["127.0.0.1", "[::1]"].includes(url.hostname) || url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error("Knowledge API must use a loopback HTTP origin");
  return url.origin;
}
export function createLocalKnowledge(state: string, origin = "http://127.0.0.1:8795", request = fetch) {
  const endpoint = localKnowledgeOrigin(origin);
  async function call<T>(path: string, body?: unknown): Promise<T> {
    const token = (await readFile(resolve(state, "api-token"), "utf8")).trim();
    const response = await request(endpoint + path, { method: body ? "POST" : "GET", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(60000), redirect: "error" });
    if (!response.ok) throw new Error(`Local knowledge request failed (${response.status})`);
    return response.json() as Promise<T>;
  }
  return {
    status: () => call<{ snapshot_id: string; semantic_complete: boolean }>("/v1/status"),
    projection: () => call<Record<string, unknown>>("/v1/projection"),
    submit: async (candidate: KnowledgeCandidate) => call<{ id: string }>("/v1/candidates", knowledgeCandidateSchema.parse(candidate)),
    job: (id: string) => call<KnowledgeJob>("/v1/evaluations/" + encodeURIComponent(id)),
    async evaluate(candidate: KnowledgeCandidate, wait: (ms: number) => Promise<void> = ms => new Promise(resolveWait => setTimeout(resolveWait, ms))): Promise<KnowledgeReport> {
      const { id } = await this.submit(candidate);
      const until = Date.now() + 600000;
      while (Date.now() < until) { const result = await this.job(id); if (result.status === "succeeded" && result.report) return knowledgeReportSchema.parse(result.report); if (result.status === "failed") throw new Error(result.error || "Local evaluation failed"); await wait(2000); }
      throw new Error("Local evaluation timed out; the staged report remains available by ID " + id);
    },
  };
}
