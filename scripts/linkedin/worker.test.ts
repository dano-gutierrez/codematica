import { describe, expect, it } from "vitest";
import { analysisFixture, editorialFixture } from "../../packages/core/src/test/linkedin-fixture";
import { createPublishArguments, prepareRefinement, validateSeed } from "./worker";
describe("local LinkedIn worker boundaries", () => {
  it("only publishes the exact approved revision to the configured channel", () => {
    const post = { ...editorialFixture.posts[0], status: "approved" as const, approved_revision_id: editorialFixture.revisions[0].id };
    expect(createPublishArguments(post, editorialFixture.revisions[0], { ...editorialFixture.settings, publishing_enabled: true, buffer_channel_id: "personal" })).toEqual({ channelId: "personal", text: editorialFixture.revisions[0].body, schedulingType: "automatic", mode: "addToQueue" });
    expect(() => createPublishArguments(editorialFixture.posts[0], editorialFixture.revisions[0], editorialFixture.settings)).toThrow();
    expect(() => createPublishArguments(post, { ...editorialFixture.revisions[0], id: "another" }, { ...editorialFixture.settings, publishing_enabled: true, buffer_channel_id: "personal" })).toThrow();
  });
  it("validates all analysis sections and binds them to a fixed prompt hash", () => {
    const result = prepareRefinement(analysisFixture, "fixed prompt");
    expect(result.promptHash).toHaveLength(64);
    expect(result.analysis.rewrittenPost).toBe(analysisFixture.rewrittenPost);
    expect(() => prepareRefinement({ ...analysisFixture, alternativeHooks: [] }, "prompt")).toThrow();
  });
  it("rejects duplicate or unsourced seed posts before touching the database", () => {
    const post = { seed_key: "one", title: "Retries", topic: "Reliability", body: "Retries add load", first_comment: "", sources: editorialFixture.revisions[0].sources };
    expect(validateSeed([post])).toHaveLength(1);
    expect(() => validateSeed([post, post])).toThrow(/Duplicate/);
    expect(() => validateSeed([{ ...post, sources: [] }])).toThrow();
  });
});
