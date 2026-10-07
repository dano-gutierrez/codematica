import { act, renderHook, waitFor } from "@testing-library/react-native";
import { AppState } from "react-native";
import { useAccountSession } from "../lib/use-account-session";
import { createNativeSupabaseClient } from "../lib/supabase";
jest.mock("../lib/supabase", () => ({ createNativeSupabaseClient: jest.fn() }));

const user = { id: "user-1", email: "daniel@example.com", user_metadata: { full_name: "Daniel" } };
const create = createNativeSupabaseClient as jest.Mock;
beforeEach(() => { jest.spyOn(AppState, "addEventListener").mockReturnValue({ remove: jest.fn() }).mockClear(); });
afterEach(() => jest.restoreAllMocks());

it("updates account from auth events and ignores an older initial lookup", async () => {
  let changed!: (event: string, session: unknown) => void;
  let finish!: (value: unknown) => void;
  const unsubscribe = jest.fn();
  create.mockReturnValue({ auth: { getUser: () => new Promise(resolve => { finish = resolve; }), onAuthStateChange: (callback: typeof changed) => { changed = callback; return { data: { subscription: { unsubscribe } } }; }, signOut: jest.fn(async () => ({ error: null })) } });
  const view = await renderHook(useAccountSession);
  await act(() => changed("SIGNED_IN", { user }));
  expect(view.result.current.user).toEqual(user);
  await act(() => changed("SIGNED_OUT", null));
  await act(() => finish({ data: { user }, error: null }));
  expect(view.result.current.user).toBeNull();
  await view.unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  await act(() => changed("SIGNED_IN", { user }));
});

it("refreshes on foreground, signs out locally and retains account on a sign-out error", async () => {
  const getUser = jest.fn().mockResolvedValue({ data: { user }, error: null });
  const signOut = jest.fn().mockResolvedValueOnce({ error: { message: "offline" } }).mockResolvedValueOnce({ error: null });
  create.mockReturnValue({ auth: { getUser, signOut, onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }) } });
  const listen = jest.spyOn(AppState, "addEventListener");
  const view = await renderHook(useAccountSession);
  await waitFor(() => expect(view.result.current.user).toEqual(user));
  await expect(view.result.current.signOut()).rejects.toThrow("offline");
  expect(view.result.current.user).toEqual(user);
  await act(() => view.result.current.signOut());
  expect(signOut).toHaveBeenLastCalledWith({ scope: "local" });
  expect(view.result.current.user).toBeNull();
  getUser.mockRejectedValueOnce(new Error("offline"));
  await act(async () => listen.mock.calls[0][1]("active"));
  expect(view.result.current.isLoading).toBe(false);
  await act(async () => listen.mock.calls[0][1]("background"));
  expect(getUser).toHaveBeenCalledTimes(2);
  await view.unmount(); listen.mockRestore();
});

it("keeps unconfigured account anonymous and rejects unavailable sign-out", async () => {
  create.mockReturnValue(undefined);
  const view = await renderHook(useAccountSession);
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  expect(view.result.current.user).toBeNull();
  await expect(view.result.current.signOut()).rejects.toThrow(/not available/i);
});

it("keeps the known display identity offline but clears an invalidated session", async () => {
  const getUser = jest.fn().mockResolvedValueOnce({ data: { user }, error: null })
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ data: { user: null }, error: { name: "AuthRetryableFetchError" } })
    .mockResolvedValueOnce({ data: { user: null }, error: { name: "AuthSessionMissingError" } });
  create.mockReturnValue({ auth: { getUser, onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }) } });
  const listen = jest.spyOn(AppState, "addEventListener");
  const view = await renderHook(useAccountSession);
  await waitFor(() => expect(view.result.current.user).toEqual(user));
  await act(async () => listen.mock.calls[0][1]("active"));
  expect(view.result.current.user).toEqual(user);
  await act(async () => listen.mock.calls[0][1]("active"));
  expect(view.result.current.user).toEqual(user);
  await act(async () => listen.mock.calls[0][1]("active"));
  expect(view.result.current.user).toBeNull();
});
