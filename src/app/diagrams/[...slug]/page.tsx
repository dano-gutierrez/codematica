import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MermaidBlock } from "@/components/MermaidBlock";
import { getContentIndex, getDiagramBySlug } from "@/lib/content";

type DiagramPageProps = {
  params: Promise<{
    slug: string[];
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

export default async function DiagramPage({ params }: DiagramPageProps) {
  const { slug } = await params;
  const diagram = getDiagramBySlug(slug.join("/"));

  if (!diagram) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:py-8" data-testid="diagram-page">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-b-4 border-[#d5e2e8] bg-white px-3 py-2 text-sm font-extrabold text-[#263238]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Browser
        </Link>
        <div className="mt-6">
          <p className="text-sm font-extrabold uppercase text-[#007c78]">Mermaid Diagram</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-6xl">{diagram.title}</h1>
          <p className="mt-4 text-sm font-bold text-[#68737d]">{diagram.sourcePath}</p>
        </div>
        <div className="mt-8">
          <MermaidBlock source={diagram.source} title={diagram.title} />
        </div>
      </div>
    </main>
  );
}
