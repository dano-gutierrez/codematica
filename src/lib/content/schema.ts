import { z } from "zod";

export const difficultySchema = z.enum(["foundation", "practitioner", "senior", "principal"]);

export const contentStatusSchema = z.enum(["draft", "published", "planned"]);

const slugSchema = z
  .string()
  .min(3)
  .regex(/^[a-z0-9]+(?:[/-][a-z0-9]+)*$/, "Use lowercase slugs with / or - separators.");

export const knowledgeFrontmatterSchema = z.object({
  title: z.string().min(4),
  slug: slugSchema,
  summary: z.string().min(20),
  track: z.string().min(2),
  topic: z.string().min(2),
  difficulty: difficultySchema,
  tags: z.array(z.string().min(2)).min(1),
  prerequisites: z.array(z.string().min(2)).default([]),
  diagramRefs: z.array(slugSchema).default([]),
  caseStudyFlowRef: slugSchema.optional(),
  status: contentStatusSchema.default("draft"),
});

export const learningPathKindSchema = z.enum(["role", "skill"]);

export const learningPathNodeSchema = z.object({
  kind: z.enum(["document", "diagram", "exercise", "interview"]),
  slug: slugSchema,
});

export const learningPathUnitSchema = z.object({
  slug: slugSchema,
  title: z.string().min(4),
  summary: z.string().min(20),
  nodes: z.array(learningPathNodeSchema).min(1),
});

export const learningPathFileSchema = z.object({
  slug: slugSchema,
  title: z.string().min(4),
  summary: z.string().min(20),
  kind: learningPathKindSchema,
  category: z.string().min(2),
  audience: z.string().min(10),
  status: contentStatusSchema.default("draft"),
  units: z.array(learningPathUnitSchema).min(1),
});

const exerciseBaseSchema = z.object({
  slug: slugSchema,
  title: z.string().min(4),
  documentSlug: slugSchema,
  concept: z.string().min(2),
  difficulty: difficultySchema,
  tags: z.array(z.string().min(2)).min(1),
  status: contentStatusSchema.default("draft"),
});

const questionIdSchema = z
  .string()
  .min(2)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase question IDs with - separators.");

export const flashcardExerciseFileSchema = exerciseBaseSchema.extend({
  type: z.literal("flashcard"),
  prompt: z.string().min(10),
  answer: z.string().min(2),
  explanation: z.string().min(10),
});

export const clozeExerciseFileSchema = exerciseBaseSchema.extend({
  type: z.literal("cloze"),
  prompt: z.string().min(10),
  template: z.string().min(10),
  acceptedAnswers: z.array(z.string().min(1)).min(1),
  explanation: z.string().min(10),
});

const questionBaseSchema = z.object({
  id: questionIdSchema,
  prompt: z.string().min(10),
  explanation: z.string().min(10),
});

export const choiceQuestionSchema = questionBaseSchema.extend({
  kind: z.literal("choice"),
  options: z
    .array(
      z.object({
        id: questionIdSchema,
        label: z.string().min(2),
        isCorrect: z.boolean(),
      }),
    )
    .min(2),
});

export const questionnaireClozeQuestionSchema = questionBaseSchema.extend({
  kind: z.literal("cloze"),
  template: z.string().min(10),
  acceptedAnswers: z.array(z.string().min(1)).min(1),
});

export const orderingQuestionSchema = questionBaseSchema.extend({
  kind: z.literal("ordering"),
  items: z
    .array(
      z.object({
        id: questionIdSchema,
        label: z.string().min(2),
      }),
    )
    .min(2),
  correctOrder: z.array(questionIdSchema).min(2),
});

export const matchingQuestionSchema = questionBaseSchema.extend({
  kind: z.literal("matching"),
  pairs: z
    .array(
      z.object({
        id: questionIdSchema,
        prompt: z.string().min(2),
        match: z.string().min(2),
      }),
    )
    .min(2),
});

export const questionnaireQuestionSchema = z.discriminatedUnion("kind", [
  choiceQuestionSchema,
  questionnaireClozeQuestionSchema,
  orderingQuestionSchema,
  matchingQuestionSchema,
]);

