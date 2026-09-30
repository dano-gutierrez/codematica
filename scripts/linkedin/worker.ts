import { createHash } from "node:crypto";
import { z } from "zod";
import { analysisSchema, canApprove, postTextSchema, sourceSchema, type EditorialSnapshot, type LinkedInPost, type LinkedInRevision } from "../../packages/core/src/linkedin";

export const seedPostSchema = z.object({ seed_key: z.string().min(1), title: z.string().min(1), topic: z.string().min(1), body: postTextSchema, first_comment: z.string().max(1248), sources: z.array(sourceSchema).min(1) });
export function validateSeed(input: unknown) {
  const posts = z.array(seedPostSchema).min(1).parse(input);
  if (new Set(posts.map((p) => p.seed_key)).size !== posts.length || new Set(posts.map((p) => p.body)).size !== posts.length) throw new Error("Duplicate seed keys or post bodies");
  return posts;
}
export function prepareRefinement(input: unknown, prompt: string) {
  return { analysis: analysisSchema.parse(input), promptHash: createHash("sha256").update(prompt).digest("hex") };
}
export function createPublishArguments(post: LinkedInPost, revision: LinkedInRevision, settings: EditorialSnapshot["settings"]) {
  if (!settings.publishing_enabled || !settings.buffer_channel_id || post.status !== "approved" || post.approved_revision_id !== revision.id || post.id !== revision.post_id || !canApprove(revision, post.origin === "manual")) throw new Error("The exact revision must be approved and publishing enabled");
  return { channelId: settings.buffer_channel_id, text: revision.body, schedulingType: "automatic" as const, mode: "addToQueue" as const };
}
export const publicationResultSchema = z.object({ status: z.enum(["scheduled", "sent", "error", "cancelled"]), buffer_id: z.string().min(1), scheduled_at: z.iso.datetime({ offset: true }).nullable().optional(), sent_at: z.iso.datetime({ offset: true }).nullable().optional(), url: z.url({ protocol: /^https?$/ }).nullable().optional(), error: z.string().nullable().optional() });
