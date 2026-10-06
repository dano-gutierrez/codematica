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
    vi.mocked(getAnonymousProgressItems).mockReturnValue([]);
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(authClient() as never);
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => new Response(JSON.stringify({
      synced: JSON.parse(String(init?.body)).items.length,
      rejected: 0,
    }), { status: 200 })));
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
    expect(screen.getByText(/sign-in is not set up here/i)).toBeVisible();
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
    const client = authClient();
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(client as never);
    render(<LoginForm nextPath="/paths" isAuthConfigured isAppleEnabled={false} shouldSync={false} />);
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "  learner@example.com  " } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password" } });
    fireEvent.submit(screen.getByRole("button", { name: /sign in with email/i }).closest("form")!);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/paths"));
    expect(client.auth.signInWithPassword).toHaveBeenCalledTimes(1);
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({ email: "learner@example.com", password: "password" });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/progress/sync-anonymous", expect.any(Object));
    expect(clearAnonymousProgressItems).toHaveBeenCalled();
    expect(router.refresh).toHaveBeenCalled();
  });

  it("handles failed sign-in and confirmation-required sign-up", async () => {
    const signInWithPassword = vi.fn(async () => ({ data: { session: null }, error: { message: "bad password" } }));
    const signUp = vi.fn(async () => ({ data: { session: null }, error: null }));
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(authClient({ signInWithPassword, signUp }) as never);
    render(<LoginForm nextPath="/" isAuthConfigured isAppleEnabled={false} shouldSync={false} />);
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "learner@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password" } });
    fireEvent.submit(screen.getByRole("button", { name: /sign in with email/i }).closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent("bad password");
    fireEvent.click(screen.getByRole("button", { name: /create an account/i }));
    fireEvent.submit(screen.getByRole("button", { name: /create account/i }).closest("form")!);
    expect(await screen.findByRole("status")).toHaveTextContent(/check your email/i);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Create your account");
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("autocomplete", "new-password");
  });

  it("recovers from thrown network errors without leaving the form busy", async () => {
    const signInWithPassword = vi.fn().mockRejectedValue(new Error("network unavailable"));
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(authClient({ signInWithPassword }) as never);
    render(<LoginForm nextPath="/" isAuthConfigured isAppleEnabled={false} shouldSync={false} />);
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "learner@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password" } });
    fireEvent.submit(screen.getByRole("button", { name: /sign in with email/i }).closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent(/try again/i);
    expect(screen.getByRole("button", { name: /sign in with email/i })).toBeEnabled();
  });

  it("keeps local progress after a failed sync and retries without signing in twice", async () => {
    const client = authClient();
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(client as never);
    vi.mocked(getAnonymousProgressItems).mockReturnValue([{ input: { surface: "document", slug: "cache", pathSlug: "", status: "started", position: {} } } as never]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(null, { status: 503 })).mockResolvedValueOnce(new Response('{"synced":1,"rejected":0}', { status: 200 })));
    render(<LoginForm nextPath="/learn" isAuthConfigured isAppleEnabled={false} shouldSync={false} />);
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "learner@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password" } });
    fireEvent.submit(screen.getByTestId("login-submit").closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent(/your progress stays on this device/i);
    expect(clearAnonymousProgressItems).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Retry sync" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/learn"));
    expect(client.auth.signInWithPassword).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(clearAnonymousProgressItems).toHaveBeenCalledTimes(1);
  });

  it("uses bounded sync batches for a learner with more than 20 local items", async () => {
    vi.mocked(getAnonymousProgressItems).mockReturnValue(Array.from({ length: 25 }, (_, index) => ({ input: { surface: "document", slug: `lesson-${index}`, pathSlug: "", status: "started", position: {} } } as never)));
    render(<LoginForm nextPath="/learn" isAuthConfigured isAppleEnabled={false} shouldSync={false} />);
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "learner@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password" } });
    fireEvent.submit(screen.getByTestId("login-submit").closest("form")!);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/learn"));
    expect(vi.mocked(fetch).mock.calls.map(([, init]) => JSON.parse(String(init?.body)).items.length)).toEqual([20, 5]);
  });

  it("completes callback synchronization for an authenticated user", async () => {
    vi.mocked(createBrowserSupabaseClient).mockReturnValue(authClient({
      getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
    }) as never);
    render(<LoginForm nextPath="/browse" isAuthConfigured isAppleEnabled={false} shouldSync />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/browse"));
  });
});
