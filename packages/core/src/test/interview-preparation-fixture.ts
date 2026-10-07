import type { InterviewBrief } from "../interview-preparation";
const hash = "a".repeat(64);
export const sampleBrief: InterviewBrief = {
  opportunityId: "11111111-1111-4111-8111-111111111111", opportunityVersion: 1, profileVersion: 1,
  sections: { company: "Example makes tools. Business status needs verification.", fit: "Use the supplied project story.", likelyQuestions: "How would you bound retries?", questionsToAsk: "Who buys the product? What differentiates it from competitors?", studyPlan: "Practice the existing durable-jobs lesson.", uncertainty: "These are predicted questions, not reported questions." },
  sources: [{ title: "Company", url: "https://example.com", verifiedAt: "2026-10-03", kind: "primary" }],
  resources: [], knowledge: { status: "pending", warnings: ["Local evaluation unavailable"] },
  editing: { skill: "technical-edit", skillHash: hash, draftHash: hash, editedHash: hash, compared: true },
};
