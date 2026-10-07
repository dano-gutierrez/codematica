import { AdaptiveText as Text } from "@codematica/ui";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { AppScreen, Button, colors, spacing } from "@codematica/ui";
import { createNativeSupabaseClient } from "../../src/lib/supabase";
import { syncNativeAnonymousProgress } from "../../src/lib/progress";
import { exchangeNativeAuthCode } from "../../src/lib/auth-code";

type Phase = "loading" | "error" | "sync-error" | "done";

export default function AuthCallbackRoute() {
  const params = useLocalSearchParams<{ code?: string; error?: string }>();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [retrying, setRetrying] = useState(false);
  const busy = useRef(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    const counter = requestVersion;
    const version = ++counter.current;
    let mounted = true;
    const setCurrentPhase = (value: Phase) => { if (mounted && requestVersion.current === version) setPhase(value); };
    async function completeAuth() {
      setCurrentPhase("loading");
      const client = createNativeSupabaseClient();
      if (!client || !params.code || params.error) { setCurrentPhase("error"); return; }
      try {
        const { error } = await exchangeNativeAuthCode(client, params.code);
        if (error) { setCurrentPhase("error"); return; }
      } catch { setCurrentPhase("error"); return; }
      if (!mounted || requestVersion.current !== version) return;
      // The auth code is consumed once. Sync recovery must never exchange it again.
      try {
        const result = await syncNativeAnonymousProgress(client);
        setCurrentPhase(result.rejected ? "sync-error" : "done");
      } catch { setCurrentPhase("sync-error"); }
    }
    void completeAuth();
    return () => { mounted = false; counter.current++; };
  }, [params.code, params.error]);

  async function retrySync() {
    if (busy.current) return;
    busy.current = true; setRetrying(true);
    const version = requestVersion.current;
    try {
      const client = createNativeSupabaseClient();
      if (!client) { setPhase("error"); return; }
      const result = await syncNativeAnonymousProgress(client);
      if (version === requestVersion.current) setPhase(result.rejected ? "sync-error" : "done");
    } catch { /* Keep the existing recovery and local buffer. */ }
    finally { busy.current = false; if (version === requestVersion.current) setRetrying(false); }
  }

  if (phase === "done") return <Redirect href="/" />;
  return <AppScreen>
    <Text accessibilityRole="header" style={{ color: colors.textStrong, fontSize: 28, fontWeight: "600" }}>{phase === "error" ? "Sign-in interrupted" : phase === "sync-error" ? "You're signed in" : "Completing sign-in"}</Text>
    {phase === "error" ? <>
      <Text accessibilityLiveRegion="polite" testID="mobile-auth-callback-error" style={{ color: colors.textMuted, fontSize: 16 }}>We couldn't complete sign-in. Return to sign in and try again.</Text>
      <Button label="Return to sign in" onPress={() => router.replace("/login")} tone="info" />
    </> : phase === "sync-error" ? <>
      <Text accessibilityLiveRegion="polite" style={{ color: colors.textMuted, fontSize: 16 }}>Your progress is still on this device. Retry sync or continue learning.</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
        <Button label="Retry sync" busy={retrying} onPress={() => void retrySync()} tone="warning" />
        <Button label="Continue" disabled={retrying} onPress={() => router.replace("/")} variant="secondary" tone="neutral" />
      </View>
    </> : <Text accessibilityLiveRegion="polite" style={{ color: colors.textMuted, fontSize: 16 }}>Please wait…</Text>}
  </AppScreen>;
}
