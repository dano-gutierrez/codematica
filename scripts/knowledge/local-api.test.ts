// @vitest-environment node
import { mkdtemp,writeFile,rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach,describe,expect,it,vi } from "vitest";
import { createLocalKnowledge } from "./local-api";
import { knowledgeReport } from "../../packages/core/src/test/knowledge-fixture";
let directory:string;afterEach(async()=>{if(directory)await rm(directory,{recursive:true,force:true});});
async function setup(request:typeof fetch){directory=await mkdtemp(join(tmpdir(),"knowledge-test-"));await writeFile(join(directory,"api-token"),"private-test-token");return createLocalKnowledge(directory,undefined,request);}
describe("local API transport",()=>{
 it("sends bearer auth only to the configured loopback endpoint",async()=>{const fetcher=vi.fn().mockImplementation(async()=>new Response(JSON.stringify({snapshot_id:"s"})));const api=await setup(fetcher);await api.status();await api.projection();await api.job("id/1");expect(fetcher.mock.calls[0][0]).toBe("http://127.0.0.1:8795/v1/status");expect(fetcher.mock.calls[0][1].headers.Authorization).toBe("Bearer private-test-token");expect(fetcher.mock.calls[2][0]).toContain("id%2F1");});
 it("validates candidates and surfaces HTTP failures",async()=>{const api=await setup(vi.fn().mockResolvedValue(new Response("denied",{status:401})));await expect(api.status()).rejects.toThrow("401");await expect(api.submit({title:"",body:"tiny",kind:"post"})).rejects.toThrow();});
 it("polls staged reports without generating hosted jobs",async()=>{const fetcher=vi.fn().mockResolvedValueOnce(new Response('{"id":"j"}')).mockResolvedValueOnce(new Response('{"status":"pending"}')).mockResolvedValueOnce(new Response(JSON.stringify({status:"succeeded",report:knowledgeReport})));const api=await setup(fetcher);expect(await api.evaluate({title:"Title",body:"A useful candidate.",kind:"post"},async()=>{})).toEqual(knowledgeReport);expect(fetcher.mock.calls).toHaveLength(3);});
 it("rejects malformed successful reports before they reach editorial preparation",async()=>{const api=await setup(vi.fn().mockResolvedValueOnce(new Response('{"id":"j"}')).mockResolvedValue(new Response('{"status":"succeeded","report":{"action":"needs_review"}}')));await expect(api.evaluate({title:"Title",body:"A useful candidate.",kind:"post"},async()=>{})).rejects.toThrow();});
 it("returns a failed local job without retrying its content",async()=>{const api=await setup(vi.fn().mockResolvedValueOnce(new Response('{"id":"j"}')).mockResolvedValue(new Response('{"status":"failed","error":"Model unavailable"}')));await expect(api.evaluate({title:"Title",body:"A useful candidate.",kind:"post"})).rejects.toThrow("Model unavailable");});
});
