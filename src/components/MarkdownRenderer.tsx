import { MermaidBlock } from "@/components/MermaidBlock";
import { slugifyHeading } from "@/lib/content/parse-markdown";
import { ExternalLink } from "lucide-react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { isValidElement, type ReactNode } from "react";

function nodeText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(nodeText).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(children)) {
    return nodeText(children.props.children);
  }

  return "";
}

const components: Components = {
  h2({ children, ...props }) {
    const id = slugifyHeading(nodeText(children));
    return (
      <h2 id={id} {...props}>
        {children}
      </h2>
    );
  },
  h3({ children, ...props }) {
    const id = slugifyHeading(nodeText(children));
    return (
      <h3 id={id} {...props}>
        {children}
      </h3>
    );
  },
  pre({ children }) {
    if (isValidElement<{ className?: string; children?: ReactNode }>(children)) {
      const className = children.props.className ?? "";
      const language = /language-(\w+)/.exec(className)?.[1];

      if (language === "mermaid") {
        return <MermaidBlock source={nodeText(children.props.children).trim()} />;
      }
    }

    return <pre>{children}</pre>;
  },
  a({ children, href, ...props }) {
    const isExternal = href?.startsWith("http://") || href?.startsWith("https://");

    return (
      <a href={href} {...props}>
        {isExternal ? <ExternalLink className="mr-1 inline-block h-3.5 w-3.5 align-[-0.125em]" aria-hidden="true" /> : null}
        {children}
      </a>
    );
  },
};

export function MarkdownRenderer({ markdown }: { markdown: string }) {
  return (
    <div className="prose-codematica" data-testid="markdown-renderer">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
