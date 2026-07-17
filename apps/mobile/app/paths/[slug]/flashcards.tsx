import { Redirect, useLocalSearchParams } from "expo-router";
import { getPassiveFlashcardFeedByPathSlug } from "@codematica/core";
import { PassiveFlashcardFeedScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../../src/lib/adapters";
import { pathParam } from "../../../src/lib/params";

export default function PathFlashcardsRoute() {
  const adapters = useCodematicaAdapters();
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const feed = getPassiveFlashcardFeedByPathSlug(pathParam(params.slug));

  if (!feed) {
    return <Redirect href="/+not-found" />;
  }

  return <PassiveFlashcardFeedScreen feed={feed} adapters={adapters} />;
}
