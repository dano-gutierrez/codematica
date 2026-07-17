import { Redirect, useLocalSearchParams } from "expo-router";
import { getExerciseBySlug, getNextPathNodeRoute } from "@codematica/core";
import { PracticeScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../src/lib/adapters";
import { pathParam } from "../../src/lib/params";

export default function PracticeRoute() {
  const adapters = useCodematicaAdapters();
  const params = useLocalSearchParams<{ slug?: string | string[]; path?: string }>();
  const exercise = getExerciseBySlug(pathParam(params.slug));

  if (!exercise) {
    return <Redirect href="/+not-found" />;
  }

  const nextHref = params.path ? getNextPathNodeRoute(params.path, { kind: "exercise", slug: exercise.slug }) : undefined;

  return <PracticeScreen exercise={exercise} nextHref={nextHref} adapters={adapters} />;
}
