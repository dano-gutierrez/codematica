import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseKnowledgeMarkdown } from "./parse-markdown";
import {
  learningExerciseFileSchema,
  learningPathFileSchema,
  type ContentIndex,
  type ContentTrack,
  type Difficulty,
  type KnowledgeDocument,
  type LearningExercise,
  type LearningPath,
  type MermaidDiagram,
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

function assertUniqueEntitySlugs(items: { slug: string; sourcePath: string }[], label: string) {
  const slugs = new Set<string>();

  for (const item of items) {
    if (slugs.has(item.slug)) {
      throw new Error(`Duplicate ${label} slug: ${item.slug}`);
    }

    slugs.add(item.slug);
  }
}

function assertUniqueSlugs(documents: KnowledgeDocument[], diagrams: MermaidDiagram[], exercises: LearningExercise[], learningPaths: LearningPath[]) {
  assertUniqueEntitySlugs(documents, "knowledge");
  assertUniqueEntitySlugs(diagrams, "diagram");
  assertUniqueEntitySlugs(exercises, "exercise");
  assertUniqueEntitySlugs(learningPaths, "learning path");
}

function assertContentReferences(documents: KnowledgeDocument[], diagrams: MermaidDiagram[], exercises: LearningExercise[], learningPaths: LearningPath[]) {
  const documentSlugs = new Set<string>();
  const diagramSlugs = new Set(diagrams.map((diagram) => diagram.slug));
  const exerciseSlugs = new Set(exercises.map((exercise) => exercise.slug));

  for (const document of documents) {
    documentSlugs.add(document.slug);

    for (const diagramRef of document.diagramRefs) {
      if (!diagramSlugs.has(diagramRef)) {
        throw new Error(`${document.sourcePath} references missing diagram "${diagramRef}"`);
      }
    }
  }

  for (const exercise of exercises) {
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
}

export async function buildContentIndex({ rootDir }: BuildContentIndexOptions): Promise<ContentIndex> {
  const [documents, diagrams, exercises, learningPaths] = await Promise.all([
    collectKnowledgeDocuments(rootDir),
    collectMermaidDiagrams(rootDir),
    collectLearningExercises(rootDir),
    collectLearningPaths(rootDir),
  ]);

  const sortedDocuments = documents.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedDiagrams = diagrams.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedExercises = exercises.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedLearningPaths = learningPaths.sort((left, right) => left.slug.localeCompare(right.slug));
  assertUniqueSlugs(sortedDocuments, sortedDiagrams, sortedExercises, sortedLearningPaths);
  assertContentReferences(sortedDocuments, sortedDiagrams, sortedExercises, sortedLearningPaths);

  return {
    schemaVersion: 2,
    documents: sortedDocuments,
    diagrams: sortedDiagrams,
    learningPaths: sortedLearningPaths,
    exercises: sortedExercises,
    tracks: buildTracks(sortedDocuments),
  };
}

export function serializeContentIndex(index: ContentIndex) {
  return `${JSON.stringify(index, null, 2)}\n`;
}
