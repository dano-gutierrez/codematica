import { act, renderHook, waitFor } from "@testing-library/react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAccountSession } from "./use-account-session";

const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("./client", () => ({ createBrowserSupabaseClient: mocks.create }));
const user = { id: "user-1", email: "learner@example.test", user_metadata: {} } as User;

function authClient() {
  let notify: (event: AuthChangeEvent, session: Session | null) => void = () => {};
  const unsubscribe = vi.fn();
  const getUser = vi.fn().mockResolvedValue({ data: { user }, error: null });
  mocks.create.mockReturnValue({ auth: {
    getUser,
    onAuthStateChange: (callback: typeof notify) => {
      notify = callback;
      return { data: { subscription: { unsubscribe } } };
    },
  } });
  return { getUser, unsubscribe, notify: (event: AuthChangeEvent, next: User | null) => notify(event, next ? { user: next } as Session : null) };
}

beforeEach(() => mocks.create.mockReset());

describe("navigation account session", () => {
  it("remains usable when Supabase is unconfigured", async () => {
    mocks.create.mockReturnValue(null);
    const { result } = renderHook(useAccountSession);
    await waitFor(() => expect(result.current).toEqual({ user: null, isLoading: false }));
  });

  it("loads the account and reflects sign-in, updates and sign-out events", async () => {
    const client = authClient();
    const { result, unmount } = renderHook(useAccountSession);
    await waitFor(() => expect(result.current.user).toEqual(user));
    expect(result.current.isLoading).toBe(false);
    const updated = { ...user, user_metadata: { full_name: "Learning User" } };
    act(() => client.notify("USER_UPDATED", updated));
    expect(result.current.user).toEqual(updated);
    act(() => client.notify("SIGNED_OUT", null));
    expect(result.current.user).toBeNull();
    act(() => client.notify("SIGNED_IN", user));
    expect(result.current.user).toEqual(user);
    unmount();
    expect(client.unsubscribe).toHaveBeenCalledOnce();
    act(() => client.notify("SIGNED_OUT", null));
    expect(result.current.user).toEqual(user);
  });

  it("does not restore a stale account after a newer auth event", async () => {
    const client = authClient();
    let resolve!: (value: unknown) => void;
    client.getUser.mockReturnValue(new Promise(done => { resolve = done; }));
    const { result } = renderHook(useAccountSession);
    expect(result.current.isLoading).toBe(true);
    act(() => client.notify("SIGNED_OUT", null));
    await act(async () => resolve({ data: { user }, error: null }));
    expect(result.current).toEqual({ user: null, isLoading: false });
  });

  it.each(["error", "exception"])("treats an initial %s as signed out", async (failure) => {
    const client = authClient();
    if (failure === "error") client.getUser.mockResolvedValue({ data: { user }, error: new Error("invalid") });
    else client.getUser.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(useAccountSession);
    await waitFor(() => expect(result.current).toEqual({ user: null, isLoading: false }));
  });

  it("ignores pending lookup results and errors after unmount", async () => {
    const client = authClient();
    let reject!: (error: Error) => void;
    client.getUser.mockReturnValue(new Promise((_done, fail) => { reject = fail; }));
    const { result, unmount } = renderHook(useAccountSession);
    unmount();
    await act(async () => reject(new Error("offline")));
    expect(result.current).toEqual({ user: null, isLoading: true });
  });
});
