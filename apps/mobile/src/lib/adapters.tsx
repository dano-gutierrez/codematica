import { useRouter } from "expo-router";
import { useMemo } from "react";
import * as WebBrowser from "expo-web-browser";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import type { CodematicaAdapters, ProgressTarget } from "@codematica/ui";
import { createNativeSupabaseClient, getNativeAuthRedirectUrl, hasSupabasePublicEnv, openAuthUrl } from "./supabase";
import { recordNativeProgress, syncNativeAnonymousProgress } from "./progress";
import { nativeSearchWorkerSource } from "../generated/search-worker";
import { japaneseAudioAssets } from "../generated/japanese-audio";

import type { NotebookDataClient } from "@codematica/core";
import { createNativeNotebookStorage } from "./notebook-storage";
import { nativeHandwritingCanvas } from "./handwriting-canvas";

let activeAudioPlayer: AudioPlayer | undefined;

function playJapaneseAudio(audioId: string, playbackRate = 1) {
  const source = (japaneseAudioAssets as Record<string, number>)[audioId];
  if (!source) return false;
  activeAudioPlayer?.remove();
  activeAudioPlayer = createAudioPlayer(source);
  activeAudioPlayer.playbackRate = playbackRate;
  void activeAudioPlayer.seekTo(0);
  activeAudioPlayer.play();
  return true;
}

export function useCodematicaAdapters(): CodematicaAdapters {
  const router = useRouter();
  const supabase = useMemo(() => createNativeSupabaseClient(), []);

  return useMemo(
    () => ({
      searchScript: nativeSearchWorkerSource,
      navigation: {
        navigate: (href: string) => router.push(href as never),
        replace: (href: string) => router.replace(href as never),
        goBack: () => router.back(),
        openExternalUrl: (href: string) => WebBrowser.openBrowserAsync(href).then(() => undefined),
      },
      progress: {
        record: (target: ProgressTarget, status, position) => recordNativeProgress(supabase, target, status, position),
      },
      audio: { play: playJapaneseAudio },
      notebooks: createNativeNotebookStorage(supabase as unknown as NotebookDataClient | undefined),
      handwritingCanvas: nativeHandwritingCanvas,
      auth: {
        isConfigured: hasSupabasePublicEnv(),
        isAppleEnabled: process.env.EXPO_PUBLIC_AUTH_APPLE_ENABLED === "true",
        signInWithPassword: async (email: string, password: string) => {
          const { error } = await supabase?.auth.signInWithPassword({ email, password }) ?? { error: { message: "Supabase is not configured." } };

          if (error) {
            throw new Error(error.message);
          }

          try {
            const result = await syncNativeAnonymousProgress(supabase);
            return { progressSynced: result.rejected === 0 };
          } catch { return { progressSynced: false }; }
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

          if (!data.url) throw new Error("Could not open sign-in. Please try again.");
          await openAuthUrl(data.url);
        },
        syncAnonymousProgress: async () => {
          const result = await syncNativeAnonymousProgress(supabase);
          return { progressSynced: result.rejected === 0 };
        },
      },
    }),
    [router, supabase],
  );
}
