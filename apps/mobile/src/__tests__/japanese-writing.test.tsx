import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo, ScrollView } from "react-native";
import {
  buildWritingPracticeSheets,
  createCustomNotebook,
  createExerciseNotebook,
  createNotebookSnapshot,
  getContentIndex,
  getExerciseBySlug,
  getWritingMatchPairs,
  type LanguageCharacter,
  type NotebookStorage,
  type WritingNotebook,
} from "@codematica/core";
import {
  AppScreen,
  PracticeScreen,
  NativeNavigation,
} from "../../../../packages/ui/src/screens";
import { JapaneseNotebookPractice } from "../../../../packages/ui/src/JapaneseNotebookPractice";
import { JapaneseNotebookCatalogScreen } from "../../../../packages/ui/src/JapaneseNotebookCatalogScreen";
const index = getContentIndex(),
  exercise = getExerciseBySlug("languages/japanese-hiragana-vowels-writing")!;
const adapters = {
  navigation: { navigate: jest.fn(), openExternalUrl: jest.fn() },
  progress: { record: jest.fn(async () => undefined) },
};
beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(false);
});
afterEach(() => jest.useRealTimers());
jest.setTimeout(30000);
const strokes = [
  [
    [25, 37],
    [38, 38],
    [56, 33],
    [68, 31],
  ],
  [
    [52, 18],
    [48, 43],
    [49, 68],
    [54, 84],
  ],
  [
    [63, 39],
    [63, 51],
    [54, 65],
    [40, 80],
    [27, 82],
    [21, 75],
    [22, 65],
    [34, 53],
    [48, 49],
    [61, 49],
    [77, 55],
    [84, 65],
    [80, 78],
    [64, 87],
  ],
];
async function draw(
  view: Awaited<ReturnType<typeof render>>,
  ink: number[][][],
) {
  const pad = view.getByTestId("mobile-writing-pad");
  for (const points of ink) {
    await fireEvent(pad, "responderGrant", {
      nativeEvent: {
        locationX: points[0]![0]! + 50,
        locationY: points[0]![1]! + 180,
      },
    });
    for (const [x, y] of points.slice(1, -1))
      await fireEvent(pad, "responderMove", {
        nativeEvent: { locationX: x! + 50, locationY: y! + 180 },
      });
    const last = points.at(-1)!;
    await fireEvent(pad, "responderRelease", {
      nativeEvent: { locationX: last[0]! + 50, locationY: last[1]! + 180 },
    });
  }
}
async function glyph(
  view: Awaited<ReturnType<typeof render>>,
  c: LanguageCharacter,
) {
  await draw(
    view,
    c.strokes.map((s) =>
      s.points.filter((_, i) => i % 4 === 0 || i === s.points.length - 1),
    ),
  );
  await act(() => jest.advanceTimersByTime(400));
}
it("waits for multi-stroke handwriting before showing an error and exposes a labeled restart icon", async () => {
  const n = createCustomNotebook("あ", index);
  const view = await render(<JapaneseNotebookPractice notebook={n} adapters={adapters} />);
  expect(view.getByTestId("mobile-writing-repeat").props.accessibilityLabel).toBe("Clear and restart sheet");
  expect(view.queryByText("Clear and restart sheet")).toBeNull();
  await draw(view, strokes.slice(0, 1));
  await act(() => jest.advanceTimersByTime(900));
  expect(view.getByTestId("mobile-writing-cell-0-feedback").props.accessibilityState).toEqual({ busy: false });
  await draw(view, strokes.slice(1, 2));
  await act(() => jest.advanceTimersByTime(1199));
  expect(view.getByTestId("mobile-writing-cell-0-feedback").props.accessibilityState).toEqual({ busy: false });
  await act(() => jest.advanceTimersByTime(1));
  expect(view.getByTestId("mobile-writing-cell-0-feedback").props.accessibilityState).toEqual({ busy: true });
  await draw(view, strokes.slice(2));
  await act(() => jest.advanceTimersByTime(400));
  await act(() => jest.advanceTimersByTime(3000));
  expect(view.getByTestId("mobile-writing-cell-0-ink-2")).toBeOnTheScreen();
  expect(view.getByTestId("mobile-writing-sheet-progress")).toHaveTextContent(/1 \/ 24/);
});
it("fades rejected native ink, resets PencilKit, and preserves ink when a correction begins", async () => {
  jest.useFakeTimers();
  let props: import("../../../../packages/ui/src/JapaneseNotebookPractice").HandwritingCanvasProps;
  const Canvas = (p: typeof props) => {
    props = p;
    return null;
  };
  const n = createCustomNotebook("あ", index);
  const view = await render(
    <JapaneseNotebookPractice
      notebook={n}
      adapters={{ ...adapters, handwritingCanvas: Canvas }}
    />,
  );
  const wrong = [
    {
      points: [
        [20, 20],
        [80, 80],
      ] as [number, number][],
    },
  ];
  await act(() => props!.onBegin(true));
  await act(() => props!.onEnd(wrong));
  await act(() => jest.advanceTimersByTime(1200));
  expect(
    view.getByTestId("mobile-writing-cell-0-feedback").props.accessibilityState,
  ).toEqual({ busy: true });
  const reset = props!.resetKey;
  await act(() => jest.advanceTimersByTime(1200));
  expect(
    view.getByTestId("mobile-writing-pending-ink").props.accessibilityState,
  ).toEqual({ busy: true });
  await act(() => jest.advanceTimersByTime(250));
  expect(props!.resetKey).toBe(reset + 1);
  expect(props!.strokeCount).toBe(0);
  await act(() => props!.onBegin());
  const corrected = n.sheets[0]!.characters[0]!.strokes;
  await act(() => props!.onEnd(corrected.slice(0, 1)));
  await act(() => jest.advanceTimersByTime(1200));
  await act(() => jest.advanceTimersByTime(1300));
  await act(() => props!.onBegin());
  await act(() => props!.onEnd(corrected));
  await act(() => jest.advanceTimersByTime(400));
  await act(() => jest.advanceTimersByTime(2500));
  expect(view.getByTestId("mobile-writing-cell-0-ink-0")).toBeOnTheScreen();
  expect(view.getByTestId("mobile-writing-sheet-progress")).toHaveTextContent(
    /1 \/ 24/,
  );
});
it("configures native difficulty, rechecks pending ink, and saves the choice without a submit button", async () => {
  const notebook = createCustomNotebook("あ", index);
  const storage: NotebookStorage = {
    load: jest.fn(),
    save: jest.fn(),
    saveDefinition: jest.fn(),
    list: jest.fn(),
  };
  const view = await render(
    <JapaneseNotebookPractice
      notebook={notebook}
      adapters={{ ...adapters, notebooks: storage }}
    />,
  );
  await waitFor(() =>
    expect(
      view.getByTestId("mobile-writing-difficulty-easy"),
    ).not.toBeDisabled(),
  );
  expect(view.queryByRole("button", { name: "Check character" })).toBeNull();
  await fireEvent.press(view.getByTestId("mobile-writing-difficulty-precise"));
  await draw(
    view,
    strokes.map((s) => s.map(([x, y]) => [x! * 1.55, y! * 0.82])),
  );
  await act(() => jest.advanceTimersByTime(400));
  expect(view.queryByTestId("mobile-writing-cell-0-ink-0")).toBeNull();
  await fireEvent.press(view.getByTestId("mobile-writing-difficulty-easy"));
  await act(() => jest.advanceTimersByTime(400));
  expect(view.getByTestId("mobile-writing-cell-0-ink-2")).toBeOnTheScreen();
  await waitFor(() =>
    expect(storage.save).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: "easy" }),
    ),
  );
  await fireEvent.press(view.getByTestId("mobile-writing-difficulty-balanced"));
  await waitFor(() =>
    expect(storage.save).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: "balanced" }),
    ),
  );
  await fireEvent.press(view.getByTestId("mobile-writing-repeat"));
  expect(
    view.getByTestId("mobile-writing-difficulty-balanced").props
      .accessibilityState.selected,
  ).toBe(true);
});
it("fades rejected Android SVG ink with reduced motion while preserving previously accepted ink", async () => {
  jest.useFakeTimers();
  const reduced = jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(true);
  try {
    const notebook = createCustomNotebook("一", index);
    const view = await render(
      <JapaneseNotebookPractice notebook={notebook} adapters={adapters} />,
    );
    await glyph(view, notebook.sheets[0]!.characters[0]!);
    await draw(view, [
      [
        [20, 20],
        [80, 80],
      ],
    ]);
    await act(() => jest.advanceTimersByTime(1200));
    expect(
      view.getByTestId("mobile-writing-cell-1-feedback").props
        .accessibilityState,
    ).toEqual({ busy: true });
    await act(() => jest.advanceTimersByTime(1200));
    await act(() => jest.advanceTimersByTime(250));
    expect(view.queryByTestId("mobile-writing-ink-0")).toBeNull();
    expect(view.getByTestId("mobile-writing-cell-0-ink-0")).toBeOnTheScreen();
    expect(view.getByTestId("mobile-writing-sheet-progress")).toHaveTextContent(
      /1 \/ 24/,
    );
  } finally {
    reduced.mockRestore();
  }
});
it("accepts rough あ anywhere after reordered strokes, preserves curves, and supports correction", async () => {
  const view = await render(
    <PracticeScreen exercise={exercise} adapters={adapters} />,
  );
  const pad = view.getByTestId("mobile-writing-pad");
  await fireEvent(pad, "layout", { nativeEvent: { layout: { width: 400 } } });
  await draw(view, strokes.slice(0, 1));
  await act(() => jest.advanceTimersByTime(400));
  expect(view.queryByTestId("mobile-writing-cell-0-ink-0")).toBeNull();
  await fireEvent.press(view.getByTestId("mobile-writing-clear"));
  await draw(view, [strokes[2]!, strokes[0]!, strokes[1]!]);
  expect(view.getByTestId("mobile-writing-ink-0").props.d).toContain(" C ");
  await act(() => jest.advanceTimersByTime(400));
  expect(view.getByTestId("mobile-writing-cell-0-ink-0")).toBeOnTheScreen();
  expect(view.getByTestId("mobile-writing-sheet-progress")).toHaveTextContent(
    /0 \/ 24 repetitions/,
  );
  await fireEvent.press(view.getByTestId("mobile-writing-undo"));
  expect(view.queryByTestId("mobile-writing-cell-0-ink-0")).toBeNull();
  expect(
    view.getByTestId("mobile-writing-notebook-viewport").props.scrollEnabled,
  ).toBe(true);
  await fireEvent(
    view.getByTestId("mobile-writing-notebook-viewport"),
    "scroll",
    { nativeEvent: { contentOffset: { y: 300 } } },
  );
  expect(
    view.getByTestId("mobile-writing-pad").props.onStartShouldSetResponder(),
  ).toBe(true);
  await act(() =>
    view
      .getByTestId("mobile-writing-pad")
      .props.onPointerDown({ nativeEvent: { pointerType: "pen" } }),
  );
  expect(
    view.getByTestId("mobile-writing-pad").props.onStartShouldSetResponder(),
  ).toBe(true);
  await fireEvent(pad, "responderGrant", {
    nativeEvent: { locationX: 20, locationY: 20 },
  });
  await fireEvent(pad, "responderTerminate");
  expect(view.queryByTestId("mobile-writing-ink-0")).toBeNull();
  await fireEvent.press(view.getByTestId("mobile-writing-source"));
  await fireEvent.press(view.getByText("CC BY-SA 3.0"));
  expect(adapters.navigation.openExternalUrl).toHaveBeenCalledTimes(2);
});
it("uses native completed samples and checks once after a pause, cancels between strokes and supports undo", async () => {
  jest.useFakeTimers();
  let props: import("../../../../packages/ui/src/JapaneseNotebookPractice").HandwritingCanvasProps;
  const Canvas = (p: typeof props) => {
    props = p;
    return null;
  };
  const notebook = createCustomNotebook("あ", index);
  const view = await render(
    <JapaneseNotebookPractice
      notebook={notebook}
      adapters={{ ...adapters, handwritingCanvas: Canvas }}
    />,
  );
  await act(() => props!.onBegin(true));
  await act(() =>
    props!.onEnd(
      strokes
        .slice(0, 1)
        .map((points) => ({ points: points as [number, number][] })),
    ),
  );
  await act(() => jest.advanceTimersByTime(300));
  await act(() => props!.onBegin());
  await act(() => jest.advanceTimersByTime(400));
  expect(view.queryByTestId("mobile-writing-cell-0-ink-0")).toBeNull();
  await act(() =>
    props!.onEnd(
      strokes.map((points) => ({
        points: points as [number, number][],
        pressures: points.map(() => 0.7),
      })),
    ),
  );
  await act(() => jest.advanceTimersByTime(400));
  expect(view.getByTestId("mobile-writing-cell-0-ink-2")).toBeOnTheScreen();
  await act(() => jest.advanceTimersByTime(1000));
  expect(view.queryByTestId("mobile-writing-cell-1-ink-0")).toBeNull();
  await fireEvent.press(view.getByTestId("mobile-writing-undo"));
});
it("keeps automatic checks available after cancelled extra contacts", async () => {
  const n = createCustomNotebook("一", index);
  const view = await render(<JapaneseNotebookPractice notebook={n} adapters={adapters} />);
  await draw(view, n.sheets[0]!.characters[0]!.strokes.map(s => s.points));
  await act(() => jest.advanceTimersByTime(400));
  expect(view.getByTestId("mobile-writing-sheet-progress")).toHaveTextContent(/1 \/ 24/);
  await draw(view, n.sheets[0]!.characters[0]!.strokes.map(s => s.points));
  const pad = view.getByTestId("mobile-writing-pad");
  await fireEvent(pad, "responderGrant", { nativeEvent: {locationX:40, locationY:50} });
  await fireEvent(pad, "responderTerminate");
  await act(() => jest.advanceTimersByTime(400));
  expect(view.getByTestId("mobile-writing-sheet-progress")).toHaveTextContent(/2 \/ 24/);
});
it("requires all 24 whole pairs, unlocks without advancing, and keeps earned unlocks after restart", async () => {
  const n = createCustomNotebook("あい", index),
    view = await render(
      <JapaneseNotebookPractice notebook={n} adapters={adapters} />,
    );
  expect(
    view.getByTestId("mobile-writing-sheet-" + n.sheets[1]!.id),
  ).toBeDisabled();
  for (let i = 0; i < 48; i++)
    await glyph(view, n.sheets[0]!.characters[i % 2]!);
  expect(view.getByTestId("mobile-writing-sheet-progress")).toHaveTextContent(
    /24 \/ 24 repetitions/,
  );
  expect(view.getByTestId("mobile-writing-next-sheet")).toBeEnabled();
  await fireEvent.press(view.getByTestId("mobile-writing-next-sheet"));
  expect(view.getByTestId("mobile-writing-sheet-progress")).toHaveTextContent(
    /Copy · Sheet 2/,
  );
  await fireEvent.press(
    view.getByTestId("mobile-writing-sheet-" + n.sheets[0]!.id),
  );
  await fireEvent.press(view.getByTestId("mobile-writing-repeat"));
  expect(
    view.getByTestId("mobile-writing-sheet-" + n.sheets[1]!.id),
  ).toBeEnabled();
}, 60000);
it("restores recall, retains ink through save failures, retries, and completes required lessons once", async () => {
  const n = createCustomNotebook("一", index),
    initial = createNotebookSnapshot(n);
  initial.pages[n.sheets[0]!.id] = {
    bestCount: 23,
    replaying: false,
    cells: Array.from({ length: 23 }, (_, i) => ({
      token: "old-" + i,
      strokes: [
        {
          points: [
            [10, 50],
            [90, 50],
          ],
        },
      ],
    })),
  };
  const storage: NotebookStorage = {
    load: jest.fn(async () => initial),
    save: jest
      .fn()
      .mockRejectedValueOnce(new Error("full"))
      .mockResolvedValue(undefined),
    saveDefinition: jest.fn(async () => undefined),
    list: jest.fn(async () => [n]),
  };
  const view = await render(
    <JapaneseNotebookPractice
      notebook={{ ...n, sheets: [n.sheets[0]!] }}
      adapters={{ ...adapters, notebooks: storage }}
      onProgress={adapters.progress.record as never}
      nextHref="/next"
    />,
  );
  await waitFor(() =>
    expect(view.getByTestId("mobile-writing-sheet-progress")).toHaveTextContent(
      /23 \/ 24/,
    ),
  );
  expect(view.getByTestId("mobile-writing-example")).toHaveTextContent(
    /Write from memory/,
  );
  await fireEvent.press(view.getByTestId("mobile-writing-peek"));
  expect(view.getByTestId("mobile-writing-example")).toHaveTextContent(/一/);
  await glyph(view, n.sheets[0]!.characters[0]!);
  await waitFor(() =>
    expect(view.getByTestId("mobile-writing-save-retry")).toBeOnTheScreen(),
  );
  expect(view.getByTestId("mobile-writing-cell-23-ink-0")).toBeOnTheScreen();
  await fireEvent.press(view.getByTestId("mobile-writing-save-retry"));
  await waitFor(() =>
    expect(view.queryByTestId("mobile-writing-save-retry")).toBeNull(),
  );
  await fireEvent.press(view.getByTestId("mobile-writing-next-node"));
  expect(adapters.navigation.navigate).toHaveBeenCalledWith("/next");
  await fireEvent.press(view.getByTestId("mobile-writing-repeat"));
  expect(view.getByTestId("mobile-writing-sheet-progress")).toHaveTextContent(
    /0 \/ 24/,
  );
});
it("blocks writing on restore failure and retries without replacing saved ink", async () => {
  const n = createCustomNotebook("一", index),
    storage: NotebookStorage = {
      load: jest
        .fn()
        .mockRejectedValueOnce(new Error("busy"))
        .mockResolvedValue(createNotebookSnapshot(n)),
      save: jest.fn(),
      saveDefinition: jest.fn(),
      list: jest.fn(),
    };
  const view = await render(
    <JapaneseNotebookPractice
      notebook={n}
      adapters={{ ...adapters, notebooks: storage }}
    />,
  );
  await waitFor(() =>
    expect(view.getByTestId("mobile-writing-save-retry")).toBeOnTheScreen(),
  );
  expect(
    view.getByTestId("mobile-writing-pad").props.onStartShouldSetResponder(),
  ).toBe(false);
  expect(storage.save).not.toHaveBeenCalled();
  await fireEvent.press(view.getByTestId("mobile-writing-save-retry"));
  await waitFor(() =>
    expect(view.queryByTestId("mobile-writing-save-retry")).toBeNull(),
  );
});
it("retains matching as an independent activity", async () => {
  const view = await render(
    <PracticeScreen exercise={exercise} adapters={adapters} />,
  );
  await fireEvent.press(view.getByTestId("mobile-writing-activity-match"));
  const n = createExerciseNotebook(exercise as never, index);
  const pairs = getWritingMatchPairs(
    buildWritingPracticeSheets(n.sheets[0]!.characters, index),
  );
  await fireEvent.press(
    view.getByTestId("mobile-writing-match-kana-characters-0-0"),
  );
  await fireEvent.press(
    view.getByTestId("mobile-writing-match-romaji-characters-0-1"),
  );
  expect(view.getByText("Try another pair. You have time.")).toBeOnTheScreen();
  await fireEvent.press(
    view.getByTestId("mobile-writing-match-romaji-characters-0-0"),
  );
  const all = getWritingMatchPairs(
    buildWritingPracticeSheets(
      (
        exercise as Extract<typeof exercise, { type: "writing" }>
      ).characterSlugs.map((slug) =>
        index.languageCharacters.find((c) => c.slug === slug)!,
      ),
      index,
    ),
  );
  for (const p of all.slice(1)) {
    await fireEvent.press(
      view.getByTestId("mobile-writing-match-kana-" + p.id),
    );
    await fireEvent.press(
      view.getByTestId("mobile-writing-match-romaji-" + p.id),
    );
  }
  expect(pairs.length).toBeGreaterThan(0);
  await fireEvent.press(view.getByTestId("mobile-writing-match-repeat"));
  await fireEvent.press(view.getByTestId("mobile-writing-activity-write"));
  expect(view.getByTestId("mobile-writing-notebook")).toBeOnTheScreen();
});
it("creates, validates, saves and reopens custom notebooks from Japanese navigation", async () => {
  const notebooks: WritingNotebook[] = [];
  const storage: NotebookStorage = {
    list: jest.fn(async () => notebooks),
    saveDefinition: jest.fn(async (n) => {
      notebooks.push(n);
    }),
    load: jest.fn(),
    save: jest.fn(),
  };
  const view = await render(
    <JapaneseNotebookCatalogScreen
      index={index}
      adapters={{ ...adapters, notebooks: storage }}
    />,
  );
  await fireEvent.changeText(view.getByTestId("mobile-notebook-input"), "abc");
  expect(view.getByText(/No writing guide/)).toBeOnTheScreen();
  expect(view.getByTestId("mobile-notebook-create")).toBeDisabled();
  await fireEvent.changeText(
    view.getByTestId("mobile-notebook-input"),
    "あ い",
  );
  await fireEvent.press(view.getByTestId("mobile-notebook-create"));
  await waitFor(() =>
    expect(view.getByTestId("mobile-writing-notebook")).toBeOnTheScreen(),
  );
  await fireEvent.press(view.getByTestId("mobile-notebook-back"));
  await waitFor(() =>
    expect(
      view.getByTestId("mobile-notebook-saved-custom-3042-3044-v1"),
    ).toBeOnTheScreen(),
  );
  await fireEvent.press(
    view.getByTestId("mobile-notebook-saved-custom-3042-3044-v1"),
  );
  const nav = await render(
    <NativeNavigation
      pathname="/languages/japanese/notebooks"
      wide={false}
      navigate={adapters.navigation.navigate}
    />,
  );
  await fireEvent.press(nav.getByTestId("mobile-nav-more"));
  await fireEvent.press(nav.getByTestId("mobile-menu-notebooks"));
  expect(adapters.navigation.navigate).toHaveBeenCalledWith(
    "/languages/japanese/notebooks",
  );
});

