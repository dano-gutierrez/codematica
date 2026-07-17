import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { createNativeSupabaseClient } from "../../src/lib/supabase";
import { syncNativeAnonymousProgress } from "../../src/lib/progress";

export default function AuthCallbackRoute() {
  const params = useLocalSearchParams<{ code?: string }>();
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("Completing sign in");

  useEffect(() => {
    let mounted = true;

    async function completeAuth() {
      const client = createNativeSupabaseClient();

      if (!client || !params.code) {
        setMessage("Auth callback is missing a code.");
        setDone(true);
        return;
      }

      const { error } = await client.auth.exchangeCodeForSession(params.code);

      if (error) {
        setMessage(error.message);
      } else {
        await syncNativeAnonymousProgress(client);
      }

      if (mounted) {
        setDone(true);
      }
    }

    void completeAuth();

    return () => {
      mounted = false;
    };
  }, [params.code]);

  if (done) {
    return <Redirect href="/" />;
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f5fbff", padding: 24 }}>
      <Text style={{ color: "#263238", fontSize: 18, fontWeight: "900" }}>{message}</Text>
    </View>
  );
}
