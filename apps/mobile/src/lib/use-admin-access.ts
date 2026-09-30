import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { createNativeSupabaseClient } from "./supabase";
export function useAdminAccess() {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    const client = createNativeSupabaseClient(); if (!client) return;
    let active = true;
    const check = async () => { try { const { data, error } = await client.rpc("linkedin_is_admin"); if (active) setAdmin(!error && data === true); } catch { if (active) setAdmin(false); } };
    void check(); const { data } = client.auth.onAuthStateChange(() => { void check(); }); const sub = AppState.addEventListener("change", () => { void check(); });
    return () => { active = false; data.subscription.unsubscribe(); sub.remove(); };
  }, []);
  return admin;
}
