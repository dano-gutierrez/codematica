import type { EditorialSnapshot, LinkedInAnalysis } from "../linkedin";
const score = { score: 7, justification: "The lesson is concrete." };
export const analysisFixture: LinkedInAnalysis = {
  diagnosis: { hook: score, clarity: score, value: score, storytelling: score, readability: score, authenticity: score, cta: score, algorithm: score },
  coreIdea: "Retries need a budget.", rewrittenPost: "A retry is more work for an already struggling dependency. Set a retry budget.",
  alternativeHooks: ["Retries are load.", "A timeout is not proof of failure.", "Budget your retries."],
  keyChanges: ["Clarified the tradeoff", "Added a practical action", "Removed jargon"],
  postingPlan: { format: "Text", timing: "Use Buffer recommended slots", firstComment: "Source: https://aws.amazon.com/builders-library/", hashtags: [], engagementActions: ["Reply to relevant questions"] },
  visualOutline: [], verificationNotes: [], assumptions: "Audience: practicing engineers", toolsUsed: ["Repository source review"],
};
export const editorialFixture: EditorialSnapshot = {
  posts: [{ id: "10000000-0000-4000-8000-000000000001", seed_key: "test-1", title: "Retries need a budget", topic: "Reliability", status: "review", current_revision_id: "20000000-0000-4000-8000-000000000001", approved_revision_id: null, approved_at: null, created_at: "2026-09-29T00:00:00Z", updated_at: "2026-09-29T00:00:00Z" }],
  revisions: [{ id: "20000000-0000-4000-8000-000000000001", post_id: "10000000-0000-4000-8000-000000000001", parent_revision_id: null, kind: "initial", body: "A retry adds load. Set a retry budget before retrying failures.", first_comment: "Read the source", sources: [{ path: "content/knowledge/test.md", hash: "abc", title: "Retries", excerpt: "Retries increase load.", urls: ["https://aws.amazon.com/builders-library/"] }], analysis: null, facts_confirmed: false, prompt_hash: null, created_at: "2026-09-29T00:00:00Z" }],
  jobs: [], publications: [], settings: { author_context: "Practicing engineers", buffer_channel_id: null, buffer_organization_id: null, publishing_enabled: false, timezone: "America/Los_Angeles", worker_last_seen: null, worker_message: null },
};