export const questionnaireExerciseFileSchema = exerciseBaseSchema.extend({
  type: z.literal("questionnaire"),
  questions: z.array(questionnaireQuestionSchema).min(1),
});

export const codeReviewLanguageSchema = z.enum(["typescript", "javascript", "python"]);

export const codeReviewRangeSchema = z
  .object({
    filePath: z.string().min(4),
    startLine: z.number().int().positive(),
    startColumn: z.number().int().positive(),
    endLine: z.number().int().positive(),
    endColumn: z.number().int().positive(),
  })
  .superRefine((range, context) => {
    if (range.endLine < range.startLine) {
      context.addIssue({
        code: "custom",
        message: "Code review ranges must end on or after the start line.",
        path: ["endLine"],
      });
    }

    if (range.endLine === range.startLine && range.endColumn <= range.startColumn) {
      context.addIssue({
        code: "custom",
        message: "Code review ranges must use an exclusive endColumn greater than startColumn.",
        path: ["endColumn"],
      });
    }
  });

export const codeReviewFileSchema = z.object({
  path: z.string().min(4),
  language: codeReviewLanguageSchema,
  healthyExplanation: z.string().min(20),
  lines: z.array(z.string().max(240)).min(1).max(80),
});

export const codeReviewFindingSchema = z.object({
  id: questionIdSchema,
  kind: z.enum(["bug", "improvement"]),
  range: codeReviewRangeSchema,
  explanation: z.string().min(20),
  replacementLines: z.array(z.string().max(240)).min(1).max(20),
});

export const codeReviewHealthyNoteSchema = z.object({
  id: questionIdSchema,
  range: codeReviewRangeSchema,
  explanation: z.string().min(20),
});

export const codeReviewExerciseFileSchema = exerciseBaseSchema.extend({
  type: z.literal("code-review"),
  prompt: z.string().min(10),
  files: z.array(codeReviewFileSchema).min(1).max(2),
  findings: z.array(codeReviewFindingSchema).min(1).max(2),
  healthyNotes: z.array(codeReviewHealthyNoteSchema).default([]),
});

export const learningExerciseFileSchema = z.discriminatedUnion("type", [
  flashcardExerciseFileSchema,
  clozeExerciseFileSchema,
  questionnaireExerciseFileSchema,
  codeReviewExerciseFileSchema,
]);

export const passiveFlashcardTypeSchema = z.enum(["concept", "practical", "snippet", "interview"]);

export const passiveFlashcardCardSchema = z.object({
  id: questionIdSchema,
  type: passiveFlashcardTypeSchema,
  title: z.string().min(4),
  prompt: z.string().min(10),
  explanation: z.string().min(20),
  difficulty: difficultySchema,
  tags: z.array(z.string().min(2)).min(1),
  sourceDocSlug: slugSchema.optional(),
  code: z.string().min(6).optional(),
});

export const passiveFlashcardFeedFileSchema = z.object({
  slug: slugSchema,
  pathSlug: slugSchema,
  title: z.string().min(4),
  summary: z.string().min(20),
  audience: z.string().min(10),
  status: contentStatusSchema.default("draft"),
  cards: z.array(passiveFlashcardCardSchema).min(1),
});

const caseStudyElementIdSchema = z
  .string()
  .min(2)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase IDs with - separators.");

export const caseStudyFlowNodeKindSchema = z.enum(["source", "stream", "compute", "storage", "warehouse", "analytics", "ml", "serving", "product", "control"]);

export const caseStudyFlowNodeSchema = z.object({
  id: caseStudyElementIdSchema,
  label: z.string().min(2).max(48),
  kind: caseStudyFlowNodeKindSchema,
  description: z.string().min(12).max(180),
  position: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
  }),
});

export const caseStudyFlowEdgeSchema = z.object({
  id: caseStudyElementIdSchema,
  source: caseStudyElementIdSchema,
  target: caseStudyElementIdSchema,
  label: z.string().min(2).max(48).optional(),
});

export const caseStudyFlowStepSchema = z.object({
  id: caseStudyElementIdSchema,
  title: z.string().min(4).max(72),
  description: z.string().min(20).max(260),
  activeNodeIds: z.array(caseStudyElementIdSchema).min(1),
  activeEdgeIds: z.array(caseStudyElementIdSchema).default([]),
});

