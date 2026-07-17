import { getContentIndex } from "@codematica/core";
import { InterviewCatalogScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../src/lib/adapters";

export default function InterviewsRoute() {
  const adapters = useCodematicaAdapters();

  return <InterviewCatalogScreen index={getContentIndex()} adapters={adapters} />;
}
