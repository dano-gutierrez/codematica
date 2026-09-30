import { ExternalLink } from "lucide-react";
import type { ContentSource } from "@/lib/content/schema";

export function SourceReferences({ sources, title = "Primary sources" }: { sources: ContentSource[]; title?: string }) {
  if (sources.length === 0) return null;

  return (
    <section className="rounded-xl border border-[#9cc7ff] bg-[#edf5ff] p-4" data-testid="source-references">
      <h2 className="text-sm font-semibold uppercase text-[#1d4e9e]">{title}</h2>
      <p className="mt-1 text-sm font-normal leading-6 text-[#53616c]">These are the authoritative sources. Use Codematica to study and track progress.</p>
      <ul className="mt-3 grid gap-3">
        {sources.map((source) => (
          <li key={source.id}>
            <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 text-sm font-normal leading-6 text-[#1d4e9e] underline decoration-2 underline-offset-4">
              <ExternalLink className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{source.title} · {source.provider}</span>
            </a>
            <p className="mt-1 text-xs font-medium text-[#68737d]">{source.attribution}{source.upstream?.version ? ` · v${source.upstream.version.replace(/^v/, "")}` : ""}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
