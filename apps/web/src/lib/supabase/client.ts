"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";

export function createBrowserSupabaseClient() {
  const env = getSupabasePublicEnv();

  if (!env) {
    return null;
  }

  return createBrowserClient(env.url, env.publishableKey);
}
