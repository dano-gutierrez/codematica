import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseKnowledgeMarkdown } from "./parse-markdown";
import {
  caseStudyFlowFileSchema,
  interviewCompanyFileSchema,
  learningExerciseFileSchema,
  learningPathFileSchema,
  passiveFlashcardFeedFileSchema,
  type CaseStudyFlow,
  type ContentIndex,
  type ContentTrack,
  type CodeReviewFile,
  type CodeReviewRange,
  type Difficulty,
  type InterviewCompany,
  type KnowledgeDocument,
  type LearningExercise,
  type LearningPath,
  type MermaidDiagram,
  type PassiveFlashcardFeed,
} from "./schema";
import { toPosixPath, walkFiles } from "./files";

const knowledgeExtensions = [".md"];
const diagramExtensions = [".mmd", ".mermaid"];
const jsonExtensions = [".json"];

export type BuildContentIndexOptions = {
  rootDir: string;
};

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function titleFromSlug(slug: string) {
  return slug
    .split("/")
    .at(-1)!
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function trackSlug(track: string) {
  return track
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function relativeSourcePath(rootDir: string, filePath: string) {
  return toPosixPath(path.relative(rootDir, filePath));
}

function diagramSlug(rootDir: string, filePath: string) {
  const diagramsDir = path.join(rootDir, "content", "diagrams");
  const relativePath = path.relative(diagramsDir, filePath);
  return toPosixPath(relativePath.replace(path.extname(relativePath), ""));
}

async function readJson(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");

  return {
    raw,
    value: JSON.parse(raw) as unknown,
  };
}

export async function collectMermaidDiagrams(rootDir: string): Promise<MermaidDiagram[]> {
  const diagramsDir = path.join(rootDir, "content", "diagrams");
  const files = await walkFiles(diagramsDir, diagramExtensions);

  return Promise.all(
    files.map(async (filePath) => {
      const source = (await fs.readFile(filePath, "utf8")).trim();
      const slug = diagramSlug(rootDir, filePath);

      return {
        id: sha256(slug).slice(0, 12),
        title: titleFromSlug(slug),
        slug,
        route: `/diagrams/${slug}`,
        sourcePath: relativeSourcePath(rootDir, filePath),
        source,
        contentHash: sha256(source),
      };
    }),
  );
}

async function collectKnowledgeDocuments(rootDir: string): Promise<KnowledgeDocument[]> {
  const knowledgeDir = path.join(rootDir, "content", "knowledge");
  const files = await walkFiles(knowledgeDir, knowledgeExtensions);

  return Promise.all(
    files.map(async (filePath) => {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = parseKnowledgeMarkdown(raw);
      const sourcePath = relativeSourcePath(rootDir, filePath);
      const contentHash = sha256(raw);

      return {
        ...parsed.frontmatter,
        id: sha256(parsed.frontmatter.slug).slice(0, 12),
        route: `/docs/${parsed.frontmatter.slug}`,
        sourcePath,
        bodyPath: sourcePath,
        markdown: parsed.markdown,
        plainText: parsed.plainText,
        headings: parsed.headings,
        mermaidBlocks: parsed.mermaidBlocks,
        complexityFlowBlocks: parsed.complexityFlowBlocks,
        contentHash,
        readingMinutes: parsed.readingMinutes,
      };
    }),
  );
}

async function collectLearningExercises(rootDir: string): Promise<LearningExercise[]> {
  const exercisesDir = path.join(rootDir, "content", "exercises");
  const files = await walkFiles(exercisesDir, jsonExtensions);

  return Promise.all(
    files.map(async (filePath) => {
      const { raw, value } = await readJson(filePath);
      const parsed = learningExerciseFileSchema.parse(value);
      const sourcePath = relativeSourcePath(rootDir, filePath);

      if (parsed.type === "cloze") {
        const blankCount = parsed.template.match(/\{\{blank\}\}/g)?.length ?? 0;

        if (blankCount !== 1) {
          throw new Error(`${sourcePath} cloze template must contain exactly one {{blank}}.`);
        }
      }

      return {
        ...parsed,
        id: sha256(parsed.slug).slice(0, 12),
        route: `/practice/${parsed.slug}`,
        sourcePath,
        contentHash: sha256(raw),
      };
    }),
  );
}

async function collectLearningPaths(rootDir: string): Promise<LearningPath[]> {
  const pathsDir = path.join(rootDir, "content", "learning-paths");
  const files = await walkFiles(pathsDir, jsonExtensions);

  return Promise.all(
    files.map(async (filePath) => {
      const { raw, value } = await readJson(filePath);
      const parsed = learningPathFileSchema.parse(value);
      const sourcePath = relativeSourcePath(rootDir, filePath);

      return {
        ...parsed,
        id: sha256(parsed.slug).slice(0, 12),
        route: `/paths/${parsed.slug}`,
        sourcePath,
        contentHash: sha256(raw),
      };
    }),
  );
}

async function collectPassiveFlashcardFeeds(rootDir: string): Promise<PassiveFlashcardFeed[]> {
  const feedsDir = path.join(rootDir, "content", "flashcard-feeds");
  const files = await walkFiles(feedsDir, jsonExtensions);

  return Promise.all(
    files.map(async (filePath) => {
      const { raw, value } = await readJson(filePath);
      const parsed = passiveFlashcardFeedFileSchema.parse(value);
      const sourcePath = relativeSourcePath(rootDir, filePath);

      return {
        ...parsed,
        id: sha256(parsed.slug).slice(0, 12),
        route: `/paths/${parsed.pathSlug}/flashcards`,
        sourcePath,
        contentHash: sha256(raw),
      };
    }),
  );
}

async function collectCaseStudyFlows(rootDir: string): Promise<CaseStudyFlow[]> {
  const caseStudiesDir = path.join(rootDir, "content", "case-studies");
  const files = await walkFiles(caseStudiesDir, jsonExtensions);

  return Promise.all(
    files.map(async (filePath) => {
      const { raw, value } = await readJson(filePath);
      const parsed = caseStudyFlowFileSchema.parse(value);
      const sourcePath = relativeSourcePath(rootDir, filePath);

      return {
        ...parsed,
        id: sha256(parsed.slug).slice(0, 12),
        route: `/case-studies/${parsed.slug}`,
        sourcePath,
        contentHash: sha256(raw),
      };
    }),
  );
}

async function collectInterviewCompanies(rootDir: string): Promise<InterviewCompany[]> {
  const interviewsDir = path.join(rootDir, "content", "interviews");
  const files = await walkFiles(interviewsDir, jsonExtensions);

  return Promise.all(
    files.map(async (filePath) => {
      const { raw, value } = await readJson(filePath);
      const parsed = interviewCompanyFileSchema.parse(value);
      const sourcePath = relativeSourcePath(rootDir, filePath);

      return {
        ...parsed,
        id: sha256(parsed.slug).slice(0, 12),
        route: `/interviews/${parsed.slug}`,
        sourcePath,
        contentHash: sha256(raw),
        questions: parsed.questions.map((question) => ({
          ...question,
          id: sha256(`${parsed.slug}/${question.slug}`).slice(0, 12),
          route: `/interviews/${parsed.slug}/${question.slug}`,
          companySlug: parsed.slug,
          companyName: parsed.name,
        })),
      };
    }),
  );
}

function buildTracks(documents: KnowledgeDocument[]): ContentTrack[] {
  const tracks = new Map<string, ContentTrack>();

  for (const document of documents) {
    const slug = trackSlug(document.track);
    const existing =
      tracks.get(slug) ??
      ({
        name: document.track,
        slug,
        documentCount: 0,
        difficulties: [],
        topics: [],
      } satisfies ContentTrack);

    existing.documentCount += 1;
    existing.difficulties = sortedUniqueDifficulty([...existing.difficulties, document.difficulty]);
    existing.topics = sortedUnique([...existing.topics, document.topic]);
    tracks.set(slug, existing);
  }

  return [...tracks.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function sortedUnique(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function sortedUniqueDifficulty(values: Difficulty[]) {
  const order: Difficulty[] = ["foundation", "practitioner", "senior", "principal"];
  return [...new Set(values)].sort((left, right) => order.indexOf(left) - order.indexOf(right));
}

function assertUniqueIds(items: { id: string }[], label: string, sourcePath: string) {
  const ids = new Set<string>();

  for (const item of items) {
    if (ids.has(item.id)) {
      throw new Error(`${sourcePath} has duplicate ${label} "${item.id}".`);
    }

    ids.add(item.id);
  }
}

function assertCaseStudyFlow(flow: CaseStudyFlow) {
  assertUniqueIds(flow.nodes, "case study flow node id", flow.sourcePath);
  assertUniqueIds(flow.edges, "case study flow edge id", flow.sourcePath);
  assertUniqueIds(flow.steps, "case study flow step id", flow.sourcePath);

  const nodeIds = new Set(flow.nodes.map((node) => node.id));
  const edgeIds = new Set(flow.edges.map((edge) => edge.id));

  for (const edge of flow.edges) {
    if (!nodeIds.has(edge.source)) {
      throw new Error(`${flow.sourcePath} edge "${edge.id}" references unknown case study flow node "${edge.source}".`);
    }

    if (!nodeIds.has(edge.target)) {
      throw new Error(`${flow.sourcePath} edge "${edge.id}" references unknown case study flow node "${edge.target}".`);
    }
  }

  for (const step of flow.steps) {
    for (const nodeId of step.activeNodeIds) {
      if (!nodeIds.has(nodeId)) {
        throw new Error(`${flow.sourcePath} step "${step.id}" references unknown case study flow node "${nodeId}".`);
      }
    }

    for (const edgeId of step.activeEdgeIds) {
      if (!edgeIds.has(edgeId)) {
        throw new Error(`${flow.sourcePath} step "${step.id}" references unknown case study flow edge "${edgeId}".`);
      }
    }
  }
}

function sameIdSet(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

function assertQuestionnaireExercise(exercise: LearningExercise, sourcePath: string) {
  if (exercise.type !== "questionnaire") {
    return;
  }

  assertUniqueIds(exercise.questions, "questionnaire question id", sourcePath);

  for (const question of exercise.questions) {
    if (question.kind === "choice") {
      assertUniqueIds(question.options, `choice option id in question "${question.id}"`, sourcePath);

      if (question.options.filter((option) => option.isCorrect).length !== 1) {
        throw new Error(`${sourcePath} choice question "${question.id}" must have exactly one correct option.`);
      }
    }

    if (question.kind === "cloze") {
      const blankCount = question.template.match(/\{\{blank\}\}/g)?.length ?? 0;

      if (blankCount !== 1) {
        throw new Error(`${sourcePath} questionnaire cloze question "${question.id}" must contain exactly one {{blank}}.`);
      }
    }

    if (question.kind === "ordering") {
      assertUniqueIds(question.items, `ordering item id in question "${question.id}"`, sourcePath);

      if (!sameIdSet(question.items.map((item) => item.id), question.correctOrder)) {
        throw new Error(`${sourcePath} ordering question "${question.id}" correctOrder must contain each item id exactly once.`);
      }
    }

    if (question.kind === "matching") {
      assertUniqueIds(question.pairs, `matching pair id in question "${question.id}"`, sourcePath);
    }
  }
}

function assertCodeReviewExercise(exercise: LearningExercise, sourcePath: string) {
  if (exercise.type !== "code-review") {
    return;
  }

  assertUniqueValues(
    exercise.files.map((file) => file.path),
    "code review file path",
    sourcePath,
  );
  assertUniqueIds(exercise.findings, "code review finding id", sourcePath);
  assertUniqueIds(exercise.healthyNotes, "code review healthy note id", sourcePath);

  const filesByPath = new Map(exercise.files.map((file) => [file.path, file]));
  const findingFilePaths = new Set<string>();
  const findingRanges = new Set<string>();

  for (const finding of exercise.findings) {
    assertCodeReviewRange(filesByPath, finding.range, `finding "${finding.id}"`, sourcePath);

    if (findingFilePaths.has(finding.range.filePath)) {
      throw new Error(`${sourcePath} code review exercise must have at most one finding per file.`);
    }

    const rangeKey = codeReviewRangeKey(finding.range);

    if (findingRanges.has(rangeKey)) {
      throw new Error(`${sourcePath} has duplicate code review finding range "${rangeKey}".`);
    }

    findingFilePaths.add(finding.range.filePath);
    findingRanges.add(rangeKey);
  }

  for (const healthyNote of exercise.healthyNotes) {
    assertCodeReviewRange(filesByPath, healthyNote.range, `healthy note "${healthyNote.id}"`, sourcePath);
  }
}

function assertCodeReviewRange(filesByPath: Map<string, CodeReviewFile>, range: CodeReviewRange, label: string, sourcePath: string) {
  const file = filesByPath.get(range.filePath);

  if (!file) {
    throw new Error(`${sourcePath} ${label} references missing code review file "${range.filePath}".`);
  }

  const startLine = file.lines[range.startLine - 1];
  const endLine = file.lines[range.endLine - 1];

  if (startLine === undefined || endLine === undefined) {
    throw new Error(`${sourcePath} ${label} has an invalid code review range outside "${range.filePath}".`);
  }

  if (range.startColumn > startLine.length + 1 || range.endColumn > endLine.length + 1) {
    throw new Error(`${sourcePath} ${label} has an invalid code review range outside "${range.filePath}".`);
  }
}

function codeReviewRangeKey(range: CodeReviewRange) {
  return `${range.filePath}:${range.startLine}:${range.startColumn}-${range.endLine}:${range.endColumn}`;
}

function assertUniqueValues(values: string[], label: string, sourcePath: string) {
  const seen = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`${sourcePath} has duplicate ${label} "${value}".`);
    }

    seen.add(value);
  }
}

function assertInterviewCompany(company: InterviewCompany) {
  assertUniqueValues(
    company.questions.map((question) => question.slug),
    "interview question slug",
    company.sourcePath,
  );

  for (const question of company.questions) {
    assertUniqueValues(
      question.solutionTracks.map((track) => track.id),
      `interview solution id in question "${question.slug}"`,
      company.sourcePath,
    );
  }
}

function assertUniqueEntitySlugs(items: { slug: string; sourcePath: string }[], label: string) {
  const slugs = new Set<string>();

  for (const item of items) {
    if (slugs.has(item.slug)) {
      throw new Error(`Duplicate ${label} slug: ${item.slug}`);
    }

    slugs.add(item.slug);
  }
}

function assertUniqueSlugs(
  documents: KnowledgeDocument[],
  diagrams: MermaidDiagram[],
  exercises: LearningExercise[],
  learningPaths: LearningPath[],
  passiveFlashcardFeeds: PassiveFlashcardFeed[],
  caseStudyFlows: CaseStudyFlow[],
  interviewCompanies: InterviewCompany[],
) {
  assertUniqueEntitySlugs(documents, "knowledge");
  assertUniqueEntitySlugs(diagrams, "diagram");
  assertUniqueEntitySlugs(exercises, "exercise");
  assertUniqueEntitySlugs(learningPaths, "learning path");
  assertUniqueEntitySlugs(passiveFlashcardFeeds, "passive flashcard feed");
  assertUniqueEntitySlugs(caseStudyFlows, "case study flow");
  assertUniqueEntitySlugs(interviewCompanies, "interview company");
}

function assertContentReferences(
  documents: KnowledgeDocument[],
  diagrams: MermaidDiagram[],
  exercises: LearningExercise[],
  learningPaths: LearningPath[],
  passiveFlashcardFeeds: PassiveFlashcardFeed[],
  caseStudyFlows: CaseStudyFlow[],
  interviewCompanies: InterviewCompany[],
) {
  const documentSlugs = new Set<string>();
  const diagramSlugs = new Set(diagrams.map((diagram) => diagram.slug));
  const exerciseSlugs = new Set(exercises.map((exercise) => exercise.slug));
  const learningPathSlugs = new Set(learningPaths.map((learningPath) => learningPath.slug));
  const caseStudyFlowSlugs = new Set(caseStudyFlows.map((flow) => flow.slug));
  const interviewQuestionSlugs = new Set(
    interviewCompanies.flatMap((company) => company.questions.map((question) => `${company.slug}/${question.slug}`)),
  );

  for (const flow of caseStudyFlows) {
    assertCaseStudyFlow(flow);
  }

  for (const document of documents) {
    documentSlugs.add(document.slug);

    for (const diagramRef of document.diagramRefs) {
      if (!diagramSlugs.has(diagramRef)) {
        throw new Error(`${document.sourcePath} references missing diagram "${diagramRef}"`);
      }
    }

    if (document.caseStudyFlowRef && !caseStudyFlowSlugs.has(document.caseStudyFlowRef)) {
      throw new Error(`${document.sourcePath} references missing case study flow "${document.caseStudyFlowRef}"`);
    }
  }

  for (const exercise of exercises) {
    assertQuestionnaireExercise(exercise, exercise.sourcePath);
    assertCodeReviewExercise(exercise, exercise.sourcePath);

    if (!documentSlugs.has(exercise.documentSlug)) {
      throw new Error(`${exercise.sourcePath} references missing document "${exercise.documentSlug}"`);
    }
  }

  for (const learningPath of learningPaths) {
    for (const unit of learningPath.units) {
      for (const node of unit.nodes) {
        if (node.kind === "document" && !documentSlugs.has(node.slug)) {
          throw new Error(`${learningPath.sourcePath} references missing document "${node.slug}"`);
        }

        if (node.kind === "diagram" && !diagramSlugs.has(node.slug)) {
          throw new Error(`${learningPath.sourcePath} references missing diagram "${node.slug}"`);
        }

        if (node.kind === "exercise" && !exerciseSlugs.has(node.slug)) {
          throw new Error(`${learningPath.sourcePath} references missing exercise "${node.slug}"`);
        }

        if (node.kind === "interview" && !interviewQuestionSlugs.has(node.slug)) {
          throw new Error(`${learningPath.sourcePath} references missing interview "${node.slug}"`);
        }
      }
    }
  }

  for (const feed of passiveFlashcardFeeds) {
    if (!learningPathSlugs.has(feed.pathSlug)) {
      throw new Error(`${feed.sourcePath} references missing learning path "${feed.pathSlug}"`);
    }

    assertUniqueIds(feed.cards, "passive flashcard card id", feed.sourcePath);

    for (const card of feed.cards) {
      if (card.sourceDocSlug && !documentSlugs.has(card.sourceDocSlug)) {
        throw new Error(`${feed.sourcePath} card "${card.id}" references missing document "${card.sourceDocSlug}"`);
      }
    }
  }

  for (const company of interviewCompanies) {
    assertInterviewCompany(company);
  }
}

export async function buildContentIndex({ rootDir }: BuildContentIndexOptions): Promise<ContentIndex> {
  const [documents, diagrams, exercises, learningPaths, passiveFlashcardFeeds, caseStudyFlows, interviewCompanies] = await Promise.all([
    collectKnowledgeDocuments(rootDir),
    collectMermaidDiagrams(rootDir),
    collectLearningExercises(rootDir),
    collectLearningPaths(rootDir),
    collectPassiveFlashcardFeeds(rootDir),
    collectCaseStudyFlows(rootDir),
    collectInterviewCompanies(rootDir),
  ]);

  const sortedDocuments = documents.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedDiagrams = diagrams.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedExercises = exercises.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedLearningPaths = learningPaths.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedPassiveFlashcardFeeds = passiveFlashcardFeeds.sort((left, right) => left.slug.localeCompare(right.slug));
  const documentRouteByFlowSlug = new Map<string, string>();

  for (const document of sortedDocuments) {
    if (document.caseStudyFlowRef && !documentRouteByFlowSlug.has(document.caseStudyFlowRef)) {
      documentRouteByFlowSlug.set(document.caseStudyFlowRef, document.route);
    }
  }

  const sortedCaseStudyFlows = caseStudyFlows
    .map((flow) => ({
      ...flow,
      route: `${documentRouteByFlowSlug.get(flow.slug) ?? `/case-studies/${flow.slug}`}#case-study-flow`,
    }))
    .sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedInterviewCompanies = interviewCompanies.sort((left, right) => left.name.localeCompare(right.name));
  assertUniqueSlugs(
    sortedDocuments,
    sortedDiagrams,
    sortedExercises,
    sortedLearningPaths,
    sortedPassiveFlashcardFeeds,
    sortedCaseStudyFlows,
    sortedInterviewCompanies,
  );
  assertContentReferences(
    sortedDocuments,
    sortedDiagrams,
    sortedExercises,
    sortedLearningPaths,
    sortedPassiveFlashcardFeeds,
    sortedCaseStudyFlows,
    sortedInterviewCompanies,
  );

  return {
    schemaVersion: 8,
    documents: sortedDocuments,
    diagrams: sortedDiagrams,
    learningPaths: sortedLearningPaths,
    exercises: sortedExercises,
    passiveFlashcardFeeds: sortedPassiveFlashcardFeeds,
    caseStudyFlows: sortedCaseStudyFlows,
    interviewCompanies: sortedInterviewCompanies,
    tracks: buildTracks(sortedDocuments),
  };
}

export function serializeContentIndex(index: ContentIndex) {
  return `${JSON.stringify(index, null, 2)}\n`;
}
