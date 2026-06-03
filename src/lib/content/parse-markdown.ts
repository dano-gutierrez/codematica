import matter from "gray-matter";
import type { Code, Heading, Root, RootContent } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import { unified } from "unified";
import {
  complexityFlowBlockSchema,
  knowledgeFrontmatterSchema,
  type ComplexityFlowBlock,
  type ContentHeading,
  type KnowledgeFrontmatter,
  type MermaidBlock,
} from "./schema";

export type ParsedKnowledgeMarkdown = {
  frontmatter: KnowledgeFrontmatter;
  markdown: string;
  plainText: string;
  headings: ContentHeading[];
  mermaidBlocks: MermaidBlock[];
  complexityFlowBlocks: ComplexityFlowBlock[];
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

export function parseComplexityFlowBlock(value: string): ComplexityFlowBlock {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Invalid JSON.";
    throw new Error(`Invalid complexity-flow JSON: ${detail}`);
  }

  return complexityFlowBlockSchema.parse(parsed);
}

function complexityFlowPlainText(flow: ComplexityFlowBlock) {
  return [
    flow.title,
    flow.scenario,
    ...flow.variants.flatMap((variant) => [
      variant.label,
      variant.complexity,
      variant.summary,
      variant.code?.label,
      ...variant.steps.flatMap((step) => [step.title, step.description]),
    ]),
  ]
    .filter(Boolean)
    .join(" ");
}

function nodePlainText(node: RootContent, complexityFlowBlocksBySource: Map<string, ComplexityFlowBlock>) {
  if (node.type === "code" && node.lang?.toLowerCase() === "complexity-flow") {
    const block = complexityFlowBlocksBySource.get(node.value.trim());

    return block ? complexityFlowPlainText(block) : "";
  }

  return toString(node);
}

export function parseKnowledgeMarkdown(fileContents: string): ParsedKnowledgeMarkdown {
  const parsed = matter(fileContents);
  const frontmatter = knowledgeFrontmatterSchema.parse(parsed.data);
  const tree = unified().use(remarkParse).parse(parsed.content) as Root;
  const headings: ContentHeading[] = [];
  const mermaidBlocks: MermaidBlock[] = [];
  const complexityFlowBlocks: ComplexityFlowBlock[] = [];
  const complexityFlowBlocksBySource = new Map<string, ComplexityFlowBlock>();

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
    const language = node.lang?.toLowerCase();

    if (language === "mermaid") {
      mermaidBlocks.push({
        id: `embedded-${mermaidBlocks.length + 1}`,
        source: node.value.trim(),
      });
      return;
    }

    if (language === "complexity-flow") {
      const source = node.value.trim();
      const flow = parseComplexityFlowBlock(source);
      complexityFlowBlocks.push(flow);
      complexityFlowBlocksBySource.set(source, flow);
    }
  });

  const complexityFlowBlockIds = new Set<string>();

  for (const flow of complexityFlowBlocks) {
    if (complexityFlowBlockIds.has(flow.id)) {
      throw new Error(`duplicate complexity flow block id "${flow.id}"`);
    }

    complexityFlowBlockIds.add(flow.id);
  }

  const plainText = tree.children
    .map((child) => nodePlainText(child, complexityFlowBlocksBySource))
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
    complexityFlowBlocks,
    readingMinutes: Math.max(1, Math.ceil(wordCount / 220)),
  };
}
