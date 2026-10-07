import { act, fireEvent, render } from "@testing-library/react-native";
import { Text, View } from "react-native";
import { executeNativeSearch, getContentIndex, nativeSearchChannel, searchDiscovery, type NativeSearchInput, type SearchFilters } from "@codematica/core";
import { BrowseScreen, HomeDiscoveryScreen } from "../../../../packages/ui/src/screens";
import { LocalSearchFeedback, useLocalSearch } from "../../../../packages/ui/src/LocalSearch";

const mockInject = jest.fn();
jest.mock("react-native-webview", () => {
  const React = jest.requireActual("react");
  const { View: NativeView } = jest.requireActual("react-native");
  return { WebView: React.forwardRef((props: object, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({ injectJavaScript: mockInject }));
    return React.createElement(NativeView, props);
  }) };
});

const index = getContentIndex();
const script = "window.localSearchTest = true;";
function Harness({ query = "", filters = {}, content = index, kind = "discovery", runtimeScript = script }: {
  query?: string; filters?: SearchFilters; content?: typeof index; kind?: "discovery" | "content"; runtimeScript?: string;
}) {
  const state = useLocalSearch({ index: content, kind, query, filters, runtimeScript });
  return <View>{state.runtime}<Text>{state.pending ? "Pending" : "Settled"}</Text><LocalSearchFeedback error={state.error} retry={state.retry} />
    {state.results.map((item, position) => <Text testID={`local-search-result-${position}`} key={`${item.kind}-${item.id}`}>{item.title}</Text>)}
    <Text onPress={state.retry}>Retry</Text>
  </View>;
}
function request() {
  const code = mockInject.mock.calls.at(-1)![0] as string;
  return JSON.parse(code.replace(/^window\.__codematicaSearch\(/, "").replace(/\); true;$/, "")) as { id: number; input: NativeSearchInput; query: string; filters: SearchFilters };
}
function message(value: object) { return { nativeEvent: { data: JSON.stringify({ channel: nativeSearchChannel, ...value }) } }; }
async function ready(view: Awaited<ReturnType<typeof render>>) { await fireEvent(view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), "message", message({ type: "ready" })); }
async function settle() { await act(async () => { jest.advanceTimersByTime(300); }); }

beforeEach(() => { jest.useFakeTimers(); mockInject.mockClear(); });
afterEach(() => { jest.useRealTimers(); });

it("waits for readiness and a typing pause, then maps results to canonical metadata", async () => {
  const view = await render(<Harness query="N" />);
  await ready(view);
  await act(async () => { jest.advanceTimersByTime(299); });
  expect(mockInject).not.toHaveBeenCalled();
  await view.rerender(<Harness query="Number Of Islands" />);
  await settle();
  const req = request();
  expect(mockInject).toHaveBeenCalledTimes(1);
  expect(req.query).toBe("Number Of Islands");
  expect(view.getByText("Pending")).toBeOnTheScreen();
  await fireEvent(view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), "message", message({ type: "result", id: req.id, rows: executeNativeSearch(req.input, req.query) }));
  expect(view.getByText("Settled")).toBeOnTheScreen();
  expect(view.getByText("Number Of Islands")).toBeOnTheScreen();
});

it("hides old results while replacing a query and ignores superseded replies", async () => {
  const view = await render(<Harness query="Number Of Islands" />); await ready(view); await settle();
  const old = request();
  await view.rerender(<Harness query="water" />);
  await fireEvent(view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), "message", message({ type: "result", id: old.id, rows: executeNativeSearch(old.input, old.query) }));
  expect(view.queryByText("Number Of Islands")).toBeNull();
  await settle(); const latest = request(); expect(latest.id).toBeGreaterThan(old.id);
  await fireEvent(view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), "message", message({ type: "error", id: old.id }));
  expect(view.queryByText("Search couldn't finish. Please try again.")).toBeNull();
  await fireEvent(view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), "message", message({ type: "result", id: latest.id, rows: executeNativeSearch(latest.input, latest.query) }));
  expect(view.getByText("Settled")).toBeOnTheScreen();
  expect(view.getAllByTestId(/^local-search-result-/).map(item => item.props.children)).toEqual(searchDiscovery(index, "water").slice(0, 40).map(item => item.title));
});

it("clears without accepting a late reply or sending the discarded query", async () => {
  const view = await render(<Harness query="Number Of Islands" />); await ready(view); await settle(); const old = request();
  await view.rerender(<Harness query="discard" />); await view.rerender(<Harness query="" />); await settle();
  await fireEvent(view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), "message", message({ type: "result", id: old.id, rows: executeNativeSearch(old.input, old.query) }));
  expect(mockInject).toHaveBeenCalledTimes(1); expect(view.getByText("Settled")).toBeOnTheScreen();
  expect(view.queryByText("Number Of Islands")).toBeNull();
});

it("carries the current library filters and rejects results from an earlier index", async () => {
  const view = await render(<Harness kind="content" query="cache" />); await ready(view); await settle(); const old = request();
  const smaller = { ...index, diagrams: [], documents: [] };
  const filters = { track: "Programming", difficulty: "senior" as const };
  await view.rerender(<Harness kind="content" query="cache" content={smaller} filters={filters} />);
  const latest = request(); expect(latest.filters).toEqual(filters); expect(latest.id).toBeGreaterThan(old.id);
  await fireEvent(view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), "message", message({ type: "result", id: old.id, rows: executeNativeSearch(old.input, old.query) }));
  expect(view.getByText("Pending")).toBeOnTheScreen();
  await fireEvent(view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), "message", message({ type: "result", id: latest.id, rows: [] }));
  expect(view.getByText("Settled")).toBeOnTheScreen();
});

