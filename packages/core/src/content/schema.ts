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

export const writingExerciseFileSchema = exerciseBaseSchema.extend({
  type: z.literal("writing"),
  prompt: z.string().min(10),
  characterSlugs: z.array(slugSchema).min(1),
  modes: z.array(z.enum(["assisted", "free"])).min(1).default(["assisted", "free"]),
  explanation: z.string().min(10),
});

export const learningExerciseFileSchema = z.discriminatedUnion("type", [
  flashcardExerciseFileSchema,
  clozeExerciseFileSchema,
  questionnaireExerciseFileSchema,
  writingExerciseFileSchema,
]);

export const languageCodeSchema = z.enum(["ja"]);

export const languageWritingSystemSchema = z.enum(["hiragana", "katakana", "kanji"]);

export const languageSourceSchema = z.object({
  label: z.string().min(3),
  url: z.string().url(),
});

export const languageReadingSchema = z.object({
  label: z.string().min(2),
  value: z.string().min(1),
  ipa: z.string().min(1),
});

export const languageStrokePointSchema = z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]);

export const languageStrokeSchema = z.object({
  id: questionIdSchema,
  points: z.array(languageStrokePointSchema).min(2),
});

export const languageCharacterFileItemSchema = z.object({
  slug: slugSchema,
  language: languageCodeSchema.default("ja"),
  writingSystem: languageWritingSystemSchema,
  glyph: z.string().min(1),
  title: z.string().min(2),
  summary: z.string().min(10),
  meanings: z.array(z.string().min(1)).min(1),
  readings: z.array(languageReadingSchema).min(1),
  romaji: z.string().min(1),
  ipa: z.string().min(1),
  tags: z.array(z.string().min(2)).min(1),
  status: contentStatusSchema.default("draft"),
  strokes: z.array(languageStrokeSchema).default([]),
  sources: z.array(languageSourceSchema).default([]),
});

export const languageVocabularyFileItemSchema = z.object({
  slug: slugSchema,
  language: languageCodeSchema.default("ja"),
  expression: z.string().min(1),
  reading: z.string().min(1),
  romaji: z.string().min(1),
  ipa: z.string().min(1),
  meanings: z.array(z.string().min(1)).min(1),
  characterSlugs: z.array(slugSchema).default([]),
  tags: z.array(z.string().min(2)).min(1),
  status: contentStatusSchema.default("draft"),
  sources: z.array(languageSourceSchema).default([]),
});

export const languageCharacterCatalogFileSchema = z.object({
  kind: z.literal("characters"),
  language: languageCodeSchema.default("ja"),
  items: z.array(languageCharacterFileItemSchema).min(1),
});

export const languageVocabularyCatalogFileSchema = z.object({
  kind: z.literal("vocabulary"),
  language: languageCodeSchema.default("ja"),
  items: z.array(languageVocabularyFileItemSchema).min(1),
});

