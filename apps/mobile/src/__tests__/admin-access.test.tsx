import { act, renderHook, waitFor } from "@testing-library/react-native";
import { AppState } from "react-native";
import { useAdminAccess } from "../lib/use-admin-access";
import { createNativeSupabaseClient } from "../lib/supabase";
jest.mock("../lib/supabase", () => ({ createNativeSupabaseClient: jest.fn() }));
const create = createNativeSupabaseClient as jest.Mock;
beforeEach(() => { jest.spyOn(AppState, "addEventListener").mockReturnValue({ remove: jest.fn() }); });
afterEach(() => jest.restoreAllMocks());
it("checks native membership and responds to auth/app state changes", async () => {
  let changed = () => {}; const unsubscribe = jest.fn(); const rpc = jest.fn().mockResolvedValue({ data: true, error: null });
  create.mockReturnValue({ rpc, auth: { onAuthStateChange: (callback: () => void) => { changed = callback; return { data: { subscription: { unsubscribe } } }; } } });
  const appState = jest.spyOn(AppState,"addEventListener");
  const view = await renderHook(useAdminAccess); await waitFor(() => expect(view.result.current).toBe(true));
  rpc.mockResolvedValue({ data: false, error: null }); await act(async () => changed()); expect(view.result.current).toBe(false);
  rpc.mockResolvedValue({ data: true, error: null }); await act(async () => appState.mock.calls[0][1]("active")); expect(view.result.current).toBe(true);
  rpc.mockRejectedValue(new Error("offline")); await act(async () => changed()); expect(view.result.current).toBe(false);
  await view.unmount(); expect(unsubscribe).toHaveBeenCalled(); await act(async () => changed()); appState.mockRestore();
});
it("keeps native navigation public without configuration", async () => { create.mockReturnValue(undefined); const view = await renderHook(useAdminAccess); expect(view.result.current).toBe(false); });

it("cannot restore admin access from a stale check after sign out", async () => {
  let changed!: (event: string, session: unknown) => void;
  let finish!: (value: unknown) => void;
  create.mockReturnValue({ rpc: () => new Promise(resolve => { finish = resolve; }), auth: { onAuthStateChange: (callback: typeof changed) => { changed = callback; return { data: { subscription: { unsubscribe: jest.fn() } } }; } } });
  const view = await renderHook(useAdminAccess);
  await act(() => changed("SIGNED_OUT", null));
  await act(() => finish({ data: true, error: null }));
  expect(view.result.current).toBe(false);
});