it("keeps unknown messages harmless and exposes a bounded timeout with a fresh retry", async () => {
  const view = await render(<Harness query="Number Of Islands" />); await ready(view); await settle(); const old = request();
  await fireEvent(view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), "message", { nativeEvent: { data: "malformed" } });
  const beforeCleanup = view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }).props.onMessage;
  await act(async () => {
    jest.advanceTimersByTime(15000);
    // An already queued reply can arrive before React commits effect cleanup.
    beforeCleanup(message({ type: "result", id: old.id, rows: executeNativeSearch(old.input, old.query) }));
  });
  expect(view.getByText("Search couldn't finish. Please try again.")).toBeOnTheScreen();
  await fireEvent(view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), "message", message({ type: "result", id: old.id, rows: executeNativeSearch(old.input, old.query) }));
  expect(view.queryByText("Number Of Islands")).toBeNull();
  await fireEvent.press(view.getByRole("button", { name: "Retry search" })); await ready(view); const latest = request();
  expect(latest.id).toBeGreaterThan(old.id);
  await fireEvent(view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), "message", message({ type: "result", id: latest.id, rows: executeNativeSearch(latest.input, latest.query) }));
  expect(view.queryByText("Search couldn't finish. Please try again.")).toBeNull();
  expect(view.getByText("Number Of Islands")).toBeOnTheScreen();
});

it.each(["error", "httpError", "renderProcessGone", "contentProcessDidTerminate"])("recovers from a local renderer %s without losing the input", async event => {
  const view = await render(<Harness query="Number Of Islands" />); await ready(view); await settle();
  await fireEvent(view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), event, {});
  expect(view.getByText("Search couldn't finish. Please try again.")).toBeOnTheScreen();
  await fireEvent.press(view.getByText("Retry")); await ready(view);
  expect(request().query).toBe("Number Of Islands");
});

it("rejects a malformed result row and a known worker error with retry feedback", async () => {
  const view = await render(<Harness query="Number Of Islands" />); await ready(view); await settle();
  await fireEvent(view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), "message", message({ type: "result", id: request().id, rows: [{ index: 999999, score: 100 }] }));
  expect(view.getByText("Search couldn't finish. Please try again.")).toBeOnTheScreen();
  await fireEvent.press(view.getByText("Retry")); await ready(view);
  await fireEvent(view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), "message", message({ type: "error", id: request().id }));
  expect(view.getByText("Search couldn't finish. Please try again.")).toBeOnTheScreen();
});

it("keeps the local runtime hidden, blocks navigation and quotes input as data", async () => {
  const query = "</script>\"; window.bad = true; //";
  const view = await render(<Harness query={query} />); const runtime = view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true });
  expect(runtime.props.source.html).toContain("connect-src 'none'");
  expect(runtime.props.source.html).not.toContain(query);
  expect(runtime.props.onShouldStartLoadWithRequest({ url: "https://example.com" })).toBe(false);
  expect(runtime.props.onShouldStartLoadWithRequest({ url: "about:blank" })).toBe(true);
  expect(view.getByTestId("mobile-local-search-container", { includeHiddenElements: true }).props.importantForAccessibility).toBe("no-hide-descendants");
  await ready(view); await settle(); expect(request().query).toBe(query);
});

it("cancels the owned deadline and ignores replies after unmount", async () => {
  const clear = jest.spyOn(globalThis, "clearTimeout"); const schedule = jest.spyOn(globalThis, "setTimeout");
  try {
    const view = await render(<Harness query="Number Of Islands" />); await ready(view); await settle(); const req = request();
    const handler = view.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }).props.onMessage;
    const slot = schedule.mock.calls.findIndex(([, delay]) => delay === 15000); expect(slot).toBeGreaterThanOrEqual(0);
    const timer = schedule.mock.results[slot]!.value; await view.unmount(); expect(clear).toHaveBeenCalledWith(timer);
    await act(async () => { handler(message({ type: "result", id: req.id, rows: executeNativeSearch(req.input, req.query) })); jest.advanceTimersByTime(15000); });
    expect(mockInject).toHaveBeenCalledTimes(1);
  } finally { clear.mockRestore(); schedule.mockRestore(); }
});


it("uses the local runtime in both Learn and Browse and preserves their destinations", async () => {
  const navigate = jest.fn();
  const adapters = { navigation: { navigate }, searchScript: script };
  const learn = await render(<HomeDiscoveryScreen index={index} adapters={adapters} />);
  await ready(learn);
  await fireEvent.changeText(learn.getByTestId("mobile-home-global-search"), "Number Of Islands"); await settle();
  let req = request();
  await fireEvent(learn.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), "message", message({ type: "result", id: req.id, rows: executeNativeSearch(req.input, req.query) }));
  expect(learn.getByText("7 results")).toBeOnTheScreen();
  await fireEvent.press(learn.getByTestId("mobile-discovery-interview-question-google-number-of-islands"));
  expect(navigate).toHaveBeenLastCalledWith("/interviews/google/number-of-islands");
  await learn.unmount();
  const browse = await render(<BrowseScreen index={index} adapters={adapters} />); await ready(browse);
  await fireEvent.changeText(browse.getByTestId("mobile-knowledge-search-input"), "cache aside"); await settle();
  req = request();
  await fireEvent(browse.getByTestId("mobile-local-search-runtime", { includeHiddenElements: true }), "message", message({ type: "result", id: req.id, rows: executeNativeSearch(req.input, req.query, req.filters) }));
  await fireEvent.press(browse.getByTestId("mobile-result-diagram-system-design-cache-aside"));
  expect(navigate).toHaveBeenLastCalledWith("/diagrams/system-design/cache-aside");
});
