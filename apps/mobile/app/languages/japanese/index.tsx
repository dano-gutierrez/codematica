import { getContentIndex } from "@codematica/core";
import { JapaneseLanguageHubScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../../src/lib/adapters";

export default function JapaneseLanguageRoute() {
  const adapters = useCodematicaAdapters();

  return <JapaneseLanguageHubScreen index={getContentIndex()} adapters={adapters} />;
}
