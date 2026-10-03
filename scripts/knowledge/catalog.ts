import { createHash } from "node:crypto";
import type { ContentIndex } from "../../packages/core/src/content/schema";
import { knowledgeSnapshotSchema, type KnowledgeResource, type KnowledgeRelationship } from "../../packages/core/src/knowledge";

export const hash = (value: string) => createHash("sha256").update(value).digest("hex");
type Post = { id: string; revisionId: string; title: string; body: string; status: string; published: boolean };
export function buildKnowledgeCatalog(index: ContentIndex, posts: Post[] = [], approved: KnowledgeRelationship[] = [], gameSources:Record<string,{path:string;hash:string}> = {}) {
  const resources: KnowledgeResource[] = [], relationships: KnowledgeRelationship[] = [], exclusions: { id: string; reason: string }[] = [], unresolved: { resourceId: string; reference: string }[] = [];
  const excludedPaths = new Set(index.learningPaths.filter(p => p.category === "Languages").map(p => p.slug));
  const add = (r: Omit<KnowledgeResource, "paths" | "skills" | "tags" | "visibility" | "status"> & Partial<Pick<KnowledgeResource, "paths" | "skills" | "tags" | "visibility" | "status">>) => resources.push({ paths: [], skills: [], tags: [], visibility: "curriculum", status: "published", ...r });
  const link = (source: string, target: string, type: KnowledgeRelationship["type"], order?: number) => relationships.push({ id: hash(`${source}|${type}|${target}|${order ?? ""}`), source, target, type, provenance: "explicit", evidence: [], ...(order === undefined ? {} : { order }) });
  const exclude = (id: string) => exclusions.push({ id, reason: "Human-language curriculum" });
  for (const d of index.documents) {
    if (d.track === "Languages" || d.sourcePath.startsWith("content/knowledge/languages/")) { exclude(`document:${d.slug}`); continue; }
    const id = `document:${d.slug}`;
    add({ id, kind: "document", title: d.title, text: d.plainText, hash: d.contentHash, sourcePath: d.sourcePath, route: d.route, status: d.status, tags: d.tags, difficulty: d.difficulty });
    // Only parsed headings are section boundaries; code-fence headings cannot create resources.
    let fence = false, headingIndex = -1, text = "", heading = d.headings[0];
    const flush = () => { if (headingIndex >= 0 && text.trim()) { const sid = `${id}#${heading.id}`; add({ id: sid, parentId: id, kind: "section", title: `${d.title}: ${heading.text}`, text: text.trim(), hash: d.contentHash, sourcePath: d.sourcePath, route: `${d.route}#${heading.id}`, status: d.status, tags: d.tags, difficulty: d.difficulty }); link(id, sid, "contains", headingIndex); } };
    for (const line of d.markdown.split("\n")) {
      if (/^\s*(```|~~~)/.test(line)) fence = !fence;
      const match = !fence && /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      const next = d.headings[headingIndex + 1];
      if (match && next && match[2] === next.text) { flush(); headingIndex++; heading = next; text = ""; }
      text += line + "\n";
    }
    flush();
    for (const ref of d.diagramRefs) link(id, `diagram:${ref}`, "illustrates");
    for (const ref of d.sourceRefs ?? []) link(id, `source:${ref}`, "cites");
  }
  for (const d of index.diagrams) add({ id: `diagram:${d.slug}`, kind: "diagram", title: d.title, text: d.source, hash: d.contentHash, sourcePath: d.sourcePath, route: d.route });
  for (const s of index.sources) { if (s.sourcePath.startsWith("content/sources/languages/")) { exclude(`source:${s.id}`); continue; } add({ id: `source:${s.id}`, kind: "source", title: s.title, text: JSON.stringify(s), hash: s.contentHash, sourcePath: s.sourcePath }); }
  for (const e of index.exercises) {
    if (e.sourcePath.startsWith("content/exercises/languages/")) { exclude(`exercise:${e.slug}`); continue; }
    const id = `exercise:${e.slug}`;
    add({ id, kind: "exercise", title: e.title, text: JSON.stringify(e), hash: e.contentHash, sourcePath: e.sourcePath, route: e.route, status: e.status });
    if ("documentSlug" in e && e.documentSlug) link(id, `document:${e.documentSlug}`, "assesses");
    for (const ref of e.sourceRefs ?? []) link(id, `source:${ref}`, "cites");
  }
  for (const c of index.interviewCollections) {
    const cid = `interview-collection:${c.slug}`;
    add({ id: cid, kind: "interview-collection", title: c.name, text: c.summary, hash: c.contentHash, sourcePath: c.sourcePath, route: c.route, status: c.status });
    for (const [order, q] of c.questions.entries()) {
      const id = `interview-question:${c.slug}/${q.slug}`;
      add({ id, parentId: cid, kind: "interview-question", title: q.title, text: JSON.stringify(q), hash: c.contentHash, sourcePath: c.sourcePath, route: q.route, status: c.status, tags: q.tags, difficulty: q.difficulty }); link(cid, id, "contains", order);
      for (const ref of q.sourceRefs ?? []) link(id, `source:${ref}`, "cites");
      const tracks = "solutionTracks" in q ? q.solutionTracks : [];
      for (const [i, t] of tracks.entries()) { const sid = `${id}/solution:${"id" in t ? t.id : i}`; add({ id: sid, parentId: id, kind: "solution", title: "title" in t ? String(t.title) : q.title, text: JSON.stringify(t), hash: c.contentHash, sourcePath: c.sourcePath, route: q.route, status: c.status }); link(id, sid, "contains", i); }
    }
  }
  for (const p of index.learningPaths) {
    if (excludedPaths.has(p.slug)) { exclude(`path:${p.slug}`); continue; }
    const pid = `path:${p.slug}`;
    add({ id: pid, kind: "path", title: p.title, text: p.summary + "\n" + p.audience, audience: p.audience, hash: p.contentHash, sourcePath: p.sourcePath, route: p.route, status: p.status, paths: [pid] });
    for (const s of p.progression?.skills ?? []) { const id = `skill:${p.slug}:${s.id}`; add({ id, kind: "skill", title: s.label, text: s.description, hash: p.contentHash, sourcePath: p.sourcePath, paths: [pid], status: p.status }); link(pid, id, "teaches"); }
    for (const [order, u] of p.units.entries()) {
      const uid = `unit:${p.slug}:${u.slug}`;
      add({ id: uid, kind: "unit", title: u.title, text: u.summary, hash: p.contentHash, sourcePath: p.sourcePath, paths: [pid], status: p.status }); link(pid, uid, "contains", order);
      if (order) link(`unit:${p.slug}:${p.units[order - 1].slug}`, uid, "next");
      for (const [i, n] of u.nodes.entries()) { const target = `${n.kind === "interview" ? "interview-question" : n.kind}:${n.kind === "source" ? n.sourceRef : n.slug}`; link(uid, target, "contains", i); for (const skill of n.skillIds ?? []) link(target, `skill:${p.slug}:${skill}`, n.kind === "exercise" ? "assesses" : "teaches"); }
    }
    for (const ref of p.sourceRefs ?? []) link(pid, `source:${ref}`, "cites");
  }
  for (const f of index.passiveFlashcardFeeds) {
    if (excludedPaths.has(f.pathSlug)) { exclude(`feed:${f.slug}`); continue; }
    const id = `feed:${f.slug}`;
    add({ id, kind: "feed", title: f.title, text: f.summary, hash: f.contentHash, sourcePath: f.sourcePath, route: f.route, status: f.status, paths: [`path:${f.pathSlug}`] }); link(id, `path:${f.pathSlug}`, "reviews");
    for (const [i, c] of f.cards.entries()) { const cid = `${id}/card:${c.id}`; add({ id: cid, parentId: id, kind: "flashcard", title: c.title, text: JSON.stringify(c), hash: f.contentHash, sourcePath: f.sourcePath, status: f.status, tags: c.tags, difficulty: c.difficulty }); link(id, cid, "contains", i); if (c.sourceDocSlug) link(cid, `document:${c.sourceDocSlug}`, "reviews"); }
  }
  for (const c of index.gameCampaigns) {
    const origin=gameSources[c.id]??{path:`content/game/${c.id}.json`,hash:hash(JSON.stringify(c))};
    const cid=`game-campaign:${c.id}`;
    add({id:cid,kind:"game-campaign",title:c.title,text:c.summary,hash:origin.hash,sourcePath:origin.path,route:"/"});
    for (const [order,level] of c.levels.entries()) {
      const lid=`game-level:${c.id}/${level.id}`;
      const paths=level.pathSlug?[`path:${level.pathSlug}`]:[];
      add({id:lid,parentId:cid,kind:"game-level",title:level.title,text:level.story,hash:origin.hash,sourcePath:origin.path,route:`/play/${c.id}/${level.id}`,paths});link(cid,lid,"contains",order);
      if(order)link(`game-level:${c.id}/${c.levels[order-1].id}`,lid,"next");
      for(const slug of level.lessonSlugs)link(lid,`document:${slug}`,"reviews");
      if(level.pathSlug)link(lid,`path:${level.pathSlug}`,"reviews");
      for(const [i,scenario] of level.scenarios.entries()){
        const sid=`game-scenario:${c.id}/${level.id}/${i}`;
        add({id:sid,parentId:lid,kind:"game-scenario",title:`${level.title}: ${scenario.title}`,text:JSON.stringify(scenario),hash:origin.hash,sourcePath:origin.path,route:`/play/${c.id}/${level.id}`,paths});link(lid,sid,"contains",i);
      }
    }
  }
  for (const p of posts) add({ id: `post:${p.id}`, kind: "post", revisionId: p.revisionId, title: p.title, text: p.body, hash: hash(p.body + "\n" + p.revisionId + "\n" + p.status + "\n" + p.published), sourcePath: `private/linkedin/${p.id}`, visibility: "private", status: p.published ? "published" : p.status, postStatus: p.status, published: p.published });
  const byId = new Map(resources.map(r => [r.id, r]));
  for (const d of index.documents) for (const ref of d.prerequisites) { const target = resources.find(r => r.kind === "document" && (r.title.toLowerCase() === ref.toLowerCase() || r.id === `document:${ref}`)); if (target && byId.has(`document:${d.slug}`)) link(`document:${d.slug}`, target.id, "requires"); else if (byId.has(`document:${d.slug}`)) unresolved.push({ resourceId: `document:${d.slug}`, reference: ref }); }
  const valid = relationships.filter(e => { if (byId.has(e.source) && byId.has(e.target)) return true; unresolved.push({ resourceId: e.source, reference: e.target }); return false; });
  for (const edge of valid) {
    const origin = byId.get(byId.get(edge.target)?.kind === "skill" ? edge.target : edge.source)!;
    edge.origin = {resourceId:origin.id,sourcePath:origin.sourcePath,hash:origin.hash};
  }
  for (const e of approved) {
    if (e.provenance !== "approved" || !byId.has(e.source) || !byId.has(e.target) || !e.evidence.length || e.evidence.some(v => byId.get(v.resourceId)?.hash !== v.hash || !byId.get(v.resourceId)?.text.includes(v.quote))) { unresolved.push({resourceId:e.source,reference:`invalidated approved relationship ${e.id}`}); continue; }
    valid.push(e);
  }
  for (const r of resources) { const parentUnits = valid.filter(e => e.type === "contains" && e.target === r.id).map(e => byId.get(e.source)!); r.paths = [...new Set([...r.paths, ...parentUnits.flatMap(p => p.paths)])]; r.skills = valid.filter(e => ["teaches", "assesses"].includes(e.type) && e.source === r.id && byId.get(e.target)?.kind === "skill").map(e => e.target); }
  for (const r of resources) if (r.parentId) { const parent = byId.get(r.parentId); r.paths = [...new Set([...r.paths, ...parent?.paths ?? []])]; r.skills = [...new Set([...r.skills, ...parent?.skills ?? []])]; }
  resources.sort((a, b) => a.id.localeCompare(b.id));
  valid.sort((a, b) => a.id.localeCompare(b.id));
  const counts = Object.fromEntries([...new Set(resources.map(r => r.kind))].map(kind => [kind, resources.filter(r => r.kind === kind).length]));
  const id = hash(JSON.stringify({ resources, relationships: valid, exclusions, unresolved }));
  const manifest = [...new Map(resources.map(r=>[r.sourcePath,{path:r.sourcePath,hash:r.hash}])).values()].sort((a,b)=>a.path.localeCompare(b.path));
  return knowledgeSnapshotSchema.parse({ version: 1, id, resources, relationships: valid, counts, exclusions, unresolved, manifest });
}
