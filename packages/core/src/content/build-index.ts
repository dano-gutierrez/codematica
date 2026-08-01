import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseKnowledgeMarkdown } from "./parse-markdown";
import {
  interviewCollectionFileSchema,
  homeDiscoveryFileSchema,
  languageCatalogFileSchema,
  learningExerciseFileSchema,
  learningPathFileSchema,
  passiveFlashcardFeedFileSchema,
  type ContentIndex,
  type ContentTrack,
  type Difficulty,
  type InterviewCollection,
  type HomeDiscovery,
  type KnowledgeDocument,
  type LanguageCharacter,
  type LanguageVocabulary,
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

const emptyHomeDiscovery: HomeDiscovery = {
  sections: {
    paths: [],
    lessons: [],
    interviews: [],
    practice: [],
    languages: [],
  },
};

async function collectHomeDiscovery(rootDir: string): Promise<HomeDiscovery> {
  const filePath = path.join(rootDir, "content", "discovery", "home.json");

  try {
    const { value } = await readJson(filePath);
    return homeDiscoveryFileSchema.parse(value);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return emptyHomeDiscovery;
    }

    throw error;
  }
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

async function collectLanguageContent(rootDir: string): Promise<{
  languageCharacters: LanguageCharacter[];
  languageVocabulary: LanguageVocabulary[];
}> {
  const languagesDir = path.join(rootDir, "content", "languages");
  const files = await walkFiles(languagesDir, jsonExtensions).catch((error: unknown) => {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  });
  const characterGroups: LanguageCharacter[][] = [];
  const vocabularyGroups: LanguageVocabulary[][] = [];

  for (const filePath of files) {
    const { raw, value } = await readJson(filePath);
    const parsed = languageCatalogFileSchema.parse(value);
    const sourcePath = relativeSourcePath(rootDir, filePath);
    const contentHash = sha256(raw);

    if (parsed.kind === "characters") {
      characterGroups.push(
        parsed.items.map((item) => ({
          ...item,
          id: sha256(item.slug).slice(0, 12),
          route: `/languages/japanese/characters/${languageCharacterRouteSlug(item.slug)}`,
          sourcePath,
          contentHash,
        })),
      );
    } else {
      vocabularyGroups.push(
        parsed.items.map((item) => ({
          ...item,
          id: sha256(item.slug).slice(0, 12),
          route: `/languages/japanese/vocabulary/${languageVocabularyRouteSlug(item.slug)}`,
          sourcePath,
          contentHash,
        })),
      );
    }
  }

  return {
    languageCharacters: characterGroups.flat(),
    languageVocabulary: vocabularyGroups.flat(),
  };
}

function languageCharacterRouteSlug(slug: string) {
  return slug.startsWith("japanese/") ? slug.slice("japanese/".length) : slug;
}

function languageVocabularyRouteSlug(slug: string) {
  return slug.startsWith("japanese/vocabulary/") ? slug.slice("japanese/vocabulary/".length) : slug;
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

async function collectInterviewCollections(rootDir: string): Promise<InterviewCollection[]> {
  const interviewsDir = path.join(rootDir, "content", "interviews");
  const files = await walkFiles(interviewsDir, jsonExtensions);

  return Promise.all(
    files.map(async (filePath) => {
      const { raw, value } = await readJson(filePath);
      const parsed = interviewCollectionFileSchema.parse(value);
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
          collectionSlug: parsed.slug,
          collectionName: parsed.name,
          collectionKind: parsed.kind,
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

function assertWritingExercise(exercise: LearningExercise, sourcePath: string, languageCharacterSlugs: Set<string>) {
  if (exercise.type !== "writing") {
    return;
  }

  assertUniqueValues(exercise.characterSlugs, "writing exercise character slug", sourcePath);

  for (const characterSlug of exercise.characterSlugs) {
    if (!languageCharacterSlugs.has(characterSlug)) {
      throw new Error(`${sourcePath} references missing language character "${characterSlug}"`);
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

function assertInterviewCollection(collection: InterviewCollection) {
  assertUniqueValues(
    collection.questions.map((question) => question.slug),
    "interview question slug",
    collection.sourcePath,
  );

  for (const question of collection.questions) {
    assertUniqueValues(
      question.solutionTracks.map((track) => track.id),
      `interview solution id in question "${question.slug}"`,
      collection.sourcePath,
    );

    if (collection.kind === "company" && question.sourceLinks.length === 0) {
      throw new Error(`${collection.sourcePath} company interview question "${question.slug}" must include a public source link.`);
    }

    if (collection.kind === "real-world" && !question.sourceNote) {
      throw new Error(`${collection.sourcePath} real-world interview question "${question.slug}" must include an anonymous provenance source note.`);
    }
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
  languageCharacters: LanguageCharacter[],
  languageVocabulary: LanguageVocabulary[],
  learningPaths: LearningPath[],
  passiveFlashcardFeeds: PassiveFlashcardFeed[],
  interviewCollections: InterviewCollection[],
) {
  assertUniqueEntitySlugs(documents, "knowledge");
  assertUniqueEntitySlugs(diagrams, "diagram");
  assertUniqueEntitySlugs(exercises, "exercise");
  assertUniqueEntitySlugs(languageCharacters, "language character");
  assertUniqueEntitySlugs(languageVocabulary, "language vocabulary");
  assertUniqueEntitySlugs(learningPaths, "learning path");
  assertUniqueEntitySlugs(passiveFlashcardFeeds, "passive flashcard feed");
  assertUniqueEntitySlugs(interviewCollections, "interview collection");
}

function assertContentReferences(
  documents: KnowledgeDocument[],
  diagrams: MermaidDiagram[],
  exercises: LearningExercise[],
  languageCharacters: LanguageCharacter[],
  languageVocabulary: LanguageVocabulary[],
  learningPaths: LearningPath[],
  passiveFlashcardFeeds: PassiveFlashcardFeed[],
  interviewCollections: InterviewCollection[],
) {
  const documentSlugs = new Set<string>();
  const diagramSlugs = new Set(diagrams.map((diagram) => diagram.slug));
  const exerciseSlugs = new Set(exercises.map((exercise) => exercise.slug));
  const languageCharacterSlugs = new Set(languageCharacters.map((character) => character.slug));
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
    assertWritingExercise(exercise, exercise.sourcePath, languageCharacterSlugs);

    if (!documentSlugs.has(exercise.documentSlug)) {
      throw new Error(`${exercise.sourcePath} references missing document "${exercise.documentSlug}"`);
    }
  }

  for (const vocabulary of languageVocabulary) {
    assertUniqueValues(vocabulary.characterSlugs, `language vocabulary character slug in "${vocabulary.slug}"`, vocabulary.sourcePath);

    const nestedCharacterSlugs = [
      ...vocabulary.segments.flatMap((segment) => segment.characterSlugs),
      ...vocabulary.examples.flatMap((example) => example.segments.flatMap((segment) => segment.characterSlugs)),
    ];

    for (const characterSlug of [...vocabulary.characterSlugs, ...nestedCharacterSlugs]) {
      if (!languageCharacterSlugs.has(characterSlug)) {
        throw new Error(`${vocabulary.sourcePath} references missing language character "${characterSlug}"`);
      }
    }
  }

  for (const character of languageCharacters) {
    for (const characterSlug of character.examples.flatMap((example) => example.segments.flatMap((segment) => segment.characterSlugs))) {
      if (!languageCharacterSlugs.has(characterSlug)) {
        throw new Error(`${character.sourcePath} references missing language character "${characterSlug}"`);
      }
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

  for (const collection of interviewCollections) {
    assertInterviewCollection(collection);
  }
}

function assertHomeDiscoveryReferences(
  homeDiscovery: HomeDiscovery,
  documents: KnowledgeDocument[],
  diagrams: MermaidDiagram[],
  exercises: LearningExercise[],
  languageCharacters: LanguageCharacter[],
  languageVocabulary: LanguageVocabulary[],
  learningPaths: LearningPath[],
  passiveFlashcardFeeds: PassiveFlashcardFeed[],
  interviewCollections: InterviewCollection[],
) {
  const validKindsBySection = {
    paths: new Set(["path"]),
    lessons: new Set(["document", "diagram"]),
    interviews: new Set(["interview-question"]),
    practice: new Set(["exercise", "flashcard-feed"]),
    languages: new Set(["language-hub", "language-character", "language-vocabulary"]),
  } as const;
  const available = new Set([
    ...learningPaths.map((item) => `path:${item.slug}`),
    ...documents.map((item) => `document:${item.slug}`),
    ...diagrams.map((item) => `diagram:${item.slug}`),
    ...exercises.map((item) => `exercise:${item.slug}`),
    ...passiveFlashcardFeeds.map((item) => `flashcard-feed:${item.slug}`),
    ...interviewCollections.flatMap((collection) => collection.questions.map((question) => `interview-question:${collection.slug}/${question.slug}`)),
    ...languageCharacters.map((item) => `language-character:${item.slug}`),
    ...languageVocabulary.map((item) => `language-vocabulary:${item.slug}`),
    ...(languageCharacters.some((item) => item.language === "ja") ? ["language-hub:japanese"] : []),
  ]);

  for (const [sectionId, references] of Object.entries(homeDiscovery.sections) as [keyof HomeDiscovery["sections"], HomeDiscovery["sections"][keyof HomeDiscovery["sections"]]][]) {
    const seen = new Set<string>();

    for (const reference of references) {
      const key = `${reference.kind}:${reference.slug}`;

      if (!validKindsBySection[sectionId].has(reference.kind as never)) {
        throw new Error(`Home discovery section "${sectionId}" cannot contain ${reference.kind} references.`);
      }

      if (seen.has(key)) {
        throw new Error(`Home discovery section "${sectionId}" has duplicate reference "${key}".`);
      }

      if (!available.has(key)) {
        throw new Error(`Home discovery section "${sectionId}" references missing content "${key}".`);
      }

      seen.add(key);
    }
  }
}

export async function buildContentIndex({ rootDir }: BuildContentIndexOptions): Promise<ContentIndex> {
  const [documents, diagrams, exercises, languageContent, learningPaths, passiveFlashcardFeeds, interviewCollections, homeDiscovery] = await Promise.all([
    collectKnowledgeDocuments(rootDir),
    collectMermaidDiagrams(rootDir),
    collectLearningExercises(rootDir),
    collectLanguageContent(rootDir),
    collectLearningPaths(rootDir),
    collectPassiveFlashcardFeeds(rootDir),
    collectInterviewCollections(rootDir),
    collectHomeDiscovery(rootDir),
  ]);

  const sortedDocuments = documents.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedDiagrams = diagrams.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedExercises = exercises.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedLanguageCharacters = languageContent.languageCharacters.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedLanguageVocabulary = languageContent.languageVocabulary.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedLearningPaths = learningPaths.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedPassiveFlashcardFeeds = passiveFlashcardFeeds.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedInterviewCollections = interviewCollections.sort((left, right) => left.name.localeCompare(right.name));
  assertUniqueSlugs(
    sortedDocuments,
    sortedDiagrams,
    sortedExercises,
    sortedLanguageCharacters,
    sortedLanguageVocabulary,
    sortedLearningPaths,
    sortedPassiveFlashcardFeeds,
    sortedInterviewCollections,
  );
  assertContentReferences(
    sortedDocuments,
    sortedDiagrams,
    sortedExercises,
    sortedLanguageCharacters,
    sortedLanguageVocabulary,
    sortedLearningPaths,
    sortedPassiveFlashcardFeeds,
    sortedInterviewCollections,
  );
  assertHomeDiscoveryReferences(
    homeDiscovery,
    sortedDocuments,
    sortedDiagrams,
    sortedExercises,
    sortedLanguageCharacters,
    sortedLanguageVocabulary,
    sortedLearningPaths,
    sortedPassiveFlashcardFeeds,
    sortedInterviewCollections,
  );

  return {
    schemaVersion: 7,
    documents: sortedDocuments,
    diagrams: sortedDiagrams,
    learningPaths: sortedLearningPaths,
    exercises: sortedExercises,
    languageCharacters: sortedLanguageCharacters,
    languageVocabulary: sortedLanguageVocabulary,
    passiveFlashcardFeeds: sortedPassiveFlashcardFeeds,
    interviewCollections: sortedInterviewCollections,
    tracks: buildTracks(sortedDocuments),
    homeDiscovery,
  };
}

export function serializeContentIndex(index: ContentIndex) {
  return `${JSON.stringify(index, null, 2)}\n`;
}
