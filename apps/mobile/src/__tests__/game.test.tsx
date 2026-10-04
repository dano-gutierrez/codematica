/* eslint-disable @typescript-eslint/no-require-imports -- Hoisted Jest mock factories need a local React import. */
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { AppState, AccessibilityInfo, type AppStateStatus } from "react-native";
import { getContentIndex } from "@codematica/core";
import {
  GameStore,
  emptyGameProgress,
  awardScenario,
  getGameSession,
} from "@codematica/core/game";
import {
  NativeGameMap,
  NativeGamePlay,
} from "../../../../packages/ui/src/game/screens";
import { miniatureScene } from "@codematica/core/game";
import { NativeGameScene } from "../../../../packages/ui/src/game/NativeGameScene";
import { NativeDistrictArt } from "../../../../packages/ui/src/game/NativeDistrictArt";
const mockFrames: ((frame: {
  timeSincePreviousFrame: number | null;
}) => void)[] = [];
jest.mock("react-native-reanimated", () => ({
  useSharedValue: (initial: number) => {
    const React = require("react");
    return React.useState(() => ({
      value: initial,
      set(next: number | ((v: number) => number)) {
        this.value = typeof next === "function" ? next(this.value) : next;
      },
    }))[0];
  },
  useDerivedValue: (fn: () => unknown) => ({ value: fn() }),
  useFrameCallback: (
    fn: (frame: { timeSincePreviousFrame: number | null }) => void,
  ) => {
    mockFrames.push(fn);
    return { setActive: jest.fn() };
  },
}));
const mockAtlasProps: {
  transforms: { value: unknown };
  colors: { value: string[] };
}[] = [];
const mockSceneryProps: { y: number | { value: number } }[] = [];
let mockImage: object | null = { texture: true };
jest.mock("@shopify/react-native-skia", () => ({
  Canvas: "Canvas",
  Atlas: (props: (typeof mockAtlasProps)[number]) => {
    mockAtlasProps.push(props);
    return null;
  },
  Image: (props: (typeof mockSceneryProps)[number]) => {
    mockSceneryProps.push(props);
    return null;
  },
  rect: (x: number, y: number, width: number, height: number) => ({
    x,
    y,
    width,
    height,
  }),
  useImage: () => mockImage,
  Skia: {
    RSXform: (...values: number[]) => values,
    Color: (color: string) => color,
  },
}));
const campaign = getContentIndex().gameCampaigns[0];
function storeAt(order: number, mastery = false) {
  let p = emptyGameProgress();
  for (const l of campaign.levels.slice(0, order + (mastery ? 1 : 0)))
    p = awardScenario(p, campaign, l.id, "main", "standard");
  return new GameStore(campaign, {
    getItem: () => JSON.stringify(p),
    setItem: jest.fn(),
  });
}
async function open(order: number, scenario = "main") {
  const level = campaign.levels[order],
    store = storeAt(order, scenario !== "main"),
    session = getGameSession(campaign.id, level);
  session.choose(scenario);
  session.reset();
  const navigate = jest.fn();
  const view = await render(
    <NativeGamePlay
      campaign={campaign}
      level={level}
      store={store}
      navigate={navigate}
      workerSource="worker"
    />,
  );
  await waitFor(() => expect(view.getByTestId("game-play")).toBeOnTheScreen());
  return { view, session, store, navigate };
}
beforeEach(() => {
  mockImage = { texture: true };
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(false);
});
afterEach(() => jest.restoreAllMocks());
it("shows the chapter, navigation, list, locks and earned wardrobe controls", async () => {
  const store = storeAt(4);
  await store.load();
  let p = store.getSnapshot();
  for (const id of ["mastery-1", "mastery-2"])
    p = awardScenario(p, campaign, campaign.levels[0].id, id, "standard");
  await store.save(p);
  const navigate = jest.fn();
  const view = await render(
    <NativeGameMap campaign={campaign} store={store} navigate={navigate} />,
  );
  await waitFor(() => expect(view.getByTestId("game-level-5")).toBeEnabled());
  await fireEvent(view.getByTestId("game-map"), "layout", {
    nativeEvent: { layout: { height: 700 } },
  });
  await fireEvent(view.getByTestId("game-district-canal"), "layout", {
    nativeEvent: { layout: { y: 1000 } },
  });
  await fireEvent(view.getByTestId("game-stop-5"), "layout", {
    nativeEvent: { layout: { y: 600, height: 150 } },
  });
  await fireEvent.press(view.getByTestId("game-continue"));
  expect(navigate).toHaveBeenCalledWith("/play/restore-the-signal/crossfire");
  await fireEvent.press(view.getByRole("button", { name: "Level list" }));
  await fireEvent.press(view.getByRole("button", { name: "Explore lessons" }));
  expect(navigate).toHaveBeenCalledWith("/learn");
  await fireEvent.press(view.getByRole("button", { name: "antenna" }));
  expect(store.getSnapshot().cosmetic).toBe("antenna");
  await fireEvent(view.getByTestId("game-map"), "scroll", {
    nativeEvent: { contentOffset: { y: 1200 } },
  });
  await fireEvent(view.getByTestId("game-map"), "contentSizeChange", 400, 3500);
  await fireEvent.press(view.getByRole("button", { name: "Map" }));
});
it("keeps locked levels inaccessible and opens the map", async () => {
  const navigate = jest.fn();
  const view = await render(
    <NativeGamePlay
      campaign={campaign}
      level={campaign.levels[1]}
      store={storeAt(0)}
      navigate={navigate}
      workerSource=""
    />,
  );
  await waitFor(() =>
    expect(view.getByText(/Complete the preceding level/)).toBeOnTheScreen(),
  );
  await fireEvent.press(view.getByRole("button", { name: "Story map" }));
  expect(navigate).toHaveBeenCalledWith("/");
});
it("edits CSS, handles the isolated runner reply, rejects unrelated messages, and resets", async () => {
  const { view, session, store } = await open(0);
  await fireEvent.changeText(
    view.getByTestId("game-code"),
    "grid-column: 2 / 3;",
  );
  await fireEvent.press(view.getByTestId("game-run"));
  await fireEvent(view.getByTestId("game-play"), "scroll", {
    nativeEvent: { contentOffset: { y: 800 } },
  });
  const frame = view.getByTestId("game-sandbox"),
    nonce = JSON.parse(
      frame.props.source.html.match(/const data=(.*);\nconst send/)[1],
    ).nonce;
  await fireEvent(frame, "message", {
    nativeEvent: {
      data: JSON.stringify({
        channel: "other",
        nonce,
        result: { passed: true },
      }),
    },
  });
  expect(session.getSnapshot().attempt.phase).toBe("briefing");
  await fireEvent(frame, "message", {
    nativeEvent: {
      data: JSON.stringify({
        channel: "codematica-game",
        nonce,
        result: { passed: true, reasons: [], events: ["Target covered"] },
      }),
    },
  });
  expect(Object.keys(store.getSnapshot().awards)).toHaveLength(1);
  await fireEvent.press(view.getByTestId("game-scenario-mastery-1"));
  await fireEvent.press(view.getByTestId("game-reset"));
  expect(session.getSnapshot().attempt.phase).toBe("briefing");
});
it("renders SQL fixtures and exposes retryable errors without network execution", async () => {
  const { view, session } = await open(1);
  expect(
    view.getByText("zombies: id | kind | zone | threat | shield"),
  ).toBeOnTheScreen();
  await fireEvent.press(view.getByTestId("game-run"));
  const frame = view.getByTestId("game-sandbox");
  expect(
    frame.props.onShouldStartLoadWithRequest({ url: "https://example.com" }),
  ).toBe(false);
  expect(frame.props.onShouldStartLoadWithRequest({ url: "about:blank" })).toBe(
    true,
  );
  await fireEvent(frame, "message", { nativeEvent: { data: "{broken" } });
  await fireEvent(frame, "error");
  expect(session.getSnapshot().result?.passed).toBe(false);
  await fireEvent.press(view.getByTestId("game-reset"));
});
it.each(
  campaign.levels.flatMap((l, i) =>
    l.scenarios
      .filter((s) => s.kind === "pipes" || s.kind === "system")
      .map((s) => [i, s.id] as const),
  ),
)("plays touch graph scenario level %i %s", async (order, id) => {
  const { view, session } = await open(order, id);
  const scenario = session.getSnapshot().scenario;
  if (scenario.kind === "pipes") {
    await fireEvent.press(view.getByTestId("game-run"));
    await fireEvent.press(view.getByTestId("game-run"));
    for (const e of scenario.solution) {
      await fireEvent.press(view.getByTestId(`game-port-${e.from}`));
      await fireEvent.press(view.getByTestId(`game-port-${e.to}`));
    }
  } else if (scenario.kind === "system") {
    if (campaign.levels[order].mode === "defense")
      await fireEvent.press(
        view.getByRole("button", { name: "Use assisted untimed mode" }),
      );
    for (const id of scenario.solution.nodes)
      await fireEvent.press(view.getByTestId(`game-piece-${id}`));
    for (const e of scenario.solution.edges) {
      await fireEvent.press(view.getByTestId(`game-connect-${e.from}`));
      await fireEvent.press(view.getByTestId(`game-connect-${e.to}`));
    }
    if (scenario.solution.invalidate)
      await fireEvent.press(
        view.getByRole("button", { name: "Invalidate after writes: off" }),
      );
    if (scenario.solution.routing === "capacity-weighted")
      await fireEvent.press(view.getByTestId("game-routing"));
  }
  await fireEvent.press(view.getByTestId("game-run"));
  expect(session.getSnapshot().attempt.phase).toBe("won");
});
it("pauses in the background and freezes edits until explicit resume", async () => {
  const background: ((state: AppStateStatus) => void)[] = [];
  jest.spyOn(AppState, "addEventListener").mockImplementation((_name, fn) => {
    background.push(fn);
    return { remove: jest.fn() };
  });
  const { view, session } = await open(7);
  await fireEvent.press(view.getByTestId("game-run"));
  await fireEvent.press(view.getByTestId("game-pause"));
  expect(view.getByTestId("game-piece-client")).toBeDisabled();
  await fireEvent.press(view.getByTestId("game-resume"));
  await act(() => {
    background.forEach((fn) => fn("background"));
  });
  expect(session.getSnapshot().attempt.phase).toBe("paused");
  await fireEvent.press(view.getByTestId("game-resume"));
  await fireEvent.press(view.getByTestId("game-hint"));
});
it("renders every expression, attachment and reduced-motion scenery without affecting grading", async () => {
  const view = await render(<NativeGameScene />);
  for (const state of [
    "walk",
    "work",
    "attack",
    "reaction",
    "recovery",
    "celebrate",
  ] as const) {
    await view.rerender(<NativeGameScene state={state} cosmetic="beacon" />);
    await act(() => mockFrames.at(-1)?.({ timeSincePreviousFrame: 16 }));
  }
  await view.rerender(<NativeGameScene paused cosmetic="toolbelt" />);
  await act(() => mockFrames.at(-1)?.({ timeSincePreviousFrame: null }));
  await view.unmount();
  for (const district of ["garden", "canal", "tower"] as const) {
    const v = await render(
      <NativeDistrictArt
        district={district}
        scroll={{ value: 700 } as never}
        restored
        details={4}
      />,
    );
    await v.unmount();
  }
  mockImage = null;
  await render(<NativeGameScene />);
});

