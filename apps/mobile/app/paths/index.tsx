import { getContentIndex } from "@codematica/core";
import { LearningPathHomeScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../src/lib/adapters";

export default function PathsCatalogRoute() {
  const adapters = useCodematicaAdapters();
  return <LearningPathHomeScreen index={getContentIndex()} adapters={adapters} />;
}
