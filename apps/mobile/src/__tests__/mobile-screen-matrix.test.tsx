import { fireEvent, render, waitFor } from "@testing-library/react-native";
import {
  getContentIndex,
  getExerciseBySlug,
  getInterviewCollectionBySlug,
  getInterviewQuestionBySlug,
  getLanguageVocabularyBySlug,
} from "@codematica/core";
import type { CodematicaAdapters } from "../../../../packages/ui/src/adapters";
import {
  CodeBlock,
  DiagramReaderScreen,
  DifficultyPill,
  DocumentReaderScreen,
  InterviewCollectionScreen,
  InterviewQuestionScreen,
  JapaneseVocabularyDetailScreen,
  KeepReadingSection,
  BrowseScreen,
  LanguageCatalogScreen,
  LearningPathDetailScreen,
  LearningPathHomeScreen,
  LoginScreen,
  MarkdownReader,
  MermaidBlock,
  PassiveFlashcardFeedScreen,
  PracticeCatalogScreen,
  PracticeScreen,
  SaveProgressPrompt,
} from "../../../../packages/ui/src/screens";

function createAdapters(overrides: Partial<CodematicaAdapters> = {}): CodematicaAdapters {
  return {
    navigation: {
      navigate: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
      openExternalUrl: jest.fn(async () => undefined),
    },
    progress: { record: jest.fn(async () => undefined) },
    ...overrides,
  };
}

