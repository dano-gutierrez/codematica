import { describe, expect, it, vi } from "vitest";
import { createKnowledgeClient, knowledgeCandidateSchema } from "./knowledge";
describe("knowledge client boundary", () => {
  it("validates candidates before queuing and preserves the caller's idempotency key", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "job", error: null });
    const client = createKnowledgeClient({ rpc });
    await expect(client.submit({ title: "", body: "tiny", kind: "post" }, "key")).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
    expect(await client.submit({ title: " Draft ", body: "A valid candidate.", kind: "document" }, "key")).toBe("job");
    expect(rpc).toHaveBeenCalledWith("knowledge_submit", { p_key: "key", p_candidate: { title: " Draft ", body: "A valid candidate.", kind: "document" } });
  });
  it("propagates errors and sends bounded read/review contracts", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: {}, error: null }); const client = createKnowledgeClient({ rpc });
    await client.browse("index", { kind: "document" }, "cursor", "document:a");
    await client.job("job"); await client.forPost("post", "rev"); await client.review({ id: "job", status: "succeeded" }, "reject");
    expect(rpc).toHaveBeenCalledWith("knowledge_browse", expect.objectContaining({ p_focus: "document:a" }));
    rpc.mockResolvedValue({ data: null, error: { message: "Denied" } });
    await expect(client.isAdmin()).rejects.toThrow("Denied");
    expect(knowledgeCandidateSchema.safeParse({ title: "A", body: "Valid body", kind: "unknown" }).success).toBe(false);
  });
});

it("preserves exact candidate text while rejecting blank content",()=>{
 const input={title:" Draft ",body:"A complete body.\n\n   ",kind:"post"};
 expect(knowledgeCandidateSchema.parse(input)).toEqual(input);
 expect(knowledgeCandidateSchema.safeParse({...input,body:"             "}).success).toBe(false);
});

it("invalidates account access without treating token refresh as an account change",()=>{
 let callback!:(event:string,session:{user:{id:string}}|null)=>void;
 const unsubscribe=vi.fn(),listener=vi.fn();
 const client=createKnowledgeClient({rpc:vi.fn(),auth:{onAuthStateChange:handler=>{callback=handler;return {data:{subscription:{unsubscribe}}};}}});
 const stop=client.onAccessChange(listener);
 callback("INITIAL_SESSION",{user:{id:"one"}});callback("TOKEN_REFRESHED",{user:{id:"one"}});expect(listener).not.toHaveBeenCalled();
 callback("SIGNED_OUT",null);callback("SIGNED_IN",{user:{id:"two"}});expect(listener).toHaveBeenCalledTimes(2);stop();expect(unsubscribe).toHaveBeenCalledOnce();
 createKnowledgeClient({rpc:vi.fn()}).onAccessChange(listener)();
});
