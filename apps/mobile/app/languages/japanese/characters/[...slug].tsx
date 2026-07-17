import { Redirect, useLocalSearchParams } from "expo-router";
import { getLanguageCharacterBySlug } from "@codematica/core";
import { JapaneseCharacterDetailScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../../../src/lib/adapters";
import { pathParam } from "../../../../src/lib/params";

export default function JapaneseCharacterRoute() {
  const adapters = useCodematicaAdapters();
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const character = getLanguageCharacterBySlug(languageCharacterLookupSlug(pathParam(params.slug)));

  if (!character) {
    return <Redirect href="/+not-found" />;
  }

  return <JapaneseCharacterDetailScreen character={character} adapters={adapters} />;
}

function languageCharacterLookupSlug(slug: string) {
  return slug.startsWith("japanese/") ? slug : `japanese/${slug}`;
}
