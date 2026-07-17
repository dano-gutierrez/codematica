import { Redirect, useLocalSearchParams } from "expo-router";
import { getLanguageVocabularyBySlug } from "@codematica/core";
import { JapaneseVocabularyDetailScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../../../src/lib/adapters";
import { pathParam } from "../../../../src/lib/params";

export default function JapaneseVocabularyRoute() {
  const adapters = useCodematicaAdapters();
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const vocabulary = getLanguageVocabularyBySlug(languageVocabularyLookupSlug(pathParam(params.slug)));

  if (!vocabulary) {
    return <Redirect href="/+not-found" />;
  }

  return <JapaneseVocabularyDetailScreen vocabulary={vocabulary} adapters={adapters} />;
}

function languageVocabularyLookupSlug(slug: string) {
  return slug.startsWith("japanese/vocabulary/") ? slug : `japanese/vocabulary/${slug}`;
}