describe("complete shared native screen matrix", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, "random").mockReturnValue(0.99);
  });

  afterEach(() => jest.restoreAllMocks());

  it("renders path, practice, and language catalogs and routes their primary actions", async () => {
    const index = getContentIndex();
    const adapters = createAdapters();
    const progressItem = {
      id: "document-cache", title: "Resume cache", summary: "Summary", href: "/docs/cache",
      eyebrow: "Document", status: "started" as const, lastSeenAt: "2026-08-05T00:00:00.000Z",
    };
    const home = await render(<LearningPathHomeScreen index={index} keepReadingItems={[progressItem]} isSignedIn adapters={adapters} />);
    await fireEvent.press(home.getByTestId("mobile-home-browse"));
    await fireEvent.press(home.getByText("Resume cache"));
    expect(adapters.navigation.navigate).toHaveBeenCalledWith("/browse");
    expect(adapters.navigation.navigate).toHaveBeenCalledWith("/docs/cache");
    await home.unmount();

    const browser = await render(<BrowseScreen index={index} adapters={adapters} />);
    await fireEvent.changeText(browser.getByTestId("mobile-knowledge-search-input"), "cache aside");
    await fireEvent.press(browser.getByTestId("mobile-result-diagram-system-design-cache-aside"));
    expect(adapters.navigation.navigate).toHaveBeenCalledWith("/diagrams/system-design/cache-aside");
    await browser.unmount();

    const practice = await render(<PracticeCatalogScreen index={index} adapters={adapters} />);
    await fireEvent.changeText(practice.getByTestId("mobile-practice-catalog-search"), "cache");
    expect(practice.getByTestId("mobile-practice-catalog")).toBeOnTheScreen();
    await practice.unmount();

    const language = await render(<LanguageCatalogScreen index={index} adapters={adapters} />);
    await fireEvent.press(language.getByTestId("mobile-language-japanese"));
    expect(adapters.navigation.navigate).toHaveBeenCalledWith("/languages/japanese");
  });

  it("renders path nodes and follows document, diagram, and exercise routes", async () => {
    const index = getContentIndex();
    const path = index.learningPaths.find((item) => item.slug === "system-design-fundamentals")!;
    const adapters = createAdapters();
    const view = await render(<LearningPathDetailScreen index={index} learningPath={path} adapters={adapters} />);
    expect(view.getByTestId("mobile-path-units")).toBeOnTheScreen();
    const node = path.units.flatMap((unit) => unit.nodes)[0]!;
    await fireEvent.press(view.getByTestId(`mobile-path-node-${node.kind}-${node.slug.replaceAll("/", "-")}`));
    expect(adapters.navigation.navigate).toHaveBeenCalledWith(expect.stringContaining(node.slug));
  });

  it("renders ML career stages and opens planned source nodes externally", async () => {
    const index = getContentIndex();
    const path = index.learningPaths.find((item) => item.slug === "ml-systems-engineer")!;
    const adapters = createAdapters();
    const view = await render(<LearningPathDetailScreen index={index} learningPath={path} adapters={adapters} />);
    expect(view.getByText("Scientific Computing Apprentice")).toBeOnTheScreen();
    const node = path.units.find((unit) => unit.slug === "volume-one-build")!.nodes[0]!;
    await fireEvent.press(view.getByTestId(`mobile-path-node-${node.kind}-${node.slug.replaceAll("/", "-")}`));
    expect(adapters.navigation.openExternalUrl).toHaveBeenCalledWith("https://mlsysbook.ai/vol1/nn_computation/nn_computation.html");
  });

  it("reads documents and diagrams, records completion, and renders Mermaid success/fallback states", async () => {
    const index = getContentIndex();
    const document = index.documents.find((item) => item.diagramRefs.length > 0)!;
    const diagram = index.diagrams.find((item) => document.diagramRefs.includes(item.slug))!;
    const adapters = createAdapters();
    const article = await render(<DocumentReaderScreen document={document} referencedDiagrams={[diagram]} nextHref="/practice/next?path=test-path" adapters={adapters} />);
    await fireEvent.press(article.getByTestId("mobile-document-next-node"));
    expect(adapters.progress?.record).toHaveBeenCalledWith(expect.objectContaining({ surface: "document", pathSlug: "test-path" }), "completed", expect.any(Object));
    await article.unmount();

    const diagramView = await render(<DiagramReaderScreen diagram={diagram} nextHref="/next" adapters={adapters} />);
    await fireEvent.press(diagramView.getByTestId("mobile-diagram-next-node"));
    expect(diagramView.getByTestId("mobile-mermaid-block")).toBeOnTheScreen();
    await diagramView.unmount();

    const rendered = await render(<MermaidBlock source={'flowchart LR\nA["<unsafe>"] --> B'} title="Safe diagram" adapters={{ ...adapters, mermaidScript: "window.mermaid = mermaid;" }} />);
    expect(rendered.getByTestId("mobile-mermaid-webview")).toBeOnTheScreen();
    expect(rendered.getByText("Safe diagram")).toBeOnTheScreen();
  });

  it("completes flashcard, cloze, and every questionnaire interaction kind", async () => {
    const adapters = createAdapters();
    const flashcard = getExerciseBySlug("system-design/cache-product-contract")!;
    const flash = await render(<PracticeScreen exercise={flashcard} nextHref="/next?path=system-design" adapters={adapters} />);
    await fireEvent.press(flash.getByTestId("mobile-flashcard-reveal"));
    await flash.unmount();

    const cloze = getExerciseBySlug("programming/runtime-boundary-cloze")!;
    const clozeView = await render(<PracticeScreen exercise={cloze} adapters={adapters} />);
    await fireEvent.changeText(clozeView.getByTestId("mobile-cloze-answer-input"), "schema");
    await fireEvent.press(clozeView.getByTestId("mobile-cloze-check"));
    expect(clozeView.getByTestId("mobile-cloze-feedback")).toBeOnTheScreen();
    await clozeView.unmount();

    const questionnaire = getExerciseBySlug("programming/python-runtime-questionnaire")!;
    const session = await render(<PracticeScreen exercise={questionnaire} nextHref="/questionnaire-next" adapters={adapters} />);
    await fireEvent.press(session.getByTestId("mobile-questionnaire-choice-binding"));
    await fireEvent.press(session.getByTestId("mobile-questionnaire-check"));
    await fireEvent.press(session.getByTestId("mobile-questionnaire-next"));
    await fireEvent.changeText(session.getByTestId("mobile-questionnaire-cloze-answer-input"), "None");
    await fireEvent.press(session.getByTestId("mobile-questionnaire-check"));
    await fireEvent.press(session.getByTestId("mobile-questionnaire-next"));
    await fireEvent.press(session.getAllByText("Down")[0]!);
    await fireEvent.press(session.getAllByText("Up")[1]!);
    await fireEvent.press(session.getByTestId("mobile-questionnaire-check"));
    await fireEvent.press(session.getByTestId("mobile-questionnaire-next"));
    await fireEvent.press(session.getByTestId("mobile-questionnaire-match-none-none"));
    await fireEvent.press(session.getByTestId("mobile-questionnaire-match-dict-dict"));
    await fireEvent.press(session.getByTestId("mobile-questionnaire-match-with-with"));
    await fireEvent.press(session.getByTestId("mobile-questionnaire-check"));
    await fireEvent.press(session.getByTestId("mobile-questionnaire-next"));
    await fireEvent.press(session.getByTestId("mobile-questionnaire-choice-explicit-state"));
    await fireEvent.press(session.getByTestId("mobile-questionnaire-check"));
    await fireEvent.press(session.getByTestId("mobile-questionnaire-next"));
    await fireEvent.press(session.getByTestId("mobile-questionnaire-check"));
    await fireEvent.press(session.getByTestId("mobile-questionnaire-finish"));
    expect(session.getByTestId("mobile-questionnaire-complete")).toBeOnTheScreen();
    await fireEvent.press(session.getByText("Next node"));
    expect(adapters.navigation.navigate).toHaveBeenCalledWith("/questionnaire-next");
    await fireEvent.press(session.getByText("Restart"));
    expect(session.getByTestId("mobile-questionnaire-session")).toBeOnTheScreen();
  });

  it("draws, edits, clears, and completes native writing strokes", async () => {
    const source = getExerciseBySlug("languages/japanese-starter-kanji-writing")!;
    expect(source.type).toBe("writing");
    const exercise = { ...source, characterSlugs: ["japanese/kanji/one"], modes: ["free" as const] };
    const adapters = createAdapters();
    const view = await render(<PracticeScreen exercise={exercise} nextHref="/writing-next" adapters={adapters} />);
    const pad = view.getByTestId("mobile-writing-pad");
    const draw = async () => {
      await fireEvent(pad, "responderGrant", { nativeEvent: { locationX: 50.4, locationY: 140 } });
      await fireEvent(pad, "responderMove", { nativeEvent: { locationX: 229.6, locationY: 140 } });
      await fireEvent(pad, "responderRelease", { nativeEvent: { locationX: 229.6, locationY: 140 } });
    };
    await draw();
    await fireEvent.press(view.getByText("Undo"));
    await draw();
    await fireEvent.press(view.getByText("Clear"));
    await draw();
    await fireEvent.press(view.getByTestId("mobile-writing-check"));
    expect(view.getByText("Correct")).toBeOnTheScreen();
    await fireEvent.press(view.getByText("Next node"));
    expect(adapters.navigation.navigate).toHaveBeenCalledWith("/writing-next");
  });

  it("renders passive review, records scroll position, and opens its path", async () => {
    const feed = getContentIndex().passiveFlashcardFeeds[0]!;
    const adapters = createAdapters();
    const view = await render(<PassiveFlashcardFeedScreen feed={feed} initialVisibleCount={3} adapters={adapters} />);
    expect(view.getByTestId("mobile-passive-flashcard-card-0")).toBeOnTheScreen();
    await fireEvent.scroll(view.getByTestId("mobile-passive-flashcard-list"), {
      nativeEvent: { layoutMeasurement: { height: 600 }, contentOffset: { y: 1200 }, contentSize: { height: 6000 } },
    });
    expect(adapters.progress?.record).toHaveBeenCalledWith(expect.objectContaining({ surface: "passive-feed" }), "started", expect.objectContaining({ sequenceIndex: 2 }));
    await fireEvent.press(view.getByText("Path"));
    expect(adapters.navigation.navigate).toHaveBeenCalledWith(`/paths/${feed.pathSlug}`);
  });

  it("covers company collections and the algorithm interview solution controls", async () => {
    const collection = getInterviewCollectionBySlug("airbnb")!;
    const adapters = createAdapters();
    const catalog = await render(<InterviewCollectionScreen collection={collection} adapters={adapters} />);
    await fireEvent.press(catalog.getByTestId(`mobile-question-${collection.questions[0]!.slug}`));
    expect(adapters.navigation.navigate).toHaveBeenCalledWith(collection.questions[0]!.route);
    await catalog.unmount();

    const question = getInterviewQuestionBySlug("airbnb", "palindrome-pairs")!;
    const detail = await render(<InterviewQuestionScreen question={question} adapters={adapters} />);
    expect(detail.getAllByText("Python").length).toBeGreaterThan(0);
    await fireEvent.press(detail.getAllByText("TypeScript")[0]!);
    expect(detail.getAllByTestId("mobile-code-block").length).toBeGreaterThan(0);
  });

  it("renders vocabulary breakdowns, progress prompts, code, and every difficulty", async () => {
    const adapters = createAdapters();
    const vocabulary = getLanguageVocabularyBySlug("japanese/vocabulary/hello")!;
    const detail = await render(<JapaneseVocabularyDetailScreen vocabulary={vocabulary} adapters={adapters} />);
    expect(detail.getByTestId("mobile-japanese-vocabulary-breakdown")).toBeOnTheScreen();
    expect(detail.getByTestId("mobile-japanese-vocabulary-examples")).toBeOnTheScreen();
    await detail.unmount();

    const helpers = await render(<>
      <SaveProgressPrompt itemCount={0} adapters={adapters} />
      <SaveProgressPrompt itemCount={2} adapters={adapters} />
      <KeepReadingSection items={[]} isSignedIn={false} adapters={adapters} />
      <CodeBlock code="const value = 1" />
      {(["foundation", "practitioner", "senior", "principal"] as const).map((difficulty) => <DifficultyPill key={difficulty} difficulty={difficulty} />)}
    </>);
    expect(helpers.getByText(/2 local progress items can sync/i)).toBeOnTheScreen();
    await fireEvent.press(helpers.getByText("Sign in"));
    expect(adapters.navigation.navigate).toHaveBeenCalledWith("/login");
  });

  it("handles unconfigured, successful, and failed native Auth without hiding errors", async () => {
    const unconfigured = await render(<LoginScreen adapters={createAdapters()} />);
    expect(unconfigured.getByText(/environment variables are not configured/i)).toBeOnTheScreen();
    await fireEvent.press(unconfigured.getByTestId("mobile-sign-in"));
    await waitFor(() => expect(unconfigured.getByText("Signed in")).toBeOnTheScreen());
    await unconfigured.unmount();

    const signIn = jest.fn(async () => undefined);
    const configured = await render(<LoginScreen adapters={createAdapters({ auth: { isConfigured: true, signInWithPassword: signIn } })} />);
    await fireEvent.changeText(configured.getByPlaceholderText("Email"), "learner@example.com");
    await fireEvent.changeText(configured.getByPlaceholderText("Password"), "password");
    await fireEvent.press(configured.getByTestId("mobile-sign-in"));
    await waitFor(() => expect(configured.getByText("Signed in")).toBeOnTheScreen());
    expect(signIn).toHaveBeenCalledWith("learner@example.com", "password");
    await configured.unmount();

    const failed = await render(<LoginScreen adapters={createAdapters({ auth: { isConfigured: true, signInWithPassword: jest.fn(async () => { throw new Error("invalid login"); }) } })} />);
    await fireEvent.press(failed.getByTestId("mobile-sign-in"));
    await waitFor(() => expect(failed.getByText("invalid login")).toBeOnTheScreen());
  });

  it("routes both internal and external Markdown links", async () => {
    const adapters = createAdapters();
    const view = await render(<MarkdownReader markdown={'[Internal](/browse)\n\n[External](https://example.com)'} adapters={adapters} />);
    await fireEvent.press(view.getByText("Internal"));
    await fireEvent.press(view.getByText("External"));
    expect(adapters.navigation.navigate).toHaveBeenCalledWith("/browse");
    expect(adapters.navigation.openExternalUrl).toHaveBeenCalledWith("https://example.com");
  });
});
