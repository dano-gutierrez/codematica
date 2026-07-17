import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export function getNativeAuthRedirectUrl() {
  return Linking.createURL("/auth/callback");
}

export async function openAuthUrl(url: string) {
  await WebBrowser.openAuthSessionAsync(url, getNativeAuthRedirectUrl());
}
