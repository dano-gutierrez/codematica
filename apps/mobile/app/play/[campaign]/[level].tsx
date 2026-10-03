import { useCallback } from "react";
import { getGameSession } from "@codematica/core/game";
import { getContentIndex } from "@codematica/core";
import { NativeGamePlay } from "@codematica/ui/game";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Text } from "react-native";
import { nativeGameStore } from "../../../src/lib/game-store";
import { gameWorkerSource } from "../../../src/generated/game-worker";
export default function GameLevel() {
  const params = useLocalSearchParams<{ campaign: string; level: string }>(),
    router = useRouter(),
    campaign = getContentIndex().gameCampaigns.find(
      (c) => c.id === params.campaign,
    ),
    level = campaign?.levels.find((l) => l.id === params.level);
  useFocusEffect(
    useCallback(
      () => () => {
        if (campaign && level) getGameSession(campaign.id, level).pause();
      },
      [campaign, level],
    ),
  );
  if (!campaign || !level) return <Text>Unknown campaign level.</Text>;
  return (
    <NativeGamePlay
      key={level.id}
      campaign={campaign}
      level={level}
      store={nativeGameStore(campaign)}
      workerSource={gameWorkerSource}
      navigate={(route) => router.push(route as never)}
    />
  );
}
