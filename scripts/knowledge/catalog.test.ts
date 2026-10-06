// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { buildContentIndex } from "../../packages/core/src/content/build-index";
import { buildKnowledgeCatalog } from "./catalog";

import {sampleBrief} from '../../packages/core/src/test/interview-preparation-fixture';

let validatedIndex: Awaited<ReturnType<typeof buildContentIndex>>;
beforeAll(async () => {
  validatedIndex = await buildContentIndex({ rootDir: process.cwd() });
});
// Parse the real canonical files once; mutations belong to each case's copy.
function freshContent() { return structuredClone(validatedIndex); }

describe("complete knowledge catalog", () => {
  it('catalogs preparation privately with canonical evidence and invalidates stale links', async()=>{
    const index=freshContent();const base=buildKnowledgeCatalog(index);
    const target=base.resources.find(r=>r.kind==='document' && r.skills.length && r.route)!;
    const opportunity={id:sampleBrief.opportunityId,companyId:sampleBrief.opportunityId,version:1,updatedAt:'2026-10-04',company:'Example',position:'Engineer',website:'',jobUrl:'',jobDescription:'',notes:'',outcome:'',status:'potential' as const,rounds:[]};
    const snapshot={profile:{version:1,resume:'PRIVATE RESUME',experience:'PRIVATE EXPERIENCE'},opportunities:[opportunity],revisions:[{id:opportunity.id,createdAt:'2026-10-04',brief:{...sampleBrief,resources:[{resourceId:target.id,title:target.title,hash:target.hash,quote:target.text.slice(0,30),route:target.route,paths:target.paths,skills:target.skills}]}}]};
    const graph=buildKnowledgeCatalog(index,[],[],{},snapshot);const prep=graph.resources.find(r=>r.kind==='interview-preparation')!;
    expect(prep.visibility).toBe('private');expect(prep.paths).toEqual(target.paths);expect(prep.skills).toEqual(target.skills);
    expect(JSON.stringify(graph)).not.toContain('PRIVATE RESUME');expect(graph.relationships.some(e=>e.source===prep.id && e.target===target.id && e.type==='reviews')).toBe(true);
    snapshot.revisions[0].brief.resources[0].hash='a'.repeat(64);
    const stale=buildKnowledgeCatalog(index,[],[],{},snapshot);expect(stale.resources.find(r=>r.id===prep.id)?.paths).toEqual([]);expect(stale.unresolved.some(r=>r.resourceId===prep.id)).toBe(true);
  });
  it("indexes published source companions at the source node's unit position and scoped skills", async () => {
    const index=freshContent();
    const graph=buildKnowledgeCatalog(index);
    const path="path:ml-systems-engineer",unit="unit:ml-systems-engineer:volume-one-foundations";
    const companion="document:ml-systems/ai-engineering-introduction";
    expect(graph.resources.find(r=>r.id===companion)).toMatchObject({paths:[path],skills:["skill:ml-systems-engineer:systems-thinking"]});
    const sections=graph.resources.filter(r=>r.parentId===companion);
    expect(sections.length).toBeGreaterThan(0);
    expect(sections.every(r=>r.paths.includes(path)&&r.skills.includes("skill:ml-systems-engineer:systems-thinking"))).toBe(true);
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:unit,target:companion,type:"contains",order:0,provenance:"explicit",origin:expect.objectContaining({resourceId:unit})}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:unit,target:"source:harvard-vol1-introduction",type:"contains",order:0}));
    expect(graph.resources.some(r=>r.id===companion)).toBe(true);
  });
  it("keeps absent and draft companions out of ordered membership", async () => {
    const index=freshContent();
    index.documents.find(d=>d.slug==="ml-systems/ai-engineering-introduction")!.status="draft";
    expect(freshContent().documents.find(d=>d.slug==="ml-systems/ai-engineering-introduction")?.status).toBe("published");
    const graph=buildKnowledgeCatalog(index);
    expect(graph.relationships.some(e=>e.source==="unit:ml-systems-engineer:volume-one-foundations"&&e.target==="document:ml-systems/ai-engineering-introduction"&&e.type==="contains")).toBe(false);
    expect(graph.resources.find(r=>r.id==="document:ml-systems/ai-engineering-introduction")?.paths).toEqual([]);
    expect(graph.relationships.some(e=>e.target==="exercise:ml-systems/tinytorch-twenty-modules")).toBe(false);
    expect(graph.resources.find(r=>r.id==="source:harvard-tinytorch")?.paths).toContain("path:ml-systems-engineer");
  });
  it("uses exercise identity and assessment edges for published exercise companions",async()=>{
    const index=freshContent();
    index.exercises.push({...index.exercises.find(e=>e.slug==="ml-systems/prerequisite-measurement-lab")!,slug:"ml-systems/tinytorch-twenty-modules",status:"published"});
    expect(freshContent().exercises.some(e=>e.slug==="ml-systems/tinytorch-twenty-modules")).toBe(false);
    const graph=buildKnowledgeCatalog(index),id="exercise:ml-systems/tinytorch-twenty-modules";
    expect(graph.resources.find(r=>r.id===id)?.paths).toContain("path:ml-systems-engineer");
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:"unit:ml-systems-engineer:volume-one-build",target:id,type:"contains",order:4}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:id,target:"skill:ml-systems-engineer:model-development",type:"assesses"}));
    expect(graph.relationships.some(e=>e.source===id&&e.type==="teaches")).toBe(false);
  });
  it("covers authored kinds and excludes human languages without excluding programming", async () => {
    const source = freshContent();
    const graph = buildKnowledgeCatalog(source);
    expect(graph.resources.some(r => r.id === "path:python-for-ts-js-engineers")).toBe(true);
    expect(graph.resources.some(r => r.kind === "interview-question")).toBe(true);
    expect(graph.resources.some(r => r.kind === "solution")).toBe(true);
    expect(graph.resources.some(r => r.kind === "flashcard")).toBe(true);
    expect(graph.resources.some(r => r.id === "skill:ml-systems-engineer:scientific-computing")).toBe(true);
    expect(graph.resources.some(r => /japanese|^language:/.test(r.id))).toBe(false);
    expect(graph.exclusions.length).toBeGreaterThan(0);
    expect(graph.counts.document).toBe(source.documents.filter(d => d.track !== "Languages").length);
    const ids = new Set(graph.resources.map(r => r.id));
    expect(ids.size).toBe(graph.resources.length);
    expect(graph.relationships.every(e => ids.has(e.source) && ids.has(e.target))).toBe(true);
    expect(graph.relationships.every(e=>e.origin?.hash.length===64 && e.origin.sourcePath.startsWith("content/"))).toBe(true);
    expect(graph.resources.every(r => r.hash.length === 64 && r.sourcePath.startsWith("content/"))).toBe(true);
  });
  it("keeps identities stable and fingerprints exact source changes", async () => {
    const source = freshContent();
    const a = buildKnowledgeCatalog(source);
    expect(buildKnowledgeCatalog(source).id).toBe(a.id);
    const copy = structuredClone(source);
    copy.documents.find(d => d.track !== "Languages")!.contentHash = "b".repeat(64);
    const b = buildKnowledgeCatalog(copy);
    expect(b.id).not.toBe(a.id);
    expect(b.resources.map(r => r.id)).toEqual(a.resources.map(r => r.id));
  });
  it("indexes private posts without mixing their identifiers with curriculum", async () => {
    const source = freshContent();
    const graph = buildKnowledgeCatalog(source, [{ id: "p1", revisionId: "r1", title: "Retries", body: "Retry budgets matter.", status: "review", published: false }]);
    expect(graph.resources.find(r => r.id === "post:p1")).toMatchObject({ visibility: "private", revisionId: "r1", kind: "post" });
  });
  it("preserves published post identity when rebuilding the private collection", async () => {
    const source = freshContent();
    const graph = buildKnowledgeCatalog(source, [{ id: "p1", revisionId: "r1", title: "Retries", body: "Retry budgets matter.", status: "approved", published: true }]);
    const r = graph.resources.find(r => r.id === "post:p1")!;
    const rebuilt = buildKnowledgeCatalog(source, [{ id: r.id.slice(5), revisionId: r.revisionId!, title: r.title, body: r.text, status: r.postStatus!, published: r.published! }]);
    expect(rebuilt.id).toBe(graph.id);
    expect(r).toMatchObject({ status: "published", postStatus: "approved", published: true });
  });
});

  it("keeps resource targets out of skill identities",async()=>{
    const snapshot=buildKnowledgeCatalog(freshContent());
    const kinds=new Map(snapshot.resources.map(r=>[r.id,r.kind]));
    for(const r of snapshot.resources) for(const skill of r.skills) expect(kinds.get(skill)).toBe("skill");
  });

