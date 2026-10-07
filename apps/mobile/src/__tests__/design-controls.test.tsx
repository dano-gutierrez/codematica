import { DeviceEventEmitter, Dimensions, Platform, StyleSheet, TextInput } from "react-native";
import { act, fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { AppScreen, NativeNavigation, LoginScreen, PracticeScreen, HomeDiscoveryScreen, PassiveFlashcardFeedScreen, DocumentReaderScreen, InterviewQuestionScreen, JapaneseLanguageHubScreen, BrowseScreen, PracticeCatalogScreen, LearningPathHomeScreen, LearningPathDetailScreen, SaveProgressPrompt, MermaidBlock, JapaneseCharacterDetailScreen } from "../../../../packages/ui/src/screens";
import { getContentIndex, getExerciseBySlug, getHomeDiscoverySections, getLanguageCharacterBySlug } from "@codematica/core";
import { Button } from "../../../../packages/ui/src/Button";

it("keeps native action labels visible and reports disabled, busy and selected states", async () => {
  const press = jest.fn();
  const view = await render(<Button label="Retry" onPress={press} tone="warning" disabled />);
  expect(view.getByRole("button", { name: "Retry" })).toBeDisabled();
  expect(view.getByText("Retry")).toBeOnTheScreen();
  await fireEvent.press(view.getByText("Retry"));
  expect(press).not.toHaveBeenCalled();
  await view.rerender(<Button label="Save" onPress={press} busy selected />);
  expect(view.getByRole("button", { name: "Save" }).props.accessibilityState).toMatchObject({ busy: true, disabled: true, selected: true });
  await view.rerender(<Button label="Save" onPress={press} />);
  await fireEvent.press(view.getByText("Save"));
  expect(press).toHaveBeenCalledTimes(1);
  await view.rerender(<Button label="View all" accessibilityLabel="View all learning paths" onPress={press} />);
  expect(view.getByRole("button", { name: "View all learning paths" })).toBeOnTheScreen();
});

it.each([false, true])("shows account and sign-out recovery on wide=%s navigation", async (wide) => {
  const navigate = jest.fn();
  const signOut = jest.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
  const view = await render(<NativeNavigation pathname="/admin/linkedin" wide={wide} navigate={navigate} isAdmin account={{ name: "Daniel", email: "daniel@example.com", signOut }} />);
  if (!wide) await fireEvent.press(view.getByTestId("mobile-nav-more"));
  expect(view.queryByText("Sign in")).toBeNull();
  expect(view.getByText("Admin")).toBeOnTheScreen();
  await fireEvent.press(view.getByRole("button", { name: "Account: Daniel" }));
  expect(view.getByText("daniel@example.com")).toBeOnTheScreen();
  await fireEvent.press(view.getByRole("button", { name: "Sign out" }));
  expect(view.getByText("Couldn't sign out. Please try again.")).toBeOnTheScreen();
  expect(navigate).not.toHaveBeenCalled();
  await fireEvent.press(view.getByRole("button", { name: "Sign out" }));
  expect(signOut).toHaveBeenCalledTimes(2);
  expect(navigate).toHaveBeenCalledWith("/");
});

it.each(["android", "ios"] as const)("keeps the shared form above the %s keyboard without replacing its input", async (platform) => {
  const originalPlatform = Platform.OS;
  Object.defineProperty(Platform, "OS", { value: platform, configurable: true });
  try {
    const view = await render(<AppScreen keyboardAware><TextInput testID="keyboard-draft" defaultValue="Keep my draft" /></AppScreen>);
    const input = view.getByTestId("keyboard-draft");
    await fireEvent(view.getByTestId("keyboard-aware-screen"), "layout", {
      persist: jest.fn(), nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 700 } },
    });
    await act(() => { DeviceEventEmitter.emit(platform === "android" ? "keyboardDidShow" : "keyboardWillShow", {
      duration: 0, easing: "keyboard", endCoordinates: { screenX: 0, screenY: 300, width: 390, height: 400 },
    }); });
    const style = StyleSheet.flatten(view.getByTestId("keyboard-aware-screen").props.style);
    expect(platform === "android" ? style.height : style.paddingBottom).toBe(platform === "android" ? 300 : 400);
    expect(view.getByTestId("keyboard-draft")).toBe(input);
    await act(() => { DeviceEventEmitter.emit(platform === "android" ? "keyboardDidHide" : "keyboardWillHide", {}); });
    const restoredStyle = StyleSheet.flatten(view.getByTestId("keyboard-aware-screen").props.style);
    expect(restoredStyle.height).toBeUndefined();
    if (platform === "ios") expect(restoredStyle.paddingBottom).toBe(0);
    expect(view.getByTestId("keyboard-draft")).toBe(input);
    await view.unmount();
  } finally {
    Object.defineProperty(Platform, "OS", { value: originalPlatform, configurable: true });
  }
});

