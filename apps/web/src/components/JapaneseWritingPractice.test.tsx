import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCustomNotebook,
  createNotebookSnapshot,
  getContentIndex,
  getLanguageCharacterBySlug,
  type NotebookStorage,
  type NotebookSnapshot,
} from "@codematica/core";
import { JapaneseWritingPractice } from "./JapaneseWritingPractice";

const one = getLanguageCharacterBySlug("japanese/kanji/one")!;
function draw(
  points: Array<[number, number]> = [
    [18, 50],
    [82, 50],
  ],
  pointerId = 1,
  pointerType = "touch",
) {
  const pad = screen.getByTestId("writing-pad");
  fireEvent.pointerDown(pad, {
    pointerId,
    pointerType,
    clientX: points[0]![0],
    clientY: points[0]![1],
  });
  points
    .slice(1, -1)
    .forEach(([clientX, clientY]) =>
      fireEvent.pointerMove(pad, { pointerId, pointerType, clientX, clientY }),
    );
  const [clientX, clientY] = points.at(-1)!;
  fireEvent.pointerUp(pad, { pointerId, pointerType, clientX, clientY });
}
function check(delay = 400) {
  act(() => vi.advanceTimersByTime(delay));
}
function memoryStorage(initial?: NotebookSnapshot): NotebookStorage {
  return {
    load: vi.fn(async () => initial),
    save: vi.fn(async () => undefined),
    list: vi.fn(async () => []),
    saveDefinition: vi.fn(async () => undefined),
  };
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.spyOn(SVGSVGElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: SVGSVGElement) {
      const height = Number(this.getAttribute("height") ?? 100);
      return {
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: 600,
        bottom: height,
        width: 600,
        height,
        toJSON: () => ({}),
      };
    },
  );
  Object.defineProperty(SVGSVGElement.prototype, "setPointerCapture", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(SVGSVGElement.prototype, "hasPointerCapture", {
    configurable: true,
    value: vi.fn(() => false),
  });
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("notebook writing", () => {
  it("detects inputs automatically and pans with two fingers without saving cancelled ink", () => {
    vi.useFakeTimers();
    render(<JapaneseWritingPractice characters={[one]} storage={false} />);
    for (const name of ["Draw", "Pen", "Scroll"])
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    const pad = screen.getByTestId("writing-pad"), viewport = screen.getByTestId("writing-notebook-viewport");
    Object.defineProperties(viewport, { scrollHeight: {value:2000}, clientHeight: {value:400} });
    fireEvent.pointerDown(pad, {pointerId:1, pointerType:"touch", clientX:40, clientY:300});
    fireEvent.pointerDown(pad, {pointerId:2, pointerType:"touch", clientX:140, clientY:300});
    fireEvent.pointerMove(pad, {pointerId:1, pointerType:"touch", clientX:40, clientY:200});
    fireEvent.pointerMove(pad, {pointerId:2, pointerType:"touch", clientX:140, clientY:200});
    expect(viewport.scrollTop).toBe(100);
    fireEvent.pointerUp(pad, {pointerId:2, pointerType:"touch"});
    fireEvent.pointerMove(pad, {pointerId:1, pointerType:"touch", clientX:82, clientY:50});
    fireEvent.pointerUp(pad, {pointerId:1, pointerType:"touch"});
    expect(screen.queryByTestId("writing-ink-0")).not.toBeInTheDocument();
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent("0 / 24");
    draw(undefined, 3, "mouse"); check();
    draw(undefined, 4, "touch"); check();
    draw(undefined, 5, "pen"); check();
    check(800);
    draw(undefined, 6, "touch"); check();
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent("4 / 24");
  });
  it("pauses checks during two-finger scrolling and keeps completed strokes for correction", () => {
    vi.useFakeTimers();
    render(<JapaneseWritingPractice characters={[one]} storage={false} />);
    draw(undefined, 3);
    const pad=screen.getByTestId("writing-pad");
    fireEvent.pointerDown(pad,{pointerId:1,pointerType:"touch",clientX:40,clientY:300});
    fireEvent.pointerDown(pad,{pointerId:2,pointerType:"touch",clientX:140,clientY:300});
    check(4000);
    expect(screen.getByTestId("writing-ink-0")).toBeInTheDocument();
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent("0 / 24");
    fireEvent.pointerCancel(pad,{pointerId:1,pointerType:"touch"});
    fireEvent.pointerUp(pad,{pointerId:2,pointerType:"touch"});
    check();
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent("1 / 24");
  });

  it("gives multi-stroke characters 1.2 seconds before an error and cancels early feedback when writing continues", () => {
    vi.useFakeTimers();
    const a = getLanguageCharacterBySlug("japanese/hiragana/a")!;
    render(<JapaneseWritingPractice characters={[a]} storage={false} />);
    expect(screen.getByTestId("writing-repeat")).toHaveAccessibleName("Clear and restart sheet");
    expect(screen.getByTestId("writing-repeat").textContent).toBe("");
    expect(screen.queryByText("Clear and restart sheet")).not.toBeInTheDocument();
    draw(a.strokes[0]!.points, 1, "mouse");
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByTestId("writing-cell-0-feedback")).toHaveAttribute("data-error", "false");
    expect(screen.getByTestId("writing-feedback")).not.toHaveTextContent("Not quite");
    draw(a.strokes[1]!.points, 1, "mouse");
    act(() => vi.advanceTimersByTime(1199));
    expect(screen.getByTestId("writing-cell-0-feedback")).toHaveAttribute("data-error", "false");
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId("writing-cell-0-feedback")).toHaveAttribute("data-error", "true");
    draw(a.strokes[2]!.points, 1, "mouse");
    check();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent("1 / 24");
    expect(screen.getByTestId("writing-cell-0-ink-2")).toBeInTheDocument();
    expect(screen.getByTestId("writing-feedback")).toHaveTextContent("Correct");
  });
  it("uses configurable difficulty and automatic checking without a Check character button", () => {
    vi.useFakeTimers();
    render(<JapaneseWritingPractice characters={[one]} storage={false} />);
    expect(
      screen.queryByRole("button", { name: "Check character" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("writing-difficulty")).toHaveTextContent("Easy");
    draw();
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
      "1 / 24",
    );
  });
  it("keeps automatic checking available after cancelled extra contacts", () => {
    vi.useFakeTimers();
    render(<JapaneseWritingPractice characters={[one]} storage={false} />);
    draw();
    check();
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent("1 / 24");
    draw(undefined, 1, "pen");
    fireEvent.pointerDown(screen.getByTestId("writing-pad"), {
      pointerId: 2, pointerType: "pen", clientX: 40, clientY: 50,
    });
    fireEvent.pointerCancel(screen.getByTestId("writing-pad"), { pointerId: 2 });
    check();
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent("2 / 24");
  });
  it("bounces the expected cell, then fades only rejected ink and leaves accepted characters intact", () => {
    vi.useFakeTimers();
    render(<JapaneseWritingPractice characters={[one]} storage={false} />);
    draw();
    check();
    draw([
      [20, 20],
      [80, 80],
    ]);
    check(1200);
    expect(screen.getByTestId("writing-cell-1-feedback")).toHaveAttribute(
      "data-error",
      "true",
    );
    expect(screen.getByTestId("writing-pending-ink")).toHaveAttribute(
      "data-phase",
      "rejected",
    );
    act(() => vi.advanceTimersByTime(1200));
    expect(screen.getByTestId("writing-pending-ink")).toHaveAttribute(
      "data-phase",
      "fading",
    );
    act(() => vi.advanceTimersByTime(250));
    expect(screen.queryByTestId("writing-ink-0")).not.toBeInTheDocument();
    expect(screen.getByTestId("writing-cell-0-ink-0")).toBeInTheDocument();
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
      "1 / 24",
    );
    expect(screen.queryByTestId("writing-ink-0")).not.toBeInTheDocument();
  });
  it("cancels a rejection fade when another stroke begins and allows correction without a stale clear", () => {
    vi.useFakeTimers();
    const a = getLanguageCharacterBySlug("japanese/hiragana/a")!;
    render(<JapaneseWritingPractice characters={[a]} storage={false} />);
    draw(a.strokes[0]!.points);
    check(1200);
    act(() => vi.advanceTimersByTime(1300));
    draw(a.strokes[1]!.points);
    expect(screen.getByTestId("writing-pending-ink")).toHaveAttribute(
      "data-phase",
      "idle",
    );
    draw(a.strokes[2]!.points);
    check();
    act(() => vi.advanceTimersByTime(2500));
    expect(screen.getByTestId("writing-cell-0-ink-2")).toBeInTheDocument();
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
      "1 / 24",
    );
  });
  it("waits 400ms, accepts ink once into the next cell, and keeps drawing separate from scroll", () => {
    vi.useFakeTimers();
    render(<JapaneseWritingPractice characters={[one]} storage={false} />);
    draw([
      [18, 50],
      [40, 52],
      [82, 50],
    ]);
    act(() => vi.advanceTimersByTime(399));
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
      "0 / 24",
    );
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
      "1 / 24",
    );
    expect(
      screen.getByTestId("writing-cell-0-ink-0").getAttribute("d"),
    ).toContain("C");
    fireEvent.pointerUp(screen.getByTestId("writing-pad"), {
      pointerId: 1,
      clientX: 82,
      clientY: 50,
    });
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
      "1 / 24",
    );
    expect(screen.getByTestId("writing-notebook-viewport")).toHaveStyle({ overflowY: "auto" });
    draw();
    check();
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
      "2 / 24",
    );
  });
  it("collects multi-stroke rough あ in a different order and rejects incomplete ink", () => {
    const character = getLanguageCharacterBySlug("japanese/hiragana/a")!;
    render(
      <JapaneseWritingPractice characters={[character]} storage={false} />,
    );
    draw([
      [52, 18],
      [48, 43],
      [49, 68],
      [54, 84],
    ]);
    check(1200);
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
      "0 / 24",
    );
    expect(screen.getByTestId("writing-feedback")).toHaveTextContent(
      "missing shape",
    );
    draw([
      [25, 37],
      [38, 38],
      [56, 33],
      [68, 31],
    ]);
    draw([
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
    ]);
    check();
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
      "1 / 24",
    );
    expect(
      screen.getByTestId("writing-cell-0-ink-2").getAttribute("d"),
    ).toContain("C");
  });
  it("rejects a tap and supports current-ink undo, cancellation and clearing", () => {
    render(<JapaneseWritingPractice characters={[one]} storage={false} />);
    draw([
      [1, 1],
      [2, 1],
    ]);
    check(1200);
    expect(screen.getByTestId("writing-feedback")).toHaveTextContent(
      "tiny mark",
    );
    fireEvent.click(screen.getByTestId("writing-undo"));
    expect(screen.queryByTestId("writing-ink-0")).not.toBeInTheDocument();
    const pad = screen.getByTestId("writing-pad");
    fireEvent.pointerDown(pad, { pointerId: 1, clientX: 18, clientY: 50 });
    fireEvent.pointerDown(pad, { pointerId: 2, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(pad, { pointerId: 2, clientX: 99, clientY: 99 });
    fireEvent.pointerCancel(pad, { pointerId: 1 });
    expect(screen.queryByTestId("writing-ink-0")).not.toBeInTheDocument();
    draw();
    fireEvent.click(screen.getByTestId("writing-clear"));
    expect(screen.queryByTestId("writing-ink-0")).not.toBeInTheDocument();
  });
  it("lets the pen preempt a palm contact and ignores subsequent finger contacts", () => {
    render(<JapaneseWritingPractice characters={[one]} storage={false} />);
    fireEvent.pointerDown(screen.getByTestId("writing-pad"), {
      pointerId: 8,
      pointerType: "touch",
      clientX: 1,
      clientY: 1,
    });
    draw(undefined, 2, "pen");
    check();
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
      "1 / 24",
    );
    expect(screen.queryByTestId("writing-input-pen")).not.toBeInTheDocument();
    draw(undefined, 3, "touch");
    expect(screen.queryByTestId("writing-ink-0")).not.toBeInTheDocument();
  });
  it("keeps coalesced samples and the release position in live ink", () => {
    render(<JapaneseWritingPractice characters={[one]} storage={false} />);
    const pad = screen.getByTestId("writing-pad");
    fireEvent.pointerDown(pad, {
      pointerId: 1,
      pointerType: "pen",
      clientX: 18,
      clientY: 50,
    });
    const event = new PointerEvent("pointermove", {
      bubbles: true,
      pointerId: 1,
      clientX: 82,
      clientY: 50,
    });
    Object.defineProperty(event, "getCoalescedEvents", {
      value: () => [
        { clientX: 36, clientY: 60, pressure: 0.4 },
        { clientX: 56, clientY: 62, pressure: 0.8 },
      ],
    });
    fireEvent(pad, event);
    fireEvent.pointerUp(pad, { pointerId: 1, clientX: 90, clientY: 50 });
    expect(screen.getByTestId("writing-ink-0").getAttribute("d")).toContain(
      "36",
    );
    expect(screen.getByTestId("writing-ink-0").getAttribute("d")).toMatch(
      /90 [0-9.]+$/,
    );
  });
  it("requires 24 full pairs, unlocks the next sheet and preserves earned unlocks on restart", () => {
    const progress = vi.fn();
    render(
      <JapaneseWritingPractice
        characters={[one, one, one]}
        storage={false}
        onProgressEvent={progress}
        nextHref="/next"
      />,
    );
    const sheets = screen.getAllByTestId(/^writing-sheet-[0-9a-f]/);
    expect(sheets[1]).toBeDisabled();
    draw();
    check();
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
      "0 / 24",
    );
    for (let i = 1; i < 48; i++) {
      draw();
      check();
    }
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
      "24 / 24",
    );
    expect(sheets[1]).toBeEnabled();
    expect(progress).not.toHaveBeenCalledWith("completed", expect.anything());
    fireEvent.click(screen.getByTestId("writing-next-sheet"));
    for (let i = 0; i < 24; i++) {
      draw();
      check();
    }
    expect(progress).toHaveBeenCalledWith(
      "completed",
      expect.objectContaining({ repetitions: 24 }),
    );
    expect(screen.getByRole("link", { name: /next activity/i })).toHaveAttribute(
      "href",
      "/next",
    );
    fireEvent.click(screen.getByTestId("writing-repeat"));
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
      "0 / 24",
    );
    expect(screen.getByRole("link", { name: /next activity/i })).toBeVisible();
  });
  it("restores remote completion markers, offers replay and leaves memory hints optional", async () => {
    const notebook = createCustomNotebook("一", getContentIndex()),
      snapshot = createNotebookSnapshot(notebook);
    snapshot.pages[notebook.sheets[0]!.id]!.bestCount = 24;
    snapshot.pages[notebook.sheets[0]!.id]!.cells = Array.from(
      { length: 24 },
      (_, i) => ({ token: "remote-" + i, strokes: [] }),
    );
    render(
      <JapaneseWritingPractice
        notebook={notebook}
        storage={memoryStorage(snapshot)}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId("writing-next-sheet")).toBeEnabled(),
    );
    expect(screen.getByTestId("writing-feedback")).toHaveTextContent(
      "Sheet complete",
    );
    fireEvent.click(screen.getByTestId("writing-next-sheet"));
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
      "Copy",
    );
    for (let i = 0; i < 12; i++) {
      draw();
      check();
    }
    expect(screen.getByTestId("writing-example")).toHaveTextContent(
      "Write from memory",
    );
    fireEvent.click(screen.getByTestId("writing-peek"));
    expect(screen.getByTestId("writing-example")).toHaveTextContent("一");
    fireEvent.click(screen.getByTestId("writing-peek"));
    expect(screen.getByTestId("writing-example")).toHaveTextContent(
      "Write from memory",
    );
    fireEvent.click(screen.getByTestId("writing-undo"));
    expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
      "11 / 24",
    );
  });
  it("retains the session on save failure and retries without discarding accepted ink", async () => {
    const store = memoryStorage();
    vi.mocked(store.save).mockRejectedValueOnce(new Error("full"));
    render(<JapaneseWritingPractice characters={[one]} storage={store} />);
    await waitFor(() =>
      expect(screen.getByTestId("writing-sheet-progress")).toHaveTextContent(
        "0 / 24",
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId("writing-repeat")).toBeEnabled(),
    );
    draw();
    check();
    await screen.findByTestId("writing-save-retry");
    expect(screen.getByTestId("writing-cell-0-ink-0")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("writing-save-retry"));
    await waitFor(() =>
      expect(
        screen.queryByTestId("writing-save-retry"),
      ).not.toBeInTheDocument(),
    );
  });
  it("keeps saved pages intact when restoration fails", async () => {
    const store = memoryStorage();
    vi.mocked(store.load).mockRejectedValueOnce(new Error("offline"));
    render(<JapaneseWritingPractice characters={[one]} storage={store} />);
    await screen.findByTestId("writing-save-retry");
    draw();
    expect(screen.queryByTestId("writing-ink-0")).not.toBeInTheDocument();
    expect(store.save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("writing-save-retry"));
    await waitFor(() =>
      expect(
        screen.queryByTestId("writing-save-retry"),
      ).not.toBeInTheDocument(),
    );
  });
  it("retains matching-pair recognition as a separate activity", () => {
    const characters = ["a", "i", "u", "e", "o"].map((s) =>
      getLanguageCharacterBySlug("japanese/hiragana/" + s)!,
    );
    render(<JapaneseWritingPractice characters={characters} storage={false} />);
    fireEvent.click(screen.getByTestId("writing-activity-match"));
    fireEvent.click(screen.getByTestId("writing-match-kana-characters-0-0"));
    fireEvent.click(screen.getByTestId("writing-match-romaji-characters-0-1"));
    expect(screen.getByRole("status")).toHaveTextContent("Try another pair");
    fireEvent.click(screen.getByTestId("writing-match-romaji-characters-0-0"));
    expect(
      screen.getByTestId("writing-match-kana-characters-0-0"),
    ).toBeDisabled();
    fireEvent.click(screen.getByTestId("writing-activity-write"));
    expect(screen.getByTestId("writing-pad")).toBeVisible();
  });
  it("renders a stable empty state", () => {
    render(<JapaneseWritingPractice storage={false} />);
    expect(screen.getByText(/no characters are available/i)).toBeVisible();
  });
});
it("retains completed finger strokes when a pen cancels an active palm contact", () => {
  const a = getLanguageCharacterBySlug("japanese/hiragana/a")!;
  render(<JapaneseWritingPractice characters={[a]} storage={false} />);
  draw(
    [
      [25, 37],
      [38, 38],
      [56, 33],
      [68, 31],
    ],
    1,
  );
  draw(
    [
      [52, 18],
      [48, 43],
      [49, 68],
      [54, 84],
    ],
    2,
  );
  fireEvent.pointerDown(screen.getByTestId("writing-pad"), {
    pointerId: 3,
    pointerType: "touch",
    clientX: 1,
    clientY: 1,
  });
  draw(
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
    4,
    "pen",
  );
  check();
  expect(screen.getByTestId("writing-cell-0-ink-2")).toBeVisible();
});
