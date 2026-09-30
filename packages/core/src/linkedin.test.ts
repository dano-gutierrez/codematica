import { describe, expect, it, vi } from "vitest";
import { analysisSchema, canApprove, createEditorialClient, filterPosts, postTextSchema, snapshotSchema } from "./linkedin";

const revision = { body: "A practical lesson", analysis: null, facts_confirmed: false };
describe("LinkedIn editorial contract", () => {
  it("rejects empty, oversized and unresolved placeholder text", () => {
    expect(postTextSchema.safeParse("   ").success).toBe(false);
    expect(postTextSchema.safeParse("x".repeat(3001)).success).toBe(false);
    expect(canApprove({ ...revision, body: "We saved [ADD: metric]" })).toBe(false);
    expect(canApprove(revision)).toBe(true);
  });
  it("requires complete diagnosis and exactly three alternative hooks", () => {
    expect(analysisSchema.safeParse({ rewrittenPost: "invented" }).success).toBe(false);
  });
  it("does not accept malformed database snapshots", () => {
    expect(snapshotSchema.safeParse({ posts: [] }).success).toBe(false);
  });
  it("uses authenticated RPCs and exposes denied access without falling back", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
    expect(await createEditorialClient({ rpc }).isAdmin()).toBe(false);
    expect(rpc).toHaveBeenCalledWith("linkedin_is_admin", {});
    rpc.mockResolvedValue({ data: null, error: { message: "Admin access required" } });
    await expect(createEditorialClient({ rpc }).snapshot()).rejects.toThrow("Admin access required");
  });
  it("sends the expected revision for every action", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    await createEditorialClient({ rpc }).review("post", "revision", "approve");
    expect(rpc).toHaveBeenCalledWith("linkedin_review", { p_post_id: "post", p_expected_revision: "revision", p_action: "approve" });
  });
  it("filters using topic, title and review status", () => {
    const posts = [{ id: "1", title: "Cache stampedes", topic: "Reliability", status: "review" }, { id: "2", title: "Indexes", topic: "Databases", status: "approved" }];
    expect(filterPosts(posts, "cache", "all", "all")).toEqual([posts[0]]);
    expect(filterPosts(posts, "", "Databases", "approved")).toEqual([posts[1]]);
    expect(filterPosts(posts, "", "Reliability", "approved")).toEqual([]);
  });
});

it("requires analyzed manual revisions and counts styled letters as two units", () => {
  expect(canApprove({ ...revision, prompt_hash: null }, true)).toBe(false);
  expect(canApprove({ ...revision, analysis: { verificationNotes: [] }, prompt_hash: "hash" }, true)).toBe(true);
  expect(canApprove({ ...revision, analysis: { verificationNotes: ["Verify"] }, prompt_hash: "hash" }, true)).toBe(false);
  expect(postTextSchema.safeParse("𝗔".repeat(1501)).success).toBe(false);
});
it("validates manual creation and passes the retry identity to its atomic RPC", async () => {
  const rpc = vi.fn().mockResolvedValue({ data: "10000000-0000-4000-8000-000000000001", error: null });
  const client = createEditorialClient({ rpc });
  await client.create("request-key", { title: " Lesson ", topic: " Systems ", body: " Hello " });
  expect(rpc).toHaveBeenCalledWith("linkedin_create", { p_request_key: "request-key", p_title: "Lesson", p_topic: "Systems", p_body: "Hello" });
  expect(() => client.create("request-key", { title: "", topic: "Systems", body: "Hello" })).toThrow();
});
