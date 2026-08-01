import { Redirect, useLocalSearchParams } from "expo-router";
import { getInterviewCollectionBySlug } from "@codematica/core";
import { InterviewCollectionScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../../src/lib/adapters";
import { pathParam } from "../../../src/lib/params";

export default function InterviewCollectionRoute() {
  const adapters = useCodematicaAdapters();
  const params = useLocalSearchParams<{ collection?: string | string[] }>();
  const collection = getInterviewCollectionBySlug(pathParam(params.collection));

  if (!collection) {
    return <Redirect href="/+not-found" />;
  }

  return <InterviewCollectionScreen collection={collection} adapters={adapters} />;
}
