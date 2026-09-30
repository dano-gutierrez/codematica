"use client";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "./client";
export function useAdminAccess() {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    const client = createBrowserSupabaseClient();
    if (!client) return;
    let active = true;
    const check = async () => { try { const { data, error } = await client.rpc("linkedin_is_admin"); if (active) setAdmin(!error && data === true); } catch { if (active) setAdmin(false); } };
    void check();
    const { data } = client.auth.onAuthStateChange(() => { void check(); });
    window.addEventListener("focus", check);
    return () => { active = false; data.subscription.unsubscribe(); window.removeEventListener("focus", check); };
  }, []);
  return admin;
}
