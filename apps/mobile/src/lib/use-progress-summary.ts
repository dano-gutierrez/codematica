import { useEffect, useState } from "react";
import type { ProgressDisplayItem } from "@codematica/core";
import { getNativeProgressSummary } from "./progress";
import { createNativeSupabaseClient } from "./supabase";

export function useProgressSummary() {
  const [summary, setSummary] = useState<{ isSignedIn: boolean; items: ProgressDisplayItem[] }>({
    isSignedIn: false,
    items: [],
  });

  useEffect(() => {
    let mounted = true;
    const client = createNativeSupabaseClient();

    getNativeProgressSummary(client).then((nextSummary) => {
      if (mounted) {
        setSummary(nextSummary);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return summary;
}