export const caseStudyFlowFileSchema = z.object({
  slug: slugSchema,
  title: z.string().min(4),
  summary: z.string().min(20),
  nodes: z.array(caseStudyFlowNodeSchema).min(2).max(12),
  edges: z.array(caseStudyFlowEdgeSchema).min(1).max(20),
  steps: z.array(caseStudyFlowStepSchema).min(1).max(8),
});

export const complexityFlowNodeKindSchema = z.enum(["input", "operation", "decision", "data", "result"]);

export const complexityFlowCodeSchema = z.object({
  language: z.enum(["typescript", "javascript", "python", "java"]),
  label: z.string().min(2).max(48).optional(),
  source: z.string().min(6).max(1200),
});

export const complexityFlowNodeSchema = z.object({
  id: caseStudyElementIdSchema,
  label: z.string().min(2).max(48),
  kind: complexityFlowNodeKindSchema,
  description: z.string().min(10).max(180),
  position: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
  }),
});

export const complexityFlowEdgeSchema = z.object({
  id: caseStudyElementIdSchema,
  source: caseStudyElementIdSchema,
  target: caseStudyElementIdSchema,
  label: z.string().min(2).max(48).optional(),
});

export const complexityFlowStepSchema = z.object({
  id: caseStudyElementIdSchema,
  title: z.string().min(4).max(72),
  description: z.string().min(20).max(260),
  activeNodeIds: z.array(caseStudyElementIdSchema).min(1),
  activeEdgeIds: z.array(caseStudyElementIdSchema).default([]),
});

function hasDuplicateIds(items: { id: string }[]) {
  const ids = new Set<string>();

  for (const item of items) {
    if (ids.has(item.id)) {
      return item.id;
    }

    ids.add(item.id);
  }

  return undefined;
}

export const complexityFlowVariantSchema = z
  .object({
    id: caseStudyElementIdSchema,
    label: z.string().min(2).max(36),
    complexity: z.string().min(3).max(64),
    summary: z.string().min(20).max(220),
    operationCounts: z.array(z.number().int().nonnegative()).min(1).max(12),
    code: complexityFlowCodeSchema.optional(),
    nodes: z.array(complexityFlowNodeSchema).min(2).max(10),
    edges: z.array(complexityFlowEdgeSchema).min(1).max(18),
    steps: z.array(complexityFlowStepSchema).min(1).max(12),
  })
  .superRefine((variant, context) => {
    const duplicateNodeId = hasDuplicateIds(variant.nodes);
    const duplicateEdgeId = hasDuplicateIds(variant.edges);
    const duplicateStepId = hasDuplicateIds(variant.steps);

    if (duplicateNodeId) {
      context.addIssue({
        code: "custom",
        message: `duplicate complexity flow node id "${duplicateNodeId}"`,
        path: ["nodes"],
      });
    }

    if (duplicateEdgeId) {
      context.addIssue({
        code: "custom",
        message: `duplicate complexity flow edge id "${duplicateEdgeId}"`,
        path: ["edges"],
      });
    }

    if (duplicateStepId) {
      context.addIssue({
        code: "custom",
        message: `duplicate complexity flow step id "${duplicateStepId}"`,
        path: ["steps"],
      });
    }

    if (variant.operationCounts.length !== variant.steps.length) {
      context.addIssue({
        code: "custom",
        message: "operationCounts length must match steps length",
        path: ["operationCounts"],
      });
    }

    const nodeIds = new Set(variant.nodes.map((node) => node.id));
    const edgeIds = new Set(variant.edges.map((edge) => edge.id));

    for (const edge of variant.edges) {
      if (!nodeIds.has(edge.source)) {
        context.addIssue({
          code: "custom",
          message: `edge "${edge.id}" references unknown complexity flow node "${edge.source}"`,
          path: ["edges"],
        });
      }

      if (!nodeIds.has(edge.target)) {
        context.addIssue({
          code: "custom",
          message: `edge "${edge.id}" references unknown complexity flow node "${edge.target}"`,
          path: ["edges"],
        });
      }
    }

    for (const step of variant.steps) {
      for (const nodeId of step.activeNodeIds) {
        if (!nodeIds.has(nodeId)) {
          context.addIssue({
            code: "custom",
            message: `step "${step.id}" references unknown complexity flow node "${nodeId}"`,
            path: ["steps"],
          });
        }
      }

      for (const edgeId of step.activeEdgeIds) {
        if (!edgeIds.has(edgeId)) {
          context.addIssue({
            code: "custom",
            message: `step "${step.id}" references unknown complexity flow edge "${edgeId}"`,
            path: ["steps"],
          });
        }
      }
    }
  });

