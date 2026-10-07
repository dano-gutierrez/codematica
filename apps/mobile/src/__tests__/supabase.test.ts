const mockCreateClient = jest.fn();
const mockCreateURL = jest.fn(() => "codematica://auth/callback");
const mockOpenAuthSessionAsync = jest.fn(async () => ({ type: "success", url: "codematica://auth/callback?code=code" }));
const mockOpenURL = jest.fn(async () => undefined);
const mockMaybeCompleteAuthSession = jest.fn();

jest.mock("@supabase/supabase-js", () => ({ createClient: mockCreateClient }));
jest.mock("react-native-url-polyfill/auto", () => ({}));
jest.mock("expo-linking", () => ({ createURL: mockCreateURL, openURL: mockOpenURL }));
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(),
}));
jest.mock("expo-web-browser", () => ({ __esModule: true, openAuthSessionAsync: mockOpenAuthSessionAsync, maybeCompleteAuthSession: mockMaybeCompleteAuthSession }));

describe("native Supabase configuration", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("stays optional without public environment values", () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    let module!: typeof import("../lib/supabase");
    jest.isolateModules(() => {
      // Jest's isolated module cache is CommonJS under the Expo preset.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module = require("../lib/supabase");
    });
    expect(module.hasSupabasePublicEnv()).toBe(false);
    expect(module.createNativeSupabaseClient()).toBeUndefined();
  });

  it("constructs an anon-safe persistent client and OAuth redirect", async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable";
    const expected = { auth: {} };
    mockCreateClient.mockReturnValue(expected);
    let module!: typeof import("../lib/supabase");
    jest.isolateModules(() => {
      // Jest's isolated module cache is CommonJS under the Expo preset.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module = require("../lib/supabase");
    });
    expect(module.hasSupabasePublicEnv()).toBe(true);
    expect(module.createNativeSupabaseClient()).toBe(expected);
    expect(module.createNativeSupabaseClient()).toBe(expected);
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(mockCreateClient).toHaveBeenCalledWith("https://example.supabase.co", "publishable", expect.objectContaining({
      auth: expect.objectContaining({ persistSession: true, detectSessionInUrl: false, flowType: "pkce" }),
    }));
    expect(module.getNativeAuthRedirectUrl()).toBe("codematica://auth/callback");
    await module.openAuthUrl("https://provider.example");
    expect(mockOpenAuthSessionAsync).toHaveBeenCalledWith("https://provider.example", "codematica://auth/callback");
    expect(mockOpenURL).toHaveBeenCalledWith("codematica://auth/callback?code=code");
  });

  it.each(["cancel", "dismiss", "wrong-path", "wrong-scheme", "wrong-host", "missing-code", "malformed"])("does not report a successful %s browser auth handoff", async kind => {
    let module!: typeof import("../lib/supabase");
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      module = require("../lib/supabase");
    });
    const urls: Record<string, string> = { "wrong-path": "codematica://auth/other?code=code", "wrong-scheme": "https://auth/callback?code=code", "wrong-host": "codematica://other/callback?code=code", "missing-code": "codematica://auth/callback", malformed: "not a URL" };
    mockOpenAuthSessionAsync.mockResolvedValueOnce({ type: ["cancel", "dismiss"].includes(kind) ? kind : "success", url: urls[kind] });
    await expect(module.openAuthUrl("https://provider.example")).rejects.toThrow(/sign-in/i);
    expect(mockOpenURL).not.toHaveBeenCalled();
  });
});
