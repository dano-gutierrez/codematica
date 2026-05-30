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

export type Difficulty = z.infer<typeof difficultySchema>;
export type ContentStatus = z.infer<typeof contentStatusSchema>;
export type KnowledgeFrontmatter = z.infer<typeof knowledgeFrontmatterSchema>;

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
  schemaVersion: 1;
  documents: KnowledgeDocument[];
  diagrams: MermaidDiagram[];
  tracks: ContentTrack[];
};
