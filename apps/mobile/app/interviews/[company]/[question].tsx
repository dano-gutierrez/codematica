import { Redirect, useLocalSearchParams } from "expo-router";
import { getInterviewQuestionBySlug } from "@codematica/core";
import { InterviewQuestionScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../../src/lib/adapters";
import { pathParam } from "../../../src/lib/params";

export default function InterviewQuestionRoute() {
  const adapters = useCodematicaAdapters();
  const params = useLocalSearchParams<{ company?: string | string[]; question?: string | string[] }>();
  const question = getInterviewQuestionBySlug(pathParam(params.company), pathParam(params.question));

  if (!question) {
    return <Redirect href="/+not-found" />;
  }

  return <InterviewQuestionScreen question={question} adapters={adapters} />;
}
