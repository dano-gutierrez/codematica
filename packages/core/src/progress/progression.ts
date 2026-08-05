import type { LanguageSkill, LearningStage } from "../content/schema";

export function calculateStageProgress(stage: LearningStage, completedNodeSlugs: ReadonlySet<string>) {
  const completed = stage.requiredNodeSlugs.filter((slug) => completedNodeSlugs.has(slug)).length;
  const total = stage.requiredNodeSlugs.length;
  return { completed, total, percentage: total ? Math.round((completed / total) * 100) : 0 };
}

export function isStageStampEligible(
  stage: LearningStage,
  input: {
    completedNodeSlugs: ReadonlySet<string>;
    checkpointScore: number;
    skillScores?: Partial<Record<LanguageSkill, number>>;
  },
) {
  const completion = calculateStageProgress(stage, input.completedNodeSlugs);
  if (completion.completed !== completion.total || input.checkpointScore < stage.passThreshold) return false;
  if (stage.minimumSkillScore === undefined) return true;

  const assessedSkills = new Set(stage.canDos.map((canDo) => canDo.skill));
  return [...assessedSkills].every((skill) => (input.skillScores?.[skill] ?? 0) >= stage.minimumSkillScore!);
}
