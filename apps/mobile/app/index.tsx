import { useCallback, useState } from "react";
import { getContentIndex } from "@codematica/core";
import { NativeGameMap } from "@codematica/ui/game";
import { useFocusEffect, useRouter } from "expo-router";
import { hasSupabasePublicEnv } from "../src/lib/supabase";
import { nativeGameStore } from "../src/lib/game-store";
export default function GameHome() {
  const campaign = getContentIndex().gameCampaigns[0], router = useRouter();
  const [active, setActive] = useState(false);
  useFocusEffect(useCallback(() => {
    setActive(true);
    return () => setActive(false);
  }, []));
  return <NativeGameMap active={active} isAuthConfigured={hasSupabasePublicEnv()} campaign={campaign} store={nativeGameStore(campaign)} navigate={route => router.push(route as never)} />;
}
