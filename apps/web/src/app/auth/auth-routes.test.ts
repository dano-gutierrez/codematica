import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GET as callback } from "./callback/route";
import { GET as signOutGet, POST as signOutPost } from "./sign-out/route";

vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));

describe("Auth route handlers", () => {
  beforeEach(() => vi.mocked(createServerSupabaseClient).mockReset());

  it("exchanges an OAuth code and preserves safe local destinations", async () => {
    const exchangeCodeForSession = vi.fn(async () => ({}));
    vi.mocked(createServerSupabaseClient).mockResolvedValue({ auth: { exchangeCodeForSession } } as never);
    const response = await callback(new NextRequest("http://localhost/auth/callback?code=abc&next=/paths"));
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(response.headers.get("location")).toBe("http://localhost/login?sync=1&next=%2Fpaths");
  });

  it("blocks external and protocol-relative callback destinations", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(null);
    for (const next of ["https://evil.example", "//evil.example", "missing-slash"]) {
      const response = await callback(new NextRequest(`http://localhost/auth/callback?next=${encodeURIComponent(next)}`));
      expect(new URL(response.headers.get("location")!).searchParams.get("next")).toBe("/");
    }
  });

  it("supports GET and POST sign-out with or without Supabase", async () => {
    const signOut = vi.fn(async () => ({}));
    vi.mocked(createServerSupabaseClient).mockResolvedValue({ auth: { signOut } } as never);
    expect((await signOutGet(new NextRequest("http://localhost/auth/sign-out"))).headers.get("location")).toBe("http://localhost/");
    expect((await signOutPost(new NextRequest("http://localhost/auth/sign-out", { method: "POST" }))).headers.get("location")).toBe("http://localhost/");
    expect(signOut).toHaveBeenCalledTimes(2);

    vi.mocked(createServerSupabaseClient).mockResolvedValue(null);
    expect((await signOutGet(new NextRequest("http://localhost/auth/sign-out"))).status).toBe(307);
  });
});