export const languageCatalogFileSchema = z.discriminatedUnion("kind", [
  languageCharacterCatalogFileSchema,
  languageVocabularyCatalogFileSchema,
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

export const interviewAlgorithmSolutionTrackSchema = z.object({
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

const webExerciseProjectPathSchema = z
  .string()
  .regex(/^\/(?!.*(?:^|\/)\.\.?(?:\/|$))[A-Za-z0-9._/-]+$/, "Use an absolute safe project file path without dot segments.");

export const webExerciseProjectSchema = z
  .object({
    runtime: z.enum(["react-ts", "vanilla-ts", "static"]),
    files: z.record(
      webExerciseProjectPathSchema,
      z.object({
        code: z.string().min(10),
        hidden: z.boolean().optional(),
        readOnly: z.boolean().optional(),
      }),
    ),
    activeFile: webExerciseProjectPathSchema,
    visibleFiles: z.array(webExerciseProjectPathSchema).min(1),
    entry: webExerciseProjectPathSchema.optional(),
    dependencies: z.record(z.string().min(1), z.string().min(1)).default({}),
  })
  .superRefine((project, context) => {
    const paths = new Set(Object.keys(project.files));

    if (!paths.has(project.activeFile)) {
      context.addIssue({ code: "custom", path: ["activeFile"], message: "Active file must exist in project files." });
    }

    if (project.entry && !paths.has(project.entry)) {
      context.addIssue({ code: "custom", path: ["entry"], message: "Entry file must exist in project files." });
    }

    for (const visibleFile of project.visibleFiles) {
      if (!paths.has(visibleFile)) {
        context.addIssue({ code: "custom", path: ["visibleFiles"], message: `Visible file "${visibleFile}" must exist in project files.` });
      }
    }
  });

const interviewWebSolutionTrackSchema = z.object({
  id: questionIdSchema,
  title: z.string().min(4),
  summary: z.string().min(20),
  steps: z.array(interviewSolutionStepSchema).min(2),
  explanation: z.string().min(40),
  acceptanceRationale: z.string().min(40),
  tradeoffs: z.array(z.string().min(20)).min(1),
  complexity: z.object({
    time: z.string().min(3),
    space: z.string().min(3),
  }),
  project: webExerciseProjectSchema,
});

const interviewRubricItemSchema = z.object({
  title: z.string().min(4),
  explanation: z.string().min(20),
});

export const interviewEvaluationSchema = z.object({
  intent: z.string().min(40),
  expectedSignals: z.array(z.string().min(20)).min(1),
  acceptanceCriteria: z.array(interviewRubricItemSchema).min(1),
  redFlags: z.array(interviewRubricItemSchema).min(1),
});

const interviewQuestionBaseSchema = z.object({
  slug: slugSchema,
  title: z.string().min(4),
  summary: z.string().min(20),
  prompt: z.string().min(40),
  difficulty: difficultySchema,
  tags: z.array(z.string().min(2)).min(1),
  sourceLinks: z.array(externalLinkSchema).default([]),
  sourceNote: z.string().min(20).optional(),
  resources: z.array(externalLinkSchema).default([]),
  examples: z.array(interviewExampleSchema).default([]),
  constraints: z.array(z.string().min(4)).default([]),
  diagrams: z.array(interviewDiagramSchema).default([]),
});

export const interviewAlgorithmQuestionFileSchema = interviewQuestionBaseSchema.extend({
  kind: z.literal("algorithm").default("algorithm"),
  solutionTracks: z.array(interviewAlgorithmSolutionTrackSchema).min(2),
});

export const interviewWebQuestionFileSchema = interviewQuestionBaseSchema.extend({
  kind: z.literal("web"),
  evaluation: interviewEvaluationSchema,
  solutionTracks: z.array(interviewWebSolutionTrackSchema).min(3),
});

export const interviewQuestionFileSchema = z.union([interviewWebQuestionFileSchema, interviewAlgorithmQuestionFileSchema]);

const interviewCollectionBaseSchema = z.object({
  slug: slugSchema,
  name: z.string().min(2),
  summary: z.string().min(20),
  status: contentStatusSchema.default("draft"),
  questions: z.array(interviewQuestionFileSchema).min(1),
});

const interviewCompanyFileSchema = interviewCollectionBaseSchema.extend({
  kind: z.literal("company").default("company"),
  logo: z.object({
    src: z.string().min(4),
    alt: z.string().min(4),
  }),
});

const realWorldInterviewFileSchema = interviewCollectionBaseSchema.extend({
  kind: z.literal("real-world"),
  logo: z.never().optional(),
});

export const interviewCollectionFileSchema = z.union([realWorldInterviewFileSchema, interviewCompanyFileSchema]);
export { interviewCompanyFileSchema };

export type Difficulty = z.infer<typeof difficultySchema>;
export type ContentStatus = z.infer<typeof contentStatusSchema>;
export type KnowledgeFrontmatter = z.infer<typeof knowledgeFrontmatterSchema>;
export type LearningPathKind = z.infer<typeof learningPathKindSchema>;
export type LearningPathNode = z.infer<typeof learningPathNodeSchema>;
export type LearningPathUnit = z.infer<typeof learningPathUnitSchema>;
export type LearningPathFile = z.infer<typeof learningPathFileSchema>;
export type QuestionnaireQuestion = z.infer<typeof questionnaireQuestionSchema>;
export type LearningExerciseFile = z.infer<typeof learningExerciseFileSchema>;
export type LanguageCode = z.infer<typeof languageCodeSchema>;
export type LanguageWritingSystem = z.infer<typeof languageWritingSystemSchema>;
export type LanguageReading = z.infer<typeof languageReadingSchema>;
export type LanguageStrokePoint = z.infer<typeof languageStrokePointSchema>;
export type LanguageStroke = z.infer<typeof languageStrokeSchema>;
export type LanguageCharacterFileItem = z.infer<typeof languageCharacterFileItemSchema>;
export type LanguageVocabularyFileItem = z.infer<typeof languageVocabularyFileItemSchema>;
export type LanguageCatalogFile = z.infer<typeof languageCatalogFileSchema>;
export type PassiveFlashcardType = z.infer<typeof passiveFlashcardTypeSchema>;
export type PassiveFlashcardCard = z.infer<typeof passiveFlashcardCardSchema>;
export type PassiveFlashcardFeedFile = z.infer<typeof passiveFlashcardFeedFileSchema>;
export type WebExerciseProject = z.infer<typeof webExerciseProjectSchema>;
export type InterviewAlgorithmSolutionTrack = z.infer<typeof interviewAlgorithmSolutionTrackSchema>;
export type InterviewWebSolutionTrack = z.infer<typeof interviewWebSolutionTrackSchema>;
export type InterviewSolutionTrack = InterviewAlgorithmSolutionTrack | InterviewWebSolutionTrack;
export type InterviewQuestionFile = z.infer<typeof interviewQuestionFileSchema>;
export type InterviewAlgorithmQuestionFile = z.infer<typeof interviewAlgorithmQuestionFileSchema>;
export type InterviewWebQuestionFile = z.infer<typeof interviewWebQuestionFileSchema>;
export type InterviewCompanyFile = z.infer<typeof interviewCompanyFileSchema>;
export type InterviewCollectionFile = z.infer<typeof interviewCollectionFileSchema>;

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

export type LanguageCharacter = LanguageCharacterFileItem & {
  id: string;
  route: string;
  sourcePath: string;
  contentHash: string;
};

export type LanguageVocabulary = LanguageVocabularyFileItem & {
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
  collectionSlug: string;
  collectionName: string;
  collectionKind: InterviewCollectionFile["kind"];
};

type InterviewCollectionRuntime<TCollection extends InterviewCollectionFile> = TCollection extends InterviewCollectionFile
  ? Omit<TCollection, "questions"> & {
      id: string;
      route: string;
      sourcePath: string;
      contentHash: string;
      questions: InterviewQuestion[];
    }
  : never;

export type InterviewCollection = InterviewCollectionRuntime<InterviewCollectionFile>;

export type InterviewCompany = Extract<InterviewCollection, { kind: "company" }>;

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
  schemaVersion: 6;
  documents: KnowledgeDocument[];
  diagrams: MermaidDiagram[];
  learningPaths: LearningPath[];
  exercises: LearningExercise[];
  languageCharacters: LanguageCharacter[];
  languageVocabulary: LanguageVocabulary[];
  passiveFlashcardFeeds: PassiveFlashcardFeed[];
  interviewCollections: InterviewCollection[];
  tracks: ContentTrack[];
};
