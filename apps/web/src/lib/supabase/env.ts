export type SupabasePublicEnv = {
  url: string;
  publishableKey: string;
};

export function getSupabasePublicEnv(): SupabasePublicEnv | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return undefined;
  }

  return {
    url,
    publishableKey,
  };
}

export function hasSupabasePublicEnv() {
  return Boolean(getSupabasePublicEnv());
}

export function isAppleAuthEnabled() {
  return process.env.NEXT_PUBLIC_AUTH_APPLE_ENABLED === "true";
}
