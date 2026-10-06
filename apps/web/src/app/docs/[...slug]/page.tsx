import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Clock, GitBranch } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { DifficultyPill } from "@/components/DifficultyPill";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { MermaidBlock } from "@/components/MermaidBlock";
import { PathScopedNextLink } from "@/components/PathScopedNextLink";
import { DocumentProgressTracker } from "@/components/ProgressTrackers";
import { SourceReferences } from "@/components/SourceReferences";
import { getContentIndex, getDocumentBySlug, getNextPathNodeRoutesByPath, getReferencedDiagrams, getSourcesByRefs } from "@/lib/content";

type DocumentPageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

export function generateStaticParams() {
  return getContentIndex().documents.map((document) => ({
    slug: document.slug.split("/"),
  }));
}

export async function generateMetadata({ params }: DocumentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = getDocumentBySlug(slug.join("/"));

  if (!document) {
    return {
      title: "Document not found - Codematica",
    };
  }

  return {
    title: `${document.title} - Codematica`,
    description: document.summary,
  };
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { slug } = await params;
  const document = getDocumentBySlug(slug.join("/"));

  if (!document) {
    notFound();
  }

  const nextHrefsByPath = getNextPathNodeRoutesByPath({ kind: "document", slug: document.slug });
  const referencedDiagrams = getReferencedDiagrams(document.diagramRefs);
  const sources = getSourcesByRefs(document.sourceRefs);

  return (
    <main className="ui-page min-h-screen" data-testid="document-page">
      <div className="mx-auto w-full max-w-3xl">
        <BackButton />

        <article className="mt-6">
          <div className="min-w-0">
            <Suspense fallback={null}>
              <DocumentProgressTracker
                target={{
                  surface: "document",
                  slug: document.slug,
                  title: document.title,
                  summary: document.summary,
                  href: document.route,
                  eyebrow: "Document",
                }}
              />
            </Suspense>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <DifficultyPill difficulty={document.difficulty} />
              <span className="rounded-xl border border-[#d5e2e8] bg-white px-2.5 py-1 text-xs font-semibold text-[#245fba]">{document.track}</span>
              <span className="inline-flex items-center gap-1 rounded-xl border border-[#d5e2e8] bg-white px-2.5 py-1 text-xs font-semibold text-[#68737d]">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {document.readingMinutes} min
              </span>
            </div>
            <h1 className="max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-[#263238] sm:text-4xl">{document.title}</h1>
            <p className="mt-4 max-w-3xl text-lg font-normal leading-8 text-[#68737d]">{document.summary}</p>
            <div className="mt-5"><SourceReferences sources={sources} /></div>
            <div className="mt-5 flex flex-wrap gap-2">
              {document.tags.map((tag) => (
                <span key={tag} className="rounded-xl bg-[#eaf7f4] px-2.5 py-1 text-xs font-semibold text-[#007c78]">
                  {tag}
                </span>
              ))}
            </div>
          <details className="ui-disclosure mt-6" data-testid="document-outline">
            <summary>On this page</summary>
            <nav className="mt-3 grid gap-2 text-sm font-medium text-[#68737d]" aria-label="Article outline">
              {document.headings.map((heading) => (
                <a
                  key={`${heading.depth}-${heading.id}`}
                  href={`#${heading.id}`}
                  className={heading.depth > 2 ? "ui-outline-link pl-3" : "ui-outline-link font-semibold"}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </details>
            <div className="mt-8">
              <MarkdownRenderer markdown={document.markdown} />
            </div>

            <Suspense fallback={null}>
              <PathScopedNextLink
                nextHrefsByPath={nextHrefsByPath}
                testId="document-next-node"
                progressTarget={{
                  surface: "document",
                  slug: document.slug,
                  title: document.title,
                  summary: document.summary,
                  href: document.route,
                  eyebrow: "Document",
                }}
              />
            </Suspense>

            {referencedDiagrams.length > 0 ? (
              <section className="mt-10 border-t border-[#e1e5e9] pt-6" data-testid="referenced-diagrams">
                <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-[#263238]">
                  <GitBranch className="h-5 w-5 text-[#007c78]" aria-hidden="true" />
                  Related diagrams
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4">
                  {referencedDiagrams.map((diagram) => (
                    <div key={diagram.slug}>
                      <Link href={diagram.route} className="text-sm font-semibold text-[#245fba]">
                        {diagram.title}
                      </Link>
                      <MermaidBlock source={diagram.source} title={diagram.title} />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>


        </article>
      </div>
    </main>
  );
}
