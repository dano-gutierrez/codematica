import { act, fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { getContentIndex, getExerciseBySlug, getHomeDiscoverySections, getInterviewQuestionBySlug, getJapaneseVocabularyForCharacter, getLanguageCharacterBySlug, searchContent, searchDiscovery } from "@codematica/core";
import type { CodematicaAdapters } from "../../../../packages/ui/src/adapters";
import { BrowseScreen, HomeDiscoveryScreen, InterviewCatalogScreen, InterviewQuestionScreen, JapaneseCharacterDetailScreen, JapaneseFlashcardReviewScreen, JapaneseLanguageHubScreen, JapanesePracticeModeScreen, JapaneseReviewScreen, MarkdownReader, PracticeScreen } from "../../../../packages/ui/src/screens";

const adapters: CodematicaAdapters = {
  navigation: {
    navigate: jest.fn(),
  },
  progress: {
    record: jest.fn(),
  },
};

jest.mock("@codematica/core", () => {
  const actual = jest.requireActual("@codematica/core");
  return { ...actual, searchContent: jest.fn(actual.searchContent), searchDiscovery: jest.fn(actual.searchDiscovery) };
});

describe("mobile shared screens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("continues an algorithm reading to its exact path destination without certifying a result", async () => {
    const question = getInterviewQuestionBySlug("amazon", "two-sum-product-pair")!;
    const nextHref = "/interviews/apple/validate-parentheses-stream?path=coding-interview-pattern-practice";
    const view = await render(<InterviewQuestionScreen question={question} nextHref={nextHref} adapters={adapters} />);
    await fireEvent.press(view.getByTestId("mobile-interview-next-node"));
    expect(adapters.navigation.navigate).toHaveBeenCalledTimes(1);
    expect(adapters.navigation.navigate).toHaveBeenCalledWith(nextHref);
    expect(adapters.progress?.record).not.toHaveBeenCalled();
  });

  it("keeps an algorithm reading without a supplied continuation", async () => {
    const question = getInterviewQuestionBySlug("amazon", "two-sum-product-pair")!;
    const view = await render(<InterviewQuestionScreen question={question} adapters={adapters} />);
    expect(view.queryByTestId("mobile-interview-next-node")).toBeNull();
    expect(adapters.navigation.navigate).not.toHaveBeenCalled();
  });

  it("searches generated content from the bundled index", async () => {
    const view = await render(<BrowseScreen index={getContentIndex()} adapters={adapters} />);

    await fireEvent.changeText(view.getByTestId("mobile-knowledge-search-input"), "cache invalidation");

    await waitFor(() => expect(view.getAllByText(/Cache Invalidation/i).length).toBeGreaterThan(0));
  });

  it("waits for a typing pause in Browse and hides earlier query results", async () => {
    jest.useFakeTimers();
    try {
      const index = getContentIndex();
      const view = await render(<BrowseScreen index={index} adapters={adapters} />);
      const lookup = jest.mocked(searchContent);
      const input = view.getByTestId("mobile-knowledge-search-input");
      lookup.mockClear();
      await fireEvent.changeText(input, "c");
      expect(view.getByText("Searching…")).toBeOnTheScreen();
      expect(within(view.getByTestId("mobile-search-results")).queryAllByRole("button")).toHaveLength(0);
      expect(view.queryByText("No lessons or diagrams match these filters.")).toBeNull();
      await act(async () => { jest.advanceTimersByTime(299); });
      expect(lookup).not.toHaveBeenCalled();
      await fireEvent.changeText(input, "cache aside");
      await act(async () => { jest.advanceTimersByTime(299); });
      expect(lookup).not.toHaveBeenCalled();
      await act(async () => { jest.advanceTimersByTime(1); });
      expect(lookup).toHaveBeenCalledTimes(1);
      expect(lookup).toHaveBeenLastCalledWith(index, "cache aside", { track: undefined, difficulty: undefined });
      expect(view.queryByText("Searching…")).toBeNull();
      await fireEvent.press(view.getByTestId("mobile-result-diagram-system-design-cache-aside"));
      expect(adapters.navigation.navigate).toHaveBeenLastCalledWith("/diagrams/system-design/cache-aside");

      lookup.mockClear();
      await fireEvent.changeText(input, "water");
      expect(view.queryByTestId("mobile-result-diagram-system-design-cache-aside")).toBeNull();
      await fireEvent.press(view.getByRole("button", { name: "Foundation" }));
      expect(lookup).not.toHaveBeenCalled();
      await act(async () => { jest.advanceTimersByTime(300); });
      expect(lookup).toHaveBeenCalledTimes(1);
      expect(lookup).toHaveBeenLastCalledWith(index, "water", { track: undefined, difficulty: "foundation" });
    } finally {
      jest.useRealTimers();
    }
  });

  it("cancels a pending Browse query on clear and on leaving the screen", async () => {
    jest.useFakeTimers();
    const scheduleTimer = jest.spyOn(globalThis, "setTimeout");
    const clearTimer = jest.spyOn(globalThis, "clearTimeout");
    try {
      const view = await render(<BrowseScreen index={getContentIndex()} adapters={adapters} />);
      const lookup = jest.mocked(searchContent);
      const input = view.getByTestId("mobile-knowledge-search-input");
      lookup.mockClear();
      await fireEvent.changeText(input, "discard this query");
      await act(async () => { jest.advanceTimersByTime(299); });
      await fireEvent.press(view.getByRole("button", { name: "Clear search" }));
      await act(async () => { jest.advanceTimersByTime(300); });
      expect(lookup.mock.calls.map(([, query]) => query)).not.toContain("discard this query");
      expect(view.getByTestId("mobile-knowledge-search-input").props.value).toBe("");
      expect(view.queryByText("Searching…")).toBeNull();
      expect(within(view.getByTestId("mobile-search-results")).getAllByRole("button")).toHaveLength(40);
      lookup.mockClear();
      scheduleTimer.mockClear();
      clearTimer.mockClear();
      await fireEvent.changeText(input, "leave before lookup");
      const pending = scheduleTimer.mock.calls.findIndex(([, delay]) => delay === 300);
      expect(pending).toBeGreaterThanOrEqual(0);
      const timer = scheduleTimer.mock.results[pending]!.value;
      await view.unmount();
      expect(clearTimer).toHaveBeenCalledWith(timer);
      await act(async () => { jest.advanceTimersByTime(300); });
      expect(lookup).not.toHaveBeenCalled();
    } finally {
      clearTimer.mockRestore();
      scheduleTimer.mockRestore();
      jest.useRealTimers();
    }
  });

  it("shows every discovery section and searches across them", async () => {
    const index = getContentIndex();
    const view = await render(<HomeDiscoveryScreen index={index} adapters={adapters} />);

    expect(view.getByTestId("mobile-home-section-paths")).toBeOnTheScreen();
    expect(view.getByTestId("mobile-home-section-languages")).toBeOnTheScreen();
    const shortcuts = within(view.getByTestId("mobile-home-shortcuts"));
    expect(shortcuts.queryByRole("button", { name: "Learn" })).toBeNull();
    expect(shortcuts.getAllByRole("button")).toHaveLength(5);
    for (const [name, route] of [["Paths", "/paths"], ["Lessons", "/browse"], ["Practice", "/practice"], ["Interviews", "/interviews"], ["Languages", "/languages"]]) {
      await fireEvent.press(shortcuts.getByRole("button", { name }));
      expect(adapters.navigation.navigate).toHaveBeenLastCalledWith(route);
    }
    for (const section of getHomeDiscoverySections(index)) {
      for (const item of section.items) {
        const card = within(view.getByTestId(`mobile-home-section-${section.id}`)).getByTestId(`mobile-discovery-${item.kind}-${item.sourceSlug.replaceAll("/", "-")}`);
        expect(within(card).getByText(item.title)).toBeOnTheScreen();
        expect(within(card).getByText(item.eyebrow)).toBeOnTheScreen();
        expect(card.props.accessibilityLabel).toBe([item.title, item.eyebrow, item.difficulty ? within(card).getByText(item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)).props.children : undefined].filter(Boolean).join(", "));
        expect(within(card).queryByText(item.summary)).toBeNull();
        expect(card.props.accessibilityHint).toBeUndefined();
        await fireEvent.press(card);
        expect(adapters.navigation.navigate).toHaveBeenLastCalledWith(item.route);
      }
    }

    await fireEvent.changeText(view.getByTestId("mobile-home-global-search"), "Number Of Islands");

    await waitFor(() => expect(view.getByTestId("mobile-home-search-results")).toBeOnTheScreen());
    await waitFor(() => expect(view.getByText("Number Of Islands")).toBeOnTheScreen());
    for (const item of searchDiscovery(index, "Number Of Islands").slice(0, 40)) {
      const card = within(view.getByTestId("mobile-home-search-results")).getByTestId(`mobile-discovery-${item.kind}-${item.sourceSlug.replaceAll("/", "-")}`);
      expect(within(card).getByText(item.title)).toBeOnTheScreen();
      expect(within(card).getByText(item.eyebrow)).toBeOnTheScreen();
      expect(card.props.accessibilityLabel).toBe([item.title, item.eyebrow, item.difficulty ? within(card).getByText(item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)).props.children : undefined].filter(Boolean).join(", "));
      expect(within(card).queryByText(item.summary)).toBeNull();
      expect(card.props.accessibilityHint).toBeUndefined();
    }
  });

  it("keeps Learn resume titles, labels and destinations without description previews", async () => {
    const view = await render(<HomeDiscoveryScreen index={getContentIndex()} isSignedIn keepReadingItems={[{
      id: "document-system-design/cache-invalidation",
      title: "A resumed lesson",
      summary: "A description that should not appear on Learn.",
      href: "/docs/system-design/cache-invalidation",
      eyebrow: "Document",
      status: "started",
      lastSeenAt: "2026-10-04T00:00:00Z",
    }]} adapters={adapters} />);
    const resume = within(view.getByTestId("mobile-keep-reading"));
    expect(resume.getByText("Document")).toBeOnTheScreen();
    expect(resume.queryByText("A description that should not appear on Learn.")).toBeNull();
    await fireEvent.press(resume.getByRole("button", { name: "Resume A resumed lesson, Document" }));
    expect(adapters.navigation.navigate).toHaveBeenCalledWith("/docs/system-design/cache-invalidation");
  });

  it("coalesces native discovery searches while typing and cancels pending work on clear", async () => {
    jest.useFakeTimers();
    try {
      const view = await render(<HomeDiscoveryScreen index={getContentIndex()} adapters={adapters} />);
      const lookup = jest.mocked(searchDiscovery);
      lookup.mockClear();
      const input = view.getByTestId("mobile-home-global-search");
      await fireEvent.changeText(input, "N");
      expect(view.getByText("Searching…")).toBeOnTheScreen();
      await act(async () => { jest.advanceTimersByTime(299); });
      expect(view.getByText("Searching…")).toBeOnTheScreen();
      expect(lookup).not.toHaveBeenCalled();
      await fireEvent.changeText(input, "Number Of Islands");
      await act(async () => { jest.advanceTimersByTime(299); });
      expect(view.getByText("Searching…")).toBeOnTheScreen();
      expect(view.queryByTestId("mobile-discovery-interview-question-google-number-of-islands")).toBeNull();
      expect(lookup).not.toHaveBeenCalled();
      await act(async () => { jest.advanceTimersByTime(1); });
      expect(view.getByText("Number Of Islands")).toBeOnTheScreen();
      expect(view.queryByText("Searching…")).toBeNull();
      expect(lookup).toHaveBeenCalledTimes(1);
      expect(lookup).toHaveBeenLastCalledWith(getContentIndex(), "Number Of Islands");
      await fireEvent.changeText(input, "water");
      expect(view.getByText("Searching…")).toBeOnTheScreen();
      expect(view.queryByText("Number Of Islands")).toBeNull();
      await fireEvent.press(view.getByRole("button", { name: "Clear search" }));
      await act(async () => { jest.advanceTimersByTime(300); });
      expect(view.getByTestId("mobile-home-section-paths")).toBeOnTheScreen();
      expect(view.queryByTestId("mobile-home-search-results")).toBeNull();
      expect(lookup.mock.calls.map(([, query]) => query)).not.toContain("water");
    } finally {
      jest.useRealTimers();
    }
  });

  it("reveals a flashcard answer and records completion", async () => {
    const exercise = getExerciseBySlug("system-design/cache-product-contract");

    expect(exercise?.type).toBe("flashcard");
    const view = await render(<PracticeScreen exercise={exercise!} adapters={adapters} />);

    fireEvent.press(view.getByTestId("mobile-flashcard-reveal"));

    expect(adapters.progress?.record).toHaveBeenCalledWith(
      expect.objectContaining({ surface: "practice", slug: "system-design/cache-product-contract" }),
      "completed",
      { revealed: true },
    );
  });

  it("searches Japanese language data from the bundled index", async () => {
    const view = await render(<JapaneseLanguageHubScreen index={getContentIndex()} adapters={adapters} />);

    expect(view.getByTestId("mobile-japanese-flashcards-link")).toBeOnTheScreen();
    expect(view.getByTestId("mobile-japanese-path-link")).toBeOnTheScreen();
    expect(view.getByTestId("mobile-japanese-review-link")).toBeOnTheScreen();
    expect(view.getByTestId("mobile-japanese-resources")).toBeOnTheScreen();

    fireEvent.changeText(view.getByTestId("mobile-japanese-search-input"), "water");

    await waitFor(() => expect(view.getByTestId("mobile-japanese-results")).toBeOnTheScreen());
    expect(view.getAllByText("水").length).toBeGreaterThan(0);
  });

  it("keeps every Japanese review skill available with substantive N5 practice modes", async () => {
    const index = getContentIndex();
    const learningPath = index.learningPaths.find((path) => path.slug === "japanese-foundations")!;
    const onRate = jest.fn();
    const view = await render(<JapaneseReviewScreen learningPath={learningPath} progress={[]} onRate={onRate} adapters={adapters} />);

    expect(view.getByTestId("mobile-japanese-review-skills")).toBeOnTheScreen();
    expect(view.getByTestId("mobile-japanese-review-flashcards")).toBeOnTheScreen();
    expect(view.getByTestId("mobile-japanese-review-writing")).toBeOnTheScreen();
    expect(view.queryByText(/audio/i)).toBeNull();
    await fireEvent.press(view.getByTestId("mobile-japanese-review-good"));
    expect(onRate).toHaveBeenCalledWith("kana-listening", "good");
    await waitFor(() => expect(view.getByTestId("mobile-japanese-review-good").props.accessibilityState).toEqual(expect.objectContaining({ selected: true, disabled: true })));
    expect(view.getByText(/Good saved/i)).toBeOnTheScreen();

    await fireEvent.press(view.getByTestId("mobile-japanese-review-good"));
    expect(onRate).toHaveBeenCalledTimes(1);

    await fireEvent.press(view.getByTestId("mobile-japanese-review-reset"));
    await waitFor(() => expect(view.getByTestId("mobile-japanese-review-good").props.accessibilityState).toEqual(expect.objectContaining({ selected: false, disabled: false })));
  });

  it("renders Japanese writing practice from a writing exercise", async () => {
    const exercise = getExerciseBySlug("languages/japanese-hiragana-vowels-writing");

    expect(exercise?.type).toBe("writing");
    const view = await render(<PracticeScreen exercise={exercise!} adapters={adapters} />);

    expect(view.getByTestId("mobile-writing-practice")).toBeOnTheScreen();
    expect(view.getByTestId("mobile-writing-pad")).toBeOnTheScreen();
  });

  it("reveals and advances the native N5 flashcard deck", async () => {
    const vocabulary = getContentIndex().languageVocabulary.slice(0, 2);
    const view = await render(<JapaneseFlashcardReviewScreen vocabulary={vocabulary} adapters={adapters} />);

    await fireEvent.press(view.getByTestId("mobile-japanese-flashcard"));
    await waitFor(() => expect(view.getByText(vocabulary[0]!.meanings.join(", "))).toBeOnTheScreen());
    await fireEvent.press(view.getByText("Next"));
    await waitFor(() => expect(view.getByText("Card 2 of 2")).toBeOnTheScreen());
    await fireEvent.press(view.getByText("Previous"));
    await waitFor(() => expect(view.getByText("Card 1 of 2")).toBeOnTheScreen());
  });

  it("opens native writing units and explains the human audio gate", async () => {
    const exercise = getExerciseBySlug("languages/japanese-n5-identity-and-demonstratives-open-answer")!;
    const writing = await render(<JapanesePracticeModeScreen title="Writing" description="Compose answers." exercises={[exercise as never]} adapters={adapters} />);
    await fireEvent.press(writing.getByTestId("mobile-japanese-practice-unit-1"));
    expect(adapters.navigation.navigate).toHaveBeenCalledWith(exercise.route);

    const listening = await render(<JapanesePracticeModeScreen title="Listening" description="Approved audio only." exercises={[]} adapters={adapters} />);
    expect(listening.getByTestId("mobile-japanese-listening-pending")).toBeOnTheScreen();
  });

  it("converts romaji and grades a native open answer", async () => {
    const exercise = getExerciseBySlug("languages/japanese-n5-identity-and-demonstratives-open-answer")!;
    const view = await render(<PracticeScreen exercise={exercise} adapters={adapters} />);

    const input = await waitFor(() => view.getByTestId("mobile-questionnaire-open-answer-input"));
    await fireEvent.changeText(input, "watashi wa gakusei desu");
    await fireEvent.press(view.getByTestId("mobile-japanese-ime-candidate-0"));
    await fireEvent.press(view.getByTestId("mobile-questionnaire-check"));
    await waitFor(() => expect(view.getByText(/Correct|Not quite/)).toBeOnTheScreen());
    await fireEvent.press(view.getByTestId("mobile-questionnaire-next"));
  });

  it("embeds transient writing practice and related phrases on character details", async () => {
    const character = getLanguageCharacterBySlug("japanese/hiragana/ha")!;
    const relatedVocabulary = getJapaneseVocabularyForCharacter(getContentIndex(), character.slug);
    const view = await render(<JapaneseCharacterDetailScreen character={character} relatedVocabulary={relatedVocabulary} adapters={adapters} />);

    expect(view.getByTestId("mobile-japanese-character-practice")).toBeOnTheScreen();
    expect(view.getByTestId("mobile-writing-pad")).toBeOnTheScreen();
    expect(view.getByText("こんばんは")).toBeOnTheScreen();
  });

  it("routes internal Japanese lesson links through the native navigation adapter", async () => {
    const view = await render(<MarkdownReader markdown="[は](/languages/japanese/characters/hiragana/ha)" adapters={adapters} />);

    fireEvent.press(view.getByText("は"));
    expect(adapters.navigation.navigate).toHaveBeenCalledWith("/languages/japanese/characters/hiragana/ha");
  });

  it("groups real-world interviews and renders web exercises as read-only source", async () => {
    const catalog = await render(<InterviewCatalogScreen index={getContentIndex()} adapters={adapters} />);
    expect(catalog.getByTestId("mobile-real-world-interview-list")).toBeOnTheScreen();
    expect(catalog.getAllByText("Real-world interviews").length).toBeGreaterThan(0);

    const question = getInterviewQuestionBySlug("real-world", "mondrian-composition-generator");
    expect(question?.kind).toBe("web");
    const detail = await render(<InterviewQuestionScreen question={question!} adapters={adapters} />);

    expect(detail.queryByTestId("mobile-web-interview-evaluation")).toBeNull();
    expect(detail.queryByTestId("mobile-web-interview-red-flags")).toBeNull();
    const evaluation = detail.getByRole("button", { name: "What to demonstrate" });
    expect(evaluation.props.accessibilityState.expanded).toBe(false);
    await fireEvent.press(evaluation);
    expect(detail.getByTestId("mobile-web-interview-evaluation")).toBeOnTheScreen();
    expect(detail.getByRole("button", { name: "What to demonstrate" }).props.accessibilityState.expanded).toBe(true);
    await fireEvent.press(detail.getByRole("button", { name: "What to demonstrate" }));
    expect(detail.queryByTestId("mobile-web-interview-evaluation")).toBeNull();
    await fireEvent.press(detail.getByRole("button", { name: "Acceptance criteria" }));
    expect(detail.getByTestId("mobile-web-interview-criteria")).toBeOnTheScreen();
    await fireEvent.press(detail.getByRole("button", { name: "Red flags" }));
    expect(detail.getByTestId("mobile-web-interview-red-flags")).toBeOnTheScreen();
    expect(detail.getByText("Hardcodes one painting")).toBeOnTheScreen();
    expect(detail.getAllByText("Weighted CSS Grid").length).toBeGreaterThan(0);
    await fireEvent.press(detail.getByTestId("mobile-web-show-solution"));
    expect(detail.getByText("Interactive runner available on web")).toBeOnTheScreen();
    expect(detail.getByText(/createGridComposition/)).toBeOnTheScreen();
    await fireEvent.press(detail.getByText("Recursive Rectangular Subdivision"));
    expect(detail.getByRole("button", { name: "Recursive Rectangular Subdivision" }).props.accessibilityState.selected).toBe(true);
    expect(detail.getByTestId("mobile-web-solution")).toHaveTextContent(/Recursive Rectangular Subdivision/);
  });
  it("guides a frontend recipe in both languages and continues to its quiz", async () => {
    const question = getInterviewQuestionBySlug("frontend-practice", "dynamic-board")!;
    const nextHref = "/practice/frontend/interview-dynamic-board-questionnaire?path=frontend-interview-practice";
    const view = await render(<InterviewQuestionScreen question={question} nextHref={nextHref} adapters={adapters} />);
    expect(view.getByTestId("mobile-web-recipe-position")).toHaveTextContent("Step 1 of 4");
    expect(view.queryByText("Interactive runner available on web")).toBeNull();
    await fireEvent.press(view.getByTestId("mobile-web-next-step"));
    expect(view.getByTestId("mobile-web-recipe-position")).toHaveTextContent("Step 2 of 4");
    await fireEvent.press(view.getByTestId("mobile-web-previous-step"));
    await fireEvent.press(view.getByTestId("mobile-web-show-solution"));
    await fireEvent.press(view.getByText("Python"));
    expect(view.getByText(/def create_board/)).toBeOnTheScreen();
    await fireEvent.press(view.getByTestId("mobile-interview-next-node"));
    expect(adapters.navigation.navigate).toHaveBeenCalledWith(nextHref);
    await fireEvent.press(view.getByText("Flat indexes"));
    expect(view.getByTestId("mobile-web-recipe-position")).toHaveTextContent("Step 1 of 4");
  });

});
