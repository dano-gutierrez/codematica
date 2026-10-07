import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AuthCallbackRoute from "../../app/auth/callback";

const mockParams: { code?: string; error?: string } = {};
const mockExchange = jest.fn();
const mockSync = jest.fn();
const mockReplace = jest.fn();
const mockRedirect = jest.fn((_props: unknown) => null);
let mockConfigured = true;
jest.mock("expo-router", () => ({ useLocalSearchParams: () => mockParams, useRouter: () => ({ replace: mockReplace }), Redirect: (props: unknown) => mockRedirect(props) }));
jest.mock("../lib/supabase", () => ({ createNativeSupabaseClient: () => mockConfigured ? { auth: { exchangeCodeForSession: mockExchange } } : undefined }));
jest.mock("../lib/progress", () => ({ syncNativeAnonymousProgress: () => mockSync() }));

beforeEach(() => {
  jest.clearAllMocks(); mockConfigured = true; mockParams.code = "one-use-code"; delete mockParams.error;
  mockExchange.mockResolvedValue({ error: null }); mockSync.mockResolvedValue({ synced: 1, rejected: 0 });
});

it.each(["missing", "unconfigured", "provider", "rejected", "network"])("keeps the %s callback failure visible with a sign-in recovery", async kind => {
  if (kind === "missing") delete mockParams.code;
  if (kind === "unconfigured") mockConfigured = false;
  if (kind === "provider") mockParams.error = "access_denied";
  if (kind === "rejected") mockExchange.mockResolvedValue({ error: { message: "expired" } });
  if (kind === "network") mockExchange.mockRejectedValue(new Error("offline"));
  const view = await render(<AuthCallbackRoute />);
  await waitFor(() => expect(view.getByTestId("mobile-auth-callback-error")).toBeOnTheScreen());
  expect(mockRedirect).not.toHaveBeenCalled(); expect(mockSync).not.toHaveBeenCalled();
  await fireEvent.press(view.getByRole("button", { name: "Return to sign in" }));
  expect(mockReplace).toHaveBeenCalledWith("/login");
});

it.each(["rejected", "network"])("retries %s progress sync without consuming the auth code twice", async kind => {
  if (kind === "rejected") mockSync.mockResolvedValueOnce({ synced: 0, rejected: 1 });
  else mockSync.mockRejectedValueOnce(new Error("offline"));
  const view = await render(<AuthCallbackRoute />);
  await waitFor(() => expect(view.getByRole("button", { name: "Retry sync" })).toBeOnTheScreen());
  expect(mockRedirect).not.toHaveBeenCalled();
  await fireEvent.press(view.getByRole("button", { name: "Retry sync" }));
  await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ href: "/" })));
  expect(mockExchange).toHaveBeenCalledTimes(1); expect(mockSync).toHaveBeenCalledTimes(2);
});

it("lets a signed-in learner continue with local progress retained", async () => {
  mockSync.mockResolvedValueOnce({ synced: 0, rejected: 1 });
  const view = await render(<AuthCallbackRoute />);
  await waitFor(() => expect(view.getByRole("button", { name: "Continue" })).toBeOnTheScreen());
  await fireEvent.press(view.getByRole("button", { name: "Continue" }));
  expect(mockReplace).toHaveBeenCalledWith("/");
  expect(mockExchange).toHaveBeenCalledTimes(1);
});

it("redirects only after a completed sign-in and successful sync", async () => {
  await render(<AuthCallbackRoute />);
  await waitFor(() => expect(mockRedirect).toHaveBeenCalledWith(expect.objectContaining({ href: "/" })));
  expect(mockExchange).toHaveBeenCalledWith("one-use-code"); expect(mockSync).toHaveBeenCalledTimes(1);
});