it("automatically handles inputs and cancels live ink for two-finger scrolling", async () => {
  const n=createCustomNotebook("一",index);
  const view=await render(<JapaneseNotebookPractice notebook={n} adapters={adapters}/>);
  for(const mode of ["draw","pen","scroll"])
    expect(view.queryByTestId("mobile-writing-input-"+mode)).toBeNull();
  const pad=view.getByTestId("mobile-writing-pad");
  const scrollTo = jest.spyOn(ScrollView.prototype,"scrollTo");
  await fireEvent(pad,"responderGrant",{nativeEvent:{locationX:40,locationY:200,touches:[{pageY:200}]}});
  await fireEvent(pad,"responderStart",{nativeEvent:{touches:[{pageY:200},{pageY:200}]}});
  await fireEvent(pad,"responderMove",{nativeEvent:{locationX:82,locationY:50,touches:[{pageY:100},{pageY:100}]}});
  expect(scrollTo).toHaveBeenCalledWith({y:100,animated:false});
  await fireEvent(pad,"responderEnd",{nativeEvent:{touches:[{pageY:100}]}});
  await fireEvent(pad,"responderRelease",{nativeEvent:{locationX:82,locationY:50,touches:[]}});
  expect(view.queryByTestId("mobile-writing-ink-0")).toBeNull();
  scrollTo.mockRestore();
  await draw(view,n.sheets[0]!.characters[0]!.strokes.map(s=>s.points));
  await act(()=>jest.advanceTimersByTime(400));
  expect(view.getByTestId("mobile-writing-sheet-progress")).toHaveTextContent(/1 \/ 24/);
});

