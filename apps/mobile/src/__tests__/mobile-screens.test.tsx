import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { getContentIndex, getExerciseBySlug, getInterviewQuestionBySlug } from "@codematica/core";
import type { CodematicaAdapters } from "@codematica/ui";
import { BrowseScreen, HomeDiscoveryScreen, InterviewCatalogScreen, InterviewQuestionScreen, JapaneseLanguageHubScreen, PracticeScreen } from "@codematica/ui";

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

    fireEvent.changeText(view.getByTestId("mobile-knowledge-search-input"), "cache invalidation");

    expect(view.getByTestId("mobile-search-results")).toBeOnTheScreen();
    expect(view.getByText(/Cache Invalidation/i)).toBeOnTheScreen();
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

    fireEvent.changeText(view.getByTestId("mobile-japanese-search-input"), "water");

    expect(view.getByTestId("mobile-japanese-results")).toBeOnTheScreen();
    expect(view.getAllByText("水").length).toBeGreaterThan(0);
  });

  it("renders Japanese writing practice from a writing exercise", async () => {
    const exercise = getExerciseBySlug("languages/japanese-hiragana-vowels-writing");

    expect(exercise?.type).toBe("writing");
    const view = await render(<PracticeScreen exercise={exercise!} adapters={adapters} />);

    expect(view.getByTestId("mobile-writing-practice")).toBeOnTheScreen();
    expect(view.getByTestId("mobile-writing-pad")).toBeOnTheScreen();
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
  });
});