export const complexityFlowBlockSchema = z
  .object({
    id: caseStudyElementIdSchema,
    title: z.string().min(4).max(80),
    scenario: z.string().min(20).max(260),
    variants: z.array(complexityFlowVariantSchema).min(2).max(4),
  })
  .superRefine((flow, context) => {
    const duplicateVariantId = hasDuplicateIds(flow.variants);

    if (duplicateVariantId) {
      context.addIssue({
        code: "custom",
        message: `duplicate complexity flow variant id "${duplicateVariantId}"`,
        path: ["variants"],
      });
    }
  });

const externalLinkSchema = z.object({
  label: z.string().min(4),
  url: z.string().url(),
});

const interviewExampleSchema = z.object({
  input: z.string().min(1),
  output: z.string().min(1),
  explanation: z.string().min(10).optional(),
});

const interviewDiagramSchema = z.object({
  title: z.string().min(4),
  mermaid: z.string().min(10),
});

const interviewSolutionLanguageSchema = z.object({
  label: z.string().min(2),
  code: z.string().min(10),
});

const interviewSolutionStepSchema = z.object({
  title: z.string().min(4),
  explanation: z.string().min(20),
});

export const interviewSolutionTrackSchema = z.object({
  id: questionIdSchema,
  title: z.string().min(4),
  summary: z.string().min(20),
  steps: z.array(interviewSolutionStepSchema).min(2),
  explanation: z.string().min(40),
  complexity: z.object({
    time: z.string().min(3),
    space: z.string().min(3),
  }),
  languages: z.object({
    python: interviewSolutionLanguageSchema,
    typescript: interviewSolutionLanguageSchema,
    java: interviewSolutionLanguageSchema,
  }),
});

export const interviewQuestionFileSchema = z.object({
  slug: slugSchema,
  title: z.string().min(4),
  summary: z.string().min(20),
  prompt: z.string().min(40),
  difficulty: difficultySchema,
  tags: z.array(z.string().min(2)).min(1),
  sourceLinks: z.array(externalLinkSchema).min(1),
  resources: z.array(externalLinkSchema).default([]),
  examples: z.array(interviewExampleSchema).default([]),
  constraints: z.array(z.string().min(4)).default([]),
  diagrams: z.array(interviewDiagramSchema).default([]),
  solutionTracks: z.array(interviewSolutionTrackSchema).min(2),
});

export const interviewCompanyFileSchema = z.object({
  slug: slugSchema,
  name: z.string().min(2),
  logo: z.object({
    src: z.string().min(4),
    alt: z.string().min(4),
  }),
  summary: z.string().min(20),
  status: contentStatusSchema.default("draft"),
  questions: z.array(interviewQuestionFileSchema).min(1),
});

