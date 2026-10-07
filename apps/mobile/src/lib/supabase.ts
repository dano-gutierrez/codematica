import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
let sharedClient: SupabaseClient | undefined;

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export function hasSupabasePublicEnv() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function createNativeSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    return undefined;
  }

  // Navigation, adapters and progress must observe the same in-process session.
  sharedClient ??= createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  });
  return sharedClient;
}

export function getNativeAuthRedirectUrl() {
  return Linking.createURL("/auth/callback");
}

export async function openAuthUrl(url: string) {
  const redirect = getNativeAuthRedirectUrl();
  const result = await WebBrowser.openAuthSessionAsync(url, redirect);
  if (result.type !== "success") throw new Error("Sign-in was cancelled. Please try again.");
  let callback: URL;
  const expected = new URL(redirect);
  try { callback = new URL(result.url); }
  catch { throw new Error("Sign-in returned an invalid callback. Please try again."); }
  if (callback.protocol !== expected.protocol || callback.hostname !== expected.hostname || callback.port !== expected.port || callback.pathname !== expected.pathname || (!callback.searchParams.has("code") && !callback.searchParams.has("error"))) {
    throw new Error("Sign-in returned an invalid callback. Please try again.");
  }
  await Linking.openURL(result.url);
}
