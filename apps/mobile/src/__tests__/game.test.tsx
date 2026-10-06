/* eslint-disable @typescript-eslint/no-require-imports -- Hoisted Jest mock factories need a local React import. */
import { act, fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { AppState, AccessibilityInfo, DeviceEventEmitter, Platform, Dimensions, type AppStateStatus, ScrollView, StyleSheet } from "react-native";
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
const mockSetPlaybackActive = jest.fn();
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
    return { setActive: mockSetPlaybackActive };
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
it("keeps the Android game editor above the keyboard without replacing the native draft", async () => {
  const originalPlatform = Platform.OS;
  Object.defineProperty(Platform, "OS", { value: "android", configurable: true });
  try {
    const { view } = await open(0);
    const input = view.getByTestId("game-code");
    const frame = view.root!;
    await fireEvent(frame, "layout", {
      persist: jest.fn(), nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 700 } },
    });
    await act(() => { DeviceEventEmitter.emit("keyboardDidShow", {
      duration: 0, easing: "keyboard", endCoordinates: { screenX: 0, screenY: 300, width: 390, height: 400 },
    }); });
    expect(StyleSheet.flatten(view.root!.props.style).height).toBe(300);
    expect(view.getByTestId("game-code")).toBe(input);
    await act(() => { DeviceEventEmitter.emit("keyboardDidHide", {}); });
    expect(StyleSheet.flatten(view.root!.props.style).height).toBeUndefined();
    expect(view.getByTestId("game-code")).toBe(input);
  } finally {
    Object.defineProperty(Platform, "OS", { value: originalPlatform, configurable: true });
  }
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
it.each([0, campaign.levels.findIndex((level) => level.id === "threat-scanner")])(
  "keeps native code entry stable and reseeds only on explicit reset or scenario choice at level %i",
  async (order) => {
    const { view, session } = await open(order, "mastery-1");
    const scenario = session.getSnapshot().scenario;
    if (scenario.kind !== "grid" && scenario.kind !== "sql") throw new Error("Expected code scenario");
    const input = view.getByTestId("game-code");
    expect(input.props.value).toBeUndefined();
    expect(input.props.defaultValue).toBe(scenario.starter);
    await fireEvent.changeText(input, scenario.solution);
    expect(session.getSnapshot().code).toBe(scenario.solution);
    expect(input).toBeOnTheScreen();
    expect(view.getByTestId("game-code").props.defaultValue).toBe(scenario.starter);
    await fireEvent.press(view.getByTestId("game-run"));
    const payload = JSON.parse(view.getByTestId("game-sandbox").props.source.html.match(/const data=(.*);\nconst send/)[1]);
    expect(payload.source).toBe(scenario.solution);
    await fireEvent.press(view.getByTestId("game-reset"));
    expect(input).not.toBeOnTheScreen();
    expect(view.getByTestId("game-code").props.defaultValue).toBe(scenario.starter);
    await fireEvent.changeText(view.getByTestId("game-code"), "temporary draft");
    await fireEvent.press(view.getByTestId("game-scenario-main"));
    const main = session.getSnapshot().scenario;
    if (main.kind !== "grid" && main.kind !== "sql") throw new Error("Expected code scenario");
    expect(view.getByTestId("game-code").props.defaultValue).toBe(main.starter);
    const mainInput = view.getByTestId("game-code");
    await fireEvent.changeText(mainInput, "another draft");
    await fireEvent.press(view.getByTestId("game-scenario-main"));
    expect(mainInput).not.toBeOnTheScreen();
    expect(view.getByTestId("game-code").props.defaultValue).toBe(main.starter);
    expect(session.getSnapshot().code).toBe(main.starter);
  },
);
it("ignores a code event from an editor replaced by reset or scenario choice", async () => {
  const { view, session } = await open(1, "mastery-1");
  const oldChange = view.getByTestId("game-code").props.onChangeText;
  await fireEvent.press(view.getByTestId("game-reset"));
  const seed = session.getSnapshot().code;
  await act(() => { oldChange("late text from before reset"); });
  expect(session.getSnapshot().code).toBe(seed);
  const resetChange = view.getByTestId("game-code").props.onChangeText;
  await fireEvent.press(view.getByTestId("game-scenario-main"));
  const mainSeed = session.getSnapshot().code;
  await act(() => { resetChange("late text from the previous scenario"); });
  expect(session.getSnapshot().code).toBe(mainSeed);
});
it("runs the latest native text when an edit and Run arrive before the next render", async () => {
  const { view, session } = await open(1);
  const scenario = session.getSnapshot().scenario;
  if (scenario.kind !== "sql") throw new Error("Expected SQL scenario");
  const change = view.getByTestId("game-code").props.onChangeText;
  const run = view.getByTestId("game-run");
  await act(async () => { change(scenario.solution); await fireEvent.press(run); });
  const payload = JSON.parse(view.getByTestId("game-sandbox").props.source.html.match(/const data=(.*);\nconst send/)[1]);
  expect(payload.source).toBe(scenario.solution);
});
it("runs one current scenario and code snapshot when a scenario changes before the next render", async () => {
  const { view, session } = await open(1, "mastery-1");
  const run = view.getByTestId("game-run");
  await act(async () => { session.choose("mastery-2"); await fireEvent.press(run); });
  const payload = JSON.parse(view.getByTestId("game-sandbox").props.source.html.match(/const data=(.*);\nconst send/)[1]);
  expect(payload.scenario).toEqual(session.getSnapshot().scenario);
  expect(payload.source).toBe(session.getSnapshot().code);
});
it("waits for renderer startup before applying the response watchdog", async () => {
  const { view, session } = await open(1);
  jest.useFakeTimers();
  try {
    await fireEvent.press(view.getByTestId("game-run"));
    const frame = view.getByTestId("game-sandbox");
    await act(() => { jest.advanceTimersByTime(20000); });
    expect(session.getSnapshot().result).toBeNull();
    expect(view.getByRole("button", { name: "Starting runner…" })).toBeDisabled();
    await fireEvent(frame, "loadEnd");
    await act(() => { jest.advanceTimersByTime(9999); });
    expect(session.getSnapshot().result).toBeNull();
    await act(() => { jest.advanceTimersByTime(1); });
    expect(session.getSnapshot().result?.reasons).toContain("The local runner timed out. Retry your solution.");
  } finally { jest.useRealTimers(); }
});
it("bounds renderer startup and ignores a previous attempt's late readiness", async () => {
  const { view, session } = await open(1);
  jest.useFakeTimers();
  try {
    await fireEvent.press(view.getByTestId("game-run"));
    const firstReady = view.getByTestId("game-sandbox").props.onLoadEnd;
    await act(() => { jest.advanceTimersByTime(29999); });
    expect(session.getSnapshot().result).toBeNull();
    await act(() => { jest.advanceTimersByTime(1); });
    expect(session.getSnapshot().result?.reasons).toContain("The local runner could not start. Retry your solution.");
    await fireEvent.press(view.getByTestId("game-run"));
    const second = view.getByTestId("game-sandbox");
    await act(() => { firstReady(); });
    await act(() => { jest.advanceTimersByTime(10000); });
    expect(view.getByTestId("game-sandbox")).toBeOnTheScreen();
    expect(view.getByRole("button", { name: "Starting runner…" })).toBeDisabled();
    await fireEvent(second, "loadEnd");
    const nonce = JSON.parse(second.props.source.html.match(/const data=(.*);\nconst send/)[1]).nonce;
    await fireEvent(second, "message", { nativeEvent: { data: JSON.stringify({ channel: "codematica-game", nonce, result: { passed: true, reasons: [], events: [] } }) } });
    await act(() => { jest.advanceTimersByTime(40000); });
    expect(session.getSnapshot().result?.passed).toBe(true);
  } finally { jest.useRealTimers(); }
});
it("pauses offscreen challenge art using its measured bounds and resumes after reflow", async () => {
  const { view } = await open(1);
  const scene = () => mockSetPlaybackActive.mock.calls.at(-1)?.[0];
  const viewport = view.getByTestId("game-play");
  const region = view.getByTestId("game-scene-region");
  await fireEvent(viewport, "layout", { nativeEvent: { layout: { height: 500 } } });
  await fireEvent(region, "layout", { nativeEvent: { layout: { y: 200, height: 144 } } });
  expect(scene()).toBe(true);
  await fireEvent(viewport, "scroll", { nativeEvent: { contentOffset: { y: 344 } } });
  expect(scene()).toBe(false); // The old 600px cutoff kept offscreen art running.
  await fireEvent(viewport, "scroll", { nativeEvent: { contentOffset: { y: 343 } } });
  expect(scene()).toBe(true);
  await fireEvent(region, "layout", { nativeEvent: { layout: { y: 900, height: 144 } } });
  expect(scene()).toBe(false); // Enlarged text can move the art below the viewport.
  await fireEvent(viewport, "layout", { nativeEvent: { layout: { height: 600 } } });
  expect(scene()).toBe(true);
  await fireEvent(viewport, "scroll", { nativeEvent: { contentOffset: { y: 1044 } } });
  expect(scene()).toBe(false);
});
it("pauses map art outside its measured viewport and while the route is covered", async () => {
  const props = { campaign, store: storeAt(0), navigate: jest.fn() };
  const view = await render(<NativeGameMap {...props} />);
  const viewport = view.getByTestId("game-map");
  await fireEvent(viewport, "layout", { nativeEvent: { layout: { height: 500 } } });
  await fireEvent(view.getByTestId("game-scene-region"), "layout", { nativeEvent: { layout: { y: 200, height: 144 } } });
  expect(mockSetPlaybackActive.mock.calls.at(-1)?.[0]).toBe(true);
  await fireEvent(viewport, "scroll", { nativeEvent: { contentOffset: { y: 344 } } });
  expect(mockSetPlaybackActive.mock.calls.at(-1)?.[0]).toBe(false);
  await fireEvent(viewport, "scroll", { nativeEvent: { contentOffset: { y: 0 } } });
  expect(mockSetPlaybackActive.mock.calls.at(-1)?.[0]).toBe(true);
  const playbackUpdates = mockSetPlaybackActive.mock.calls.length;
  await fireEvent(viewport, "scroll", { nativeEvent: { contentOffset: { y: 1 } } });
  expect(mockSetPlaybackActive.mock.calls).toHaveLength(playbackUpdates);
  await view.rerender(<NativeGameMap {...props} active={false} />);
  expect(mockSetPlaybackActive.mock.calls.at(-1)?.[0]).toBe(false);
  await view.rerender(<NativeGameMap {...props} active />);
  expect(mockSetPlaybackActive.mock.calls.at(-1)?.[0]).toBe(true);
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

it.each(["reset", "blur", "unmount"])("ignores retained runner callbacks after %s", async (interruption) => {
  const { view, session, store, navigate } = await open(0);
  await fireEvent.press(view.getByTestId("game-run"));
  const { onMessage, onError, onLoadEnd, source } = view.getByTestId("game-sandbox").props;
  const nonce = JSON.parse(source.html.match(/const data=(.*);\nconst send/)[1]).nonce;
  if (interruption === "reset") await fireEvent.press(view.getByTestId("game-reset"));
  else if (interruption === "blur") await view.rerender(<NativeGamePlay campaign={campaign} level={campaign.levels[0]} store={store} navigate={navigate} workerSource="worker" active={false} />);
  else await view.unmount();
  const submit = jest.spyOn(session, "submit");
  await act(() => {
    onMessage({ nativeEvent: { data: JSON.stringify({ channel: "codematica-game", nonce, result: { passed: true, reasons: [], events: [] } }) } });
    onError();
    onLoadEnd();
  });
  expect(submit).not.toHaveBeenCalled();
  expect(session.getSnapshot().attempt.phase).toBe("briefing");
  expect(Object.keys(store.getSnapshot().awards)).toHaveLength(0);
});

it("keeps map actions available outside the scrolling terrain after centering and switching views", async () => {
  const navigate = jest.fn();
  const view = await render(<NativeGameMap campaign={campaign} store={storeAt(0)} navigate={navigate} />);
  const terrain = view.getByTestId("game-map");
  await fireEvent.scroll(terrain, { nativeEvent: { contentOffset: { y: 7000 } } });
  expect(within(terrain).queryByTestId("game-map-view")).toBeNull();
  await fireEvent.press(view.getByRole("button", { name: "Level list" }));
  expect(view.getByRole("button", { name: "Map" })).toBeOnTheScreen();
  await fireEvent.press(view.getByRole("button", { name: "Map" }));
  await fireEvent.press(view.getByRole("button", { name: "Explore lessons" }));
  expect(navigate).toHaveBeenCalledWith("/learn");
});

it("rebuilds terrain measurements when switching views and ignores callbacks from the replaced terrain", async () => {
  const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo");
  const view = await render(<NativeGameMap campaign={campaign} store={storeAt(0)} navigate={jest.fn()} />);
  await waitFor(() => expect(view.getByTestId("game-level-1")).toBeEnabled());
  const originalTerrain = view.getByTestId("game-map");
  const toolbar = view.getByTestId("game-map-view");
  const oldContent = originalTerrain.props.onContentSizeChange;
  const oldDistrict = view.getByTestId("game-district-garden").props.onLayout;
  const oldNode = view.getByTestId("game-stop-1").props.onLayout;
  await fireEvent.press(toolbar);
  const listTerrain = view.getByTestId("game-map");
  expect(listTerrain).not.toBe(originalTerrain);
  expect(view.getByTestId("game-map-view")).toBe(toolbar);
  scrollTo.mockClear();
  await act(() => {
    oldContent(390, 20000);
    oldDistrict({ nativeEvent: { layout: { y: 6000 } } });
    oldNode({ nativeEvent: { layout: { y: 400, height: 80 } } });
  });
  expect(scrollTo).not.toHaveBeenCalled();
  await fireEvent(listTerrain, "layout", { nativeEvent: { layout: { height: 600, width: 390 } } });
  await fireEvent(view.getByTestId("game-district-garden"), "layout", { nativeEvent: { layout: { y: 1000 } } });
  await fireEvent(view.getByTestId("game-stop-1"), "layout", { nativeEvent: { layout: { y: 200, height: 80 } } });
  await act(() => { oldContent(390, 20000); });
  expect(scrollTo).not.toHaveBeenCalled();
  await fireEvent(listTerrain, "contentSizeChange", 390, 4000);
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 940, animated: false });
  const staleListContent = listTerrain.props.onContentSizeChange;
  const staleListDistrict = view.getByTestId("game-district-garden").props.onLayout;
  const staleListNode = view.getByTestId("game-stop-1").props.onLayout;
  await fireEvent.press(toolbar);
  const mapTerrain = view.getByTestId("game-map");
  expect(mapTerrain).not.toBe(listTerrain);
  scrollTo.mockClear();
  await act(() => {
    staleListContent(390, 4000);
    staleListDistrict({ nativeEvent: { layout: { y: 1000 } } });
    staleListNode({ nativeEvent: { layout: { y: 200, height: 80 } } });
    oldContent(390, 20000);
    oldDistrict({ nativeEvent: { layout: { y: 6000 } } });
    oldNode({ nativeEvent: { layout: { y: 400, height: 80 } } });
  });
  expect(scrollTo).not.toHaveBeenCalled();
  await fireEvent(mapTerrain, "layout", { nativeEvent: { layout: { height: 600, width: 390 } } });
  await fireEvent(mapTerrain, "contentSizeChange", 390, 7000);
  expect(scrollTo).not.toHaveBeenCalled();
  await fireEvent(view.getByTestId("game-stop-1"), "layout", { nativeEvent: { layout: { y: 400, height: 80 } } });
  await act(() => {
    staleListDistrict({ nativeEvent: { layout: { y: 1000 } } });
    oldDistrict({ nativeEvent: { layout: { y: 6000 } } });
  });
  expect(scrollTo).not.toHaveBeenCalled();
  await fireEvent(view.getByTestId("game-district-garden"), "layout", { nativeEvent: { layout: { y: 6000 } } });
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 6140, animated: false });
  await fireEvent.press(toolbar);
  const nextList = view.getByTestId("game-map");
  scrollTo.mockClear();
  await fireEvent(nextList, "layout", { nativeEvent: { layout: { height: 600, width: 390 } } });
  await fireEvent(nextList, "contentSizeChange", 390, 4000);
  await fireEvent(view.getByTestId("game-district-garden"), "layout", { nativeEvent: { layout: { y: 1000 } } });
  await act(() => {
    oldNode({ nativeEvent: { layout: { y: 400, height: 80 } } });
    staleListNode({ nativeEvent: { layout: { y: 200, height: 80 } } });
  });
  await fireEvent(nextList, "contentSizeChange", 390, 4000);
  expect(scrollTo).not.toHaveBeenCalled();
  await fireEvent(view.getByTestId("game-stop-1"), "layout", { nativeEvent: { layout: { y: 200, height: 80 } } });
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 940, animated: false });
});

