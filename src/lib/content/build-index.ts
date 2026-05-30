import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseKnowledgeMarkdown } from "./parse-markdown";
import type { ContentIndex, ContentTrack, Difficulty, KnowledgeDocument, MermaidDiagram } from "./schema";
import { toPosixPath, walkFiles } from "./files";

const knowledgeExtensions = [".md"];
const diagramExtensions = [".mmd", ".mermaid"];

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

function assertUniqueSlugs(documents: KnowledgeDocument[], diagrams: MermaidDiagram[]) {
  const documentSlugs = new Set<string>();
  const diagramSlugs = new Set(diagrams.map((diagram) => diagram.slug));

  for (const document of documents) {
    if (documentSlugs.has(document.slug)) {
      throw new Error(`Duplicate knowledge slug: ${document.slug}`);
    }

    documentSlugs.add(document.slug);

    for (const diagramRef of document.diagramRefs) {
      if (!diagramSlugs.has(diagramRef)) {
        throw new Error(`${document.sourcePath} references missing diagram "${diagramRef}"`);
      }
    }
  }
}

export async function buildContentIndex({ rootDir }: BuildContentIndexOptions): Promise<ContentIndex> {
  const [documents, diagrams] = await Promise.all([
    collectKnowledgeDocuments(rootDir),
    collectMermaidDiagrams(rootDir),
  ]);

  const sortedDocuments = documents.sort((left, right) => left.slug.localeCompare(right.slug));
  const sortedDiagrams = diagrams.sort((left, right) => left.slug.localeCompare(right.slug));
  assertUniqueSlugs(sortedDocuments, sortedDiagrams);

  return {
    schemaVersion: 1,
    documents: sortedDocuments,
    diagrams: sortedDiagrams,
    tracks: buildTracks(sortedDocuments),
  };
}

export function serializeContentIndex(index: ContentIndex) {
  return `${JSON.stringify(index, null, 2)}\n`;
}
