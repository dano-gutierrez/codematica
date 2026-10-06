"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "./client";

/** Display identity only; database membership and RLS still authorize admin access. */
export function useAccountSession() {
  const [account, setAccount] = useState<{ user: User | null; isLoading: boolean }>({ user: null, isLoading: true });

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    let active = true;
    let authVersion = 0;
    const subscription = client?.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      authVersion++;
      setAccount({ user: session?.user ?? null, isLoading: false });
    }).data.subscription;
    const initialVersion = authVersion;

    // Keep the auth callback synchronous; additional auth calls inside it can deadlock.
    void Promise.resolve(client ? client.auth.getUser() : null).then(
      (result) => {
        if (active && authVersion === initialVersion) {
          setAccount({ user: result && !result.error ? result.data.user : null, isLoading: false });
        }
      },
      () => {
        if (active && authVersion === initialVersion) setAccount({ user: null, isLoading: false });
      },
    );

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  return account;
}