export type Difficulty = z.infer<typeof difficultySchema>;
export type ContentStatus = z.infer<typeof contentStatusSchema>;
export type KnowledgeFrontmatter = z.infer<typeof knowledgeFrontmatterSchema>;
export type LearningPathKind = z.infer<typeof learningPathKindSchema>;
export type LearningPathNode = z.infer<typeof learningPathNodeSchema>;
export type LearningPathUnit = z.infer<typeof learningPathUnitSchema>;
export type LearningPathFile = z.infer<typeof learningPathFileSchema>;
export type QuestionnaireQuestion = z.infer<typeof questionnaireQuestionSchema>;
export type CodeReviewLanguage = z.infer<typeof codeReviewLanguageSchema>;
export type CodeReviewRange = z.infer<typeof codeReviewRangeSchema>;
export type CodeReviewFile = z.infer<typeof codeReviewFileSchema>;
export type CodeReviewFinding = z.infer<typeof codeReviewFindingSchema>;
export type CodeReviewHealthyNote = z.infer<typeof codeReviewHealthyNoteSchema>;
export type CodeReviewExerciseFile = z.infer<typeof codeReviewExerciseFileSchema>;
export type LearningExerciseFile = z.infer<typeof learningExerciseFileSchema>;
export type PassiveFlashcardType = z.infer<typeof passiveFlashcardTypeSchema>;
export type PassiveFlashcardCard = z.infer<typeof passiveFlashcardCardSchema>;
export type PassiveFlashcardFeedFile = z.infer<typeof passiveFlashcardFeedFileSchema>;
export type CaseStudyFlowNodeKind = z.infer<typeof caseStudyFlowNodeKindSchema>;
export type CaseStudyFlowNode = z.infer<typeof caseStudyFlowNodeSchema>;
export type CaseStudyFlowEdge = z.infer<typeof caseStudyFlowEdgeSchema>;
export type CaseStudyFlowStep = z.infer<typeof caseStudyFlowStepSchema>;
export type CaseStudyFlowFile = z.infer<typeof caseStudyFlowFileSchema>;
export type ComplexityFlowNodeKind = z.infer<typeof complexityFlowNodeKindSchema>;
export type ComplexityFlowNode = z.infer<typeof complexityFlowNodeSchema>;
export type ComplexityFlowEdge = z.infer<typeof complexityFlowEdgeSchema>;
export type ComplexityFlowStep = z.infer<typeof complexityFlowStepSchema>;
export type ComplexityFlowVariant = z.infer<typeof complexityFlowVariantSchema>;
export type ComplexityFlowBlock = z.infer<typeof complexityFlowBlockSchema>;
export type InterviewSolutionTrack = z.infer<typeof interviewSolutionTrackSchema>;
export type InterviewQuestionFile = z.infer<typeof interviewQuestionFileSchema>;
export type InterviewCompanyFile = z.infer<typeof interviewCompanyFileSchema>;

export type ContentHeading = {
  id: string;
  depth: number;
  text: string;
};

export type MermaidBlock = {
  id: string;
  source: string;
};

export type KnowledgeDocument = KnowledgeFrontmatter & {
  id: string;
  route: string;
  sourcePath: string;
  bodyPath: string;
  markdown: string;
  plainText: string;
  headings: ContentHeading[];
  mermaidBlocks: MermaidBlock[];
  complexityFlowBlocks: ComplexityFlowBlock[];
  contentHash: string;
  readingMinutes: number;
};

export type LearningPath = LearningPathFile & {
  id: string;
  route: string;
  sourcePath: string;
  contentHash: string;
};

export type LearningExercise = LearningExerciseFile & {
  id: string;
  route: string;
  sourcePath: string;
  contentHash: string;
};

export type PassiveFlashcardFeed = PassiveFlashcardFeedFile & {
  id: string;
  route: string;
  sourcePath: string;
  contentHash: string;
};

export type CaseStudyFlow = CaseStudyFlowFile & {
  id: string;
  route: string;
  sourcePath: string;
  contentHash: string;
};

export type InterviewQuestion = InterviewQuestionFile & {
  id: string;
  route: string;
  companySlug: string;
  companyName: string;
};

export type InterviewCompany = Omit<InterviewCompanyFile, "questions"> & {
  id: string;
  route: string;
  sourcePath: string;
  contentHash: string;
  questions: InterviewQuestion[];
};

export type MermaidDiagram = {
  id: string;
  title: string;
  slug: string;
  route: string;
  sourcePath: string;
  source: string;
  contentHash: string;
};

export type ContentTrack = {
  name: string;
  slug: string;
  documentCount: number;
  difficulties: Difficulty[];
  topics: string[];
};

export type ContentIndex = {
  schemaVersion: 8;
  documents: KnowledgeDocument[];
  diagrams: MermaidDiagram[];
  learningPaths: LearningPath[];
  exercises: LearningExercise[];
  passiveFlashcardFeeds: PassiveFlashcardFeed[];
  caseStudyFlows: CaseStudyFlow[];
  interviewCompanies: InterviewCompany[];
  tracks: ContentTrack[];
};