it("fits the native miniatures to their measured container while paused", async () => {
  const view = await render(<NativeGameScene paused cosmetic="beacon" />);
  await fireEvent(view.getByTestId("game-scene"), "layout", {
    nativeEvent: { layout: { width: 280, height: 180 } },
  });
  const expected = miniatureScene(280, 180, "idle", 0, "beacon").layers;
  expect(mockAtlasProps.at(-1)!.transforms.value).toEqual(
    expected.map((p) => [p.scos, p.ssin, p.tx, p.ty]),
  );
  await fireEvent(view.getByTestId("game-scene"), "layout", {
    nativeEvent: { layout: { width: 620, height: 180 } },
  });
  expect(mockAtlasProps.at(-1)!.transforms.value).toEqual(
    miniatureScene(620, 180, "idle", 0, "beacon").layers.map((p) => [
      p.scos,
      p.ssin,
      p.tx,
      p.ty,
    ]),
  );
  await view.rerender(<NativeGameScene paused state="celebrate" />);
  expect(mockAtlasProps.at(-1)!.colors.value.at(-1)).toBe(
    "rgba(255,255,255,0.35)",
  );
});

it("ticks only the focused copy of a level when returning from a lesson", async () => {
  jest.useFakeTimers();
  try {
    const { view, session, store, navigate } = await open(7);
    const props = {
      campaign,
      level: campaign.levels[7],
      store,
      navigate,
      workerSource: "worker",
    };
    await view.rerender(<NativeGamePlay {...props} active={false} />);
    const returned = await render(<NativeGamePlay {...props} active />);
    await waitFor(() =>
      expect(returned.getByTestId("game-play")).toBeOnTheScreen(),
    );
    const tick = jest.spyOn(session, "tick");
    await act(() => {
      session.run();
      jest.advanceTimersByTime(1000);
    });
    expect(tick).toHaveBeenCalledTimes(1);
    expect(session.getSnapshot().attempt.elapsed).toBe(1);
    await returned.rerender(<NativeGamePlay {...props} active={false} />);
    await act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(session.getSnapshot().attempt.phase).toBe("paused");
    expect(session.getSnapshot().attempt.elapsed).toBe(1);
    await returned.rerender(<NativeGamePlay {...props} active />);
    expect(session.getSnapshot().attempt.phase).toBe("paused");
    await act(() => {
      session.resume();
      jest.advanceTimersByTime(1000);
    });
    expect(session.getSnapshot().attempt.elapsed).toBe(2);
  } finally {
    jest.useRealTimers();
  }
});