it("waits for fresh positions to center the first list level and current map level", async () => {
  const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo");
  const view = await render(<NativeGameMap campaign={campaign} store={storeAt(0)} navigate={jest.fn()} />);
  await waitFor(() => expect(view.getByTestId("game-level-1")).toBeEnabled());
  let terrain = view.getByTestId("game-map");
  await fireEvent(terrain, "layout", { nativeEvent: { layout: { height: 600, width: 390 } } });
  await fireEvent.scroll(terrain, { nativeEvent: { contentOffset: { y: 7000 } } });
  scrollTo.mockClear();
  await fireEvent.press(view.getByRole("button", { name: "Level list" }));
  terrain = view.getByTestId("game-map");
  expect(scrollTo).not.toHaveBeenCalled();
  await fireEvent(view.getByTestId("game-district-garden"), "layout", { nativeEvent: { layout: { y: 1000 } } });
  await fireEvent(terrain, "contentSizeChange", 390, 20000);
  expect(scrollTo).not.toHaveBeenCalled();
  await fireEvent(view.getByTestId("game-stop-1"), "layout", { nativeEvent: { layout: { y: 200, height: 80 } } });
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 940, animated: false });
  scrollTo.mockClear();
  await fireEvent.scroll(terrain, { nativeEvent: { contentOffset: { y: 1200 } } });
  await fireEvent.press(view.getByRole("button", { name: "Map" }));
  terrain = view.getByTestId("game-map");
  expect(scrollTo).not.toHaveBeenCalled();
  await fireEvent(view.getByTestId("game-district-garden"), "layout", { nativeEvent: { layout: { y: 6000 } } });
  await fireEvent(view.getByTestId("game-stop-1"), "layout", { nativeEvent: { layout: { y: 400, height: 80 } } });
  expect(scrollTo).not.toHaveBeenCalled();
  await fireEvent(terrain, "contentSizeChange", 390, 3000);
  expect(scrollTo).not.toHaveBeenCalled();
  await fireEvent(terrain, "contentSizeChange", 390, 7000);
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 6140, animated: false });
});

