import { fireEvent, render } from "@testing-library/react-native";
import { NativeNavigation } from "../../../../packages/ui/src/screens";

describe("adaptive native navigation", () => {
  it("keeps phone sections reachable and identifies the current section", async () => {
    const navigate = jest.fn();
    const view = await render(<NativeNavigation pathname="/interviews/google/number-of-islands" navigate={navigate} wide={false} />);
    expect(view.getByTestId("mobile-nav-more").props.accessibilityState).toEqual({ selected: true });
    await fireEvent.press(view.getByTestId("mobile-nav-paths"));
    expect(navigate).toHaveBeenCalledWith("/paths");
    await fireEvent.press(view.getByTestId("mobile-nav-more"));
    await fireEvent.press(view.getByTestId("mobile-menu-lessons"));
    expect(navigate).toHaveBeenCalledWith("/browse");
    expect(view.queryByTestId("mobile-menu-lessons")).toBeNull();
    await fireEvent.press(view.getByTestId("mobile-nav-more"));
    await fireEvent.press(view.getByTestId("mobile-menu-languages"));
    expect(navigate).toHaveBeenCalledWith("/languages");
    await fireEvent.press(view.getByTestId("mobile-nav-more"));
    await fireEvent.press(view.getByTestId("mobile-menu-close"));
    expect(view.queryByTestId("mobile-menu-languages")).toBeNull();
  });
  it("shows every destination on iPad and marks articles as lessons", async () => {
    const navigate = jest.fn();
    const view = await render(<NativeNavigation pathname="/docs/system-design/cache-invalidation" navigate={navigate} wide />);
    expect(view.getByTestId("mobile-nav-lessons").props.accessibilityState).toEqual({ selected: true });
    expect(view.queryByTestId("mobile-nav-more")).toBeNull();
    await fireEvent.press(view.getByRole("button", { name: "Codematica home" }));
    expect(navigate).toHaveBeenCalledWith("/");
    await fireEvent.press(view.getByTestId("mobile-nav-languages"));
    expect(navigate).toHaveBeenCalledWith("/languages");
    await fireEvent.press(view.getByTestId("mobile-nav-sign-in"));
    expect(navigate).toHaveBeenCalledWith("/login");
  });
});

// Exercise the real root shell's responsive decision as well as the shared control.
jest.mock("expo-router", () => ({
  Stack: () => null,
  usePathname: () => "/",
  useGlobalSearchParams:()=>({}),
  useRouter: () => ({ navigate: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: { children: import("react").ReactNode }) => children,
  SafeAreaView: "SafeAreaView",
}));

import { Dimensions } from "react-native";
import RootLayout from "../../app/_layout";

describe("native window adaptation", () => {
  const originalWindow = Dimensions.get("window");
  afterEach(() => Dimensions.set({ window: originalWindow }));
  it.each([
    [320, 1, "mobile-navigation-bar"],
    [834, 1, "mobile-navigation-rail"],
    [507, 1, "mobile-navigation-bar"],
    [834, 2, "mobile-navigation-bar"],
  ])("adapts a %dpt window at %dx text size", async (width, fontScale, testId) => {
    Dimensions.set({ window: { width: Number(width), height: 900, scale: 2, fontScale: Number(fontScale) } });
    const view = await render(<RootLayout />);
    expect(view.getByTestId(String(testId))).toBeOnTheScreen();
  });
});