it("bridges native two-finger scrolling while retaining completed ink and resuming its check", async () => {
  let props: import("../../../../packages/ui/src/JapaneseNotebookPractice").HandwritingCanvasProps;
  const Canvas=(p:typeof props)=>{props=p;return null;};
  const n=createCustomNotebook("一",index);
  const view=await render(<JapaneseNotebookPractice notebook={n} adapters={{...adapters,handwritingCanvas:Canvas}}/>);
  const scrollTo = jest.spyOn(ScrollView.prototype,"scrollTo");
  expect("mode" in props!).toBe(false);
  const viewport=view.getByTestId("mobile-writing-notebook-viewport");
  await fireEvent(viewport,"accessibilityAction",{nativeEvent:{actionName:"scrollForward"}});
  expect(scrollTo).toHaveBeenLastCalledWith({y:300,animated:false});
  await fireEvent(viewport,"accessibilityAction",{nativeEvent:{actionName:"scrollBackward"}});
  expect(scrollTo).toHaveBeenLastCalledWith({y:0,animated:false});
  expect(view.getByTestId("mobile-writing-notebook-viewport").props.scrollEnabled).toBe(false);
  await act(()=>props!.onBegin());
  await act(()=>props!.onEnd(n.sheets[0]!.characters[0]!.strokes));
  await act(()=>props!.onBegin());
  await act(()=>props!.onPan(0,"began"));
  await act(()=>props!.onPan(100,"changed"));
  expect(scrollTo).toHaveBeenLastCalledWith({y:100,animated:false});
  await act(()=>props!.onPan(-10000,"changed"));
  expect(scrollTo).toHaveBeenLastCalledWith({y:0,animated:false});
  await act(()=>props!.onPan(10000,"changed"));
  await act(()=>jest.advanceTimersByTime(4000));
  expect(props!.strokeCount).toBe(1);
  scrollTo.mockRestore();
  expect(view.getByTestId("mobile-writing-sheet-progress")).toHaveTextContent(/0 \/ 24/);
  await act(()=>props!.onPan(0,"ended"));
  await act(()=>jest.advanceTimersByTime(400));
  expect(view.getByTestId("mobile-writing-sheet-progress")).toHaveTextContent(/1 \/ 24/);
});

