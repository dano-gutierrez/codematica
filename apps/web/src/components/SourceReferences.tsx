import { ExternalLink } from "lucide-react";
import type { ContentSource } from "@/lib/content/schema";

export function SourceReferences({ sources, title = "Primary sources" }: { sources: ContentSource[]; title?: string }) {
  if (sources.length === 0) return null;

  return (
    <details className="ui-disclosure" data-testid="source-references">
      <summary data-testid="source-references-toggle"><h2 className="inline text-sm font-semibold">{title}</h2><span className="ml-2 text-xs font-normal text-[#52616c]">{sources.length}</span></summary>
      <ul className="mt-3 grid gap-3">
        {sources.map((source) => (
          <li key={source.id}>
            <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-normal leading-6 text-[#1d4e9e] underline decoration-2 underline-offset-4">
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{source.title} · {source.provider}</span>
            </a>
            <p className="mt-1 text-xs font-medium text-[#68737d]">{source.attribution}{source.upstream?.version ? ` · v${source.upstream.version.replace(/^v/, "")}` : ""}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}
