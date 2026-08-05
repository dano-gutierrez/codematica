import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useCodematicaAdapters } from "../lib/adapters";
import { useProgressSummary } from "../lib/use-progress-summary";
import { getNativeProgressSummary, recordNativeProgress, syncNativeAnonymousProgress } from "../lib/progress";
import { createNativeSupabaseClient, openAuthUrl } from "../lib/supabase";
import * as WebBrowser from "expo-web-browser";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
const mockAuth = {
  signInWithPassword: jest.fn(async () => ({ error: null })),
  signUp: jest.fn(async () => ({ error: null })),
  signInWithOAuth: jest.fn(async () => ({ data: { url: "https://provider.example" }, error: null })),
};

jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn(async () => ({ type: "opened" })) }));
jest.mock("../lib/supabase", () => ({
  createNativeSupabaseClient: jest.fn(() => ({ auth: mockAuth })),
  getNativeAuthRedirectUrl: jest.fn(() => "codematica://auth/callback"),
  hasSupabasePublicEnv: jest.fn(() => true),
  openAuthUrl: jest.fn(async () => undefined),
}));
jest.mock("../lib/progress", () => ({
  getNativeProgressSummary: jest.fn(async () => ({ isSignedIn: false, items: [] })),
  recordNativeProgress: jest.fn(async () => undefined),
  syncNativeAnonymousProgress: jest.fn(async () => ({ synced: 0, rejected: 0 })),
}));

describe("native adapters and progress hook", () => {
  beforeEach(() => jest.clearAllMocks());

  it("adapts navigation, progress, and password Auth", async () => {
    const { result, unmount } = await renderHook(() => useCodematicaAdapters());
    await act(async () => {
      result.current.navigation.navigate("/browse");
      result.current.navigation.replace?.("/paths");
      result.current.navigation.goBack?.();
    });
    expect(mockRouter.push).toHaveBeenCalledWith("/browse");
    expect(mockRouter.replace).toHaveBeenCalledWith("/paths");
    expect(mockRouter.back).toHaveBeenCalled();
    await result.current.navigation.openExternalUrl?.("https://example.com");
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith("https://example.com");

    await result.current.progress?.record({ surface: "document", slug: "system-design/cache-invalidation", title: "Cache", summary: "Summary", href: "/docs/cache", eyebrow: "Document" }, "started");
    expect(recordNativeProgress).toHaveBeenCalled();
    await result.current.auth?.signInWithPassword?.("learner@example.com", "password");
    expect(syncNativeAnonymousProgress).toHaveBeenCalled();
    await result.current.auth?.signUpWithPassword?.("learner@example.com", "password");
    expect(mockAuth.signUp).toHaveBeenCalledWith(expect.objectContaining({ options: { emailRedirectTo: "codematica://auth/callback" } }));
    await unmount();
  });

  it("opens OAuth and surfaces provider errors", async () => {
    const { result, unmount } = await renderHook(() => useCodematicaAdapters());
    await result.current.auth?.signInWithOAuth?.("google");
    expect(openAuthUrl).toHaveBeenCalledWith("https://provider.example");
    mockAuth.signInWithOAuth.mockResolvedValueOnce({ data: { url: null }, error: { message: "provider failed" } } as never);
    await expect(result.current.auth?.signInWithOAuth?.("apple")).rejects.toThrow("provider failed");
    await unmount();
  });

  it("loads progress once through the native hook", async () => {
    jest.mocked(getNativeProgressSummary).mockResolvedValueOnce({
      isSignedIn: true,
      items: [{ id: "item", title: "Cache", summary: "Summary", href: "/docs/cache", eyebrow: "Document", status: "started", lastSeenAt: "2026-08-05T00:00:00.000Z" }],
    });
    const { result, unmount } = await renderHook(() => useProgressSummary());
    await waitFor(() => expect(result.current.isSignedIn).toBe(true));
    expect(createNativeSupabaseClient).toHaveBeenCalled();
    await unmount();
  });
});
