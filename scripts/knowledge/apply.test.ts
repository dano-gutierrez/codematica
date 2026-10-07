// @vitest-environment node
import { mkdtemp,mkdir,readFile,rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe,it,expect,vi } from "vitest";
import { applyReviewed } from "./apply";
import { knowledgeReport,knowledgePage } from "../../packages/core/src/test/knowledge-fixture";
import type { KnowledgeSnapshot } from "../../packages/core/src/knowledge";
const snapshot={version:1,id:knowledgeReport.snapshot_id,resources:[...knowledgePage.resources,{...knowledgePage.resources[0],id:"path:databases",kind:"path"}],relationships:[],counts:{},exclusions:[],unresolved:[],manifest:[]} as KnowledgeSnapshot;
describe("review application",()=>{
 it("validates curriculum before committing private edges",async()=>{
  const root=await mkdtemp(join(tmpdir(),"knowledge-apply-"));const privateEdges=vi.fn(),mark=vi.fn();
  try{await expect(applyReviewed(root,snapshot,[{id:"j",report:{...knowledgeReport,relationships:[{...knowledgeReport.relationships[0],evidence:[]}]}}],{current:async()=>snapshot,privateEdges,mark})).rejects.toThrow("Stale relationship evidence");expect(privateEdges).not.toHaveBeenCalled();expect(mark).not.toHaveBeenCalled();}finally{await rm(root,{recursive:true,force:true});}
 });
 it("applies a bounded sidecar and leaves mixed uncreated content pending",async()=>{
  const root=await mkdtemp(join(tmpdir(),"knowledge-apply-"));await mkdir(join(root,"content"));const mark=vi.fn();
  try{const report={...knowledgeReport,relationships:[...knowledgeReport.relationships,{...knowledgeReport.relationships[0],id:"candidate-edge",source:"candidate:new"}]};const results=await applyReviewed(root,snapshot,[{id:"j",report}],{current:async()=>snapshot,privateEdges:async()=>0,mark});expect(results[0].status).toBe("relationships-applied");expect(JSON.parse(await readFile(join(root,"content/relationships.json"),"utf8"))[0].provenance).toBe("approved");expect(mark).not.toHaveBeenCalled();}finally{await rm(root,{recursive:true,force:true});}
 });
 it("checks each job's sources after earlier sidecar changes",async()=>{
  const root=await mkdtemp(join(tmpdir(),"knowledge-apply-"));await mkdir(join(root,"content"));const current=vi.fn().mockResolvedValueOnce(snapshot).mockResolvedValueOnce(snapshot).mockResolvedValue({...snapshot,id:"changed"}),privateEdges=vi.fn().mockResolvedValue(0),mark=vi.fn();
  try{const results=await applyReviewed(root,snapshot,[{id:"one",report:knowledgeReport},{id:"two",report:knowledgeReport}],{current,privateEdges,mark});expect(results[1].status).toBe("stale");expect(privateEdges).toHaveBeenCalledTimes(1);expect(mark).toHaveBeenCalledWith("one");}finally{await rm(root,{recursive:true,force:true});}
 });
});
