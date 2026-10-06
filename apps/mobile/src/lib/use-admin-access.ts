import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { createNativeSupabaseClient } from "./supabase";
export function useAdminAccess() {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    const client = createNativeSupabaseClient(); if (!client) return;
    let active = true;
    let version = 0;
    const check = async () => {
      const requestVersion = ++version;
      try { const { data, error } = await client.rpc("linkedin_is_admin"); if (active && version === requestVersion) setAdmin(!error && data === true); }
      catch { if (active && version === requestVersion) setAdmin(false); }
    };
    void check();
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") { version++; if (active) setAdmin(false); }
      else { void check(); }
    });
    const sub = AppState.addEventListener("change", state => { if (state === "active") void check(); });
    return () => { active = false; data.subscription.unsubscribe(); sub.remove(); };
  }, []);
  return admin;
}