it("keeps the native form keyboard-aware and prevents duplicate requests while busy", async () => {
  let finish!: () => void;
  const signIn = jest.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
  const view = await render(<LoginScreen adapters={{ navigation: { navigate: jest.fn() }, auth: { isConfigured: true, signInWithPassword: signIn } }} />);
  expect(view.getByTestId("keyboard-aware-scroll").props.keyboardShouldPersistTaps).toBe("handled");
  await fireEvent.changeText(view.getByLabelText("Email"), " learner@example.com ");
  await fireEvent.changeText(view.getByLabelText("Password"), "password");
  await fireEvent.press(view.getByTestId("mobile-sign-in"));
  expect(view.getByTestId("mobile-sign-in")).toBeDisabled();
  await fireEvent.press(view.getByTestId("mobile-sign-in"));
  expect(signIn).toHaveBeenCalledTimes(1);
  expect(signIn).toHaveBeenCalledWith("learner@example.com", "password");
  await act(() => finish());
  expect(view.getByText("Signed in")).toBeOnTheScreen();
});

it("clears stale cloze feedback when the learner changes an answer", async () => {
  const view = await render(<PracticeScreen exercise={getExerciseBySlug("programming/runtime-boundary-cloze")!} adapters={{ navigation: { navigate: jest.fn() } }} />);
  await fireEvent.changeText(view.getByLabelText("Answer"), "schema");
  await fireEvent.press(view.getByTestId("mobile-cloze-check"));
  expect(view.getByTestId("mobile-cloze-feedback").props.accessibilityLiveRegion).toBe("polite");
  await fireEvent.changeText(view.getByLabelText("Answer"), "another answer");
  expect(view.queryByTestId("mobile-cloze-feedback")).toBeNull();
  expect(view.getByTestId("keyboard-aware-scroll").props.keyboardShouldPersistTaps).toBe("handled");
});

it("exposes native lab predictions and evidence with real selection roles", async () => {
  const exercise = getExerciseBySlug("ml-systems/ai-triad-guided-lab")!;
  if (exercise.type !== "guided-lab") throw new Error("Expected the lab fixture");
  const record = jest.fn();
  const view = await render(<PracticeScreen exercise={exercise} adapters={{ navigation: { navigate: jest.fn() }, progress: { record } }} />);
  const prediction = view.getByRole("radio", { name: exercise.prediction.options[0].label });
  expect(prediction.props.accessibilityState.checked).toBe(false);
  await fireEvent.press(prediction);
  expect(view.getByRole("radio", { name: exercise.prediction.options[0].label }).props.accessibilityState.checked).toBe(true);
  expect(view.getByTestId("mobile-guided-lab-complete")).toBeDisabled();
  for (const item of exercise.evidenceChecklist) {
    const checkbox = view.getByRole("checkbox", { name: item.label });
    await fireEvent.press(checkbox);
    expect(view.getByRole("checkbox", { name: item.label }).props.accessibilityState.checked).toBe(true);
  }
  await fireEvent.press(view.getByTestId("mobile-guided-lab-complete"));
  expect(record).toHaveBeenLastCalledWith(expect.objectContaining({ slug: exercise.slug }), "completed", { predictionCommitted: true, evidenceCount: exercise.evidenceChecklist.length, evidenceTotal: exercise.evidenceChecklist.length });
});

