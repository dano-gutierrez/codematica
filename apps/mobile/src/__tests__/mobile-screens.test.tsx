import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { getContentIndex, getExerciseBySlug, getInterviewQuestionBySlug, getJapaneseVocabularyForCharacter, getLanguageCharacterBySlug } from "@codematica/core";
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

describe("mobile shared screens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("searches generated content from the bundled index", async () => {
    const view = await render(<BrowseScreen index={getContentIndex()} adapters={adapters} />);

    await fireEvent.changeText(view.getByTestId("mobile-knowledge-search-input"), "cache invalidation");

    await waitFor(() => expect(view.getAllByText(/Cache Invalidation/i).length).toBeGreaterThan(0));
  });

  it("shows every discovery section and searches across them", async () => {
    const view = await render(<HomeDiscoveryScreen index={getContentIndex()} adapters={adapters} />);

    expect(view.getByTestId("mobile-home-section-paths")).toBeOnTheScreen();
    expect(view.getByTestId("mobile-home-section-languages")).toBeOnTheScreen();

    fireEvent.changeText(view.getByTestId("mobile-home-global-search"), "Number Of Islands");

    await waitFor(() => expect(view.getByTestId("mobile-home-search-results")).toBeOnTheScreen());
    expect(view.getByText("Number Of Islands")).toBeOnTheScreen();
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
    fireEvent.press(view.getByTestId("mobile-japanese-review-good"));
    expect(onRate).toHaveBeenCalledWith("kana-listening", "good");
    await waitFor(() => expect(view.getByTestId("mobile-japanese-review-good").props.accessibilityState).toEqual(expect.objectContaining({ selected: true, disabled: true })));
    expect(view.getByText(/Good saved/i)).toBeOnTheScreen();

    fireEvent.press(view.getByTestId("mobile-japanese-review-good"));
    expect(onRate).toHaveBeenCalledTimes(1);

    fireEvent.press(view.getByTestId("mobile-japanese-review-reset"));
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

    expect(detail.getByTestId("mobile-web-interview-evaluation")).toBeOnTheScreen();
    expect(detail.getByTestId("mobile-web-interview-red-flags")).toBeOnTheScreen();
    expect(detail.getAllByText("Weighted CSS Grid").length).toBeGreaterThan(0);
    expect(detail.getByText("Interactive runner available on web")).toBeOnTheScreen();
    expect(detail.getByText(/createGridComposition/)).toBeOnTheScreen();
    await fireEvent.press(detail.getByText("Recursive Rectangular Subdivision"));
    expect(detail.getAllByText("Recursive Rectangular Subdivision").length).toBeGreaterThan(1);
  });
});
