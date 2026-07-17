import { Redirect, useLocalSearchParams } from "expo-router";
import { getDocumentBySlug, getNextPathNodeRoute, getReferencedDiagrams } from "@codematica/core";
import { DocumentReaderScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../src/lib/adapters";
import { pathParam } from "../../src/lib/params";

export default function DocumentRoute() {
  const adapters = useCodematicaAdapters();
  const params = useLocalSearchParams<{ slug?: string | string[]; path?: string }>();
  const document = getDocumentBySlug(pathParam(params.slug));

  if (!document) {
    return <Redirect href="/+not-found" />;
  }

  const nextHref = params.path ? getNextPathNodeRoute(params.path, { kind: "document", slug: document.slug }) : undefined;

  return <DocumentReaderScreen document={document} referencedDiagrams={getReferencedDiagrams(document.diagramRefs)} nextHref={nextHref} adapters={adapters} />;
}
