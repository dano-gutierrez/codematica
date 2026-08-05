import { useRouter } from "expo-router";
import { useMemo } from "react";
import * as WebBrowser from "expo-web-browser";
import type { CodematicaAdapters, ProgressTarget } from "@codematica/ui";
import { createNativeSupabaseClient, getNativeAuthRedirectUrl, hasSupabasePublicEnv, openAuthUrl } from "./supabase";
import { recordNativeProgress, syncNativeAnonymousProgress } from "./progress";

export function useCodematicaAdapters(): CodematicaAdapters {
  const router = useRouter();
  const supabase = useMemo(() => createNativeSupabaseClient(), []);

  return useMemo(
    () => ({
      navigation: {
        navigate: (href: string) => router.push(href as never),
        replace: (href: string) => router.replace(href as never),
        goBack: () => router.back(),
        openExternalUrl: (href: string) => WebBrowser.openBrowserAsync(href).then(() => undefined),
      },
      progress: {
        record: (target: ProgressTarget, status, position) => recordNativeProgress(supabase, target, status, position),
      },
      auth: {
        isConfigured: hasSupabasePublicEnv(),
        signInWithPassword: async (email: string, password: string) => {
          const { error } = await supabase?.auth.signInWithPassword({ email, password }) ?? { error: { message: "Supabase is not configured." } };

          if (error) {
            throw new Error(error.message);
          }

          await syncNativeAnonymousProgress(supabase);
        },
        signUpWithPassword: async (email: string, password: string) => {
          const { error } = await supabase?.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: getNativeAuthRedirectUrl(),
            },
          }) ?? { error: { message: "Supabase is not configured." } };

          if (error) {
            throw new Error(error.message);
          }
        },
        signInWithOAuth: async (provider: "google" | "apple") => {
          const { data, error } =
            (await supabase?.auth.signInWithOAuth({
              provider,
              options: {
                redirectTo: getNativeAuthRedirectUrl(),
                skipBrowserRedirect: true,
              },
            })) ?? { data: { url: null }, error: { message: "Supabase is not configured." } };

          if (error) {
            throw new Error(error.message);
          }

          if (data.url) {
            await openAuthUrl(data.url);
          }
        },
        syncAnonymousProgress: () => syncNativeAnonymousProgress(supabase).then(() => undefined),
      },
    }),
    [router, supabase],
  );
}
