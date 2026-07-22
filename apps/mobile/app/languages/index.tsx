import { getContentIndex } from "@codematica/core";
import { LanguageCatalogScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../src/lib/adapters";

export default function LanguageCatalogRoute() {
  const adapters = useCodematicaAdapters();
  return <LanguageCatalogScreen index={getContentIndex()} adapters={adapters} />;
}
