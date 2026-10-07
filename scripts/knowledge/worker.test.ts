// @vitest-environment node
import { describe,expect,it,vi } from "vitest";
import { processKnowledgeJob,synchronize } from "./worker";
import { fingerprint } from "./fingerprint";
import { localKnowledgeOrigin } from "./local-api";
describe("local knowledge worker",()=>{
  it("rejects hosted endpoints",()=>{expect(()=>localKnowledgeOrigin("https://api.openai.com")).toThrow();expect(()=>localKnowledgeOrigin("http://127.0.0.1:8795/redirect")).toThrow();expect(localKnowledgeOrigin("http://127.0.0.1:8795")).toBe("http://127.0.0.1:8795");});
  it("does nothing when no job is eligible",async()=>{const db={rpc:vi.fn().mockResolvedValue({data:null,error:null})};const engine={evaluate:vi.fn()} as never;expect(await processKnowledgeJob(db,engine)).toBeNull();});
  it("binds completion to lease, source catalog, and database candidate hash",async()=>{
    const db={rpc:vi.fn().mockResolvedValueOnce({data:{id:"j",lease_token:"t",candidate:{title:"A",body:"Valid text",kind:"document"},candidate_hash:fingerprint({title:"A",body:"Valid text",kind:"document"}),source_catalog_id:"source"},error:null}).mockResolvedValue({data:null,error:null})};
    const engine={status:vi.fn().mockResolvedValue({snapshot_id:"source"}),evaluate:vi.fn().mockResolvedValue({snapshot_id:"source",candidate_hash:fingerprint({title:"A",body:"Valid text",kind:"document"})})} as never;
    expect(await processKnowledgeJob(db,engine)).toEqual({id:"j",status:"succeeded"});expect(db.rpc).toHaveBeenLastCalledWith("knowledge_complete",{p_id:"j",p_token:"t",p_report:{snapshot_id:"source",candidate_hash:fingerprint({title:"A",body:"Valid text",kind:"document"})}});
  });
  it("fails mismatched snapshots without making an inference call",async()=>{
    const db={rpc:vi.fn().mockResolvedValueOnce({data:{id:"j",lease_token:"t",source_catalog_id:"old"},error:null}).mockResolvedValue({data:null,error:null})};const evaluate=vi.fn();const engine={status:vi.fn().mockResolvedValue({snapshot_id:"new"}),evaluate} as never;
    expect(await processKnowledgeJob(db,engine)).toEqual({id:"j",status:"failed"});expect(evaluate).not.toHaveBeenCalled();
  });
  it("publishes only complete local projections",async()=>{const db={rpc:vi.fn().mockResolvedValueOnce({data:[],error:null}).mockResolvedValue({data:"snapshot",error:null})};expect(await synchronize(db,{projection:async()=>({id:"snapshot"})} as never)).toBe("snapshot");await expect(synchronize(db,{projection:async()=>null} as never)).rejects.toThrow();});
});
it("rejects altered local candidates and reports failures",async()=>{
 const db={rpc:vi.fn().mockResolvedValueOnce({data:{id:"j",lease_token:"t",candidate:{title:"A",body:"Valid text",kind:"post"},candidate_hash:fingerprint({title:"A",body:"Valid text",kind:"post"}),source_catalog_id:"source"},error:null}).mockResolvedValue({data:null,error:null})};
 const engine={status:async()=>({snapshot_id:"source"}),evaluate:async()=>({snapshot_id:"source",candidate_hash:"wrong"})} as never;
 expect(await processKnowledgeJob(db,engine)).toEqual({id:"j",status:"failed"});expect(db.rpc).toHaveBeenLastCalledWith("knowledge_fail",expect.objectContaining({p_error:"Local candidate differs from the leased candidate"}));
});
it("synchronizes only private relationships with unchanged literal evidence",async()=>{
 const resource={id:"post:p",hash:"h",text:"Quoted evidence"};
 const edges=[{id:"valid",source:"post:p",target:"post:p",evidence:[{resourceId:"post:p",hash:"h",quote:"Quoted evidence"}]},{id:"stale",source:"post:p",target:"post:p",evidence:[{resourceId:"post:p",hash:"old",quote:"Quoted evidence"}]}];
 const db={rpc:vi.fn().mockResolvedValueOnce({data:edges,error:null}).mockResolvedValue({data:"snapshot",error:null})};
 await synchronize(db,{projection:async()=>({id:"a",resources:[resource],relationships:[]})} as never);
 expect(db.rpc).toHaveBeenLastCalledWith("knowledge_publish",{p_snapshot:expect.objectContaining({relationships:[edges[0]]})});
});
it("propagates database errors",async()=>{const db={rpc:vi.fn().mockResolvedValue({data:null,error:{message:"Denied"}})};await expect(processKnowledgeJob(db,{} as never)).rejects.toThrow("Denied");});

it("deduplicates approved edges against inferred projections",async()=>{
 const resource={id:"post:p",hash:"h",text:"Quoted evidence"};
 const edge={id:"same",source:"post:p",target:"post:p",provenance:"approved",evidence:[{resourceId:"post:p",hash:"h",quote:"Quoted evidence"}]};
 const db={rpc:vi.fn().mockResolvedValueOnce({data:[edge],error:null}).mockResolvedValue({data:"snapshot",error:null})};
 await synchronize(db,{projection:async()=>({id:"a",resources:[resource],relationships:[{...edge,provenance:"inferred"}]})} as never);
 expect(db.rpc).toHaveBeenLastCalledWith("knowledge_publish",{p_snapshot:expect.objectContaining({relationships:[edge]})});
});