it.each(["reset", "blur", "unmount"])(
  "ignores retained runner callbacks after %s",
  async (interruption) => {
    const { view, session, store, navigate } = await open(0);
    await fireEvent.press(view.getByTestId("game-run"));
    const { onMessage, onError, source } =
      view.getByTestId("game-sandbox").props;
    const nonce = JSON.parse(
      source.html.match(/const data=(.*);\nconst send/)[1],
    ).nonce;
    if (interruption === "reset")
      await fireEvent.press(view.getByTestId("game-reset"));
    else if (interruption === "blur")
      await view.rerender(
        <NativeGamePlay
          campaign={campaign}
          level={campaign.levels[0]}
          store={store}
          navigate={navigate}
          workerSource="worker"
          active={false}
        />,
      );
    else await view.unmount();
    const submit = jest.spyOn(session, "submit");
    await act(() => {
      onMessage({
        nativeEvent: {
          data: JSON.stringify({
            channel: "codematica-game",
            nonce,
            result: { passed: true, reasons: [], events: [] },
          }),
        },
      });
      onError();
    });
    expect(submit).not.toHaveBeenCalled();
    expect(session.getSnapshot().attempt.phase).toBe("briefing");
    expect(Object.keys(store.getSnapshot().awards)).toHaveLength(0);
  },
);

