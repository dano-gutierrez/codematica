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

export const learningExerciseFileSchema = z.discriminatedUnion("type", [
  flashcardExerciseFileSchema,
  clozeExerciseFileSchema,
]);

export type Difficulty = z.infer<typeof difficultySchema>;
export type ContentStatus = z.infer<typeof contentStatusSchema>;
export type KnowledgeFrontmatter = z.infer<typeof knowledgeFrontmatterSchema>;
export type LearningPathKind = z.infer<typeof learningPathKindSchema>;
export type LearningPathNode = z.infer<typeof learningPathNodeSchema>;
export type LearningPathUnit = z.infer<typeof learningPathUnitSchema>;
export type LearningPathFile = z.infer<typeof learningPathFileSchema>;
export type LearningExerciseFile = z.infer<typeof learningExerciseFileSchema>;

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
  schemaVersion: 2;
  documents: KnowledgeDocument[];
  diagrams: MermaidDiagram[];
  learningPaths: LearningPath[];
  exercises: LearningExercise[];
  tracks: ContentTrack[];
};
