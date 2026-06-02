import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { MermaidBlock } from "@/components/MermaidBlock";
import { getContentIndex, getDiagramBySlug, getNextPathNodeRoute } from "@/lib/content";

type DiagramPageProps = {
  params: Promise<{
    slug: string[];
  }>;
  searchParams: Promise<{
    path?: string | string[];
  }>;
};

export function generateStaticParams() {
  return getContentIndex().diagrams.map((diagram) => ({
    slug: diagram.slug.split("/"),
  }));
}

export async function generateMetadata({ params }: DiagramPageProps): Promise<Metadata> {
  const { slug } = await params;
  const diagram = getDiagramBySlug(slug.join("/"));

  return {
    title: diagram ? `${diagram.title} - Codematica` : "Diagram not found - Codematica",
  };
}

export default async function DiagramPage({ params, searchParams }: DiagramPageProps) {
  const { slug } = await params;
  const { path } = await searchParams;
  const diagram = getDiagramBySlug(slug.join("/"));

  if (!diagram) {
    notFound();
  }

  const pathSlug = Array.isArray(path) ? path[0] : path;
  const nextHref = pathSlug ? getNextPathNodeRoute(pathSlug, { kind: "diagram", slug: diagram.slug }) : undefined;

  return (
    <main className="min-h-screen px-4 py-5 sm:py-8" data-testid="diagram-page">
      <div className="mx-auto w-full max-w-6xl">
        <BackButton />
        <div className="mt-6">
          <p className="text-sm font-extrabold uppercase text-[#007c78]">Mermaid Diagram</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-6xl">{diagram.title}</h1>
          <p className="mt-4 text-sm font-bold text-[#68737d]">{diagram.sourcePath}</p>
        </div>
        <div className="mt-8">
          <MermaidBlock source={diagram.source} title={diagram.title} />
        </div>
        {nextHref ? (
          <div className="mt-6 flex justify-end">
            <Link
              href={nextHref}
              className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-b-4 border-[#1d4e9e] bg-[#245fba] px-4 py-2 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
              data-testid="diagram-next-node"
            >
              Next node
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
