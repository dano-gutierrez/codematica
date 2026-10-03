import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getContentIndex } from "@codematica/core";
import { awardScenario, emptyGameProgress, GAME_STORAGE_KEY } from "@codematica/core/game";
import { addAnonymousProgressItem, anonymousProgressChangedEvent } from "@/lib/progress/anonymous";
import { SaveProgressPrompt } from "./SaveProgressPrompt";

describe("SaveProgressPrompt", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
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
    expect(screen.getByRole("link", { name: /save progress/i })).toHaveAttribute("href", "/login?next=%2F");
    fireEvent.click(screen.getByRole("button", { name: /dismiss save progress/i }));
    expect(screen.queryByTestId("save-progress-prompt")).not.toBeInTheDocument();
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

});
