import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameStore, type GameCampaign } from "@codematica/core/game";
import { createNativeSupabaseClient } from "./supabase";
const stores = new Map<string, GameStore>();
export function nativeGameStore(campaign: GameCampaign) {
  let store = stores.get(campaign.id);
  if (!store) {
    const client = createNativeSupabaseClient();
    store = new GameStore(
      campaign,
      AsyncStorage,
      client
        ? {
            account: async () =>
              (await client.auth.getSession()).data.session?.user.id ?? null,
            load: async () => {
              const { data, error } = await client.rpc("get_game_progress");
              if (error) throw error;
              return data;
            },
            save: async (progress, account) => {
              const { data, error } = await client.rpc("merge_game_progress", {
                payload: progress,
                expected_user: account,
              });
              if (error) throw error;
              return data;
            },
          }
        : undefined,
    );
    stores.set(campaign.id, store);
    const instance = store;
    client?.auth.onAuthStateChange(() =>
      queueMicrotask(() => void instance.load()),
    );
  }
  return store;
}