it("recenters the current map level from fresh measurements through live font enlargement and restoration", async () => {
  const originalWindow = Dimensions.get("window");
  const originalScreen = Dimensions.get("screen");
  const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo");
  const changeScale = async (fontScale: number) => act(() => Dimensions.set({
    window: { ...originalWindow, fontScale }, screen: { ...originalScreen, fontScale },
  }));
  try {
    await changeScale(1);
    const view = await render(<NativeGameMap campaign={campaign} store={storeAt(0)} navigate={jest.fn()} />);
    await waitFor(() => expect(view.getByTestId("game-level-1")).toBeEnabled());
    let terrain = view.getByTestId("game-map");
    const toolbar = view.getByRole("button", { name: "Level list" });
    await fireEvent(terrain, "layout", { nativeEvent: { layout: { height: 600, width: 390 } } });
    await fireEvent.press(view.getByRole("button", { name: "Level list" }));
    await fireEvent.press(view.getByRole("button", { name: "Map" }));
    terrain = view.getByTestId("game-map");
    await fireEvent(view.getByTestId("game-district-garden"), "layout", { nativeEvent: { layout: { y: 6000 } } });
    await fireEvent(view.getByTestId("game-stop-1"), "layout", { nativeEvent: { layout: { y: 400, height: 80 } } });
    await fireEvent(terrain, "contentSizeChange", 390, 7000);
    expect(scrollTo).toHaveBeenLastCalledWith({ y: 6140, animated: false });
    for (const [scale, districtY, nodeY, nodeHeight, expectedY] of [[2, 9000, 600, 160, 9380], [1, 6000, 400, 80, 6140]]) {
      scrollTo.mockClear();
      const previousTerrain = terrain;
      await changeScale(scale);
      terrain = view.getByTestId("game-map");
      expect(terrain).not.toBe(previousTerrain);
      expect(view.getByRole("button", { name: "Level list" })).toBe(toolbar);
      await fireEvent.scroll(terrain, { nativeEvent: { contentOffset: { y: 6140 } } });
      await fireEvent(terrain, "contentSizeChange", 390, 15000);
      expect(scrollTo).not.toHaveBeenCalled();
      await fireEvent(view.getByTestId("game-district-garden"), "layout", { nativeEvent: { layout: { y: districtY } } });
      expect(scrollTo).not.toHaveBeenCalled();
      await fireEvent(view.getByTestId("game-stop-1"), "layout", { nativeEvent: { layout: { y: nodeY, height: nodeHeight } } });
      expect(scrollTo).toHaveBeenLastCalledWith({ y: expectedY, animated: false });
      expect(view.getByRole("button", { name: "Level list" })).toBeOnTheScreen();
    }
  } finally {
    await act(() => Dimensions.set({ window: originalWindow, screen: originalScreen }));
  }
});