it("names native discovery inputs and clears search with keyboard access", async () => {
  const view = await render(<HomeDiscoveryScreen index={getContentIndex()} adapters={{ navigation: { navigate: jest.fn() } }} />);
  const input = view.getByLabelText("Search all content");
  await fireEvent.changeText(input, "islands");
  await fireEvent.press(view.getByRole("button", { name: "Clear search" }));
  expect(view.getByLabelText("Search all content").props.value).toBe("");
  expect(view.getByTestId("keyboard-aware-scroll").props.keyboardShouldPersistTaps).toBe("handled");
  expect(view.getByRole("button", { name: "View all learning paths" })).toBeOnTheScreen();
});

const namedSearchScreens = [
  { Screen: HomeDiscoveryScreen, label: "Search all content", testID: "mobile-home-global-search" },
  { Screen: BrowseScreen, label: "Search lessons", testID: "mobile-knowledge-search-input" },
  { Screen: PracticeCatalogScreen, label: "Search practice", testID: "mobile-practice-catalog-search" },
  { Screen: JapaneseLanguageHubScreen, label: "Search Japanese", testID: "mobile-japanese-search-input" },
];

it.each(namedSearchScreens.flatMap(screen => ["android", "ios"].map(platform => ({ ...screen, platform }))))(
  "associates $platform $label with its visible label through edits and clearing",
  async ({ Screen, label, testID, platform }) => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, "OS", { value: platform, configurable: true });
    try {
      const view = await render(<Screen index={getContentIndex()} adapters={{ navigation: { navigate: jest.fn() } }} />);
      const input = view.getByTestId(testID);
      const labelID = view.getByText(label).props.nativeID;
      expect(labelID).toEqual(expect.any(String));
      expect(labelID.length).toBeGreaterThan(0);
      expect(input.props.accessibilityLabel).toBe(label);
      expect(input.props.accessibilityLabelledBy).toBe(labelID);
      await fireEvent.changeText(input, "cache");
      expect(view.getByTestId(testID).props.value).toBe("cache");
      expect(view.getByText(label).props.nativeID).toBe(labelID);
      expect(view.getByTestId(testID).props.accessibilityLabelledBy).toBe(labelID);
      await fireEvent.press(view.getByRole("button", { name: "Clear search" }));
      expect(view.getByTestId(testID).props.value).toBe("");
      expect(view.getByTestId(testID).props.accessibilityLabel).toBe(label);
      expect(view.getByText(label).props.nativeID).toBe(labelID);
      expect(view.getByTestId(testID).props.accessibilityLabelledBy).toBe(labelID);
      await view.unmount();
    } finally {
      Object.defineProperty(Platform, "OS", { value: originalPlatform, configurable: true });
    }
  },
);

it("keeps search label associations distinct for two mounted copies of the same screen", async () => {
  const index = getContentIndex();
  const adapters = { navigation: { navigate: jest.fn() } };
  const view = await render(<><HomeDiscoveryScreen index={index} adapters={adapters} /><HomeDiscoveryScreen index={index} adapters={adapters} /></>);
  const inputs = view.getAllByTestId("mobile-home-global-search");
  const labelIDs = view.getAllByText("Search all content").map(label => label.props.nativeID);
  expect(labelIDs).toEqual([expect.any(String), expect.any(String)]);
  expect(new Set(labelIDs).size).toBe(2);
  expect(inputs.map(input => input.props.accessibilityLabelledBy)).toEqual(labelIDs);
});

it("keeps native passive review scrollable without compulsory paging", async () => {
  const view = await render(<PassiveFlashcardFeedScreen feed={getContentIndex().passiveFlashcardFeeds[0]} adapters={{ navigation: { navigate: jest.fn() } }} />);
  expect(view.getByTestId("mobile-passive-flashcard-list").props.pagingEnabled).not.toBe(true);
  expect(view.getByTestId("mobile-passive-flashcard-card-0")).toBeOnTheScreen();
});

