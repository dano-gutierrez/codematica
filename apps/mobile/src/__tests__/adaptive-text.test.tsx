import { useState } from "react";
import { Dimensions, TextInput, View } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { AdaptiveText } from "../../../../packages/ui/src/AdaptiveText";
import { HomeDiscoveryScreen, MarkdownReader } from "../../../../packages/ui/src/screens";
import { getContentIndex } from "@codematica/core";

const originalWindow = Dimensions.get("window");
const originalScreen = Dimensions.get("screen");

async function resize(fontScale: number, width = originalWindow.width) {
  await act(() => Dimensions.set({
    window: { ...originalWindow, width, fontScale },
    screen: { ...originalScreen, fontScale },
  }));
}

afterEach(async () => {
  await act(() => Dimensions.set({ window: originalWindow, screen: originalScreen }));
});

it("refreshes native text measurement on live font changes while preserving its screen and input", async () => {
  function Form() {
    const [query, setQuery] = useState("");
    return <View>
      <AdaptiveText testID="live-label">{query || "Search all content"}</AdaptiveText>
      <TextInput testID="live-input" value={query} onChangeText={setQuery} />
    </View>;
  }
  await resize(1);
  const view = await render(<Form />);
  await fireEvent.changeText(view.getByTestId("live-input"), "Number Of Islands");
  const input = view.getByTestId("live-input");
  const normal = view.getByTestId("live-label");
  await resize(2);
  const enlarged = view.getByTestId("live-label");
  expect(enlarged).not.toBe(normal);
  expect(enlarged).toHaveTextContent("Number Of Islands");
  expect(view.getByTestId("live-input")).toBe(input);
  expect(input.props.value).toBe("Number Of Islands");
  await resize(1);
  expect(view.getByTestId("live-label")).not.toBe(enlarged);
  expect(input.props.value).toBe("Number Of Islands");
});

it("keeps text mounted for width-only reflow and ordinary content changes", async () => {
  await resize(1);
  const view = await render(<AdaptiveText testID="live-label">Learn</AdaptiveText>);
  const initial = view.getByTestId("live-label");
  await resize(1, originalWindow.width / 2);
  expect(view.getByTestId("live-label")).toBe(initial);
  await view.rerender(<AdaptiveText testID="live-label">Lessons</AdaptiveText>);
  expect(view.getByTestId("live-label")).toBe(initial);
  expect(initial).toHaveTextContent("Lessons");
});

it("preserves nested text, styling, accessible labels and presses without capping text size", async () => {
  const onPress = jest.fn();
  const view = await render(<AdaptiveText testID="live-label" accessibilityRole="link" accessibilityLabel="Open sources" onPress={onPress} style={{ fontSize: 18, color: "#123456" }}>
    Read <AdaptiveText>sources</AdaptiveText>
  </AdaptiveText>);
  const label = view.getByTestId("live-label");
  expect(label).toHaveStyle({ fontSize: 18, color: "#123456" });
  expect(label).toHaveTextContent("Read sources");
  expect(label.props.allowFontScaling).not.toBe(false);
  expect(label.props.maxFontSizeMultiplier).toBeUndefined();
  await fireEvent.press(view.getByRole("link", { name: "Open sources" }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it("keeps the real Learn query and settled results while its visible title remeasures", async () => {
  await resize(1);
  const view = await render(<HomeDiscoveryScreen index={getContentIndex()} adapters={{ navigation: { navigate: jest.fn() } }} />);
  const title = view.getByText("What will you learn today?");
  const input = view.getByTestId("mobile-home-global-search");
  await fireEvent.changeText(input, "Number Of Islands");
  await waitFor(() => expect(view.getByText("7 results")).toBeOnTheScreen());
  await resize(2);
  expect(view.getByText("What will you learn today?")).not.toBe(title);
  expect(view.getByTestId("mobile-home-global-search")).toBe(input);
  expect(input.props.value).toBe("Number Of Islands");
  expect(view.getByText("7 results")).toBeOnTheScreen();
  expect(view.getByTestId("mobile-discovery-interview-question-google-number-of-islands")).toBeOnTheScreen();
});

it("refreshes third-party Markdown text without resetting sibling diagram disclosure", async () => {
  await resize(1);
  const navigate = jest.fn();
  const view = await render(<MarkdownReader markdown={"# Learning note\n\n[Sources](/browse)\n\n```mermaid\ngraph TD; A-->B\n```"} adapters={{ navigation: { navigate }, mermaidScript: "window.mermaid = {};" }} />);
  const title = view.getByText("Learning note");
  await fireEvent.press(view.getByRole("button", { name: "Diagram source" }));
  const diagram = view.getByTestId("mobile-mermaid-webview");
  const code = view.getByTestId("mobile-code-source");
  await resize(2);
  expect(view.getByText("Learning note")).not.toBe(title);
  expect(view.getByTestId("mobile-mermaid-webview")).toBe(diagram);
  expect(view.getByTestId("mobile-code-source")).toHaveTextContent("graph TD; A-->B");
  expect(code).not.toBe(view.getByTestId("mobile-code-source"));
  await fireEvent.press(view.getByText("Sources"));
  expect(navigate).toHaveBeenCalledWith("/browse");
});