it("ignores a delayed list scroll offset while positioning the returned map", async () => {
  const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo");
  const view = await render(<NativeGameMap campaign={campaign} store={storeAt(0)} navigate={jest.fn()} />);
  await waitFor(() => expect(view.getByTestId("game-level-1")).toBeEnabled());
  let terrain = view.getByTestId("game-map");
  await fireEvent(terrain, "layout", { nativeEvent: { layout: { height: 600, width: 390 } } });
  await fireEvent.press(view.getByRole("button", { name: "Level list" }));
  const staleScroll = view.getByTestId("game-map").props.onScroll;
  await fireEvent.press(view.getByRole("button", { name: "Map" }));
  terrain = view.getByTestId("game-map");
  scrollTo.mockClear();
  await act(() => { staleScroll({ nativeEvent: { contentOffset: { y: 1200 } } }); });
  await fireEvent(terrain, "contentSizeChange", 390, 7000);
  await fireEvent(view.getByTestId("game-district-garden"), "layout", { nativeEvent: { layout: { y: 6000 } } });
  await fireEvent(view.getByTestId("game-stop-1"), "layout", { nativeEvent: { layout: { y: 400, height: 80 } } });
  expect(scrollTo).toHaveBeenLastCalledWith({ y: 6140, animated: false });
});

