import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { getContentIndex } from "@codematica/core";
import {
  GameStore,
  awardScenario,
  emptyGameProgress,
} from "@codematica/core/game";
import { GameMap } from "./GameMap";
import { GameDistrictArt } from "./GameDistrictArt";
import { GameLessonReturn } from "./GameLessonReturn";
const c = getContentIndex().gameCampaigns[0];
let store: GameStore;
let returnTo: string | null = null;
vi.mock("@/lib/game/store", () => ({ webGameStore: () => store }));
vi.mock("./GameScene", () => ({ GameScene: () => <div>Patch</div> }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => returnTo }),
}));
let observer: (entries: { isIntersecting: boolean }[]) => void;
beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal("scrollTo", vi.fn());
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false })),
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: typeof observer) {
        observer = cb;
      }
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
});
it("opens the current signal, offers an ascending level list, saves scroll, and earns cosmetics", async () => {
  let p = emptyGameProgress();
  for (const l of c.levels.slice(0, 4))
    p = awardScenario(p, c, l.id, "main", "standard");
  for (const s of ["mastery-1", "mastery-2"])
    p = awardScenario(p, c, c.levels[0].id, s, "standard");
  store = new GameStore(c, {
    getItem: () => JSON.stringify(p),
    setItem: vi.fn(),
  });
  render(<GameMap campaign={c} />);
  await waitFor(() => expect(screen.getByTestId("game-level-5")).toBeEnabled());
  expect(screen.getByTestId("game-level-6")).toBeDisabled();
  fireEvent.click(screen.getByTestId("game-map-view"));
  expect(screen.getByRole("button", { name: "Map" })).toBeVisible();
  expect(
    screen.getAllByRole("link", { name: /Level \d:/ })[0],
  ).toHaveAccessibleName(/Level 1:/);
  fireEvent.click(screen.getByTestId("game-continue"));
  expect(sessionStorage.getItem("game-map-scroll")).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "antenna" }));
  await waitFor(() => expect(store.getSnapshot().cosmetic).toBe("antenna"));
  fireEvent(window, new Event("scroll"));
});
it("restores map scroll and defers scenery until its district approaches the viewport", async () => {
  sessionStorage.setItem("game-map-scroll", "2400");
  store = new GameStore(c, { getItem: () => null, setItem: vi.fn() });
  const map = render(<GameMap campaign={c} />);
  await waitFor(() => expect(window.scrollTo).toHaveBeenCalledWith(0, 2400));
  map.unmount();
  const view = render(
    <GameDistrictArt district="canal" restored details={4} />,
  );
  expect(view.container.innerHTML).not.toContain("canal.webp");
  act(() => observer([{ isIntersecting: true }]));
  expect(view.container.innerHTML).toContain("canal-restored.webp");
  act(() => observer([{ isIntersecting: false }]));
  expect(view.container.innerHTML).not.toContain("canal.webp");
});
it("allows only local campaign paths in the lesson return affordance", () => {
  for (const value of [null, "https://example.com", "/play/a/b?bad=1"]) {
    returnTo = value;
    const view = render(<GameLessonReturn />);
    expect(view.queryByTestId("game-return")).toBeNull();
    view.unmount();
  }
  returnTo = "/play/restore-the-signal/target-lock";
  render(<GameLessonReturn />);
  expect(screen.getByTestId("game-return")).toHaveAttribute("href", returnTo);
});
