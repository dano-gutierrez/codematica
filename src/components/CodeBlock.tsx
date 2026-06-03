import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { Code2 } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("java", java);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("python", python);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);

const languageAliases: Record<string, string> = {
  cjs: "javascript",
  html: "xml",
  js: "javascript",
  jsx: "javascript",
  md: "markdown",
  py: "python",
  shell: "bash",
  sh: "bash",
  ts: "typescript",
  tsx: "typescript",
};

const languageLabels: Record<string, string> = {
  bash: "Bash",
  java: "Java",
  javascript: "JavaScript",
  json: "JSON",
  markdown: "Markdown",
  mermaid: "Mermaid",
  python: "Python",
  typescript: "TypeScript",
  xml: "HTML/XML",
};

const languageAccents: Record<string, string> = {
  bash: "#6dd8cf",
  java: "#f97316",
  javascript: "#f7cf5d",
  json: "#a7f3d0",
  markdown: "#c8b8ff",
  mermaid: "#9cc7ff",
  python: "#9cc7ff",
  typescript: "#7dd3fc",
  xml: "#f9a8d4",
};

export function CodeBlock({
  code,
  language,
  label,
  className,
  dataTestId,
}: {
  code: string;
  language?: string;
  label?: string;
  className?: string;
  dataTestId?: string;
}) {
  const normalizedLanguage = normalizeCodeLanguage(language);
  const highlighted = highlightCode(code, normalizedLanguage);
  const displayLabel = label ?? codeLanguageLabel(normalizedLanguage);
  const accent = codeLanguageAccent(normalizedLanguage);

  return (
    <figure className={cn("code-block overflow-hidden rounded-lg border-2 border-b-4 border-[#263544] bg-[#101820]", className)} style={{ "--code-accent": accent } as CSSProperties}>
      <figcaption className="code-block-header flex items-center justify-between gap-3 border-b border-[#263544] px-4 py-3 text-xs font-extrabold uppercase text-[#cbd7e1]">
        <span className="inline-flex min-w-0 items-center gap-2">
          <Code2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{displayLabel}</span>
        </span>
      </figcaption>
      <pre className="code-block-pre overflow-x-auto p-4 text-sm leading-6" data-testid={dataTestId}>
        <code
          className={cn("hljs", normalizedLanguage ? `language-${normalizedLanguage}` : undefined)}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </figure>
  );
}

export function normalizeCodeLanguage(language?: string) {
  const rawLanguage = language?.trim().toLowerCase();

  if (!rawLanguage) {
    return "";
  }

  return languageAliases[rawLanguage] ?? rawLanguage;
}

export function codeLanguageLabel(language: string) {
  return languageLabels[normalizeCodeLanguage(language)] ?? "Code";
}

export function codeLanguageAccent(language: string) {
  return languageAccents[normalizeCodeLanguage(language)] ?? "#b7c3cc";
}

export function highlightCode(code: string, language: string) {
  const normalizedLanguage = normalizeCodeLanguage(language);

  if (normalizedLanguage && hljs.getLanguage(normalizedLanguage)) {
    return hljs.highlight(code, { language: normalizedLanguage, ignoreIllegals: true }).value;
  }

  return escapeHtml(code);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