it("discloses native primary sources and preserves external attribution links", async () => {
  const index = getContentIndex();
  const document = index.documents.find(item => item.sourceRefs?.length)!;
  const source = index.sources.find(item => item.id === document.sourceRefs?.[0])!;
  const openExternalUrl = jest.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
  const view = await render(<DocumentReaderScreen document={document} adapters={{ navigation: { navigate: jest.fn(), openExternalUrl } }} />);
  expect(view.getByRole("button", { name: "Primary sources" }).props.accessibilityState.expanded).toBe(false);
  expect(view.queryByTestId(`mobile-source-${source.id}`)).toBeNull();
  await fireEvent.press(view.getByRole("button", { name: "Primary sources" }));
  expect(view.getByRole("button", { name: "Primary sources" }).props.accessibilityState.expanded).toBe(true);
  await fireEvent.press(view.getByTestId(`mobile-source-${source.id}`));
  expect(openExternalUrl).toHaveBeenCalledWith(source.url);
  expect(view.getByText("Couldn't open this source. Please try again.")).toBeOnTheScreen();
  await fireEvent.press(view.getByTestId(`mobile-source-${source.id}`));
  expect(openExternalUrl).toHaveBeenCalledTimes(2);
  expect(view.queryByText("Couldn't open this source. Please try again.")).toBeNull();
});

it("announces the chosen native solution language and updates it on selection", async () => {
  const question = getContentIndex().interviewCollections.flatMap(item => item.questions).find(item => item.kind === "algorithm")!;
  const view = await render(<InterviewQuestionScreen question={question} adapters={{ navigation: { navigate: jest.fn() } }} />);
  expect(view.getByRole("button", { name: "Python" }).props.accessibilityState.selected).toBe(true);
  await fireEvent.press(view.getByRole("button", { name: "Java" }));
  expect(view.getByRole("button", { name: "Java" }).props.accessibilityState.selected).toBe(true);
  expect(view.getByRole("button", { name: "Python" }).props.accessibilityState.selected).toBe(false);
});

it("retries native sync without reauthenticating and lets the learner continue", async () => {
  const signIn = jest.fn(async () => ({ progressSynced: false }));
  const sync = jest.fn().mockResolvedValueOnce({ progressSynced: false }).mockResolvedValueOnce({ progressSynced: true });
  const replace = jest.fn();
  const view = await render(<LoginScreen adapters={{ navigation: { navigate: jest.fn(), replace }, auth: { isConfigured: true, signInWithPassword: signIn, syncAnonymousProgress: sync } }} />);
  await fireEvent.changeText(view.getByLabelText("Email"), "learner@example.com");
  await fireEvent.changeText(view.getByLabelText("Password"), "password");
  await fireEvent.press(view.getByTestId("mobile-sign-in"));
  expect(view.getByText(/progress is still on this device/i)).toBeOnTheScreen();
  expect(view.getByTestId("mobile-sign-in")).toBeDisabled();
  await fireEvent.press(view.getByRole("button", { name: "Retry sync" }));
  expect(view.getByRole("button", { name: "Retry sync" })).toBeOnTheScreen();
  await fireEvent.press(view.getByRole("button", { name: "Retry sync" }));
  expect(view.queryByRole("button", { name: "Retry sync" })).toBeNull();
  expect(view.getByText("Your progress is synced.")).toBeOnTheScreen();
  expect(signIn).toHaveBeenCalledTimes(1);
  expect(sync).toHaveBeenCalledTimes(2);
  await fireEvent.press(view.getByRole("button", { name: "Continue learning" }));
  expect(replace).toHaveBeenCalledWith("/");
});

it("names the native dictionary search and keeps an empty search recoverable", async () => {
  const view = await render(<JapaneseLanguageHubScreen index={getContentIndex()} adapters={{ navigation: { navigate: jest.fn() } }} />);
  const input = view.getByLabelText("Search Japanese");
  await fireEvent.changeText(input, "qzqznotfound");
  expect(view.getByText(/No matches/).props.accessibilityLiveRegion).toBe("polite");
  await fireEvent.press(view.getByRole("button", { name: "Clear search" }));
  expect(view.getByLabelText("Search Japanese").props.value).toBe("");
  expect(view.getByRole("button", { name: "あ · a" })).toBeOnTheScreen();
  expect(view.getByTestId("keyboard-aware-scroll").props.keyboardShouldPersistTaps).toBe("handled");
});

