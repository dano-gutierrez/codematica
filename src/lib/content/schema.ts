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
  status: contentStatusSchema.default("draft"),
});

export const learningPathKindSchema = z.enum(["role", "skill"]);

export const learningPathNodeSchema = z.object({
  kind: z.enum(["document", "diagram", "exercise"]),
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

export const learningExerciseFileSchema = z.discriminatedUnion("type", [
  flashcardExerciseFileSchema,
  clozeExerciseFileSchema,
  questionnaireExerciseFileSchema,
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
export type LearningExerciseFile = z.infer<typeof learningExerciseFileSchema>;
export type PassiveFlashcardType = z.infer<typeof passiveFlashcardTypeSchema>;
export type PassiveFlashcardCard = z.infer<typeof passiveFlashcardCardSchema>;
export type PassiveFlashcardFeedFile = z.infer<typeof passiveFlashcardFeedFileSchema>;
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
  schemaVersion: 4;
  documents: KnowledgeDocument[];
  diagrams: MermaidDiagram[];
  learningPaths: LearningPath[];
  exercises: LearningExercise[];
  passiveFlashcardFeeds: PassiveFlashcardFeed[];
  interviewCompanies: InterviewCompany[];
  tracks: ContentTrack[];
};
