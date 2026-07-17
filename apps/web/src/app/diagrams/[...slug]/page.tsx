import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackButton } from "@/components/BackButton";
import { MermaidBlock } from "@/components/MermaidBlock";
import { PathScopedNextLink } from "@/components/PathScopedNextLink";
import { DiagramProgressTracker } from "@/components/ProgressTrackers";
import { getContentIndex, getDiagramBySlug, getNextPathNodeRoutesByPath } from "@/lib/content";

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

  const nextHrefsByPath = getNextPathNodeRoutesByPath({ kind: "diagram", slug: diagram.slug });

  return (
    <main className="min-h-screen px-4 py-5 sm:py-8" data-testid="diagram-page">
      <div className="mx-auto w-full max-w-6xl">
        <Suspense fallback={null}>
          <DiagramProgressTracker
            target={{
              surface: "diagram",
              slug: diagram.slug,
              title: diagram.title,
              summary: `Mermaid diagram stored in ${diagram.sourcePath}.`,
              href: diagram.route,
              eyebrow: "Diagram",
            }}
          />
        </Suspense>
        <BackButton />
        <div className="mt-6">
          <p className="text-sm font-extrabold uppercase text-[#007c78]">Mermaid Diagram</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-normal text-[#263238] sm:text-6xl">{diagram.title}</h1>
          <p className="mt-4 text-sm font-bold text-[#68737d]">{diagram.sourcePath}</p>
        </div>
        <div className="mt-8">
          <MermaidBlock source={diagram.source} title={diagram.title} />
        </div>
        <Suspense fallback={null}>
          <PathScopedNextLink nextHrefsByPath={nextHrefsByPath} testId="diagram-next-node" />
        </Suspense>
      </div>
    </main>
  );
}
