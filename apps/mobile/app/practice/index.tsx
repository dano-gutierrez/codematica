import { getContentIndex } from "@codematica/core";
import { PracticeCatalogScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../src/lib/adapters";

export default function PracticeCatalogRoute() {
  const adapters = useCodematicaAdapters();
  return <PracticeCatalogScreen index={getContentIndex()} adapters={adapters} />;
}
