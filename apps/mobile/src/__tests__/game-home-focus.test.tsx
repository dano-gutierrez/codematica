import { act, render } from "@testing-library/react-native";
import GameHome from "../../app/index";

const mockPush = jest.fn();
let mockFocusEffect: () => (() => void) | void;
let mockMapProps: { active: boolean; navigate: (route: string) => void };

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (effect: typeof mockFocusEffect) => { mockFocusEffect = effect; },
}));
jest.mock("@codematica/ui/game", () => ({
  NativeGameMap: (props: typeof mockMapProps) => { mockMapProps = props; return null; },
}));
jest.mock("../lib/game-store", () => ({ nativeGameStore: () => ({}) }));
jest.mock("../lib/supabase", () => ({ hasSupabasePublicEnv: () => false }));

it("passes map focus ownership through the route and retains navigation", async () => {
  await render(<GameHome />);
  expect(mockMapProps.active).toBe(false);
  let blur: (() => void) | void;
  await act(() => { blur = mockFocusEffect(); });
  expect(mockMapProps.active).toBe(true);
  mockMapProps.navigate("/learn");
  expect(mockPush).toHaveBeenCalledWith("/learn");
  await act(() => { if (blur) blur(); });
  expect(mockMapProps.active).toBe(false);
  await act(() => { mockFocusEffect(); });
  expect(mockMapProps.active).toBe(true);
});