it("passes two-finger scrolling to the outer native page when the sheet fits", async () => {
  let props: import("../../../../packages/ui/src/JapaneseNotebookPractice").HandwritingCanvasProps;
  const Canvas=(p:typeof props)=>{props=p;return null;};
  const n=createCustomNotebook("一",index);
  const view=await render(<AppScreen><JapaneseNotebookPractice notebook={n} adapters={{...adapters,handwritingCanvas:Canvas}}/></AppScreen>);
  const page=view.getByTestId("mobile-page-scroll");
  await act(()=>page.props.onLayout({nativeEvent:{layout:{height:600}}}));
  await act(()=>page.props.onContentSizeChange(1000,2000));
  await act(()=>page.props.onScroll({nativeEvent:{contentOffset:{y:200}}}));
  // Layout still fires on-device when the PencilKit parent declines JS touch ownership.
  await act(()=>view.getByTestId("mobile-writing-pad").props.onLayout({nativeEvent:{layout:{width:1000}}}));
  expect(view.getByTestId("mobile-writing-pad").props.style.height).toBe(430);
  const scrollTo=jest.spyOn(ScrollView.prototype,"scrollTo");
  await act(()=>props!.onPan(0,"began"));
  await act(()=>props!.onPan(100,"changed"));
  expect(scrollTo).toHaveBeenLastCalledWith({y:300,animated:false});
  await act(()=>props!.onPan(-500,"changed"));
  expect(scrollTo).toHaveBeenLastCalledWith({y:0,animated:false});
  await act(()=>props!.onPan(10000,"changed"));
  expect(scrollTo).toHaveBeenLastCalledWith({y:1400,animated:false});
  await act(()=>props!.onPan(0,"ended"));
  expect(view.getByTestId("mobile-page-scroll").props.scrollEnabled).toBe(true);
  scrollTo.mockRestore();
});
