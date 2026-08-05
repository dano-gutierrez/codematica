import { afterEach, describe, expect, it } from "vitest";
import { getSupabasePublicEnv, hasSupabasePublicEnv, isAppleAuthEnabled } from "./env";

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
});

describe("Supabase public environment", () => {
  it("requires both anon-safe public values", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(getSupabasePublicEnv()).toBeUndefined();
    expect(hasSupabasePublicEnv()).toBe(false);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    expect(getSupabasePublicEnv()).toBeUndefined();
  });

  it("returns configured values and gates Apple explicitly", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable";
    process.env.NEXT_PUBLIC_AUTH_APPLE_ENABLED = "true";
    expect(getSupabasePublicEnv()).toEqual({ url: "https://example.supabase.co", publishableKey: "publishable" });
    expect(hasSupabasePublicEnv()).toBe(true);
    expect(isAppleAuthEnabled()).toBe(true);
    process.env.NEXT_PUBLIC_AUTH_APPLE_ENABLED = "TRUE";
    expect(isAppleAuthEnabled()).toBe(false);
  });
});
