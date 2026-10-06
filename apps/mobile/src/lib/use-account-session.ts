import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import type { User } from "@supabase/supabase-js";
import { createNativeSupabaseClient } from "./supabase";

/** Display identity only. RLS and the membership RPC still authorize admin actions. */
export function useAccountSession() {
  const client = useMemo(() => createNativeSupabaseClient(), []);
  const [account, setAccount] = useState<{ user: User | null; isLoading: boolean }>({ user: null, isLoading: true });
  const version = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const refresh = async () => {
      const requestVersion = ++version.current;
      try {
        const result = client ? await client.auth.getUser() : null;
        if (mounted.current && version.current === requestVersion) {
          setAccount(previous => ({
            user: result?.error?.name === "AuthRetryableFetchError" ? previous.user : result && !result.error ? result.data.user : null,
            isLoading: false,
          }));
        }
      } catch {
        if (mounted.current && version.current === requestVersion) setAccount(previous => ({ ...previous, isLoading: false }));
      }
    };
    const subscription = client?.auth.onAuthStateChange((_event, session) => {
      if (!mounted.current) return;
      version.current++;
      setAccount({ user: session?.user ?? null, isLoading: false });
    }).data.subscription;
    void refresh();
    const appState = AppState.addEventListener("change", state => { if (state === "active") void refresh(); });
    return () => { mounted.current = false; subscription?.unsubscribe(); appState.remove(); };
  }, [client]);

  const signOut = useCallback(async () => {
    if (!client) throw new Error("Sign-out is not available here.");
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw new Error(error.message);
    version.current++;
    if (mounted.current) setAccount({ user: null, isLoading: false });
  }, [client]);

  return { ...account, signOut };
}
