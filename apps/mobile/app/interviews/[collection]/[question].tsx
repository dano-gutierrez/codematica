import { Redirect, useLocalSearchParams } from "expo-router";
import { getInterviewQuestionBySlug, getNextPathNodeRoutesByPath } from "@codematica/core";
import { InterviewQuestionScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../../src/lib/adapters";
import { pathParam } from "../../../src/lib/params";

export default function InterviewQuestionRoute() {
  const adapters = useCodematicaAdapters();
  const params = useLocalSearchParams<{ collection?: string | string[]; question?: string | string[]; path?: string }>();
  const question = getInterviewQuestionBySlug(pathParam(params.collection), pathParam(params.question));

  if (!question) {
    return <Redirect href="/+not-found" />;
  }

  const nextRoutes = getNextPathNodeRoutesByPath({ kind: "interview", slug: `${question.collectionSlug}/${question.slug}` });
  const paths = Object.keys(nextRoutes);
  const pathSlug = params.path ?? (paths.length === 1 ? paths[0] : undefined);
  return <InterviewQuestionScreen question={question} adapters={adapters} nextHref={pathSlug && Object.prototype.hasOwnProperty.call(nextRoutes, pathSlug) ? nextRoutes[pathSlug] : undefined} />;
}
