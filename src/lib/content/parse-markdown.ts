import matter from "gray-matter";
import type { Code, Heading, Root } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import { unified } from "unified";
import { knowledgeFrontmatterSchema, type ContentHeading, type KnowledgeFrontmatter, type MermaidBlock } from "./schema";

export type ParsedKnowledgeMarkdown = {
  frontmatter: KnowledgeFrontmatter;
  markdown: string;
  plainText: string;
  headings: ContentHeading[];
  mermaidBlocks: MermaidBlock[];
  readingMinutes: number;
};

export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function parseKnowledgeMarkdown(fileContents: string): ParsedKnowledgeMarkdown {
  const parsed = matter(fileContents);
  const frontmatter = knowledgeFrontmatterSchema.parse(parsed.data);
  const tree = unified().use(remarkParse).parse(parsed.content) as Root;
  const headings: ContentHeading[] = [];
  const mermaidBlocks: MermaidBlock[] = [];

  visit(tree, "heading", (node: Heading) => {
    const text = toString(node).trim();
    if (!text) {
      return;
    }

    headings.push({
      id: slugifyHeading(text),
      depth: node.depth,
      text,
    });
  });

  visit(tree, "code", (node: Code) => {
    if (node.lang?.toLowerCase() !== "mermaid") {
      return;
    }

    mermaidBlocks.push({
      id: `embedded-${mermaidBlocks.length + 1}`,
      source: node.value.trim(),
    });
  });

  const plainText = tree.children
    .map((child) => toString(child))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;

  return {
    frontmatter,
    markdown: parsed.content.trim(),
    plainText,
    headings,
    mermaidBlocks,
    readingMinutes: Math.max(1, Math.ceil(wordCount / 220)),
  };
}
