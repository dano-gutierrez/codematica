import { Redirect, useLocalSearchParams } from "expo-router";
import { getDiagramBySlug, getNextPathNodeRoute } from "@codematica/core";
import { DiagramReaderScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../src/lib/adapters";
import { pathParam } from "../../src/lib/params";

export default function DiagramRoute() {
  const adapters = useCodematicaAdapters();
  const params = useLocalSearchParams<{ slug?: string | string[]; path?: string }>();
  const diagram = getDiagramBySlug(pathParam(params.slug));

  if (!diagram) {
    return <Redirect href="/+not-found" />;
  }

  const nextHref = params.path ? getNextPathNodeRoute(params.path, { kind: "diagram", slug: diagram.slug }) : undefined;

  return <DiagramReaderScreen diagram={diagram} nextHref={nextHref} adapters={adapters} />;
}