it("fingerprints source revision and working-tree provenance",async()=>{
 const {catalogIdentity}=await import("./export-catalog");
 const source={id:"content",manifest:[],sourceRevision:"a",dirty:false};
 expect(catalogIdentity(source)).toBe(catalogIdentity({...source}));
 expect(catalogIdentity({...source,sourceRevision:"b"})).not.toBe(catalogIdentity(source));
 expect(catalogIdentity({...source,dirty:true})).not.toBe(catalogIdentity(source));
});
it("indexes the merged campaign, levels and scenarios with lesson links",async()=>{
 const source=freshContent(),graph=buildKnowledgeCatalog(source);
 expect(graph.counts["game-campaign"]).toBe(source.gameCampaigns.length);
 const c=source.gameCampaigns[0],level=c.levels[0],lid=`game-level:${c.id}/${level.id}`;
 expect(graph.counts["game-level"]).toBe(c.levels.length);expect(graph.counts["game-scenario"]).toBe(c.levels.length*3);
 expect(graph.resources.find(r=>r.id===lid)?.sourcePath).toBe(`content/game/${c.id}.json`);
 expect(graph.relationships).toContainEqual(expect.objectContaining({source:lid,target:`document:${level.lessonSlugs[0]}`,type:"reviews"}));
 expect(graph.relationships.some(e=>e.source===lid&&e.target.startsWith("game-scenario:")&&e.type==="contains")).toBe(true);
});
