import type { LearningStage } from "../content/schema";

export function calculateStageProgress(stage: LearningStage, completedNodeSlugs: ReadonlySet<string>) {
  const completed = stage.requiredNodeSlugs.filter((slug) => completedNodeSlugs.has(slug)).length;
  const total = stage.requiredNodeSlugs.length;
  return { completed, total, percentage: total ? Math.round((completed / total) * 100) : 0 };
}

export function isStageStampEligible(
  stage: LearningStage,
  input: {
    completedNodeSlugs: ReadonlySet<string>;
    skillScores?: Readonly<Record<string, number>>;
  },
) {
  if (stage.status !== "published" || stage.passThreshold === undefined) return false;
  const completion = calculateStageProgress(stage, input.completedNodeSlugs);
  if (completion.total === 0 || completion.completed !== completion.total) return false;

  const assessedSkills = [...new Set(stage.outcomes.map((outcome) => outcome.skillId))];
  if (assessedSkills.length === 0) return false;
  const scores = assessedSkills.map((skillId) => input.skillScores?.[skillId]);
  if (scores.some((score) => score === undefined)) return false;
  const numericScores = scores as number[];
  const requiredSkillScore = stage.minimumSkillScore ?? stage.passThreshold;
  const passingSkills = numericScores.filter((score) => score >= requiredSkillScore).length;
  return passingSkills / numericScores.length >= stage.passThreshold;
}
