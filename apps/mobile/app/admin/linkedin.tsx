import { useMemo } from "react";
import { useRouter } from "expo-router";
import { LinkedInAdminScreen } from "@codematica/ui";
import { createEditorialClient } from "@codematica/core/linkedin";
import { createNativeSupabaseClient } from "../../src/lib/supabase";
export default function LinkedInAdminRoute() {
  const router = useRouter();
  const client = useMemo(() => { const db = createNativeSupabaseClient(); return db ? createEditorialClient(db) : null; }, []);
  return <LinkedInAdminScreen client={client} onSignIn={() => router.navigate("/login")} />;
}
