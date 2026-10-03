import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAdminAccess } from "./use-admin-access";
const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("./client", () => ({ createBrowserSupabaseClient: mocks.create }));
describe("admin navigation membership", () => {
  it("hides navigation when unconfigured", () => { mocks.create.mockReturnValue(null); const { result } = renderHook(useAdminAccess); expect(result.current).toBe(false); });
  it("refreshes on authentication and focus and fails closed", async () => {
    let callback = () => {}; const unsubscribe = vi.fn(); const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    mocks.create.mockReturnValue({ rpc, auth: { onAuthStateChange: (cb: () => void) => { callback = cb; return { data: { subscription: { unsubscribe } } }; } } });
    const { result, unmount } = renderHook(useAdminAccess); await waitFor(() => expect(result.current).toBe(true));
    rpc.mockResolvedValue({ data: false, error: null }); await act(async () => callback()); expect(result.current).toBe(false);
    rpc.mockResolvedValue({ data: true, error: null }); await act(async () => window.dispatchEvent(new Event("focus"))); expect(result.current).toBe(true);
    rpc.mockRejectedValue(new Error("offline")); await act(async () => callback()); expect(result.current).toBe(false);
    unmount(); expect(unsubscribe).toHaveBeenCalled(); await act(async () => callback());
  });
});
