import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, GitBranch } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { DifficultyPill } from "@/components/DifficultyPill";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { MermaidBlock } from "@/components/MermaidBlock";
import { getContentIndex, getDocumentBySlug, getNextPathNodeRoute, getReferencedDiagrams } from "@/lib/content";

type DocumentPageProps = {
  params: Promise<{
    slug: string[];
  }>;
  searchParams: Promise<{
    path?: string | string[];
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

export default async function DocumentPage({ params, searchParams }: DocumentPageProps) {
  const { slug } = await params;
  const { path } = await searchParams;
  const document = getDocumentBySlug(slug.join("/"));

  if (!document) {
    notFound();
  }

  const pathSlug = Array.isArray(path) ? path[0] : path;
  const nextHref = pathSlug ? getNextPathNodeRoute(pathSlug, { kind: "document", slug: document.slug }) : undefined;
  const referencedDiagrams = getReferencedDiagrams(document.diagramRefs);

  return (
    <main className="min-h-screen px-4 py-5 sm:py-8" data-testid="document-page">
      <div className="mx-auto w-full max-w-6xl">
        <BackButton />

        <article className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <DifficultyPill difficulty={document.difficulty} />
              <span className="rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-2.5 py-1 text-xs font-extrabold text-[#245fba]">{document.track}</span>
              <span className="inline-flex items-center gap-1 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-2.5 py-1 text-xs font-extrabold text-[#68737d]">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {document.readingMinutes} min
              </span>
            </div>
            <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-6xl">{document.title}</h1>
            <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-[#68737d]">{document.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {document.tags.map((tag) => (
                <span key={tag} className="rounded-lg bg-[#eaf7f4] px-2.5 py-1 text-xs font-extrabold text-[#007c78]">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-8 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-5 sm:p-7">
              <MarkdownRenderer markdown={document.markdown} />
            </div>

            {nextHref ? (
              <div className="mt-6 flex justify-end">
                <Link
                  href={nextHref}
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#1d4e9e] bg-[#245fba] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
                  data-testid="document-next-node"
                >
                  Next node
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ) : null}

            {referencedDiagrams.length > 0 ? (
              <section className="mt-10 border-t-2 border-[#d5e2e8] pt-6" data-testid="referenced-diagrams">
                <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-normal text-[#263238]">
                  <GitBranch className="h-5 w-5 text-[#007c78]" aria-hidden="true" />
                  External Diagrams
                </h2>
                <div className="mt-4 grid gap-4">
                  {referencedDiagrams.map((diagram) => (
                    <div key={diagram.slug}>
                      <Link href={diagram.route} className="text-sm font-extrabold text-[#245fba]">
                        {diagram.title}
                      </Link>
                      <MermaidBlock source={diagram.source} title={diagram.title} />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="h-fit rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white p-4 lg:sticky lg:top-5">
            <h2 className="text-sm font-extrabold uppercase text-[#68737d]">Outline</h2>
            <nav className="mt-3 grid gap-2 text-sm font-bold text-[#68737d]" aria-label="Article outline">
              {document.headings.map((heading) => (
                <a
                  key={`${heading.depth}-${heading.id}`}
                  href={`#${heading.id}`}
                  className={heading.depth > 2 ? "pl-3 text-[#68737d]" : "font-extrabold text-[#263238]"}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </aside>
        </article>
      </div>
    </main>
  );
}
