import { describe, expect, it, vi } from "vitest";
import { analysisFixture, editorialFixture } from "../../packages/core/src/test/linkedin-fixture";
import { knowledgeReport } from "../../packages/core/src/test/knowledge-fixture";
import { compactKnowledge } from "./knowledge";
import { candidateHash, normalizeText, shortlist, prepareLocally, compactHandoff, type Answers } from "./preparation";

const original = editorialFixture.revisions[0];
const post = editorialFixture.posts[0];
const context = () => ({ post, revision: original, corpus: [{ post, revision: original }], voice: { id: "40000000-0000-4000-8000-000000000001", version: "tone-v1", rules: ["Direct and practical"] }, authorContext: "Practicing engineers", prompt: "Trusted prompt", sourceIssues: [] });
function evaluator() {
  return vi.fn(async (_state: unknown, questions: Record<string, { type: string }>): Promise<Answers> => Object.fromEntries(Object.entries(questions).map(([key, q]) => [key, q.type === "score" ? { score: 8 } : q.type === "choice" ? { choice: key === "best" ? "keep" : "distinct", probabilities: { distinct: 0.95, keep: 0.95 } } : { noul: 0.95 }])));
}
it("keeps graph evidence through OpenJev, local preparation, and the Codex handoff", async () => {
  const knowledge = compactKnowledge({ ...knowledgeReport, action: "create_resource" });
  const evaluate = evaluator();
  const report = await prepareLocally({ ...context(), knowledge }, { write: vi.fn().mockResolvedValue([analysisFixture]), evaluate });
  expect(evaluate.mock.calls.find(([, q]) => q.facts)?.[0]).toHaveProperty("knowledge", knowledge);
  expect(report.knowledge).toEqual(knowledge);
  const handoff = compactHandoff({ ...report, id: "30000000-0000-4000-8000-000000000001", job_id: "30000000-0000-4000-8000-000000000002", post_id: post.id, revision_id: original.id, created_at: "now" }, original, context().voice);
  expect(handoff.knowledge).toEqual(knowledge);
  expect(handoff.knowledge_hash).toBe(report.knowledge_hash);
});
it("allows a recorded graph override to create a flagged candidate without bypassing source failures", async () => {
  const knowledge = compactKnowledge({ ...knowledgeReport, action: "needs_review" });
  const models = { write: vi.fn().mockResolvedValue([analysisFixture]), evaluate: evaluator() };
  expect((await prepareLocally({ ...context(), knowledge }, models)).analysis).toBeNull();
  expect(models.write).not.toHaveBeenCalled();
  const flagged = await prepareLocally({ ...context(), knowledge, overrideReason: "send_with_flags: Check the uncertain relation" }, models);
  expect(flagged.outcome).toBe("held"); expect(flagged.analysis).not.toBeNull();
  const invalidSource = await prepareLocally({ ...context(), knowledge, overrideReason: "send_with_flags: Check it", sourceIssues: ["Canonical source changed"] }, models);
  expect(invalidSource.analysis).toBeNull();
});
describe("bounded local preparation", () => {
  it("normalizes comparison text without changing saved text or identifier case", () => {
    expect(normalizeText("𝗔  retry\nadds load")).toBe("A retry adds load");
    expect(normalizeText("getID()")).not.toBe(normalizeText("getId()"));
    expect(candidateHash(analysisFixture)).not.toBe(candidateHash({ ...analysisFixture, postingPlan: { ...analysisFixture.postingPlan, firstComment: "Other" } }));
  });
  it("excludes self and prioritizes shared sources in the candidate shortlist", () => {
    const other = { post: { ...post, id: "10000000-0000-4000-8000-000000000002" }, revision: { ...original, body: "Similar source", id: "20000000-0000-4000-8000-000000000002" } };
    expect(shortlist(context(), [context().corpus[0], other])).toEqual([other]);
  });
  it("holds a later exact duplicate before spending writer tokens", async () => {
    const c = context(); c.corpus.push({ post: { ...post, id: "10000000-0000-4000-8000-000000000002", status: "approved" }, revision: { ...original, id: "20000000-0000-4000-8000-000000000002" } });
    const write = vi.fn(); const evaluate = evaluator();
    const result = await prepareLocally(c, { write, evaluate });
    expect(result.outcome).toBe("held"); expect(result.related[0].kind).toBe("exact_duplicate"); expect(write).not.toHaveBeenCalled();
  });
  it("selects a safe candidate, preserves the original and bounds editing rounds", async () => {
    const c = context(); const saved = JSON.stringify(c.revision);
    const write = vi.fn().mockResolvedValue([analysisFixture]); const evaluate = evaluator();
    const result = await prepareLocally(c, { write, evaluate });
    expect(result.outcome).toBe("ready"); expect(result.metrics.rounds).toBeLessThanOrEqual(2);
    expect(write.mock.calls.length).toBeLessThanOrEqual(2); expect(JSON.stringify(c.revision)).toBe(saved);
    expect(result.analysis?.toolsUsed).toEqual(["Local writer", "OpenJev", "Canonical source snapshots"]);
  });
  it("does not let a high score override unsupported facts or missing evidence", async () => {
    const evaluate = evaluator(); evaluate.mockImplementation(async (_s, q) => Object.fromEntries(Object.entries(q).map(([k, v]) => [k, v.type === "score" ? { score: 10 } : v.type === "choice" ? { choice: "keep", probabilities: { keep: 0.95 } } : { noul: k === "facts" ? 0.3 : 0.95 }])));
    const result = await prepareLocally(context(), { write: vi.fn().mockResolvedValue([analysisFixture]), evaluate });
    expect(result.outcome).toBe("held"); expect(result.issues.some((i) => i.code === "facts" && i.blocking)).toBe(true);
    const stale = await prepareLocally({ ...context(), sourceIssues: ["Source hash changed"] }, { write: vi.fn(), evaluate });
    expect(stale.outcome).toBe("held");
  });
  it("does not leak the corpus or discarded candidates into the Codex handoff", async () => {
    const result = await prepareLocally(context(), { write: vi.fn().mockResolvedValue([analysisFixture]), evaluate: evaluator() });
    const handoff = compactHandoff({ ...result, id: "30000000-0000-4000-8000-000000000001", job_id: "30000000-0000-4000-8000-000000000001", post_id: post.id, revision_id: original.id, created_at: "now" }, original, context().voice);
    expect(handoff).not.toHaveProperty("corpus"); expect(handoff).not.toHaveProperty("candidates");
    expect(handoff.original.body).toBe(original.body); expect(handoff.sources).toEqual(original.sources);
  });
});

