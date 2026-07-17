import { Redirect, useLocalSearchParams } from "expo-router";
import { getContentIndex, getLearningPathBySlug } from "@codematica/core";
import { LearningPathDetailScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../../src/lib/adapters";
import { pathParam } from "../../../src/lib/params";

export default function PathDetailRoute() {
  const adapters = useCodematicaAdapters();
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = pathParam(params.slug);
  const learningPath = getLearningPathBySlug(slug);

  if (!learningPath) {
    return <Redirect href="/+not-found" />;
  }

  return <LearningPathDetailScreen index={getContentIndex()} learningPath={learningPath} adapters={adapters} />;
}
