// @vitest-environment node
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { analysisFixture, editorialFixture } from "../../packages/core/src/test/linkedin-fixture";
import { createLocalModels, localEndpoint, sourceIssues } from "./local-models";
import { digest, assembleCandidate, localDraftSchema } from "./preparation";
import { withInferenceLock } from "./inference";
vi.mock("./inference", () => ({ withInferenceLock: vi.fn(async (run: () => Promise<unknown>) => run()) }));

describe("local model boundary", () => {
  it("permits only literal loopback origins, preventing credential or remote fallbacks", () => {
    expect(localEndpoint("http://127.0.0.1:8791")).toBe("http://127.0.0.1:8791");
    expect(localEndpoint("http://[::1]:8791")).toBe("http://[::1]:8791");
    for (const value of ["https://127.0.0.1", "http://localhost", "http://example.test", "http://user:secret@127.0.0.1", "http://127.0.0.1/path", "http://127.0.0.1?q=1", "http://127.0.0.1#secret"]) expect(() => localEndpoint(value)).toThrow();
  });
  it("checks both services and validates evaluator and writer payloads", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}"));
    request.mockImplementation(async (url) => new Response(JSON.stringify(String(url).endsWith("systemone") ? { answers: { safe: { noul: 0.9 } } } : String(url).endsWith("completions") ? { choices: [{ finish_reason: "stop", message: { content: '```json\n' + JSON.stringify({ ...analysisFixture, firstComment: analysisFixture.postingPlan.firstComment }) + '\n```' } }] } : {})));
    const models = createLocalModels("http://127.0.0.1:1", "http://127.0.0.1:2", request);
    await models.ready(); expect(request.mock.calls.map(([url]) => url)).toEqual(["http://127.0.0.1:1/readyz", "http://127.0.0.1:2/v1/models"]);
    expect(await models.evaluate({}, { safe: { type: "noul", instructions: "Safe?" } })).toEqual({safe:{noul:0.9}});
    expect(await models.write({ instructions: "Write" })).toEqual([assembleCandidate(localDraftSchema.parse({ ...analysisFixture, firstComment: analysisFixture.postingPlan.firstComment }))]);
    expect(request.mock.calls.every(([, args]) => args?.redirect === "error")).toBe(true);
    expect(withInferenceLock).toHaveBeenCalledTimes(2);
    const body = JSON.parse(String(request.mock.calls.at(-1)?.[1]?.body));
    expect(body.model).toBe("default_model");
    expect(body.chat_template_kwargs.enable_thinking).toBe(false);
    expect(body.messages[0].content).toContain("untrusted data");
  });
  it("fails closed on unavailable models, malformed JSON, and truncated generation", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", {status:503}));
    const models = createLocalModels("http://127.0.0.1:1", "http://127.0.0.1:2", request);
    await expect(models.ready()).rejects.toThrow("503");
    request.mockImplementation(async () => new Response(JSON.stringify({ choices: [{ finish_reason: "length", message: { content: "[]" } }] })));
    await expect(models.write({instructions:"Write"})).rejects.toThrow("incomplete");
    request.mockImplementation(async () => new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: "not JSON" } }] })));
    await expect(models.write({instructions:"Write"})).rejects.toThrow();
    request.mockImplementation(async () => new Response('{"answers":{"safe":{"noul":"yes"}}}'));
    await expect(models.evaluate({}, {})).rejects.toThrow();
  });
  it("checks source hashes/excerpts and prevents traversal, missing files, and symlink escapes", async () => {
    const root = await mkdtemp(join(tmpdir(),"linkedin-sources-"));
    try {
      await mkdir(join(root,"content")); await writeFile(join(root,"content/source.md"),"A canonical paragraph."); await writeFile(join(root,"secret"),"never read");
      await symlink(join(root,"secret"),join(root,"content/escape.md"));
      const source = { ...editorialFixture.revisions[0].sources[0], path:"content/source.md", excerpt:"canonical", hash:digest("A canonical paragraph.") };
      expect(await sourceIssues(root,{...editorialFixture.revisions[0],sources:[source]})).toEqual([]);
      expect(await sourceIssues(root,{...editorialFixture.revisions[0],sources:[{...source,hash:"wrong"}]})).toEqual([expect.stringContaining("Source changed")]);
      expect(await sourceIssues(root,{...editorialFixture.revisions[0],sources:[{...source,excerpt:"fabricated"}]})).toEqual([expect.stringContaining("excerpt")]);
      for (const path of ["secret","content/escape.md","content/missing.md"]) expect(await sourceIssues(root,{...editorialFixture.revisions[0],sources:[{...source,path}]})).toEqual([expect.stringContaining("Cannot verify")]);
    } finally { await rm(root,{recursive:true,force:true}); }
  });
});

it("caches identical local work privately while changed inputs get a fresh evaluation", async () => {
  const { cachedModels } = await import("./local-models");
  const root = await mkdtemp(join(tmpdir(),"linkedin-cache-"));
  try {
    const write = vi.fn().mockResolvedValue([analysisFixture]); const evaluate = vi.fn().mockResolvedValue({safe:{noul:0.9}});
    const models = cachedModels({write,evaluate},root);
    await models.write({body:"one"}); await models.write({body:"one"}); expect(write).toHaveBeenCalledTimes(1);
    await models.write({body:"two"}); expect(write).toHaveBeenCalledTimes(2);
    await models.evaluate({body:"one"},{safe:{type:"noul",instructions:"Safe?"}});
    await models.evaluate({body:"one"},{safe:{type:"noul",instructions:"Safe?"}}); expect(evaluate).toHaveBeenCalledTimes(1);
    const fresh = cachedModels({write,evaluate},root);
    await fresh.write({body:"one"}); expect(write).toHaveBeenCalledTimes(2);
  } finally { await rm(root,{recursive:true,force:true}); }
});