it("reserves fifty map positions but only exposes twelve campaign controls", async () => {
  const view = await render(
    <NativeGameMap
      campaign={campaign}
      store={storeAt(0)}
      navigate={jest.fn()}
    />,
  );
  const frontier = view.getByTestId("game-frontier-summit-0");
  expect(frontier).toBeOnTheScreen();
  await fireEvent(frontier, "layout", { nativeEvent: { layout: { y: 0 } } });
  await fireEvent.press(
    view.getAllByRole("button", { name: "Return to current level" })[0],
  );
  expect(view.queryByTestId("game-level-13")).toBeNull();
  await fireEvent.press(view.getByRole("button", { name: "Level list" }));
  expect(view.queryByTestId("game-frontier-summit-0")).toBeNull();
  expect(view.getByTestId("game-level-12")).toBeOnTheScreen();
});
it("renders three native depths, resets them for reduced motion, and keeps terrain static", async () => {
  const listener = jest.spyOn(AccessibilityInfo, "addEventListener");
  const v = await render(
    <NativeDistrictArt
      district="garden"
      scroll={{ value: 800 } as never}
      panelTop={400}
      restored={false}
      details={0}
    />,
  );
  const props = mockSceneryProps.slice(-4);
  expect(
    new Set(props.slice(1).map((p) => (p.y as { value: number }).value)).size,
  ).toBe(3);
  expect(props[0].y).toBe((-620 * 64) / 1152);
  await fireEvent(
    v.getByTestId("game-district-art", { includeHiddenElements: true }),
    "layout",
    { nativeEvent: { layout: { width: 400, height: 800 } } },
  );
  expect(mockSceneryProps.at(-4)!.y).toBe((-800 * 64) / 1152);
  await act(() =>
    (listener.mock.calls.at(-1)![1] as unknown as (v: boolean) => void)(true),
  );
  expect(
    mockSceneryProps.slice(-3).map((p) => (p.y as { value: number }).value),
  ).toEqual([0, 0, 0]);
  await v.rerender(
    <NativeDistrictArt
      district="canal"
      scroll={{ value: 700 } as never}
      panelTop={100}
      restored
      details={4}
    />,
  );
  await v.unmount();
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(true);
  await render(
    <NativeDistrictArt
      district="tower"
      scroll={{ value: 9000 } as never}
      restored
      details={4}
    />,
  );
  await waitFor(() =>
    expect(
      mockSceneryProps.slice(-3).map((p) => (p.y as { value: number }).value),
    ).toEqual([0, 0, 0]),
  );
});