it("lets terrain panels grow with text while retaining their minimum artwork height", async () => {
  const view = await render(<NativeGameMap campaign={campaign} store={storeAt(0)} navigate={jest.fn()} />);
  await fireEvent(view.getByTestId("game-map"), "layout", { nativeEvent: { layout: { height: 500, width: 320 } } });
  for (const id of ["game-frontier-summit-0", "game-district-garden"]) {
    const style = StyleSheet.flatten(view.getByTestId(id).props.style);
    expect(style.height).toBeUndefined();
    expect(style.minHeight).toBe(620);
  }
});

it("keeps scenery mounted through the measured height of an enlarged terrain panel", async () => {
  const view = await render(<NativeGameMap campaign={campaign} store={storeAt(0)} navigate={jest.fn()} />);
  const terrain = view.getByTestId("game-map");
  await fireEvent(terrain, "layout", { nativeEvent: { layout: { height: 500, width: 320 } } });
  const garden = view.getByTestId("game-district-garden");
  await fireEvent(garden, "layout", { nativeEvent: { layout: { y: 0, height: 2200 } } });
  await fireEvent.scroll(terrain, { nativeEvent: { contentOffset: { y: 2000 } } });
  expect(within(garden).getByTestId("game-district-art", { includeHiddenElements: true })).toBeOnTheScreen();
  await fireEvent.scroll(terrain, { nativeEvent: { contentOffset: { y: 4000 } } });
  expect(within(garden).queryByTestId("game-district-art", { includeHiddenElements: true })).toBeNull();
});

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

it("keeps campaign actions at shared target sizes and font scaling without changing the painted world", async () => {
  const { view } = await open(0);
  const run = StyleSheet.flatten(view.getByTestId("game-run").props.style);
  expect(run.minHeight).toBeGreaterThanOrEqual(48);
  expect(run.maxWidth).toBe("100%");
});
