import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getContentIndex } from "@codematica/core";
import { awardScenario, emptyGameProgress, GAME_STORAGE_KEY } from "@codematica/core/game";
import { addAnonymousProgressItem, anonymousProgressChangedEvent } from "@/lib/progress/anonymous";
import { SaveProgressPrompt } from "./SaveProgressPrompt";
const { auth } = vi.hoisted(() => ({ auth: { current: null as null | { onAuthStateChange: (listener: (event: string, session: { user: { id: string } } | null) => void) => { data: { subscription: { unsubscribe: () => void } } } } } }));
vi.mock("@/lib/supabase/client", () => ({ createBrowserSupabaseClient: () => auth.current ? { auth: auth.current } : null }));


describe("SaveProgressPrompt", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    auth.current = null;
  });

  it("appears after signed-out users create local progress", async () => {
    render(<SaveProgressPrompt isAuthConfigured={false} />);

    expect(screen.queryByTestId("save-progress-prompt")).not.toBeInTheDocument();

    act(() => {
      addAnonymousProgressItem({
        input: {
          surface: "practice",
          slug: "system-design/cache-product-contract",
          pathSlug: "",
          status: "completed",
          position: {},
        },
        display: {
          id: "practice-system-design/cache-product-contract",
          title: "Cache Product Contract",
          summary: "Practice.",
          href: "/practice/system-design/cache-product-contract",
          eyebrow: "Practice",
          status: "completed",
          lastSeenAt: "2026-06-21T12:00:00.000Z",
        },
      });
    });

    await waitFor(() => expect(screen.getByTestId("save-progress-prompt")).toBeVisible());
    expect(screen.getByTestId("save-progress-prompt")).toHaveTextContent("Progress saved on this device");
    expect(screen.queryByRole("link", { name: /save progress/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /dismiss save progress/i }));
    expect(screen.queryByTestId("save-progress-prompt")).not.toBeInTheDocument();
  });

  it("offers a sign-in destination only when hosted sync is configured", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ isSignedIn: false }), { status: 200 }));
    addAnonymousProgressItem({
      input: { surface: "document", slug: "system-design/cache-invalidation", pathSlug: "", status: "started", position: {} },
      display: { id: "document-cache", title: "Cache", summary: "Summary", href: "/docs/cache", eyebrow: "Document", status: "started", lastSeenAt: "2026-08-05T00:00:00.000Z" },
    });
    render(<SaveProgressPrompt isAuthConfigured />);
    await waitFor(() => expect(screen.getByRole("link", { name: /save progress/i })).toHaveAttribute("href", "/login?next=%2F"));
  });

  it("syncs and remains hidden for an authenticated visitor", async () => {
    addAnonymousProgressItem({
      input: { surface: "document", slug: "system-design/cache-invalidation", pathSlug: "", status: "started", position: {} },
      display: { id: "document-cache", title: "Cache", summary: "Summary", href: "/docs/cache", eyebrow: "Document", status: "started", lastSeenAt: "2026-08-05T00:00:00.000Z" },
    });
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ isSignedIn: true, items: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ synced: 1, rejected: 0 }), { status: 200 }));

    render(<SaveProgressPrompt isAuthConfigured />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/progress/summary"));
    await waitFor(() => expect(screen.queryByTestId("save-progress-prompt")).not.toBeInTheDocument());
  });
  it.each(["earned", "claimed", "empty", "malformed"])("handles %s campaign progress independently of lesson progress", async (kind) => {
    const campaign = getContentIndex().gameCampaigns[0];
    const progress = kind === "empty" ? emptyGameProgress() : awardScenario(emptyGameProgress(), campaign, campaign.levels[0].id, "main", "standard");
    localStorage.setItem(GAME_STORAGE_KEY, kind === "malformed" ? "{broken" : JSON.stringify(progress));
    if (kind === "claimed") localStorage.setItem(`${GAME_STORAGE_KEY}:claimed`, "account-one");
    await act(async () => { render(<SaveProgressPrompt isAuthConfigured={false} />); });
    expect(screen.queryByTestId("save-progress-prompt") !== null).toBe(kind === "earned");
    if (kind === "earned") {
      await act(async () => {
        localStorage.setItem(`${GAME_STORAGE_KEY}:claimed`, "account-one");
        window.dispatchEvent(new Event(anonymousProgressChangedEvent));
      });
      expect(screen.queryByTestId("save-progress-prompt")).not.toBeInTheDocument();
    }
  });

  it("reflects sign-out immediately and ignores a late signed-in summary", async () => {
    addAnonymousProgressItem({ input: { surface: "document", slug: "system-design/cache-invalidation", pathSlug: "", status: "started", position: {} }, display: { id: "cache", title: "Cache", summary: "Summary", href: "/docs/cache", eyebrow: "Document", status: "started", lastSeenAt: "2026-10-03T00:00:00Z" } });
    let listener!: (event: string, session: { user: { id: string } } | null) => void;
    const unsubscribe = vi.fn();
    auth.current = { onAuthStateChange: callback => { listener = callback; return { data: { subscription: { unsubscribe } } }; } };
    let finish!: (response: Response) => void;
    vi.spyOn(globalThis, "fetch").mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const view = render(<SaveProgressPrompt isAuthConfigured />);
    await act(async () => { listener("SIGNED_IN", { user: { id: "synthetic" } }); listener("SIGNED_OUT", null); });
    expect(screen.getByRole("link", { name: "Save progress" })).toBeVisible();
    await act(async () => finish(new Response(JSON.stringify({ isSignedIn: true }), { status: 200 })));
    expect(screen.getByRole("link", { name: "Save progress" })).toBeVisible();
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

});
