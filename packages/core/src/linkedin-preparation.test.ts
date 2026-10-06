import { describe, expect, it } from "vitest";
import { preparationSchema, verificationSchema } from "./linkedin";
import { applyVerification, preparationLabel } from "./linkedin-preparation";
import { analysisFixture, editorialFixture } from "./test/linkedin-fixture";

const id = "30000000-0000-4000-8000-000000000001";
const report = () => preparationSchema.parse({
  id, job_id: id, post_id: editorialFixture.posts[0].id, revision_id: editorialFixture.revisions[0].id,
  input_hash: "a".repeat(64), candidate_hash: "b".repeat(64), outcome: "ready", analysis: analysisFixture,
  issues: [], related: [], before: {}, after: {}, versions: { writer: "writer@1", judge: "judge@1", prompt: "v1", voice: "v1" },
  metrics: { rounds: 1, elapsed_ms: 100 }, created_at: "2026-10-02T00:00:00Z",
});
const review = (verdict = "accept") => ({ preparation_id: id, candidate_hash: "b".repeat(64), verdict, checked: ["text", "meaning", "facts", "voice"], notes: [], toolsUsed: [] });

describe("local preparation handoff", () => {
  it("requires review of the exact candidate and all mandatory checks", () => {
    expect(() => applyVerification(report(), { ...review(), candidate_hash: "c".repeat(64) })).toThrow(/candidate/i);
    expect(() => applyVerification(report(), { ...review(), preparation_id: "30000000-0000-4000-8000-000000000002" })).toThrow(/candidate/i);
    expect(verificationSchema.safeParse({ ...review(), checked: ["voice"] }).success).toBe(false);
    expect(verificationSchema.safeParse({ ...review("patch"), patch: { facts_confirmed: true } }).success).toBe(false);
  });
  it("reuses unchanged analysis without treating local output as human approval", () => {
    const original = report();
    const result = applyVerification(original, review());
    expect(result?.rewrittenPost).toBe(analysisFixture.rewrittenPost);
    expect(original.analysis).toEqual(analysisFixture);
    expect(result).not.toHaveProperty("facts_confirmed");
  });
  it("applies only validated field replacements and supports an honest no-change result", () => {
    const result = applyVerification(report(), { ...review("patch"), patch: { rewrittenPost: "A clearer post.", keyChanges: [] } });
    expect(result?.rewrittenPost).toBe("A clearer post.");
    expect(result?.keyChanges).toEqual([]);
    expect(result?.alternativeHooks).toEqual(analysisFixture.alternativeHooks);
    expect(() => applyVerification(report(), { ...review("patch"), patch: { rewrittenPost: "x".repeat(3001) } })).toThrow();
    expect(verificationSchema.safeParse({ ...review(), patch: { rewrittenPost: "Changed" } }).success).toBe(false);
  });
  it("keeps needs-input outcomes on hold", () => {
    expect(applyVerification(report(), { ...review("needs_input"), notes: ["Confirm the personal result."] })).toBeNull();
    expect(verificationSchema.safeParse(review("needs_input")).success).toBe(false);
    expect(() => applyVerification({ ...report(), analysis: null }, review())).toThrow(/candidate/i);
  });
  it("shows preparation progress independently of publication status", () => {
    const post = editorialFixture.posts[0];
    const j = { id, post_id: post.id, revision_id: post.current_revision_id, kind: "prepare" as const, status: "pending" as const, attempts: 0, error: null, created_at: "now", result_revision_id: null };
    expect(preparationLabel(post, [j], [])).toBe("Waiting locally");
    expect(preparationLabel(post, [{ ...j, status: "running" }], [])).toBe("Preparing");
    expect(preparationLabel(post, [], [{ ...report(), outcome: "held" }])).toBe("Needs attention");
    expect(preparationLabel(post, [{ ...j, kind: "refine" }], [report()])).toBe("Waiting for Codex");
    expect(preparationLabel(post, [], [])).toBe("Not prepared");
  });
});

it("shows the latest proposal after a recovered failure and recognizes adoption", () => {
  const post = editorialFixture.posts[0];
  const job = {id,post_id:post.id,revision_id:post.current_revision_id,kind:"refine" as const,status:"failed" as const,attempts:1,error:"Old failure",created_at:"2026-10-01",result_revision_id:null};
  const success={...job,id:"30000000-0000-4000-8000-000000000002",status:"succeeded" as const,created_at:"2026-10-02",result_revision_id:"20000000-0000-4000-8000-000000000002"};
  expect(preparationLabel(post,[job,success],[])).toBe("Codex proposal");
  expect(preparationLabel({...post,current_revision_id:success.result_revision_id},[success],[])).toBe("Verified revision");
  expect(preparationLabel(post,[job],[])).toBe("Needs attention");
  expect(preparationLabel(post,[{...success,result_revision_id:null,review_verdict:"needs_input"}],[])).toBe("Needs attention");
  expect(preparationLabel({...post,preparation_outcome:"ready"},[],[])).toBe("Prepared");
});
