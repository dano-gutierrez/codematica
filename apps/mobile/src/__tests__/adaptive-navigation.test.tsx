jest.mock("../lib/use-admin-access", () => ({ useAdminAccess: () => false }));
import { act, fireEvent, render } from "@testing-library/react-native";
import { NativeNavigation } from "../../../../packages/ui/src/screens";

describe("adaptive native navigation", () => {
  it("fits phone tab labels on one line while allowing text scaling", async () => {
    const view = await render(<NativeNavigation pathname="/" navigate={jest.fn()} wide={false} />);
    for (const label of ["Play", "Learn", "Paths", "Practice", "More"]) {
      const text = view.getByText(label);
      expect(text.props.numberOfLines).toBe(1);
      expect(text.props.adjustsFontSizeToFit).toBe(true);
      expect(text.props.allowFontScaling).not.toBe(false);
    }
  });
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
  it("keeps tablet labels naturally wrapping at the system text size", async () => {
    const view = await render(<NativeNavigation pathname="/" navigate={jest.fn()} wide isAdmin />);
    for (const label of ["Play", "Learn", "Paths", "Lessons", "Practice", "Interviews", "Languages", "LinkedIn"]) {
      const text = view.getByText(label);
      expect(text.props.numberOfLines).toBeUndefined();
      expect(text.props.adjustsFontSizeToFit).toBe(false);
      expect(text.props.allowFontScaling).not.toBe(false);
    }
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
  afterEach(async () => { await act(() => Dimensions.set({ window: originalWindow })); });
  it.each([
    [320, 1, "mobile-navigation-bar"],
    [834, 1, "mobile-navigation-rail"],
    [507, 1, "mobile-navigation-bar"],
    [834, 2, "mobile-navigation-bar"],
  ])("adapts a %dpt window at %dx text size", async (width, fontScale, testId) => {
    await act(() => Dimensions.set({ window: { width: Number(width), height: 900, scale: 2, fontScale: Number(fontScale) } }));
    const view = await render(<RootLayout />);
    expect(view.getByTestId(String(testId))).toBeOnTheScreen();
  });
});

it("exposes editorial navigation only for admins", async () => {
  const navigate=jest.fn();const view=await render(<NativeNavigation pathname="/admin/linkedin" navigate={navigate} wide={false} isAdmin />);
  await fireEvent.press(view.getByTestId("mobile-nav-more")); await fireEvent.press(view.getByTestId("mobile-menu-linkedin")); expect(navigate).toHaveBeenCalledWith("/admin/linkedin");
  await view.rerender(<NativeNavigation pathname="/admin/linkedin" navigate={navigate} wide isAdmin />);
  expect(view.getByTestId("mobile-nav-linkedin")).toBeOnTheScreen();
});

it("shows Japanese notebook links inside the tablet language menu and phone More",async()=>{
 const navigate=jest.fn(),view=await render(<NativeNavigation pathname="/languages/japanese/notebooks" navigate={navigate} wide/>);
 await fireEvent.press(view.getByTestId("mobile-nav-japanese"));await fireEvent.press(view.getByTestId("mobile-nav-notebooks"));await fireEvent.press(view.getByTestId("mobile-nav-languages-expand"));expect(view.queryByTestId("mobile-nav-notebooks")).toBeNull();await fireEvent.press(view.getByTestId("mobile-nav-languages-expand"));
 await view.rerender(<NativeNavigation pathname="/practice/languages/japanese-hiragana-vowels-writing" navigate={navigate} wide={false}/>);await fireEvent.press(view.getByTestId("mobile-nav-more"));await fireEvent.press(view.getByTestId("mobile-menu-japanese"));expect(navigate).toHaveBeenCalledWith("/languages/japanese");
});
