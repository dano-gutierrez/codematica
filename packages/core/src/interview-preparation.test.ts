import { describe, expect, it, vi } from "vitest";
import { briefSchema, createInterviewClient, exportBrief, preparationState, validateEditing, opportunityInputSchema } from "./interview-preparation";

import { sampleBrief } from "./test/interview-preparation-fixture";
describe("private interview preparation", () => {
  it("requires every preparation section and a completed technical-edit receipt", () => {
    expect(briefSchema.parse(sampleBrief)).toEqual(sampleBrief);
    expect(briefSchema.safeParse({ ...sampleBrief, editing: undefined }).success).toBe(false);
    expect(briefSchema.safeParse({ ...sampleBrief, editing: { ...sampleBrief.editing, compared: false } }).success).toBe(false);
    expect(briefSchema.safeParse({ ...sampleBrief, sections: { ...sampleBrief.sections, questionsToAsk: " " } }).success).toBe(false);
    expect(briefSchema.safeParse({ ...sampleBrief, sources: [{ ...sampleBrief.sources[0], url: "javascript:alert(1)" }] }).success).toBe(false);
  });
  it("distinguishes missing, draft, prepared and stale input versions", () => {
    expect(preparationState(null, 1, 1)).toEqual({ status: "missing", stale: false });
    expect(preparationState(sampleBrief, 1, 1)).toEqual({ status: "draft", stale: false });
    const ready = { ...sampleBrief, knowledge: { status: "reviewed" as const, warnings: [] } };
    expect(preparationState(ready, 1, 1)).toEqual({ status: "prepared", stale: false });
    expect(preparationState(ready, 2, 1).stale).toBe(true);
    expect(preparationState(ready, 1, 2).stale).toBe(true);
  });
  it("exports the saved sections with citations and uncertainty intact", () => {
    const text = exportBrief("Example — Engineer", sampleBrief);
    expect(text).toContain(sampleBrief.sections.questionsToAsk);
    expect(text).toContain(sampleBrief.sections.uncertainty);
    expect(text).toContain("https://example.com");
    expect(text).toContain("2026-10-03");
    expect(text).not.toContain("Simplified text");
  });
  it("rejects edits that alter code, links or numeric literals", () => {
    const text = "Use `limit=3` with 48 ms. [Source](https://example.com)\n```ts\nconst n = 3;\n```";
    expect(() => validateEditing(text, text.replace("Use", "Apply"))).not.toThrow();
    for (const edited of [text+" The outcome was 100 percent.",text.replace("48", "49"), text.replace("limit=3", "limit=4"), text.replace("example.com", "other.com"), text.replace("const n", "let n")]) expect(() => validateEditing(text, edited)).toThrow();
  });
  it('protects raw citations and tilde-fenced code',()=>{
    const draft='Source https://example.com/research\n~~~ts\nconst n = 3;\n~~~';
    expect(()=>validateEditing(draft,draft.replace('example.com','other.com'))).toThrow();
    expect(()=>validateEditing(draft,draft.replace('const n','let n'))).toThrow();
  });
  it("validates opportunities, round timezones and safe URLs", () => {
    expect(opportunityInputSchema.parse({ company: "Example", position: "Engineer" }).status).toBe("potential");
    expect(opportunityInputSchema.safeParse({ company: " ", position: "Engineer" }).success).toBe(false);
    expect(opportunityInputSchema.safeParse({ company: "Example", position: "Engineer", website: "file:///tmp/x" }).success).toBe(false);
  });
  it("validates RPC data and surfaces authorization/save errors", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    const client = createInterviewClient({ rpc });
    expect(await client.isAdmin()).toBe(true);
    rpc.mockResolvedValueOnce({ data: null, error: { message: "Admin access required" } });
    await expect(client.snapshot()).rejects.toThrow("Admin access required");
    rpc.mockResolvedValueOnce({ data: {}, error: null });
    await expect(client.snapshot()).rejects.toThrow();
  });
});

describe('interview RPC and freshness boundaries',()=>{
 it('requires report bindings for prepared briefs and recognizes graph changes',()=>{
  const prepared={...sampleBrief,knowledge:{status:'reviewed' as const,warnings:[],snapshotId:'a'.repeat(64),jobId:sampleBrief.opportunityId}};
  expect(briefSchema.safeParse({...prepared,knowledge:{status:'reviewed',warnings:[]}}).success).toBe(false);
  expect(preparationState(prepared,1,1,'b'.repeat(64)).stale).toBe(true);
  expect(preparationState(prepared,1,1,'a'.repeat(64)).stale).toBe(false);
  expect(opportunityInputSchema.safeParse({company:'Example',position:'Engineer',rounds:[{label:'Round',timezone:'unknown'}]}).success).toBe(false);
 });
 it('routes validated writes and handles account changes without reacting to token refresh',async()=>{
  let authCallback!: (event:string,session:{user:{id:string}}|null)=>void;
  const unsubscribe=vi.fn();const listener=vi.fn();const rpc=vi.fn().mockResolvedValue({data:sampleBrief.opportunityId,error:null});
  const api=createInterviewClient({rpc,auth:{onAuthStateChange:callback=>{authCallback=callback;return {data:{subscription:{unsubscribe}}};}}});
  const off=api.onAccessChange(listener);authCallback('INITIAL_SESSION',{user:{id:'one'}});authCallback('TOKEN_REFRESHED',{user:{id:'one'}});expect(listener).not.toHaveBeenCalled();authCallback('SIGNED_OUT',null);expect(listener).toHaveBeenCalledTimes(1);off();expect(unsubscribe).toHaveBeenCalled();
  await api.save(opportunityInputSchema.parse({company:'Example',position:'Engineer'}),null,0,'key');expect(rpc).toHaveBeenCalledWith('interview_save',expect.objectContaining({p_key:'key'}));
  await api.saveProfile({resume:'Real resume',experience:'Evidence'},0);await api.importBrief(sampleBrief,'import');
  rpc.mockResolvedValueOnce({data:null,error:{}});await expect(api.snapshot()).rejects.toThrow('Interview request failed');
 });
 it('renders resource links and preserves literal comparisons',()=>{
  const brief={...sampleBrief,resources:[{resourceId:'path:example',hash:'a'.repeat(64),quote:'Literal passage',title:'Example',paths:[],skills:[],route:'/paths/example'}]};
  expect(exportBrief('Title',brief)).toContain('[Example](/paths/example)');
  expect(exportBrief('Title',{...brief,resources:[{...brief.resources[0],route:undefined}]})).toContain('- Example — path:example');
 });
});