it.each(["near_duplicate", "follow_up", "related", "distinct", "uncertain", "low_confidence"])("routes semantic relation %s without mistaking every shared topic for a duplicate", async (relation) => {
  const c = context(); c.corpus.push({post:{...post,id:"10000000-0000-4000-8000-000000000002",status:"approved"},revision:{...original,id:"20000000-0000-4000-8000-000000000002",body:"A different angle on retries"}});
  const base = evaluator(); const evaluate = async (state: unknown, q: Parameters<typeof base>[1]) => q.relation ? {relation:{choice:relation === "low_confidence" ? "related" : relation,probabilities:{[relation === "low_confidence" ? "related" : relation]:relation === "low_confidence" ? 0.2 : 0.95}}} : base(state,q);
  const result = await prepareLocally(c,{write:vi.fn().mockResolvedValue([analysisFixture]),evaluate});
  expect(result.outcome).toBe(["near_duplicate","uncertain","low_confidence"].includes(relation)?"held":"ready");
  if (["near_duplicate","follow_up","related"].includes(relation)) expect(result.related[0].kind).toBe(relation);
});
it("keeps the oldest duplicate canonical and allows an explicit override to produce a flagged candidate", async () => {
  const c = context(); c.corpus.push({post:{...post,id:"10000000-0000-4000-8000-000000000002",created_at:"2027-01-01"},revision:original});
  const models={write:vi.fn().mockResolvedValue([analysisFixture]),evaluate:evaluator()};
  expect((await prepareLocally(c,models)).outcome).toBe("ready");
  c.corpus[1].post.status="approved";
  const overridden=await prepareLocally({...c,overrideReason:"Follow-up accepted"},models);
  expect(overridden.outcome).toBe("held"); expect(overridden.analysis).not.toBeNull(); expect(overridden.issues[0].code).toBe("duplicate");
});
it("rejects missing or invalid evaluator decisions", async () => {
  const c = context(); c.corpus.push({post:{...post,id:"10000000-0000-4000-8000-000000000002"},revision:{...original,body:"Other"}});
  const models={write:vi.fn().mockResolvedValue([analysisFixture]),evaluate:vi.fn().mockResolvedValue({})};
  await expect(prepareLocally(c,models)).rejects.toThrow("Invalid relation");
  await expect(prepareLocally(context(),models)).rejects.toThrow();
  const base=evaluator(); models.evaluate.mockImplementation(async (state,q)=>q.best ? {best:{choice:"invented"}} : base(state,q));
  await expect(prepareLocally(context(),models)).rejects.toThrow("Invalid hook");
});
it("requires fidelity and a meaningful quality improvement before adopting a new hook", async () => {
  const c=context(); c.revision={...original,body:"Original opening\n\nAn explanation."};
  const candidate={...analysisFixture,rewrittenPost:"Improved opening\n\nAn explanation.",alternativeHooks:["Specific opening","Other opening","Third opening"]};
  const base=evaluator();
  const evaluate=async(state:unknown,q:Parameters<typeof base>[1])=>{
    if(q.best)return {best:{choice:"h0"}};
    const answer=await base(state,q); const body=(state as {candidate:{body:string}}).candidate.body;
    for(const key of Object.keys(q).filter(k=>k.startsWith("score_"))) answer[key]={score:body.startsWith("Specific")?10:body.startsWith("Improved")?8:5};
    return answer;
  };
  const result=await prepareLocally(c,{write:vi.fn().mockResolvedValue([candidate]),evaluate});
  expect(result.analysis?.rewrittenPost).toBe("Specific opening\n\nAn explanation.");
  expect(result.analysis?.keyChanges).toContain("Selected a more specific opening.");
  expect(result.before.clarity).toBe(5); expect(result.after.clarity).toBe(10);
});
it("keeps links and placeholders visible as blocking issues even when the judge is optimistic", async () => {
  const c=context(); c.revision={...original,body:"[VERIFY metric] https://example.test/reference"};
  const candidate={...analysisFixture,rewrittenPost:"An edited lesson",postingPlan:{...analysisFixture.postingPlan,firstComment:""}};
  const result=await prepareLocally(c,{write:vi.fn().mockResolvedValue([candidate]),evaluate:evaluator()});
  expect(result.outcome).toBe("held"); expect(result.analysis?.rewrittenPost).toBe(c.revision.body);
  expect(result.issues.some(i=>i.code==="placeholder")).toBe(true);
});
it("holds writer-identified missing evidence and stops after two unsuccessful editing rounds", async () => {
  const base=evaluator(); const evaluate=async(s:unknown,q:Parameters<typeof base>[1])=>{const a=await base(s,q); for(const key of Object.keys(q).filter(k=>k.startsWith("score_")))a[key]={score:(s as {candidate:{body:string}}).candidate.body===original.body?4:5};return a;};
  const write=vi.fn().mockResolvedValue([{...analysisFixture,verificationNotes:["A claim still needs evidence"]}]);
  const result=await prepareLocally(context(),{write,evaluate});
  expect(write).toHaveBeenCalledTimes(2); expect(result.outcome).toBe("held"); expect(result.issues[0].code).toBe("writer_verification");
});
it("limits shortlists, skips rejected posts, and resolves equal rankings stably", () => {
  const c=context(); const corpus=Array.from({length:20},(_,n)=>({post:{...post,id:`10000000-0000-4000-8000-${String(n+2).padStart(12,"0")}`},revision:original}));
  corpus[0].post={...corpus[0].post,status:"rejected"};
  const list=shortlist(c,corpus.reverse()); expect(list).toHaveLength(12); expect(list[0].post.id.endsWith("000000000003")).toBe(true);
  expect(shortlist({...c,post:{...post,title:""},revision:{...original,body:"",sources:[]}},[{...corpus[0],post:{...corpus[0].post,title:"",topic:"other"},revision:{...original,body:"",sources:[]}}])).toHaveLength(1);
});

