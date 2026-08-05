import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createBrowserSupabaseClient } from "./client";
import { updateSession } from "./proxy";
import { createServerSupabaseClient } from "./server";

vi.mock("@supabase/ssr", () => ({ createBrowserClient: vi.fn(), createServerClient: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

const original = { ...process.env };

function configure() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable";
}

describe("Supabase client adapters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...original };
  });
  afterEach(() => { process.env = { ...original }; });

  it("does not construct browser or server clients without public configuration", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(createBrowserSupabaseClient()).toBeNull();
    await expect(createServerSupabaseClient()).resolves.toBeNull();
    expect(createBrowserClient).not.toHaveBeenCalled();
  });

  it("constructs the browser client from anon-safe values", () => {
    configure();
    const expected = { auth: {} };
    vi.mocked(createBrowserClient).mockReturnValue(expected as never);
    expect(createBrowserSupabaseClient()).toBe(expected);
    expect(createBrowserClient).toHaveBeenCalledWith("https://example.supabase.co", "publishable");
  });

  it("adapts server cookie reads and writes", async () => {
    configure();
    const cookieStore = { getAll: vi.fn(() => [{ name: "session", value: "old" }]), set: vi.fn() };
    vi.mocked(cookies).mockResolvedValue(cookieStore as never);
    const expected = { auth: {} };
    vi.mocked(createServerClient).mockReturnValue(expected as never);
    expect(await createServerSupabaseClient()).toBe(expected);
    const options = vi.mocked(createServerClient).mock.calls[0][2];
    expect(options.cookies.getAll()).toEqual([{ name: "session", value: "old" }]);
    options.cookies.setAll?.([{ name: "session", value: "new", options: { path: "/" } }], {});
    expect(cookieStore.set).toHaveBeenCalledWith("session", "new", { path: "/" });
  });

  it("refreshes proxy claims and propagates response cookies", async () => {
    configure();
    const getClaims = vi.fn(async () => ({}));
    vi.mocked(createServerClient).mockImplementation((_url, _key, options) => ({
      auth: {
        getClaims: async () => {
          options.cookies.setAll?.(
            [{ name: "session", value: "new", options: { path: "/", httpOnly: true } }],
            { "Cache-Control": "private, no-store" },
          );
          return getClaims();
        },
      },
    }) as never);
    const request = new NextRequest("http://localhost/docs/example", {
      headers: { cookie: "session=old" },
    });
    const response = await updateSession(request);
    const options = vi.mocked(createServerClient).mock.calls[0][2];
    expect(options.cookies.getAll()).toEqual([expect.objectContaining({ name: "session", value: "new" })]);
    expect(getClaims).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.cookies.get("session")).toMatchObject({ name: "session", value: "new" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("passes requests through when proxy Auth is unconfigured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const response = await updateSession(new NextRequest("http://localhost/"));
    expect(response.status).toBe(200);
    expect(createServerClient).not.toHaveBeenCalled();
  });
});
