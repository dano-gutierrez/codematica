// @vitest-environment node
import { describe,expect,it,vi } from "vitest";
import { knowledgeReport } from "../../packages/core/src/test/knowledge-fixture";
import { editorialFixture } from "../../packages/core/src/test/linkedin-fixture";
const {evaluate}=vi.hoisted(()=>({evaluate:vi.fn()}));
vi.mock("../knowledge/local-api",()=>({createLocalKnowledge:()=>({evaluate})}));
import { compactKnowledge,assessPostKnowledge } from "./knowledge";
describe("preparation knowledge context",()=>{
 it("bounds passages and preserves source IDs and revisions",async()=>{const report={...knowledgeReport,matches:Array.from({length:8},()=>({...knowledgeReport.matches[0],text:"a".repeat(2000)}))};const compact=compactKnowledge(report);expect(compact.matches).toHaveLength(6);expect(compact.matches[0].text).toHaveLength(900);evaluate.mockResolvedValue(knowledgeReport);const post=editorialFixture.posts[0],revision=editorialFixture.revisions[0];expect(await assessPostKnowledge(post,revision)).toBe(knowledgeReport);expect(evaluate).toHaveBeenCalledWith(expect.objectContaining({kind:"post",existingId:"post:"+post.id,revisionId:revision.id}));});
 it("propagates local failures instead of falling back to hosted models",async()=>{evaluate.mockRejectedValue(new Error("Offline"));await expect(assessPostKnowledge(editorialFixture.posts[0],{...editorialFixture.revisions[0],first_comment:""})).rejects.toThrow("Offline");});
});
