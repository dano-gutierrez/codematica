// @vitest-environment node
import { expect,it } from "vitest";
import { privatePostCollection } from "./private-posts";
const posts=[{id:"p",title:"Title",status:"review",current_revision_id:"r2"}];
const revisions=[{id:"r1",post_id:"p",body:"Published body",first_comment:""},{id:"r2",post_id:"p",body:" Current body ",first_comment:" Comment "}];
it("preserves current text and indexes distinct published revisions",()=>{
 expect(privatePostCollection(posts,revisions,[{post_id:"p",revision_id:"r1",status:"sent"},{post_id:"p",revision_id:"r1",status:"sent"},{post_id:"p",revision_id:"r2",status:"scheduled"}])).toEqual([
  {id:"p",revisionId:"r2",title:"Title",body:" Current body \n\n Comment ",status:"review",published:false},
  {id:"p@published:r1",revisionId:"r1",title:"Title",body:"Published body",status:"review",published:true},
 ]);
});
it("includes a sent current revision once",()=>{
 const result=privatePostCollection(posts,revisions,[{post_id:"p",revision_id:"r2",status:"sent"}]);expect(result).toHaveLength(1);expect(result[0]!.published).toBe(true);
 expect(privatePostCollection([],[],[])).toEqual([]);
});
it("rejects a missing or foreign current revision instead of hiding a coverage gap",()=>{
 expect(()=>privatePostCollection(posts,[],[])).toThrow("current revision");
 expect(()=>privatePostCollection(posts,[{...revisions[1],post_id:"other"}],[])).toThrow("current revision");
});
it("rejects a missing or foreign sent revision",()=>{
 expect(()=>privatePostCollection(posts,revisions,[{post_id:"p",revision_id:"missing",status:"sent"}])).toThrow("published revision");
 expect(()=>privatePostCollection(posts,[revisions[1],{...revisions[0],post_id:"other"}],[{post_id:"p",revision_id:"r1",status:"sent"}])).toThrow("published revision");
});
