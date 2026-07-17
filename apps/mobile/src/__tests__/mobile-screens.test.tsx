import { fireEvent, render } from "@testing-library/react-native";
import { getContentIndex, getExerciseBySlug } from "@codematica/core";
import type { CodematicaAdapters } from "@codematica/ui";
import { BrowseScreen, JapaneseLanguageHubScreen, PracticeScreen } from "@codematica/ui";

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
});
