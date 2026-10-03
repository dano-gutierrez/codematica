"use client";
import { GameStore, type GameCampaign } from "@codematica/core/game";
import { anonymousProgressChangedEvent } from "@/lib/progress/anonymous";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
const stores = new Map<string, GameStore>();
export function webGameStore(campaign: GameCampaign) {
  let store = stores.get(campaign.id);
  if (!store) {
    store = new GameStore(
      campaign,
      {
        getItem: (key) =>
          typeof window === "undefined" ? null : localStorage.getItem(key),
        setItem: (key, value) => {
          localStorage.setItem(key, value);
          window.dispatchEvent(new Event(anonymousProgressChangedEvent));
        },
      },
      {
        account: async () => {
          const client = createBrowserSupabaseClient();
          return client
            ? ((await client.auth.getSession()).data.session?.user.id ?? null)
            : null;
        },
        load: async (account) => {
          const r = await fetch("/api/progress/game", {
            headers: { "x-game-account": account ?? "" },
          });
          if (!r.ok) throw new Error("Offline");
          return r.json();
        },
        save: async (progress, account) => {
          const r = await fetch("/api/progress/game", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-game-account": account ?? "",
            },
            body: JSON.stringify(progress),
          });
          if (!r.ok) throw new Error("Offline");
          return r.json();
        },
      },
    );
    stores.set(campaign.id, store);
    if (typeof window !== "undefined") {
      const instance = store;
      window.addEventListener("online", () => void instance.load());
      createBrowserSupabaseClient()?.auth.onAuthStateChange(() =>
        queueMicrotask(() => void instance.load()),
      );
    }
  }
  return store;
}
