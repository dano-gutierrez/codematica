import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseKnowledgeMarkdown } from "./parse-markdown";
import {
  interviewCompanyFileSchema,
  learningExerciseFileSchema,
  learningPathFileSchema,
  passiveFlashcardFeedFileSchema,
  type ContentIndex,
  type ContentTrack,
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
  interviewCompanies: InterviewCompany[],
) {
  assertUniqueEntitySlugs(documents, "knowledge");
  assertUniqueEntitySlugs(diagrams, "diagram");
  assertUniqueEntitySlugs(exercises, "exercise");
  assertUniqueEntitySlugs(learningPaths, "learning path");
  assertUniqueEntitySlugs(passiveFlashcardFeeds, "passive flashcard feed");
  assertUniqueEntitySlugs(interviewCompanies, "interview company");
}

function assertContentReferences(
  documents: KnowledgeDocument[],
  diagrams: MermaidDiagram[],
  exercises: LearningExercise[],
  learningPaths: LearningPath[],
  passiveFlashcardFeeds: PassiveFlashcardFeed[],
  interviewCompanies: InterviewCompany[],
) {
  const documentSlugs = new Set<string>();
  const diagramSlugs = new Set(diagrams.map((diagram) => diagram.slug));
  const exerciseSlugs = new Set(exercises.map((exercise) => exercise.slug));
  const learningPathSlugs = new Set(learningPaths.map((learningPath) => learningPath.slug));

  for (const document of documents) {
    documentSlugs.add(document.slug);

    for (const diagramRef of document.diagramRefs) {
      if (!diagramSlugs.has(diagramRef)) {
        throw new Error(`${document.sourcePath} references missing diagram "${diagramRef}"`);
      }
    }
  }

  for (const exercise of exercises) {
    assertQuestionnaireExercise(exercise, exercise.sourcePath);

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
  const [documents, diagrams, exercises, learningPaths, passiveFlashcardFeeds, interviewCompanies] = await Promise.all([
    collectKnowledgeDocuments(rootDir),
    collectMermaidDiagrams(rootDir),
    collectLearningExercises(rootDir),
    collectLearningPaths(rootDir),
    collectPassiveFlashcardFeeds(rootDir),
    collectInterviewCompanies(rootDir),
  ]);

  const sortedDocuments = documents.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedDiagrams = diagrams.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedExercises = exercises.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedLearningPaths = learningPaths.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedPassiveFlashcardFeeds = passiveFlashcardFeeds.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedInterviewCompanies = interviewCompanies.sort((left, right) => left.name.localeCompare(right.name));
  assertUniqueSlugs(sortedDocuments, sortedDiagrams, sortedExercises, sortedLearningPaths, sortedPassiveFlashcardFeeds, sortedInterviewCompanies);
  assertContentReferences(sortedDocuments, sortedDiagrams, sortedExercises, sortedLearningPaths, sortedPassiveFlashcardFeeds, sortedInterviewCompanies);

  return {
    schemaVersion: 4,
    documents: sortedDocuments,
    diagrams: sortedDiagrams,
    learningPaths: sortedLearningPaths,
    exercises: sortedExercises,
    passiveFlashcardFeeds: sortedPassiveFlashcardFeeds,
    interviewCompanies: sortedInterviewCompanies,
    tracks: buildTracks(sortedDocuments),
  };
}

export function serializeContentIndex(index: ContentIndex) {
  return `${JSON.stringify(index, null, 2)}\n`;
}
