import { getContentIndex } from "@codematica/core";
import { BrowseScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../src/lib/adapters";

export default function BrowseRoute() {
  const adapters = useCodematicaAdapters();

  return <BrowseScreen index={getContentIndex()} adapters={adapters} />;
}