it("does not attach a rejected candidate's evidence problems to the unchanged original", async () => {
  const result = await prepareLocally(context(),{write:vi.fn().mockResolvedValue([{...analysisFixture,verificationNotes:["The rewritten claim has no evidence"]}]),evaluate:evaluator()});
  expect(result.analysis?.rewrittenPost).toBe(original.body);
  expect(result.analysis?.verificationNotes).toEqual([]); expect(result.outcome).toBe("ready");
});

it("feeds rejected meaning changes into the second round without replacing the safe original", async () => {
  const base=evaluator();const evaluate=async(s:unknown,q:Parameters<typeof base>[1])=>{const a=await base(s,q);if(q.meaning){a.meaning={noul:(s as {candidate:{body:string}}).candidate.body===original.body?0.99:0.1};for(const k of Object.keys(q).filter(k=>k.startsWith("score_")))a[k]={score:6};}return a;};
  const write=vi.fn().mockResolvedValue([analysisFixture]);const result=await prepareLocally(context(),{write,evaluate});
  expect(write).toHaveBeenCalledTimes(2);
  expect(write.mock.calls[1][0]).toMatchObject({issues:expect.arrayContaining([expect.objectContaining({code:"meaning"})]),rejected:expect.arrayContaining([expect.objectContaining({body:analysisFixture.rewrittenPost})])});
  expect(result.analysis?.rewrittenPost).toBe(original.body);
});

it("preserves reference URLs from the original first comment as well as the body", async () => {
  const c = context(); c.revision={...original,first_comment:"Reference: https://example.test/primary"};
  const base=evaluator();const evaluate=async(s:unknown,q:Parameters<typeof base>[1])=>{const a=await base(s,q);if(q.facts){for(const k of Object.keys(q).filter(k=>k.startsWith("score_")))a[k]={score:(s as {candidate:{body:string}}).candidate.body===original.body?5:9};}return a;};
  const result=await prepareLocally(c,{write:vi.fn().mockResolvedValue([{...analysisFixture,postingPlan:{...analysisFixture.postingPlan,firstComment:""}}]),evaluate});
  expect(result.analysis?.postingPlan.firstComment).toContain("https://example.test/primary");
  expect(result.analysis?.rewrittenPost).toBe(original.body);
});
