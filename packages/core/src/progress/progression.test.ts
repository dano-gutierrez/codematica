import { describe, expect, it } from "vitest";
import { calculateStageProgress, isStageStampEligible } from "./progression";
import type { LearningStage } from "../content/schema";

const stage: LearningStage = {
  id: "first-connections",
  label: "First Connections",
  proficiencyLevel: "a1",
  summary: "Complete familiar exchanges in short concrete beginner situations.",
  unitSlugs: ["first-connections"],
  canDos: [
    { id: "listen", statement: "I can understand a slowly spoken familiar detail.", skill: "listening" },
    { id: "read", statement: "I can read a short familiar beginner exchange.", skill: "reading" },
    { id: "write", statement: "I can write a very short familiar personal message.", skill: "writing" },
    { id: "interact", statement: "I can complete a short rehearsed everyday exchange.", skill: "interaction" },
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
    expect(isStageStampEligible(stage, { completedNodeSlugs: completed, checkpointScore: 0.85, skillScores: { listening: 0.7, reading: 0.8, writing: 0.6, interaction: 0.9 } })).toBe(true);
    expect(isStageStampEligible(stage, { completedNodeSlugs: completed, checkpointScore: 0.85, skillScores: { listening: 0.5, reading: 0.8, writing: 0.9, interaction: 0.9 } })).toBe(false);
  });
});
