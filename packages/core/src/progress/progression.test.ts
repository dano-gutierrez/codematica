import { describe, expect, it } from "vitest";
import { calculateStageProgress, isStageStampEligible } from "./progression";
import type { LearningStage } from "../content/schema";

const stage: LearningStage = {
  id: "first-connections",
  label: "First Connections",
  level: "A1",
  status: "published",
  summary: "Complete familiar exchanges in short concrete beginner situations.",
  unitSlugs: ["first-connections"],
  outcomes: [
    { id: "listen", statement: "I can understand a slowly spoken familiar detail.", skillId: "a1-listening" },
    { id: "read", statement: "I can read a short familiar beginner exchange.", skillId: "a1-reading" },
    { id: "write", statement: "I can write a very short familiar personal message.", skillId: "a1-writing" },
    { id: "interact", statement: "I can complete a short rehearsed everyday exchange.", skillId: "a1-interaction" },
  ],
  requiredNodeSlugs: ["languages/lesson", "languages/checkpoint"],
  checkpointExerciseSlug: "languages/checkpoint",
  passThreshold: 0.8,
  minimumSkillScore: 0.6,
  estimatedMinutes: 120,
};

describe("learning stage progress", () => {
  it("calculates completion without locking open lessons", () => {
    expect(calculateStageProgress(stage, new Set(["languages/lesson"]))).toEqual({ completed: 1, total: 2, percentage: 50 });
  });

  it("awards a stamp only after requirements, checkpoint, and strand floor", () => {
    const completed = new Set(stage.requiredNodeSlugs);
    expect(isStageStampEligible(stage, { completedNodeSlugs: completed, skillScores: { "a1-listening": 0.7, "a1-reading": 0.8, "a1-writing": 0.6, "a1-interaction": 0.9 } })).toBe(true);
    expect(isStageStampEligible(stage, { completedNodeSlugs: completed, skillScores: { "a1-listening": 0.5, "a1-reading": 0.8, "a1-writing": 0.9, "a1-interaction": 0.9 } })).toBe(false);
  });

  it("handles empty stages and every early eligibility boundary", () => {
    expect(calculateStageProgress({ ...stage, requiredNodeSlugs: [] }, new Set())).toEqual({ completed: 0, total: 0, percentage: 0 });
    expect(isStageStampEligible(stage, { completedNodeSlugs: new Set(), skillScores: { "a1-listening": 1 } })).toBe(false);
    expect(isStageStampEligible(stage, { completedNodeSlugs: new Set(stage.requiredNodeSlugs), skillScores: { "a1-listening": 0.59, "a1-reading": 0.79, "a1-writing": 0.79, "a1-interaction": 0.79 } })).toBe(false);
    expect(isStageStampEligible({ ...stage, minimumSkillScore: undefined }, { completedNodeSlugs: new Set(stage.requiredNodeSlugs), skillScores: { "a1-listening": 0.8, "a1-reading": 0.8, "a1-writing": 0.8, "a1-interaction": 0.8 } })).toBe(true);
    expect(isStageStampEligible(stage, { completedNodeSlugs: new Set(stage.requiredNodeSlugs), skillScores: { "a1-listening": 1 } })).toBe(false);
    expect(isStageStampEligible({ ...stage, status: "planned" }, { completedNodeSlugs: new Set(stage.requiredNodeSlugs), skillScores: { "a1-listening": 1, "a1-reading": 1, "a1-writing": 1, "a1-interaction": 1 } })).toBe(false);
  });
});
