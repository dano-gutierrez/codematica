import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAnonymousProgressItems, getAnonymousProgressItems } from "@/lib/progress/anonymous";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { LoginForm } from "./LoginForm";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/supabase/client", () => ({ createBrowserSupabaseClient: vi.fn() }));
vi.mock("@/lib/progress/anonymous", () => ({
  getAnonymousProgressItems: vi.fn(() => []),
  clearAnonymousProgressItems: vi.fn(),
}));

function authClient(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null } })),
      signInWithOAuth: vi.fn(async () => ({ error: null })),
      signInWithPassword: vi.fn(async () => ({ data: { session: {} }, error: null })),
      signUp: vi.fn(async () => ({ data: { session: null }, error: null })),
      ...overrides,
    },
  };
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(authClient() as never);
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true })));
  });

  it("gates provider controls from configuration", () => {
    const view = render(<LoginForm nextPath="/" isAuthConfigured isAppleEnabled={false} shouldSync={false} />);
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: /continue with apple/i })).not.toBeInTheDocument();
    view.rerender(<LoginForm nextPath="/" isAuthConfigured isAppleEnabled shouldSync={false} />);
    expect(screen.getByRole("button", { name: /continue with apple/i })).toBeVisible();
    view.rerender(<LoginForm nextPath="/" isAuthConfigured={false} isAppleEnabled={false} shouldSync={false} />);
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /sign in with email/i })).toBeDisabled();
    expect(screen.getByText(/auth is not configured/i)).toBeVisible();
  });

  it("starts OAuth with a safe callback and surfaces provider errors", async () => {
    const signInWithOAuth = vi.fn()
      .mockResolvedValueOnce({ error: { message: "provider unavailable" } })
      .mockResolvedValueOnce({ error: null });
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(authClient({ signInWithOAuth }) as never);
    render(<LoginForm nextPath="/paths" isAuthConfigured isAppleEnabled shouldSync={false} />);
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));
    await screen.findByText("provider unavailable");
    fireEvent.click(screen.getByRole("button", { name: /continue with apple/i }));
    await waitFor(() => expect(signInWithOAuth).toHaveBeenLastCalledWith(expect.objectContaining({
      provider: "apple",
      options: expect.objectContaining({ redirectTo: expect.stringContaining("next=%2Fpaths") }),
    })));
  });

  it("signs in by email, syncs local progress, and navigates", async () => {
    vi.mocked(getAnonymousProgressItems).mockReturnValue([{
      input: { surface: "document", slug: "system-design/cache-invalidation", pathSlug: "", status: "started", position: {} },
      display: { id: "item", title: "Cache", summary: "Summary", href: "/docs/cache", eyebrow: "Document", status: "started", lastSeenAt: "2026-01-01T00:00:00.000Z" },
    }]);
    render(<LoginForm nextPath="/paths" isAuthConfigured isAppleEnabled={false} shouldSync={false} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "learner@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password" } });
    fireEvent.submit(screen.getByRole("button", { name: /sign in with email/i }).closest("form")!);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/paths"));
    expect(fetch).toHaveBeenCalledWith("/api/progress/sync-anonymous", expect.any(Object));
    expect(clearAnonymousProgressItems).toHaveBeenCalled();
    expect(router.refresh).toHaveBeenCalled();
  });

  it("handles failed sign-in and confirmation-required sign-up", async () => {
    const signInWithPassword = vi.fn(async () => ({ data: { session: null }, error: { message: "bad password" } }));
    const signUp = vi.fn(async () => ({ data: { session: null }, error: null }));
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(authClient({ signInWithPassword, signUp }) as never);
    render(<LoginForm nextPath="/" isAuthConfigured isAppleEnabled={false} shouldSync={false} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "learner@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password" } });
    fireEvent.submit(screen.getByRole("button", { name: /sign in with email/i }).closest("form")!);
    await screen.findByText("bad password");
    fireEvent.click(screen.getByRole("button", { name: /create an account/i }));
    fireEvent.submit(screen.getByRole("button", { name: /create account/i }).closest("form")!);
    await screen.findByText(/check your email/i);
  });

  it("completes callback synchronization for an authenticated user", async () => {
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(authClient({
      getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
    }) as never);
    render(<LoginForm nextPath="/browse" isAuthConfigured isAppleEnabled={false} shouldSync />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/browse"));
  });
});
