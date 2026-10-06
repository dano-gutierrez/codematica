// @vitest-environment node
import { describe,expect,it } from "vitest";
import { approvedCurriculumRelationships } from "./review";
import { knowledgeReport,knowledgePage } from "../../packages/core/src/test/knowledge-fixture";
import type { KnowledgeSnapshot } from "../../packages/core/src/knowledge";
import { fingerprint,canonicalJson } from "./fingerprint";
const snapshot={version:1,id:knowledgeReport.snapshot_id,resources:[...knowledgePage.resources,{...knowledgePage.resources[0],id:"path:databases",kind:"path"}],relationships:[],counts:{},exclusions:[],unresolved:[],manifest:[]} as KnowledgeSnapshot;
describe("reviewed sidecar",()=>{
 it("allows only evidence-bound curriculum edges",()=>{expect(approvedCurriculumRelationships(snapshot,knowledgeReport)[0].provenance).toBe("approved");expect(approvedCurriculumRelationships({...snapshot,resources:[]},knowledgeReport)).toEqual([]);});
 it("invalidates changes and missing evidence",()=>{expect(()=>approvedCurriculumRelationships({...snapshot,id:"changed"},knowledgeReport)).toThrow("Stale");for(const evidence of [[],[{resourceId:"document:indexes",hash:"changed",quote:"Indexes"}],[{resourceId:"document:indexes",hash:"b".repeat(64),quote:"Invented quote"}]])expect(()=>approvedCurriculumRelationships(snapshot,{...knowledgeReport,relationships:[{...knowledgeReport.relationships[0],evidence}]})).toThrow("Stale");});
 it("matches Python canonical JSON across order, Unicode, and absent fields",()=>{expect(canonicalJson({z:[1,null],a:"café",absent:undefined})).toBe('{"a":"café","z":[1,null]}');expect(fingerprint({kind:"post",title:"Draft",body:"Body"})).toEqual(fingerprint({body:"Body",title:"Draft",kind:"post"}));});
});
