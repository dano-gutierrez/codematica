// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { buildContentIndex } from "../../packages/core/src/content/build-index";
import { buildKnowledgeCatalog } from "./catalog";
import { sampleBrief } from "../../packages/core/src/test/interview-preparation-fixture";

let validatedIndex: Awaited<ReturnType<typeof buildContentIndex>>;
beforeAll(async () => {
  validatedIndex = await buildContentIndex({ rootDir: process.cwd() });
});
// Parse the real canonical files once; mutations belong to each case's copy.
function freshContent() { return structuredClone(validatedIndex); }

describe("complete knowledge catalog", () => {
  function preparationFixture() {
    const index = freshContent();
    const base = buildKnowledgeCatalog(index);
    const target = base.resources.find(r => r.kind === "document" && r.skills.length && r.route)!;
    const opportunity = { id: sampleBrief.opportunityId, companyId: sampleBrief.opportunityId, version: 1, updatedAt: "2026-10-04", company: "Example", position: "Engineer", website: "", jobUrl: "", jobDescription: "", notes: "", outcome: "", status: "potential" as const, rounds: [] };
    const snapshot = { profile: { version: 1, resume: "PRIVATE RESUME", experience: "PRIVATE EXPERIENCE" }, opportunities: [opportunity], revisions: [{ id: opportunity.id, createdAt: "2026-10-04", brief: { ...sampleBrief, resources: [{ resourceId: target.id, title: target.title, hash: target.hash, quote: target.text.slice(0, 30), route: target.route, paths: target.paths, skills: target.skills }] } }] };
    return { index, base, target, snapshot };
  }

  it("catalogs preparation privately with canonical evidence and excludes both profile fields", () => {
    const { index, target, snapshot } = preparationFixture();
    const graph = buildKnowledgeCatalog(index, [], [], {}, snapshot);
    const prep = graph.resources.find(r => r.kind === "interview-preparation")!;
    expect(prep.visibility).toBe("private");
    expect(prep.paths).toEqual(target.paths);
    expect(prep.skills).toEqual(target.skills);
    for (const excluded of ["PRIVATE RESUME", "PRIVATE EXPERIENCE"]) expect(JSON.stringify(graph)).not.toContain(excluded);
    expect(graph.relationships.some(e => e.source === prep.id && e.target === target.id && e.type === "reviews")).toBe(true);
  });

  it.each([
    ["hash", { hash: "a".repeat(64) }],
    ["passage", { quote: "A passage absent from the resource" }],
    ["title", { title: "Foreign title" }],
    ["route", { route: "/docs/foreign-resource" }],
  ])("invalidates private preparation links with a stale %s", (_, invalid) => {
    const { index, snapshot } = preparationFixture();
    Object.assign(snapshot.revisions[0].brief.resources[0], invalid);
    const stale = buildKnowledgeCatalog(index, [], [], {}, snapshot);
    const prep = stale.resources.find(r => r.kind === "interview-preparation")!;
    expect(prep).toBeDefined();
    expect(prep.paths).toEqual([]);
    expect(prep.skills).toEqual([]);
    expect(stale.relationships.some(e => e.source === prep.id && e.type === "reviews")).toBe(false);
    expect(stale.unresolved.some(r => r.resourceId === prep.id)).toBe(true);
  });

  it("inherits canonical paths and rejects an existing foreign skill from private preparation", () => {
    const { index, base, target, snapshot } = preparationFixture();
    const foreignSkill = base.resources.find(r => r.kind === "skill" && !target.skills.includes(r.id))!;
    expect(foreignSkill).toBeDefined();
    Object.assign(snapshot.revisions[0].brief.resources[0], { paths: ["path:foreign-path"], skills: [foreignSkill.id] });
    const unowned = buildKnowledgeCatalog(index, [], [], {}, snapshot);
    const prep = unowned.resources.find(r => r.kind === "interview-preparation")!;
    expect(prep).toBeDefined();
    expect(prep.paths).toEqual(target.paths);
    expect(prep.skills).toEqual([]);
    expect(unowned.relationships.some(e => e.source === prep.id && e.target === foreignSkill.id)).toBe(false);
  });

  it("exports selected evidence with canonical identities and path-scoped skills", () => {
    const graph = buildKnowledgeCatalog(freshContent());
    const groups = {
      "engineering-evidence-review": [
        ["ai-engineering/local-decision-contracts", "decision-evidence"],
        ["software-engineering/credential-containment", "incident-evidence"],
        ["programming/java-state-and-proxy-contracts", "java-contracts"],
        ["software-engineering/domain-and-deployment-boundaries", "domain-boundaries"],
        ["system-design/cloud-responsibility-and-runtime", "cloud-responsibility"],
        ["system-design/federation-and-delegation", "identity-boundaries"],
        ["system-design/card-payment-state-evidence", "payment-evidence"],
      ],
      "creative-computing-review": [
        ["creative-computing/authoritative-motion-and-prediction", "motion-authority"],
        ["creative-computing/sampled-surfaces-and-time", "sampled-geometry"],
        ["creative-computing/blockout-and-trigger-state", "trigger-state"],
      ],
      "ownership-and-funding-review": [["business/ownership-and-funding-models", "ownership-model"]],
    };
    for (const [slug, pairs] of Object.entries(groups)) {
      const path = `path:${slug}`;
      expect(graph.resources.filter(r => r.kind === "skill" && r.paths.includes(path))).toHaveLength(pairs.length);
      for (const [order, [document, name]] of pairs.entries()) {
        const unit = `unit:${slug}:${document.split("/").at(-1)}`;
        const skill = `skill:${slug}:${name}`;
        const doc = `document:${document}`;
        const quiz = `exercise:${document}-checkpoint`;
        for (const id of [unit, skill, doc, quiz]) expect(graph.resources.find(r => r.id === id)).toMatchObject({ visibility: "curriculum", status: "published", paths: [path] });
        expect(graph.relationships).toContainEqual(expect.objectContaining({ source: path, target: unit, type: "contains", order, provenance: "explicit" }));
        for (const [position, target] of [doc, quiz].entries()) expect(graph.relationships).toContainEqual(expect.objectContaining({ source: unit, target, type: "contains", order: position, provenance: "explicit" }));
        expect(graph.relationships).toContainEqual(expect.objectContaining({ source: doc, target: skill, type: "teaches", provenance: "explicit" }));
        expect(graph.relationships).toContainEqual(expect.objectContaining({ source: quiz, target: skill, type: "assesses", provenance: "explicit" }));
        expect(graph.unresolved.some(r => [unit, skill, doc, quiz].includes(r.resourceId))).toBe(false);
        expect(graph.resources.some(r => r.id === `skill:${name}`)).toBe(false);
        if (order) expect(graph.relationships).toContainEqual(expect.objectContaining({ source: `unit:${slug}:${pairs[order - 1][0].split("/").at(-1)}`, target: unit, type: "next", provenance: "explicit" }));
      }
    }
    const sources = graph.resources.filter(r => r.kind === "source" && r.sourcePath === "content/sources/selected-evidence-review.json");
    expect(sources).toHaveLength(27);
    for (const source of sources) expect(graph.relationships.some(r => r.type === "cites" && r.target === source.id && r.provenance === "explicit")).toBe(true);
  });
  it("exports six systems skills with source-bound order and prerequisite evidence", () => {
    const graph = buildKnowledgeCatalog(freshContent());
    const path = "path:systems-boundary-review";
    const pairs = [
      ["request-identities-and-navigation", "request-identity", "source:boundary-rfc9112"],
      ["transport-streams-and-tunnels", "transport-scope", "source:boundary-rfc9000"],
      ["api-interactions-and-intermediaries", "interaction-contract", "source:boundary-grpc-core"],
      ["derived-state-and-log-boundaries", "derived-state", "source:boundary-kafka-kraft"],
      ["document-query-and-pagination-contracts", "document-query", "source:boundary-mongo-skip"],
      ["virtual-addresses-and-device-io", "memory-domain", "source:boundary-linux-device-io"],
    ];
    for (const [order, [slug, name, source]] of pairs.entries()) {
      const unit = `unit:systems-boundary-review:${slug}`;
      const skill = `skill:systems-boundary-review:${name}`;
      const doc = `document:system-design/${slug}`;
      const quiz = `exercise:system-design/${slug}-checkpoint`;
      for (const id of [unit, skill, doc, quiz]) expect(graph.resources.find(r => r.id === id)).toMatchObject({ visibility: "curriculum", status: "published", paths: [path] });
      expect(graph.relationships).toContainEqual(expect.objectContaining({ source: path, target: unit, type: "contains", order, provenance: "explicit" }));
      for (const [position, target] of [doc, quiz].entries()) expect(graph.relationships).toContainEqual(expect.objectContaining({ source: unit, target, type: "contains", order: position, provenance: "explicit" }));
      expect(graph.relationships).toContainEqual(expect.objectContaining({ source: doc, target: skill, type: "teaches", provenance: "explicit" }));
      expect(graph.relationships).toContainEqual(expect.objectContaining({ source: quiz, target: skill, type: "assesses", provenance: "explicit" }));
      for (const from of [doc, quiz]) expect(graph.relationships).toContainEqual(expect.objectContaining({ source: from, target: source, type: "cites", provenance: "explicit" }));
      if (order) expect(graph.relationships).toContainEqual(expect.objectContaining({ source: `unit:systems-boundary-review:${pairs[order - 1][0]}`, target: unit, type: "next", provenance: "explicit" }));
      expect(graph.unresolved.some(r => [unit, skill, doc, quiz].includes(r.resourceId))).toBe(false);
      expect(graph.resources.some(r => r.id === `skill:${name}`)).toBe(false);
    }
    expect(graph.resources.filter(r => r.id.startsWith("skill:systems-boundary-review:")).length).toBe(6);
    expect(graph.relationships).toContainEqual(expect.objectContaining({ source: "document:system-design/transport-streams-and-tunnels", target: "document:system-design/request-identities-and-navigation", type: "requires", provenance: "explicit" }));
    expect(graph.relationships).toContainEqual(expect.objectContaining({ source: "document:system-design/document-query-and-pagination-contracts", target: "document:databases/index-fundamentals", type: "requires", provenance: "explicit" }));
  });
  it("exports programming contracts with qualified skills and explicit unit order", () => {
    const graph = buildKnowledgeCatalog(freshContent());
    const path = "path:programming-contract-review";
    const pairs = [
      ["javascript-value-contracts", "value-ownership"],
      ["lazy-demand-and-stream-boundaries", "bounded-demand"],
      ["text-domain-and-matching", "text-domain"],
      ["tree-shapes-and-cost-models", "shape-and-cost"],
    ];
    for (const [order, [slug, skillName]] of pairs.entries()) {
      const unit = `unit:programming-contract-review:${slug}`;
      const skill = `skill:programming-contract-review:${skillName}`;
      const doc = `document:programming/${slug}`;
      const quiz = `exercise:programming/${slug}-checkpoint`;
      for (const id of [unit, skill, doc, quiz]) expect(graph.resources.find(r => r.id === id)).toMatchObject({ visibility: "curriculum", status: "published", paths: [path] });
      expect(graph.relationships).toContainEqual(expect.objectContaining({ source: path, target: unit, type: "contains", order, provenance: "explicit" }));
      for (const [position, target] of [doc, quiz].entries()) expect(graph.relationships).toContainEqual(expect.objectContaining({ source: unit, target, type: "contains", order: position, provenance: "explicit" }));
      expect(graph.relationships).toContainEqual(expect.objectContaining({ source: doc, target: skill, type: "teaches", provenance: "explicit" }));
      expect(graph.relationships).toContainEqual(expect.objectContaining({ source: quiz, target: skill, type: "assesses", provenance: "explicit" }));
      if (order) expect(graph.relationships).toContainEqual(expect.objectContaining({ source: `unit:programming-contract-review:${pairs[order - 1][0]}`, target: unit, type: "next", provenance: "explicit" }));
      expect(graph.unresolved.some(r => [unit, skill, doc, quiz].includes(r.resourceId))).toBe(false);
    }
    const ids = graph.resources.filter(r => r.id.startsWith("skill:programming-contract-review:")).map(r => r.id);
    expect(ids).toHaveLength(4);
    expect(graph.resources.some(r => r.id === "skill:value-ownership")).toBe(false);
  });
  it("exports bounded keypad practice with explicit identities and evidence", () => {
    const graph = buildKnowledgeCatalog(freshContent());
    const lesson = "document:programming/keypad-dictionary-search", quiz = "exercise:programming/keypad-search-checkpoint", unit = "unit:coding-interview-pattern-practice:keypad-dictionary-search";
    for (const id of [lesson, quiz, unit]) expect(graph.resources.find(r => r.id === id)).toMatchObject({ visibility: "curriculum", status: "published" });
    for (const [source, target, order] of [["path:coding-interview-pattern-practice", unit, 7], [unit, lesson, 0], [unit, quiz, 1]] as const) expect(graph.relationships).toContainEqual(expect.objectContaining({ source, target, type: "contains", order, provenance: "explicit" }));
    expect(graph.relationships).toContainEqual(expect.objectContaining({ source: quiz, target: lesson, type: "assesses", provenance: "explicit" }));
    for (const target of ["document:programming/python-runtime-model", "document:programming/bfs-dfs-interview-patterns"]) expect(graph.relationships).toContainEqual(expect.objectContaining({ source: lesson, target, type: "requires", provenance: "explicit" }));
    for (const id of ["keypad-python313-mappings", "keypad-python313-product"]) for (const source of [lesson, quiz]) expect(graph.relationships).toContainEqual(expect.objectContaining({ source, target: "source:" + id, type: "cites", provenance: "explicit" }));
    expect(graph.unresolved.some(r => [lesson, quiz, unit].includes(r.resourceId))).toBe(false);
  });
  it.each([
    ["concurrency-boundaries","concurrency-boundary-checkpoint",4,["backend-python313-threading","backend-java17-thread-states","backend-java17-memory-model"]],
    ["pattern-selection-contracts","pattern-selection-checkpoint",5,["backend-fowler-polymorphism","backend-dotnet-di-lifetimes"]],
  ] as const)("exports scoped backend review %s",(slug,checkpoint,order,sources)=>{
    const graph=buildKnowledgeCatalog(freshContent()),lesson=`document:software-engineering/${slug}`,quiz=`exercise:software-engineering/${checkpoint}`,unit=`unit:backend-engineer-readiness:${order===4?"concurrency-boundaries":"pattern-selection"}`;
    for(const id of [lesson,quiz,unit])expect(graph.resources.find(r=>r.id===id)).toMatchObject({visibility:"curriculum",status:"published"});
    for(const [source,target,position]of [["path:backend-engineer-readiness",unit,order],[unit,lesson,0],[unit,quiz,1]] as const)expect(graph.relationships).toContainEqual(expect.objectContaining({source,target,type:"contains",order:position,provenance:"explicit"}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:quiz,target:lesson,type:"assesses",provenance:"explicit"}));
    const prerequisite=order===4?"document:programming/python-runtime-model":"document:software-engineering/concurrency-boundaries";
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:lesson,target:prerequisite,type:"requires",provenance:"explicit"}));
    for(const id of sources)for(const source of [lesson,quiz])expect(graph.relationships).toContainEqual(expect.objectContaining({source,target:"source:"+id,type:"cites",provenance:"explicit"}));
    expect(graph.unresolved.some(r=>[lesson,quiz,unit].includes(r.resourceId))).toBe(false);
  });
  it("exports video review with stable identities and explicit path/citation evidence", () => {
    const graph = buildKnowledgeCatalog(freshContent());
    const lesson = "document:system-design/video-delivery-boundaries", quiz = "exercise:system-design/video-delivery-checkpoint", unit = "unit:system-design-fundamentals:video-delivery";
    for (const id of [lesson, quiz, unit]) expect(graph.resources.find(r => r.id === id)).toMatchObject({visibility:"curriculum",status:"published"});
    for (const [source,target,order] of [["path:system-design-fundamentals",unit,9],[unit,lesson,0],[unit,quiz,1]] as const) expect(graph.relationships).toContainEqual(expect.objectContaining({source,target,type:"contains",provenance:"explicit",order}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:quiz,target:lesson,type:"assesses",provenance:"explicit"}));
    for (const target of ["document:system-design/cache-invalidation","document:software-engineering/product-interview-durable-generation-architecture"]) expect(graph.relationships).toContainEqual(expect.objectContaining({source:lesson,target,type:"requires",provenance:"explicit"}));
    for (const source of ["video-hls-rfc8216","video-eme-2017","video-android-drm","video-android-secure-window","video-netflix-browser-requirements"]) for (const parent of [lesson,quiz]) expect(graph.relationships).toContainEqual(expect.objectContaining({source:parent,target:"source:"+source,type:"cites",provenance:"explicit"}));
    expect(graph.unresolved.some(r=>[lesson,quiz].includes(r.resourceId))).toBe(false);
  });

  it("exports revocation sections and primary citations on the existing API resource", () => {
    const graph = buildKnowledgeCatalog(freshContent());
    const lesson = "document:system-design/cors-csrf-and-authorization";
    for (const heading of ["separate-token-validity-from-current-session-state", "trace-revocation-to-every-consumer", "review-the-revocation-window"]) expect(graph.resources.find(r => r.id === lesson + "#" + heading)).toMatchObject({kind:"section",visibility:"curriculum"});
    for (const source of ["token-jwt-owasp", "token-rest-owasp", "rfc-7009-revocation", "rfc-9700-refresh"]) {
      expect(graph.relationships).toContainEqual(expect.objectContaining({source:lesson,target:"source:"+source,type:"cites",provenance:"explicit"}));
      expect(graph.relationships).toContainEqual(expect.objectContaining({source:"exercise:system-design/api-boundary-checkpoint",target:"source:"+source,type:"cites",provenance:"explicit"}));
    }
    expect(graph.unresolved.some(r => r.resourceId === lesson)).toBe(false);
  });

  it("exports progressive state history without changing resource identity", () => {
    const graph = buildKnowledgeCatalog(freshContent());
    const lesson = "document:software-engineering/progressive-state-history", quiz = "exercise:software-engineering/progressive-state-checkpoint", unit = "unit:backend-engineer-readiness:progressive-state";
    expect(graph.resources.find(r => r.id === lesson)).toMatchObject({paths:["path:backend-engineer-readiness"],visibility:"curriculum",status:"published"});
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:"path:backend-engineer-readiness",target:unit,type:"contains",order:3,provenance:"explicit"}));
    for (const [order,target] of [lesson,quiz].entries()) expect(graph.relationships).toContainEqual(expect.objectContaining({source:unit,target,type:"contains",order,provenance:"explicit"}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:quiz,target:lesson,type:"assesses",provenance:"explicit"}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:lesson,target:"document:programming/python-runtime-model",type:"requires",provenance:"explicit"}));
    expect(graph.unresolved.some(r=>[lesson,quiz,unit].includes(r.resourceId))).toBe(false);
  });

  it("exports array-state review in the existing coding path", () => {
    const graph = buildKnowledgeCatalog(freshContent());
    const lesson = "document:programming/array-state-invariants", quiz = "exercise:programming/array-state-checkpoint", unit = "unit:coding-interview-pattern-practice:array-state-reviews";
    expect(graph.resources.find(resource => resource.id === lesson)).toMatchObject({ paths: ["path:coding-interview-pattern-practice"], visibility: "curriculum", status: "published" });
    expect(graph.relationships).toContainEqual(expect.objectContaining({ source: "path:coding-interview-pattern-practice", target: unit, type: "contains", order: 6, provenance: "explicit" }));
    for (const [order, target] of [lesson, quiz].entries()) expect(graph.relationships).toContainEqual(expect.objectContaining({ source: unit, target, type: "contains", order, provenance: "explicit" }));
    expect(graph.relationships).toContainEqual(expect.objectContaining({ source: quiz, target: lesson, type: "assesses", provenance: "explicit" }));
    expect(graph.relationships).toContainEqual(expect.objectContaining({ source: lesson, target: "document:programming/python-runtime-model", type: "requires", provenance: "explicit" }));
    expect(graph.unresolved.some(resource => [lesson, quiz, unit].includes(resource.resourceId))).toBe(false);
  });

  it("exports distributed readings with authored membership, prerequisites and citations", () => {
    const graph = buildKnowledgeCatalog(freshContent());
    const lesson = "document:system-design/distributed-reading-reviews", quiz = "exercise:system-design/distributed-reading-checkpoint", unit = "unit:system-design-fundamentals:distributed-readings";
    expect(graph.resources.find(resource => resource.id === lesson)).toMatchObject({ paths: ["path:system-design-fundamentals"], visibility: "curriculum", status: "published" });
    expect(graph.relationships).toContainEqual(expect.objectContaining({ source: "path:system-design-fundamentals", target: unit, type: "contains", order: 8, provenance: "explicit" }));
    for (const [order, target] of [lesson, quiz].entries()) expect(graph.relationships).toContainEqual(expect.objectContaining({ source: unit, target, type: "contains", order, provenance: "explicit" }));
    expect(graph.relationships).toContainEqual(expect.objectContaining({ source: quiz, target: lesson, type: "assesses", provenance: "explicit" }));
    for (const source of ["dynamo-sosp-2007", "raft-extended-2014", "tail-at-scale-2013"]) for (const resource of [lesson, quiz]) expect(graph.relationships).toContainEqual(expect.objectContaining({ source: resource, target: `source:${source}`, type: "cites", provenance: "explicit" }));
    for (const prerequisite of ["system-design/scaling-decision-worksheet", "software-engineering/product-interview-durable-generation-architecture"]) expect(graph.relationships).toContainEqual(expect.objectContaining({ source: lesson, target: `document:${prerequisite}`, type: "requires", provenance: "explicit" }));
    for (const section of ["name-the-quorum-members", "commitment-needs-more-than-a-copy-count", "measure-the-whole-fan-out"]) expect(graph.resources.find(resource => resource.id === `${lesson}#${section}`)?.paths).toEqual(["path:system-design-fundamentals"]);
    expect(graph.unresolved.some(resource => [lesson, quiz, unit].includes(resource.resourceId))).toBe(false);
  });

  it.each([
    ["review-conditional-writes-before-trusting-a-tag", ["rfc-http-preconditions", "rfc-6585-status-codes"]],
    ["bound-filtering-sorting-and-continuation", ["google-aip-160-filtering", "google-aip-158-pagination"]],
    ["name-the-resource-view-and-preserve-its-meaning", ["google-aip-157-partial-responses"]],
  ] as const)("exports the %s section without creating a competing curriculum identity", (section, sources) => {
    const graph = buildKnowledgeCatalog(freshContent());
    const lesson = "document:system-design/client-compatibility-contracts";
    const quiz = "exercise:system-design/client-compatibility-checkpoint";
    expect(graph.resources.find(resource => resource.id === `${lesson}#${section}`)).toMatchObject({ paths: ["path:system-design-fundamentals"], visibility: "curriculum", status: "published" });
    for (const source of sources) {
      expect(graph.resources.find(resource => resource.id === `source:${source}`)).toMatchObject({visibility:"curriculum",status:"published"});
      for (const resource of [lesson, quiz]) expect(graph.relationships).toContainEqual(expect.objectContaining({source:resource,target:`source:${source}`,type:"cites",provenance:"explicit"}));
    }
    expect(graph.unresolved.some(resource => [lesson,quiz].includes(resource.resourceId))).toBe(false);
  });

  it.each(["legalzoom-tsindex-navigation", "codebase-memory-v011-contracts"])("exports %s as cited bounded-retrieval evidence", (source) => {
    const graph = buildKnowledgeCatalog(freshContent());
    const lesson = "document:ai-engineering/evidence-first-agent-handoffs";
    expect(graph.resources.find(resource => resource.id === `source:${source}`)).toMatchObject({visibility:"curriculum",status:"published"});
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:lesson,target:`source:${source}`,type:"cites",provenance:"explicit"}));
    expect(graph.resources.find(resource => resource.id === `${lesson}#bound-retrieval-without-hiding-missing-evidence`)).toMatchObject({paths:["path:ai-engineering-langfuse-langchain"]});
    expect(graph.unresolved.some(resource => resource.resourceId === lesson)).toBe(false);
  });

  it.each([
    ["traffic-rate-contracts", "traffic-rate-checkpoint", "traffic-rate", 5, ["redis-rate-limiting-guide", "rfc-6585-status-codes"]],
    ["webhook-authenticity-and-replay", "webhook-authenticity-checkpoint", "webhook-authenticity", 6, ["stripe-webhook-contracts", "python-hmac-verification"]],
  ] as const)("exports %s as explicit scoped practice", (slug, checkpoint, unit, order, sources) => {
    const graph = buildKnowledgeCatalog(freshContent());
    const lesson = `document:system-design/${slug}`, quiz = `exercise:system-design/${checkpoint}`, uid = `unit:system-design-fundamentals:${unit}`;
    expect(graph.resources.find(r => r.id === lesson)).toMatchObject({paths:["path:system-design-fundamentals"],status:"published"});
    for (const source of sources) for (const resource of [lesson,quiz]) expect(graph.relationships).toContainEqual(expect.objectContaining({source:resource,target:`source:${source}`,type:"cites",provenance:"explicit"}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:quiz,target:lesson,type:"assesses",provenance:"explicit"}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:"path:system-design-fundamentals",target:uid,type:"contains",order,provenance:"explicit"}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:uid,target:lesson,type:"contains",order:0,provenance:"explicit"}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:uid,target:quiz,type:"contains",order:1,provenance:"explicit"}));
    const prerequisites = slug === "traffic-rate-contracts" ? ["system-design/scaling-decision-worksheet"] : ["system-design/cors-csrf-and-authorization", "software-engineering/product-interview-durable-generation-architecture"];
    for (const prerequisite of prerequisites) expect(graph.relationships).toContainEqual(expect.objectContaining({source:lesson,target:`document:${prerequisite}`,type:"requires",provenance:"explicit"}));
    expect(graph.unresolved.some(r => [lesson,quiz,uid].includes(r.resourceId))).toBe(false);
  });

  it("preserves authored client compatibility sources, prerequisites and ordered path placement", () => {
    const graph = buildKnowledgeCatalog(freshContent());
    const lesson = "document:system-design/client-compatibility-contracts";
    const quiz = "exercise:system-design/client-compatibility-checkpoint";
    expect(graph.resources.find(r => r.id === lesson)).toMatchObject({paths:["path:system-design-fundamentals"],status:"published"});
    for (const target of ["source:duolingo-server-driven-ui", "source:google-aip-180-compatibility"]) {
      expect(graph.relationships).toContainEqual(expect.objectContaining({source:lesson,target,type:"cites",provenance:"explicit"}));
      expect(graph.relationships).toContainEqual(expect.objectContaining({source:quiz,target,type:"cites",provenance:"explicit"}));
    }
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:quiz,target:lesson,type:"assesses",provenance:"explicit"}));
    expect(graph.unresolved.some(r => [lesson, quiz, "unit:system-design-fundamentals:client-compatibility"].includes(r.resourceId))).toBe(false);
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:lesson,target:"document:system-design/cache-invalidation",type:"requires",provenance:"explicit"}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:"path:system-design-fundamentals",target:"unit:system-design-fundamentals:client-compatibility",type:"contains",order:4,provenance:"explicit"}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:"unit:system-design-fundamentals:client-compatibility",target:lesson,type:"contains",order:0,provenance:"explicit"}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:"unit:system-design-fundamentals:client-compatibility",target:"exercise:system-design/client-compatibility-checkpoint",type:"contains",order:1,provenance:"explicit"}));
  });

  it("relates coding-pattern units to existing question identities and preserves graph-traversal membership", () => {
    const graph = buildKnowledgeCatalog(freshContent());
    const path = "path:coding-interview-pattern-practice";
    const unit = "unit:coding-interview-pattern-practice:foundations";
    const question = "interview-question:amazon/two-sum-product-pair";
    expect(graph.resources.find(resource => resource.id === path)).toMatchObject({ kind: "path", status: "published" });
    expect(graph.relationships).toContainEqual(expect.objectContaining({ source: path, target: unit, type: "contains", order: 0, provenance: "explicit" }));
    expect(graph.relationships).toContainEqual(expect.objectContaining({ source: unit, target: question, type: "contains", order: 0, provenance: "explicit" }));
    expect(graph.resources.filter(resource => resource.id === question)).toHaveLength(1);
    expect(graph.resources.find(resource => resource.id === question)?.paths).toContain(path);
    expect(graph.resources.find(resource => resource.id === "document:programming/bfs-dfs-fundamentals")?.paths).toEqual(expect.arrayContaining([path, "path:breadth-first-and-depth-first-search"]));
    const pattern = validatedIndex.learningPaths.find(resource => resource.slug === "coding-interview-pattern-practice")!;
    expect(graph.relationships.filter(edge => edge.source.startsWith("unit:coding-interview-pattern-practice:") && edge.type === "contains")).toHaveLength(26);
    for (const unit of pattern.units) for (const [order, node] of unit.nodes.entries()) {
      const target = `${node.kind === "interview" ? "interview-question" : node.kind}:${node.slug}`;
      expect(graph.relationships).toContainEqual(expect.objectContaining({ source: `unit:coding-interview-pattern-practice:${unit.slug}`, target, type: "contains", order, provenance: "explicit" }));
      expect(graph.resources.find(resource => resource.id === target)?.paths).toContain(path);
    }
    expect(graph.unresolved.some(reference => reference.resourceId.startsWith(path) || reference.resourceId.startsWith("unit:coding-interview-pattern-practice:"))).toBe(false);
  });

  it.each([
    ["document:ai-engineering/evidence-first-agent-handoffs", "source:ulfaslak-architecture-cleanse", "path:ai-engineering-langfuse-langchain"],
    ["document:ml-systems/ml-workflow", "source:ml-system-case-study-index", "path:ml-systems-engineer"],
  ])("retains %s identity and adds its reading citation", (document, source, path) => {
    const graph = buildKnowledgeCatalog(freshContent());
    expect(graph.resources.find(r => r.id === document)?.paths).toContain(path);
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:document,target:source,type:"cites",provenance:"explicit"}));
    expect(graph.resources.find(r => r.id === source)).toMatchObject({kind:"source",visibility:"curriculum"});
    expect(graph.unresolved.some(r => r.resourceId === document && r.reference === source)).toBe(false);
  });

  it("links the optional agent research reference to its existing path with explicit order", () => {
    const graph = buildKnowledgeCatalog(freshContent());
    const source = "source:stanford-cs329a-autumn-2025";
    const path = "path:ai-engineering-langfuse-langchain";
    const unit = "unit:ai-engineering-langfuse-langchain:advanced-agent-research";
    expect(graph.resources.find(r => r.id === source)).toMatchObject({kind:"source",paths:[path],visibility:"curriculum"});
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:path,target:unit,type:"contains",order:8,provenance:"explicit"}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:unit,target:source,type:"contains",order:0,provenance:"explicit"}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:path,target:source,type:"cites",provenance:"explicit"}));
    expect(graph.resources.some(r => r.id === "document:ai-engineering/stanford-self-improving-agents")).toBe(false);
    expect(graph.unresolved.some(r => [source,unit,path].includes(r.resourceId))).toBe(false);
  });

  it("keeps room-date practice inside the existing reservation resource and paths", () => {
    const graph = buildKnowledgeCatalog(freshContent());
    const lesson = "document:system-design/fair-admission-and-reservations";
    const quiz = "exercise:system-design/reservation-boundary-checkpoint";
    expect(graph.resources.find(r => r.id === lesson)?.paths).toEqual(expect.arrayContaining(["path:system-design-fundamentals", "path:backend-engineer-readiness"]));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:quiz,target:lesson,type:"assesses",provenance:"explicit"}));
    for (const source of ["postgresql-17-ranges", "postgresql-17-btree-gist", "postgresql-17-exclusion", "postgresql-17-date-functions"]) {
      for (const resource of [lesson, quiz]) {
        expect(graph.relationships).toContainEqual(expect.objectContaining({source:resource,target:`source:${source}`,type:"cites",provenance:"explicit"}));
      }
    }
    expect(graph.unresolved.some(r => [lesson, quiz].includes(r.resourceId))).toBe(false);
  });
  it("keeps routing order, prerequisite and delivery citations explicit", () => {
    const graph = buildKnowledgeCatalog(freshContent());
    const lesson = "document:system-design/routing-decision-lab";
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:"unit:system-design-fundamentals:routing-decisions",target:lesson,type:"contains",order:0,provenance:"explicit"}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:"unit:system-design-fundamentals:routing-decisions",target:"exercise:system-design/routing-decision-checkpoint",type:"contains",order:1,provenance:"explicit"}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:lesson,target:"document:system-design/scaling-decision-worksheet",type:"requires",provenance:"explicit"}));
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:lesson,target:"source:nginx-upstream-routing",type:"cites",provenance:"explicit"}));
    for (const source of ["kafka-41-delivery-design", "redis-pubsub-delivery", "redis-stream-ack", "redis-stream-autoclaim"]) {
      expect(graph.relationships).toContainEqual(expect.objectContaining({source:"document:software-engineering/product-interview-durable-generation-architecture",target:`source:${source}`,type:"cites",provenance:"explicit"}));
    }
    expect(graph.unresolved.some(r => r.resourceId === lesson)).toBe(false);
  });
  it("keeps handoff prerequisites and ordered path membership explicit", async () => {
    const graph = buildKnowledgeCatalog(freshContent());
    const lesson = "document:ai-engineering/evidence-first-agent-handoffs";
    const prerequisite = "document:ai-engineering/langchain-agents-langgraph-operations";
    expect(graph.relationships).toContainEqual(expect.objectContaining({
      source:lesson,target:prerequisite,type:"requires",provenance:"explicit",
    }));
    expect(graph.relationships).toContainEqual(expect.objectContaining({
      source:"unit:ai-engineering-langfuse-langchain:evidence-first-handoffs",
      target:lesson,type:"contains",order:0,provenance:"explicit",
    }));
    expect(graph.relationships).toContainEqual(expect.objectContaining({
      source:"unit:ai-engineering-langfuse-langchain:evidence-first-handoffs",
      target:"exercise:ai-engineering/agent-handoff-checkpoint",type:"contains",order:1,
    }));
    expect(graph.unresolved.some(r => r.resourceId === lesson)).toBe(false);
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
    expect(graph.relationships).toContainEqual(expect.objectContaining({source:"unit:ml-systems-engineer:volume-one-build",target:id,type:"contains",order:5}));
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
