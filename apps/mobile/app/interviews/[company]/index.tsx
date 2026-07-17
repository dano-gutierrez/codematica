import { Redirect, useLocalSearchParams } from "expo-router";
import { getInterviewCompanyBySlug } from "@codematica/core";
import { InterviewCompanyScreen } from "@codematica/ui";
import { useCodematicaAdapters } from "../../../src/lib/adapters";
import { pathParam } from "../../../src/lib/params";

export default function InterviewCompanyRoute() {
  const adapters = useCodematicaAdapters();
  const params = useLocalSearchParams<{ company?: string | string[] }>();
  const company = getInterviewCompanyBySlug(pathParam(params.company));

  if (!company) {
    return <Redirect href="/+not-found" />;
  }

  return <InterviewCompanyScreen company={company} adapters={adapters} />;
}