it("announces native listening failures and radio selection without changing grading", async () => {
  const exercise = getExerciseBySlug("languages/japanese-n5-identity-and-demonstratives-listening")!;
  if (exercise.type !== "questionnaire" || exercise.questions[0].kind !== "listening-choice") throw new Error("Expected a listening fixture");
  const question = exercise.questions[0];
  const play = jest.fn().mockResolvedValueOnce(false).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(true);
  const view = await render(<PracticeScreen exercise={{ ...exercise, questions: [question] }} adapters={{ navigation: { navigate: jest.fn() }, audio: { play } }} />);
  await fireEvent.press(view.getByRole("button", { name: "Play / replay" }));
  expect(view.getByText(/Audio is unavailable/)).toBeOnTheScreen();
  await fireEvent.press(view.getByRole("button", { name: "Retry audio" }));
  expect(view.getByText(/Couldn't play this audio/)).toBeOnTheScreen();
  await fireEvent.press(view.getByRole("button", { name: "Retry audio" }));
  expect(view.queryByRole("button", { name: "Retry audio" })).toBeNull();
  const option = view.getByRole("radio", { name: question.options[0].label });
  await fireEvent.press(option);
  expect(view.getByRole("radio", { name: question.options[0].label }).props.accessibilityState.checked).toBe(true);
  await fireEvent.press(view.getByTestId("mobile-questionnaire-check"));
  expect(view.getByTestId("mobile-questionnaire-feedback").props.accessibilityLiveRegion).toBe("polite");
  expect(play).toHaveBeenCalledTimes(3);
});

it("keeps native word browsing available in a named disclosure", async () => {
  const index = getContentIndex();
  const first = index.languageVocabulary.find(item => item.language === "ja" && item.status === "published")!;
  const view = await render(<JapaneseLanguageHubScreen index={index} adapters={{ navigation: { navigate: jest.fn() } }} />);
  const toggle = view.getByRole("button", { name: "Words and greetings" });
  expect(toggle.props.accessibilityState.expanded).toBe(false);
  const id = `mobile-japanese-vocabulary-${first.slug.replaceAll("/", "-")}`;
  expect(view.queryByTestId(id)).toBeNull();
  await fireEvent.press(toggle);
  expect(view.getByTestId(id)).toBeOnTheScreen();
  expect(view.getByRole("button", { name: "Words and greetings" }).props.accessibilityState.expanded).toBe(true);
});

it.each([[320, "column"], [1440, "row"]])("adapts the native context header and kana targets at %dpt with large text", async (width, direction) => {
  const original = Dimensions.get("window");
  await act(() => Dimensions.set({ window: { ...original, width: Number(width), height: 900, fontScale: 2.5 } }));
  const navigate = jest.fn();
  const view = await render(<JapaneseLanguageHubScreen index={getContentIndex()} adapters={{ navigation: { navigate } }} />);
  try {
    expect(StyleSheet.flatten(view.getByTestId("mobile-page-header").props.style).flexDirection).toBe(direction);
    const home = view.getByTestId("mobile-home-link");
    const homeStyle = StyleSheet.flatten(home.props.style);
    expect(homeStyle.height).toBeUndefined();
    expect(homeStyle.minHeight).toBeGreaterThanOrEqual(48);
    await fireEvent.press(home);
    expect(navigate).toHaveBeenCalledWith("/");
    const kana = view.getByRole("button", { name: "あ · a" });
    const style = StyleSheet.flatten(kana.props.style);
    expect(style.height).toBeUndefined();
    expect(style.minHeight).toBeGreaterThanOrEqual(48);
    expect(style.width).toBeGreaterThan(64);
    expect(view.getByText("Japanese").props.allowFontScaling).not.toBe(false);
    expect(view.getByRole("button", { name: "Browse" })).toBeOnTheScreen();
  } finally {
    await view.unmount();
    await act(() => Dimensions.set({ window: original }));
  }
});


it.each([
  [BrowseScreen, "Search lessons", "No lessons or diagrams match these filters."],
  [PracticeCatalogScreen, "Search practice", "No practice matches. Try another search."],
])("names and recovers a native catalog search for %s", async (Screen, label, empty) => {
  const view = await render(<Screen index={getContentIndex()} adapters={{ navigation: { navigate: jest.fn() } }} />);
  expect(view.getByTestId("keyboard-aware-scroll").props.keyboardShouldPersistTaps).toBe("handled");
  await fireEvent.changeText(view.getByLabelText(label), "qzqznotfound");
  await waitFor(() => expect(view.getByText(empty)).toBeOnTheScreen());
  await fireEvent.press(view.getByRole("button", { name: "Clear search" }));
  expect(view.getByLabelText(label).props.value).toBe("");
});

it("exposes browse results and path activities as named navigable controls", async () => {
  const index = getContentIndex();
  const navigate = jest.fn();
  const browser = await render(<BrowseScreen index={index} adapters={{ navigation: { navigate } }} />);
  await fireEvent.changeText(browser.getByTestId("mobile-knowledge-search-input"), "cache aside");
  const diagram = index.diagrams.find(item => item.slug === "system-design/cache-aside")!;
  await waitFor(() => expect(browser.getByRole("button", { name: diagram.title })).toBeOnTheScreen());
  await fireEvent.press(browser.getByRole("button", { name: diagram.title }));
  expect(navigate).toHaveBeenCalledWith(diagram.route);
  await browser.unmount();
  const path = index.learningPaths.find(item => item.slug === "system-design-fundamentals")!;
  const detail = await render(<LearningPathDetailScreen index={index} learningPath={path} adapters={{ navigation: { navigate } }} />);
  const document = index.documents.find(item => item.slug === path.units[0].nodes[0].slug)!;
  await fireEvent.press(detail.getByRole("button", { name: document.title }));
  expect(navigate).toHaveBeenCalledWith(expect.stringContaining(`?path=${path.slug}`));
  await detail.unmount();
  const catalog = await render(<LearningPathHomeScreen index={index} adapters={{ navigation: { navigate } }} />);
  await fireEvent.press(catalog.getByRole("button", { name: `Open ${path.title}` }));
  expect(navigate).toHaveBeenCalledWith(path.route);
});

it("offers native progress sign-in only when authentication is configured", async () => {
  const navigate = jest.fn();
  const view = await render(<SaveProgressPrompt itemCount={2} adapters={{ navigation: { navigate } }} />);
  expect(view.getByText("Progress saved on this device.")).toBeOnTheScreen();
  expect(view.queryByRole("button", { name: "Sign in" })).toBeNull();
  await view.rerender(<SaveProgressPrompt itemCount={2} adapters={{ navigation: { navigate }, auth: { isConfigured: true } }} />);
  await fireEvent.press(view.getByRole("button", { name: "Sign in" }));
  expect(navigate).toHaveBeenCalledWith("/login");
});

it("discloses native diagram source and keeps it available through preview load failure and retry", async () => {
  const source = "flowchart LR\nA-->B";
  const view = await render(<MermaidBlock source={source} title="Cache flow" adapters={{ navigation: { navigate: jest.fn() }, mermaidScript: "window.mermaid={initialize(){}}" }} />);
  expect(view.queryByTestId("mobile-code-source")).toBeNull();
  await fireEvent.press(view.getByRole("button", { name: "Diagram source" }));
  expect(view.getByTestId("mobile-code-source")).toHaveTextContent(source);
  expect(view.getByRole("button", { name: "Diagram source" }).props.accessibilityState.expanded).toBe(true);
  await fireEvent(view.getByTestId("mobile-mermaid-webview"), "error", { nativeEvent: { description: "local error" } });
  expect(view.getByText("Couldn't open the diagram preview. Source is available below.")).toBeOnTheScreen();
  expect(view.getByTestId("mobile-code-source")).toHaveTextContent(source);
  await fireEvent.press(view.getByRole("button", { name: "Retry preview" }));
  expect(view.getByTestId("mobile-mermaid-webview")).toBeOnTheScreen();
  expect(view.queryByText(/Couldn't open the diagram preview/)).toBeNull();
});

it("names the native stroke model and related dictionary destinations", async () => {
  const character = getLanguageCharacterBySlug("japanese/hiragana/ha")!;
  const vocabulary = getContentIndex().languageVocabulary.find(word => word.characterSlugs.includes(character.slug))!;
  const navigate = jest.fn();
  const view = await render(<JapaneseCharacterDetailScreen character={character} relatedVocabulary={[vocabulary]} adapters={{ navigation: { navigate } }} />);
  expect(view.getByLabelText(`Stroke order for ${character.glyph}`)).toBeOnTheScreen();
  await fireEvent.press(view.getByRole("button", { name: `${vocabulary.expression} · ${vocabulary.romaji}` }));
  expect(navigate).toHaveBeenCalledWith(vocabulary.route);
});

it.each([[320, 2], [768, 2.5]])("keeps Learn shortcut labels readable at %dpt and %s text scale", async (width, fontScale) => {
  const original = Dimensions.get("window");
  await act(() => Dimensions.set({ window: { ...original, width, height: 900, fontScale } }));
  const navigate = jest.fn();
  const view = await render(<HomeDiscoveryScreen index={getContentIndex()} adapters={{ navigation: { navigate } }} />);
  try {
    expect(StyleSheet.flatten(view.getByTestId("mobile-home-shortcuts").props.style).flexWrap).toBe("wrap");
    expect(view.getByLabelText("Search all content").props.placeholder).toBe("Search topics");
    expect(view.queryByTestId("mobile-home-explore-learn")).toBeNull();
    expect(within(view.getByTestId("mobile-home-shortcuts")).getAllByRole("button")).toHaveLength(5);
    for (const [label, route] of [["Paths", "/paths"], ["Lessons", "/browse"], ["Practice", "/practice"], ["Interviews", "/interviews"], ["Languages", "/languages"]]) {
      const shortcut = view.getByTestId(`mobile-home-explore-${label.toLowerCase()}`);
      const style = StyleSheet.flatten(shortcut.props.style);
      expect(style.minWidth).toBeGreaterThanOrEqual(80 * fontScale);
      expect(style.height).toBeUndefined();
      await fireEvent.press(shortcut);
      expect(navigate).toHaveBeenLastCalledWith(route);
    }
  } finally {
    await view.unmount();
    await act(() => Dimensions.set({ window: original }));
  }
});

it.each([
  [320, 1, "row"],
  [375, 1, "row"],
  [375, 2.86, "column"],
  [768, 2.5, "column"],
  [834, 1, "row"],
  [834, 2, "row"],
])("gives Learn section titles a full row at %dpt and %s text scale", async (width, fontScale, direction) => {
  const original = Dimensions.get("window");
  await act(() => Dimensions.set({ window: { ...original, width: Number(width), height: 900, fontScale: Number(fontScale) } }));
  const navigate = jest.fn();
  const index = getContentIndex();
  const view = await render(<HomeDiscoveryScreen index={index} adapters={{ navigation: { navigate } }} />);
  try {
    for (const section of getHomeDiscoverySections(index)) {
      const title = within(view.getByTestId(`mobile-home-section-${section.id}`)).getByText(section.title);
      const titleRegion = title.parent!;
      const header = titleRegion.parent!;
      expect(StyleSheet.flatten(header.props.style).flexDirection).toBe(direction);
      if (direction === "column") {
        expect(StyleSheet.flatten(header.props.style).alignItems).toBe("stretch");
        expect(StyleSheet.flatten(titleRegion.props.style).flex).toBe(0);
      }
      await fireEvent.press(view.getByTestId(`mobile-home-view-all-${section.id}`));
      expect(navigate).toHaveBeenLastCalledWith(section.route);
    }
  } finally {
    await view.unmount();
    await act(() => Dimensions.set({ window: original }));
  }
});
