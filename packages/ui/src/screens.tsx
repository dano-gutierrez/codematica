import {
  buildPassiveFlashcardWindow,
  checkWritingAttempt,
  checkQuestionAnswer,
  createQuestionnaireAttempt,
  getAssistedStrokeCompletion,
  getJapaneseCharacterGroups,
  getHomeDiscoverySections,
  getLanguageCharacterBySlug,
  getPathNodeRoute,
  normalizeWritingStroke,
  searchJapanese,
  searchDiscovery,
  createDiscoveryItems,
  searchContent,
  type ContentIndex,
  type Difficulty,
  type DiscoveryResult,
  type DiscoverySectionId,
  type InterviewAlgorithmSolutionTrack,
  type InterviewCollection,
  type InterviewQuestion,
  type KnowledgeDocument,
  type JapaneseSearchResult,
  type LanguageCharacter,
  type LanguageStrokePoint,
  type LanguageVocabulary,
  type LearningExercise,
  type LearningPath,
  type LearningPathNode,
  type MermaidDiagram,
  type PassiveFlashcardCard,
  type PassiveFlashcardFeed,
  type PassiveFlashcardType,
  type ProgressDisplayItem,
  type ProgressStatus,
  type QuestionnaireAnswer,
  type QuestionnaireAnswerResult,
  type QuestionnaireAttemptQuestion,
  type QuestionnaireExercise,
  type SearchResult,
  type WritingCheckResult,
  type WritingStroke,
} from "@codematica/core";
import Markdown from "react-native-markdown-display";
import Svg, { Path, Text as SvgText } from "react-native-svg";
import { WebView } from "react-native-webview";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { GestureResponderEvent, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import type { CodematicaAdapters, ProgressTarget } from "./adapters";
import { colors, radii, spacing } from "./tokens";

const difficultyLabels: Record<Difficulty, string> = {
  foundation: "Foundation",
  practitioner: "Practitioner",
  senior: "Senior",
  principal: "Principal",
};

const cardTypeLabels: Record<PassiveFlashcardType, string> = {
  concept: "Concept",
  practical: "Practical",
  snippet: "Snippet",
  interview: "Interview",
};

type ScreenProps = {
  adapters: CodematicaAdapters;
};

export function AppScreen({ title, children, footer }: { title?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        {title ? <Text style={styles.screenEyebrow}>{title}</Text> : null}
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

export function Header({ adapters, subtitle = "Path map" }: { adapters: CodematicaAdapters; subtitle?: string }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" onPress={() => adapters.navigation.navigate("/")} style={styles.brand} testID="mobile-home-link">
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>C</Text>
        </View>
        <View style={styles.fill}>
          <Text style={styles.brandTitle}>Codematica</Text>
          <Text style={styles.brandSubtitle}>{subtitle}</Text>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => adapters.navigation.navigate("/browse")} style={styles.ghostButton} testID="mobile-browse-link">
        <Text style={styles.ghostButtonText}>Browse</Text>
      </Pressable>
    </View>
  );
}

export function LearningPathHomeScreen({
  index,
  keepReadingItems = [],
  isSignedIn = false,
  adapters,
}: {
  index: ContentIndex;
  keepReadingItems?: ProgressDisplayItem[];
  isSignedIn?: boolean;
} & ScreenProps) {
  return (
    <AppScreen>
      <Header adapters={adapters} />
      <Text style={styles.eyebrow}>Learning paths</Text>
      <Text style={styles.heroTitle}>Build engineering judgment one node at a time.</Text>
      <Text style={styles.heroCopy}>Follow role and skill paths made from documents, diagrams, flashcards, and practice.</Text>

      <KeepReadingSection items={keepReadingItems} isSignedIn={isSignedIn} adapters={adapters} />

      <View style={styles.actionRow}>
        <Button label="Content library" onPress={() => adapters.navigation.navigate("/browse")} testID="mobile-home-browse" />
        <Button label="Interview prep" variant="secondary" onPress={() => adapters.navigation.navigate("/interviews")} testID="mobile-home-interviews" />
      </View>

      <View style={styles.stack} testID="mobile-learning-path-list">
        {index.learningPaths.map((learningPath) => (
          <PathOverview key={learningPath.slug} index={index} learningPath={learningPath} adapters={adapters} />
        ))}
      </View>
    </AppScreen>
  );
}

export function HomeDiscoveryScreen({
  index,
  keepReadingItems = [],
  isSignedIn = false,
  adapters,
}: {
  index: ContentIndex;
  keepReadingItems?: ProgressDisplayItem[];
  isSignedIn?: boolean;
} & ScreenProps) {
  const [query, setQuery] = useState("");
  const sections = useMemo(() => getHomeDiscoverySections(index), [index]);
  const results = useMemo(() => searchDiscovery(index, query).slice(0, 40), [index, query]);
  const searching = query.trim().length > 0;

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Learning home" />
      <Text style={styles.eyebrow}>Choose your next step</Text>
      <Text style={styles.heroTitle}>What do you want to learn?</Text>
      <Text style={styles.heroCopy}>Search everything or jump into a focused learning section.</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search paths, lessons, interviews, or Japanese"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        testID="mobile-home-global-search"
      />

      {searching ? (
        <View style={styles.stack} testID="mobile-home-search-results">
          <Text style={styles.cardEyebrow}>{results.length} results</Text>
          {results.map((result) => <MobileDiscoveryCard key={`${result.kind}-${result.id}`} item={result} adapters={adapters} />)}
          {results.length === 0 ? <Text style={styles.emptyText}>No content matches that search.</Text> : null}
        </View>
      ) : (
        <>
          <KeepReadingSection items={keepReadingItems} isSignedIn={isSignedIn} adapters={adapters} />
          {sections.map((section) => (
            <View key={section.id} style={styles.discoverySection} testID={`mobile-home-section-${section.id}`}>
              <View style={styles.discoverySectionHeader}>
                <View style={styles.fill}>
                  <Text style={[styles.discoverySectionTitle, { color: discoverySectionColor(section.id) }]}>{section.title}</Text>
                  <Text style={styles.mutedText}>{section.description}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => adapters.navigation.navigate(section.route)}
                  style={[styles.discoveryViewAll, { backgroundColor: discoverySectionColor(section.id) }]}
                  testID={`mobile-home-view-all-${section.id}`}
                >
                  <Text style={styles.discoveryViewAllText}>View all</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoveryRow}>
                {section.items.map((item) => <MobileDiscoveryCard key={`${item.kind}-${item.id}`} item={item} adapters={adapters} compact />)}
              </ScrollView>
            </View>
          ))}
        </>
      )}
    </AppScreen>
  );
}

export function PracticeCatalogScreen({ index, adapters }: { index: ContentIndex } & ScreenProps) {
  const [query, setQuery] = useState("");
  const items = useMemo(
    () => createDiscoveryItems(index).filter((item) => item.section === "practice" && (!query.trim() || `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLocaleLowerCase("en-US").includes(query.trim().toLocaleLowerCase("en-US")))),
    [index, query],
  );

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Practice & review" />
      <Text style={[styles.eyebrow, { color: colors.sectionPractice }]}>Practice & review</Text>
      <Text style={styles.heroTitle}>Turn reading into active recall.</Text>
      <TextInput value={query} onChangeText={setQuery} placeholder="Search practice activities" placeholderTextColor={colors.textMuted} style={styles.input} testID="mobile-practice-catalog-search" />
      <View style={styles.stack} testID="mobile-practice-catalog">
        {items.map((item) => <MobileDiscoveryCard key={`${item.kind}-${item.id}`} item={item} adapters={adapters} />)}
      </View>
    </AppScreen>
  );
}

export function LanguageCatalogScreen({ index, adapters }: { index: ContentIndex } & ScreenProps) {
  const characterCount = index.languageCharacters.filter((item) => item.language === "ja" && item.status === "published").length;
  const vocabularyCount = index.languageVocabulary.filter((item) => item.language === "ja" && item.status === "published").length;

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Languages" />
      <Text style={[styles.eyebrow, { color: colors.sectionLanguages }]}>Languages</Text>
      <Text style={styles.heroTitle}>Build language foundations through reading and writing.</Text>
      <Pressable onPress={() => adapters.navigation.navigate("/languages/japanese")} style={[styles.card, { borderColor: colors.sectionLanguages }]} testID="mobile-language-japanese">
        <Text style={styles.cardEyebrow}>Available now</Text>
        <Text style={styles.cardTitle}>Japanese</Text>
        <Text style={styles.mutedText}>Practice kana, kanji, vocabulary, pronunciation, and handwriting.</Text>
        <View style={styles.pillRow}>
          <Pill label={`${characterCount} characters`} tone="amber" />
          <Pill label={`${vocabularyCount} vocabulary`} tone="amber" />
        </View>
      </Pressable>
    </AppScreen>
  );
}

function MobileDiscoveryCard({ item, adapters, compact = false }: { item: DiscoveryResult; compact?: boolean } & ScreenProps) {
  return (
    <Pressable
      onPress={() => adapters.navigation.navigate(item.route)}
      style={[styles.card, compact && styles.discoveryCardCompact, { borderColor: discoverySectionColor(item.section) }]}
      testID={`mobile-discovery-${item.kind}-${item.sourceSlug.replaceAll("/", "-")}`}
    >
      <Text style={[styles.cardEyebrow, { color: discoverySectionColor(item.section) }]}>{item.eyebrow}</Text>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.mutedText} numberOfLines={compact ? 3 : undefined}>{item.summary}</Text>
      {item.difficulty ? <DifficultyPill difficulty={item.difficulty} /> : null}
    </Pressable>
  );
}

function discoverySectionColor(section: DiscoverySectionId) {
  if (section === "paths") return colors.sectionPaths;
  if (section === "lessons") return colors.sectionLessons;
  if (section === "interviews") return colors.sectionInterviews;
  if (section === "practice") return colors.sectionPractice;
  return colors.sectionLanguages;
}

export function LearningPathDetailScreen({
  index,
  learningPath,
  adapters,
}: {
  index: ContentIndex;
  learningPath: LearningPath;
} & ScreenProps) {
  const flashcardFeed = index.passiveFlashcardFeeds.find((feed) => feed.pathSlug === learningPath.slug && feed.status === "published");

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Path detail" />
      <Button label="Paths" variant="ghost" onPress={() => adapters.navigation.navigate("/paths")} testID="mobile-paths-back" />
      <Text style={styles.eyebrow}>{learningPath.kind} path</Text>
      <Text style={styles.heroTitle}>{learningPath.title}</Text>
      <Text style={styles.heroCopy}>{learningPath.summary}</Text>
      {flashcardFeed ? (
        <Button label="Flashcard feed" onPress={() => adapters.navigation.navigate(flashcardFeed.route)} testID="mobile-path-flashcards" />
      ) : null}

      <View style={styles.stack} testID="mobile-path-units">
        {learningPath.units.map((unit, unitIndex) => (
          <View key={unit.slug} style={styles.card}>
            <Text style={styles.cardEyebrow}>Unit {unitIndex + 1}</Text>
            <Text style={styles.cardTitle}>{unit.title}</Text>
            <Text style={styles.mutedText}>{unit.summary}</Text>
            <PathNodes index={index} learningPath={learningPath} nodes={unit.nodes} adapters={adapters} />
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

function PathOverview({
  index,
  learningPath,
  adapters,
}: {
  index: ContentIndex;
  learningPath: LearningPath;
} & ScreenProps) {
  const nodeCount = learningPath.units.reduce((sum, unit) => sum + unit.nodes.length, 0);

  return (
    <View style={styles.card} testID={`mobile-path-card-${learningPath.slug}`}>
      <View style={styles.pillRow}>
        <Pill label={learningPath.kind} />
        <Pill label={learningPath.category} tone="blue" />
        <Pill label={`${nodeCount} nodes`} tone="amber" />
      </View>
      <Text style={styles.cardTitle}>{learningPath.title}</Text>
      <Text style={styles.mutedText}>{learningPath.summary}</Text>
      <Button label="Open path" onPress={() => adapters.navigation.navigate(learningPath.route)} testID={`mobile-open-path-${learningPath.slug}`} />
      <PathNodes index={index} learningPath={learningPath} nodes={learningPath.units[0]?.nodes.slice(0, 5) ?? []} adapters={adapters} />
    </View>
  );
}

function PathNodes({
  index,
  learningPath,
  nodes,
  adapters,
}: {
  index: ContentIndex;
  learningPath: LearningPath;
  nodes: LearningPathNode[];
} & ScreenProps) {
  return (
    <View style={styles.stack}>
      {nodes.map((node, nodeIndex) => {
        const display = getNodeDisplay(index, node);
        const href = getPathNodeRoute(node, learningPath.slug);

        return (
          <Pressable
            key={`${node.kind}-${node.slug}`}
            onPress={() => adapters.navigation.navigate(href)}
            style={styles.nodeRow}
            testID={`mobile-path-node-${node.kind}-${node.slug.replaceAll("/", "-")}`}
          >
            <Text style={styles.nodeIndex}>{nodeIndex + 1}</Text>
            <View style={styles.fill}>
              <View style={styles.pillRow}>
                <Pill label={display.kindLabel} tone={node.kind === "exercise" ? "purple" : node.kind === "diagram" ? "green" : "blue"} />
                {display.difficulty ? <DifficultyPill difficulty={display.difficulty} /> : null}
              </View>
              <Text style={styles.nodeTitle}>{display.title}</Text>
              <Text style={styles.nodeSummary}>{display.summary}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function BrowseScreen({ index, adapters }: { index: ContentIndex } & ScreenProps) {
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState("all");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");

  const results = useMemo(
    () =>
      searchContent(index, query, {
        track: track === "all" ? undefined : track,
        difficulty: difficulty === "all" ? undefined : difficulty,
      }).slice(0, 40),
    [difficulty, index, query, track],
  );

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Content library" />
      <Text style={styles.eyebrow}>Content library</Text>
      <Text style={styles.heroTitle}>Study architecture, code, and tradeoffs.</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search concepts, patterns, failures"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        testID="mobile-knowledge-search-input"
      />

      <HorizontalOptions
        label="Track"
        options={[{ value: "all", label: "All tracks" }, ...index.tracks.map((item) => ({ value: item.name, label: item.name }))]}
        value={track}
        onChange={setTrack}
      />
      <HorizontalOptions
        label="Difficulty"
        options={[
          { value: "all", label: "All levels" },
          ...Object.entries(difficultyLabels).map(([value, label]) => ({ value, label })),
        ]}
        value={difficulty}
        onChange={(value) => setDifficulty(value as "all" | Difficulty)}
      />

      <View style={styles.stack} testID="mobile-search-results">
        {results.map((result) => (
          <SearchResultCard key={`${result.kind}-${result.id}`} result={result} adapters={adapters} />
        ))}
        {results.length === 0 ? <Text style={styles.emptyText}>No indexed nodes match the current filters.</Text> : null}
      </View>
    </AppScreen>
  );
}

function SearchResultCard({ result, adapters }: { result: SearchResult } & ScreenProps) {
  return (
    <Pressable onPress={() => adapters.navigation.navigate(result.route)} style={styles.card} testID={`mobile-result-${result.kind}-${result.id}`}>
      <View style={styles.pillRow}>
        <Pill label={result.kind === "document" ? "Doc" : "Diagram"} tone={result.kind === "document" ? "blue" : "green"} />
        {result.difficulty ? <DifficultyPill difficulty={result.difficulty} /> : null}
        <Pill label={result.track} />
      </View>
      <Text style={styles.cardTitle}>{result.title}</Text>
      <Text style={styles.mutedText}>{result.snippet || result.summary}</Text>
      <TagRow tags={result.tags} />
    </Pressable>
  );
}

export function JapaneseLanguageHubScreen({ index, adapters }: { index: ContentIndex } & ScreenProps) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => getJapaneseCharacterGroups(index), [index]);
  const results = useMemo(() => searchJapanese(index, query), [index, query]);

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Japanese" />
      <Text style={styles.eyebrow}>Japanese</Text>
      <Text style={styles.heroTitle}>Practice kana, kanji, and writing.</Text>
      <Text style={styles.heroCopy}>Search beginner Japanese characters and phrases with romaji and IPA support.</Text>
      <Button label="Japanese Foundations path" onPress={() => adapters.navigation.navigate("/paths/japanese-foundations")} testID="mobile-japanese-path-link" />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search あ, water, nihon, /ɲihoɴ/"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        testID="mobile-japanese-search-input"
      />
      <View style={styles.stack} testID="mobile-japanese-results">
        {results.map((result) => (
          <JapaneseResultCard key={`${result.kind}-${result.item.slug}`} result={result} adapters={adapters} />
        ))}
      </View>
      {!query ? (
        <View style={styles.stack}>
          <CharacterStrip title="Hiragana" characters={groups.hiragana} adapters={adapters} />
          <CharacterStrip title="Katakana" characters={groups.katakana} adapters={adapters} />
          <CharacterStrip title="Starter kanji" characters={groups.kanji} adapters={adapters} />
        </View>
      ) : null}
    </AppScreen>
  );
}

function JapaneseResultCard({ result, adapters }: { result: JapaneseSearchResult } & ScreenProps) {
  if (result.kind === "character") {
    return <CharacterCard character={result.item} adapters={adapters} />;
  }

  return <VocabularyCard vocabulary={result.item} adapters={adapters} />;
}

function CharacterStrip({ title, characters, adapters }: { title: string; characters: LanguageCharacter[] } & ScreenProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.characterGrid}>
        {characters.map((character) => (
          <Pressable key={character.slug} onPress={() => adapters.navigation.navigate(character.route)} style={styles.characterTile}>
            <Text style={styles.characterTileGlyph}>{character.glyph}</Text>
            <Text style={styles.characterTileReading}>{character.romaji}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function CharacterCard({ character, adapters }: { character: LanguageCharacter } & ScreenProps) {
  return (
    <Pressable onPress={() => adapters.navigation.navigate(character.route)} style={styles.card} testID={`mobile-japanese-character-${character.slug.replaceAll("/", "-")}`}>
      <View style={styles.pillRow}>
        <Pill label={character.writingSystem} tone={character.writingSystem === "kanji" ? "amber" : "green"} />
        <Pill label={`/${character.ipa}/`} tone="blue" />
      </View>
      <Text style={styles.japaneseGlyph}>{character.glyph}</Text>
      <Text style={styles.cardTitle}>{character.title}</Text>
      <Text style={styles.mutedText}>{character.meanings.join(", ")}</Text>
    </Pressable>
  );
}

function VocabularyCard({ vocabulary, adapters }: { vocabulary: LanguageVocabulary } & ScreenProps) {
  return (
    <Pressable onPress={() => adapters.navigation.navigate(vocabulary.route)} style={styles.card} testID={`mobile-japanese-vocabulary-${vocabulary.slug.replaceAll("/", "-")}`}>
      <View style={styles.pillRow}>
        <Pill label="Vocabulary" tone="purple" />
        <Pill label={`/${vocabulary.ipa}/`} tone="blue" />
      </View>
      <Text style={styles.japaneseGlyph}>{vocabulary.expression}</Text>
      <Text style={styles.cardTitle}>{vocabulary.romaji}</Text>
      <Text style={styles.mutedText}>{vocabulary.meanings.join(", ")}</Text>
    </Pressable>
  );
}

export function JapaneseCharacterDetailScreen({ character, adapters }: { character: LanguageCharacter } & ScreenProps) {
  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Japanese character" />
      <Button label="Japanese" variant="ghost" onPress={() => adapters.navigation.navigate("/languages/japanese")} />
      <View style={styles.card}>
        <View style={styles.pillRow}>
          <Pill label={character.writingSystem} tone={character.writingSystem === "kanji" ? "amber" : "green"} />
          <Pill label={`/${character.ipa}/`} tone="blue" />
        </View>
        <Text style={styles.japaneseGlyph}>{character.glyph}</Text>
        <Text style={styles.heroTitle}>{character.title}</Text>
        <Text style={styles.heroCopy}>{character.summary}</Text>
        <Text style={styles.cardTitle}>{character.meanings.join(", ")}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Readings</Text>
        {character.readings.map((reading) => (
          <Text key={`${reading.label}-${reading.value}`} style={styles.bodyText}>
            {reading.label}: {reading.value} /{reading.ipa}/
          </Text>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Stroke model</Text>
        <View style={styles.writingPad}>
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Path d="M 50 0 L 50 100 M 0 50 L 100 50" stroke={colors.lineSoft} strokeWidth={0.8} fill="none" />
            {character.strokes.map((stroke) => (
              <Path key={stroke.id} d={pointsToPath(stroke.points)} stroke={colors.text} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}
          </Svg>
        </View>
      </View>
    </AppScreen>
  );
}

export function JapaneseVocabularyDetailScreen({ vocabulary, adapters }: { vocabulary: LanguageVocabulary } & ScreenProps) {
  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Japanese vocabulary" />
      <Button label="Japanese" variant="ghost" onPress={() => adapters.navigation.navigate("/languages/japanese")} />
      <View style={styles.card}>
        <View style={styles.pillRow}>
          <Pill label="Vocabulary" tone="purple" />
          <Pill label={`/${vocabulary.ipa}/`} tone="blue" />
        </View>
        <Text style={styles.japaneseGlyph}>{vocabulary.expression}</Text>
        <Text style={styles.heroTitle}>{vocabulary.romaji}</Text>
        <Text style={styles.heroCopy}>{vocabulary.reading}</Text>
        <Text style={styles.cardTitle}>{vocabulary.meanings.join(", ")}</Text>
      </View>
    </AppScreen>
  );
}

export function DocumentReaderScreen({
  document,
  referencedDiagrams = [],
  nextHref,
  adapters,
}: {
  document: KnowledgeDocument;
  referencedDiagrams?: MermaidDiagram[];
  nextHref?: string;
} & ScreenProps) {
  const target: ProgressTarget = {
    surface: "document",
    slug: document.slug,
    title: document.title,
    summary: document.summary,
    href: document.route,
    eyebrow: "Document",
    pathSlug: getPathFromHref(nextHref),
  };

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Article" />
      <View style={styles.pillRow}>
        <DifficultyPill difficulty={document.difficulty} />
        <Pill label={document.track} tone="blue" />
        <Pill label={`${document.readingMinutes} min`} tone="amber" />
      </View>
      <Text style={styles.heroTitle}>{document.title}</Text>
      <Text style={styles.heroCopy}>{document.summary}</Text>
      <TagRow tags={document.tags} />
      <MarkdownReader markdown={document.markdown} adapters={adapters} />
      {referencedDiagrams.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Referenced diagrams</Text>
          {referencedDiagrams.map((diagram) => (
            <Button key={diagram.slug} label={diagram.title} variant="ghost" onPress={() => adapters.navigation.navigate(diagram.route)} />
          ))}
        </View>
      ) : null}
      {nextHref ? (
        <Button
          label="Next node"
          onPress={() => {
            void adapters.progress?.record(target, "completed", { nextHref });
            adapters.navigation.navigate(nextHref);
          }}
          testID="mobile-document-next-node"
        />
      ) : null}
    </AppScreen>
  );
}

export function DiagramReaderScreen({
  diagram,
  nextHref,
  adapters,
}: {
  diagram: MermaidDiagram;
  nextHref?: string;
} & ScreenProps) {
  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Diagram" />
      <Text style={styles.heroTitle}>{diagram.title}</Text>
      <Text style={styles.heroCopy}>Mermaid diagram stored in {diagram.sourcePath}.</Text>
      <MermaidBlock source={diagram.source} adapters={adapters} />
      {nextHref ? <Button label="Next node" onPress={() => adapters.navigation.navigate(nextHref)} testID="mobile-diagram-next-node" /> : null}
    </AppScreen>
  );
}

export function PracticeScreen({
  exercise,
  nextHref,
  adapters,
}: {
  exercise: LearningExercise;
  nextHref?: string;
} & ScreenProps) {
  const onProgress = (status: ProgressStatus, position: Record<string, unknown> = {}) =>
    adapters.progress?.record(
      {
        surface: "practice",
        slug: exercise.slug,
        title: exercise.title,
        summary: `${exercise.concept} practice`,
        href: exercise.route,
        eyebrow: "Practice",
        pathSlug: getPathFromHref(nextHref),
      },
      status,
      position,
    );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <AppScreen>
        <Header adapters={adapters} subtitle="Practice" />
        <View style={styles.card} testID="mobile-practice-card">
          <View style={styles.pillRow}>
            <Pill label={exerciseKindLabel(exercise)} tone="purple" />
            <DifficultyPill difficulty={exercise.difficulty} />
            <Pill label={exercise.concept} tone="green" />
          </View>
          <Text style={styles.heroTitle}>{exercise.title}</Text>
          {exercise.type === "flashcard" ? (
            <FlashcardPractice exercise={exercise} nextHref={nextHref} adapters={adapters} onProgress={onProgress} />
          ) : exercise.type === "cloze" ? (
            <ClozePractice exercise={exercise} nextHref={nextHref} adapters={adapters} onProgress={onProgress} />
          ) : exercise.type === "writing" ? (
            <WritingPractice exercise={exercise} nextHref={nextHref} adapters={adapters} onProgress={onProgress} />
          ) : (
            <QuestionnairePractice exercise={exercise} nextHref={nextHref} adapters={adapters} onProgress={onProgress} />
          )}
        </View>
      </AppScreen>
    </KeyboardAvoidingView>
  );
}

function FlashcardPractice({
  exercise,
  nextHref,
  adapters,
  onProgress,
}: {
  exercise: Extract<LearningExercise, { type: "flashcard" }>;
  nextHref?: string;
  onProgress: (status: ProgressStatus, position?: Record<string, unknown>) => void | Promise<void>;
} & ScreenProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.stack}>
      <Text style={styles.bodyText}>{exercise.prompt}</Text>
      {revealed ? (
        <View style={styles.subPanel}>
          <Text style={styles.cardEyebrow}>Answer</Text>
          <Text style={styles.cardTitle}>{exercise.answer}</Text>
          <Text style={styles.mutedText}>{exercise.explanation}</Text>
        </View>
      ) : null}
      <Button
        label={revealed ? "Answer revealed" : "Reveal answer"}
        disabled={revealed}
        onPress={() => {
          setRevealed(true);
          void onProgress("completed", { revealed: true });
        }}
        testID="mobile-flashcard-reveal"
      />
      {revealed ? <Button label="Reset" variant="ghost" onPress={() => setRevealed(false)} /> : null}
      {revealed && nextHref ? <Button label="Next node" variant="secondary" onPress={() => adapters.navigation.navigate(nextHref)} /> : null}
    </View>
  );
}

function ClozePractice({
  exercise,
  nextHref,
  adapters,
  onProgress,
}: {
  exercise: Extract<LearningExercise, { type: "cloze" }>;
  nextHref?: string;
  onProgress: (status: ProgressStatus, position?: Record<string, unknown>) => void | Promise<void>;
} & ScreenProps) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<"correct" | "incorrect" | undefined>();
  const [prefix, suffix] = exercise.template.split("{{blank}}");

  function checkAnswer() {
    const normalizedAnswer = answer.trim().toLowerCase();
    const correct = exercise.acceptedAnswers.some((acceptedAnswer) => acceptedAnswer.trim().toLowerCase() === normalizedAnswer);
    setResult(correct ? "correct" : "incorrect");

    if (correct) {
      void onProgress("completed", { correct: true });
    }
  }

  return (
    <View style={styles.stack}>
      <Text style={styles.bodyText}>{exercise.prompt}</Text>
      <Text style={styles.bodyText}>
        {prefix}
        {" ____ "}
        {suffix}
      </Text>
      <TextInput value={answer} onChangeText={setAnswer} placeholder="Answer" style={styles.input} testID="mobile-cloze-answer-input" />
      <Button label="Check answer" onPress={checkAnswer} testID="mobile-cloze-check" />
      {result ? (
        <View style={[styles.feedback, result === "correct" ? styles.feedbackCorrect : styles.feedbackReview]} testID="mobile-cloze-feedback">
          <Text style={styles.feedbackTitle}>{result === "correct" ? "Correct" : "Try again"}</Text>
          <Text style={styles.mutedText}>{exercise.explanation}</Text>
        </View>
      ) : null}
      {result && nextHref ? <Button label="Next node" variant="secondary" onPress={() => adapters.navigation.navigate(nextHref)} /> : null}
    </View>
  );
}

function WritingPractice({
  exercise,
  nextHref,
  adapters,
  onProgress,
}: {
  exercise: Extract<LearningExercise, { type: "writing" }>;
  nextHref?: string;
  onProgress: (status: ProgressStatus, position?: Record<string, unknown>) => void | Promise<void>;
} & ScreenProps) {
  const characters = exercise.characterSlugs.flatMap((slug) => {
    const character = getLanguageCharacterBySlug(slug);
    return character ? [character] : [];
  });
  const [mode, setMode] = useState<"assisted" | "free">(exercise.modes.includes("assisted") ? "assisted" : "free");
  const [characterIndex, setCharacterIndex] = useState(0);
  const [strokes, setStrokes] = useState<WritingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<WritingStroke | undefined>();
  const [result, setResult] = useState<WritingCheckResult | undefined>();
  const character = characters[characterIndex];

  function resetForCharacter(nextIndex = characterIndex) {
    setCharacterIndex(nextIndex);
    setStrokes([]);
    setCurrentStroke(undefined);
    setResult(undefined);
  }

  function startStroke(event: GestureResponderEvent) {
    if (result) {
      return;
    }

    setCurrentStroke({ points: [eventPoint(event)] });
  }

  function moveStroke(event: GestureResponderEvent) {
    if (!currentStroke || result) {
      return;
    }

    const nextPoint = eventPoint(event);
    setCurrentStroke((stroke) => (stroke ? { points: [...stroke.points, nextPoint] } : stroke));
  }

  function endStroke() {
    if (!character || !currentStroke || result) {
      setCurrentStroke(undefined);
      return;
    }

    const normalizedStroke = normalizeWritingStroke(currentStroke);
    const expectedStroke = character.strokes[strokes.length];
    const shouldSnap =
      mode === "assisted" && expectedStroke ? getAssistedStrokeCompletion(expectedStroke, normalizedStroke).shouldComplete : false;
    const nextStroke = shouldSnap && expectedStroke ? { points: expectedStroke.points } : normalizedStroke;

    setStrokes((value) => [...value, nextStroke]);
    setCurrentStroke(undefined);
  }

  function checkCurrentCharacter() {
    if (!character) {
      return;
    }

    const nextResult = checkWritingAttempt({
      expectedStrokes: character.strokes,
      actualStrokes: strokes,
      mode,
    });
    setResult(nextResult);

    if (nextResult.isCorrect && characterIndex + 1 >= characters.length) {
      void onProgress("completed", { mode, characterSlug: character.slug, passed: true });
    }
  }

  if (!character) {
    return <Text style={styles.emptyText}>This writing exercise has no available characters.</Text>;
  }

  return (
    <View style={styles.stack} testID="mobile-writing-practice">
      <Text style={styles.bodyText}>{exercise.prompt}</Text>
      <View style={styles.pillRow}>
        {exercise.modes.includes("assisted") ? (
          <Button label="Assisted" variant={mode === "assisted" ? "secondary" : "ghost"} onPress={() => setMode("assisted")} testID="mobile-writing-mode-assisted" />
        ) : null}
        {exercise.modes.includes("free") ? (
          <Button label="Free" variant={mode === "free" ? "secondary" : "ghost"} onPress={() => setMode("free")} testID="mobile-writing-mode-free" />
        ) : null}
      </View>
      <View style={styles.subPanel}>
        <Text style={styles.cardEyebrow}>
          Character {characterIndex + 1} of {characters.length}
        </Text>
        <Text style={styles.japaneseGlyph}>{character.glyph}</Text>
        <Text style={styles.cardTitle}>
          {character.romaji} /{character.ipa}/
        </Text>
        <Text style={styles.mutedText}>{character.meanings.join(", ")}</Text>
      </View>
      <View
        style={styles.writingPad}
        testID="mobile-writing-pad"
        onStartShouldSetResponder={() => true}
        onResponderGrant={startStroke}
        onResponderMove={moveStroke}
        onResponderRelease={endStroke}
        onResponderTerminate={endStroke}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Path d="M 50 0 L 50 100 M 0 50 L 100 50" stroke={colors.lineSoft} strokeWidth={0.8} fill="none" />
          {mode === "assisted"
            ? character.strokes.map((stroke) => <Path key={stroke.id} d={pointsToPath(stroke.points)} stroke={colors.line} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />)
            : null}
          <SvgText x="50" y="56" textAnchor="middle" fontSize="48" fill={mode === "assisted" ? "rgba(38,50,56,0.08)" : "transparent"}>
            {character.glyph}
          </SvgText>
          {[...strokes, ...(currentStroke ? [currentStroke] : [])].map((stroke, index) => (
            <Path key={`${index}-${stroke.points.length}`} d={pointsToPath(stroke.points)} stroke={colors.text} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
        </Svg>
      </View>
      {result ? (
        <View style={[styles.feedback, result.isCorrect ? styles.feedbackCorrect : styles.feedbackReview]} testID="mobile-writing-feedback">
          <Text style={styles.feedbackTitle}>{result.isCorrect ? "Correct" : "Review this"}</Text>
          <Text style={styles.bodyText}>{result.feedback}</Text>
          <Text style={styles.mutedText}>Score {result.score}</Text>
        </View>
      ) : null}
      <View style={styles.actionRow}>
        <Button label="Undo" variant="ghost" disabled={strokes.length === 0 || Boolean(result)} onPress={() => setStrokes((value) => value.slice(0, -1))} />
        <Button label="Clear" variant="ghost" onPress={() => resetForCharacter()} />
        <Button label="Check" disabled={strokes.length === 0 || Boolean(result)} onPress={checkCurrentCharacter} testID="mobile-writing-check" />
      </View>
      {result?.isCorrect && characterIndex + 1 < characters.length ? (
        <Button
          label="Next character"
          variant="secondary"
          onPress={() => {
            const nextIndex = characterIndex + 1;
            void onProgress("started", { mode, characterSlug: characters[nextIndex]?.slug });
            resetForCharacter(nextIndex);
          }}
          testID="mobile-writing-next-character"
        />
      ) : null}
      {result?.isCorrect && characterIndex + 1 >= characters.length && nextHref ? (
        <Button label="Next node" variant="secondary" onPress={() => adapters.navigation.navigate(nextHref)} />
      ) : null}
    </View>
  );
}

function QuestionnairePractice({
  exercise,
  nextHref,
  adapters,
  onProgress,
}: {
  exercise: QuestionnaireExercise;
  nextHref?: string;
  onProgress: (status: ProgressStatus, position?: Record<string, unknown>) => void | Promise<void>;
} & ScreenProps) {
  const [attempt, setAttempt] = useState(() => createQuestionnaireAttempt(exercise));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState<QuestionnaireAnswer | undefined>();
  const [result, setResult] = useState<QuestionnaireAnswerResult | undefined>();
  const [complete, setComplete] = useState(false);
  const question = attempt[currentIndex];

  function resetAnswer(nextAnswer?: QuestionnaireAnswer) {
    setAnswer(nextAnswer);
    setResult(undefined);
  }

  function checkAnswer() {
    const effectiveAnswer = getNativeEffectiveAnswer(question, answer);
    setResult(checkQuestionAnswer(question, effectiveAnswer));
  }

  function advance() {
    if (currentIndex + 1 >= attempt.length) {
      void onProgress("completed", { questionIndex: currentIndex, totalQuestions: attempt.length });
      setComplete(true);
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setAnswer(undefined);
    setResult(undefined);
    void onProgress("started", { questionIndex: nextIndex, totalQuestions: attempt.length });
  }

  function restart() {
    setAttempt(createQuestionnaireAttempt(exercise));
    setCurrentIndex(0);
    setAnswer(undefined);
    setResult(undefined);
    setComplete(false);
  }

  if (complete) {
    return (
      <View style={styles.stack} testID="mobile-questionnaire-complete">
        <View style={[styles.feedback, styles.feedbackCorrect]}>
          <Text style={styles.feedbackTitle}>Refresh complete</Text>
          <Text style={styles.mutedText}>You reached the end of this practice session.</Text>
        </View>
        <Button label="Restart" variant="ghost" onPress={restart} />
        {nextHref ? <Button label="Next node" variant="secondary" onPress={() => adapters.navigation.navigate(nextHref)} /> : null}
      </View>
    );
  }

  return (
    <View style={styles.stack} testID="mobile-questionnaire-session">
      <View style={styles.positionRow}>
        <Text style={styles.positionText}>
          Question {currentIndex + 1} of {attempt.length}
        </Text>
        <Text style={styles.positionText}>{question.kind}</Text>
      </View>
      <Text style={styles.bodyText}>{question.prompt}</Text>
      <QuestionBody question={question} answer={answer} disabled={Boolean(result)} onAnswer={resetAnswer} />
      {result ? <QuestionFeedback question={question} result={result} /> : null}
      <Button label="Check answer" disabled={Boolean(result)} onPress={checkAnswer} testID="mobile-questionnaire-check" />
      {result ? (
        <Button
          label={currentIndex + 1 >= attempt.length ? "Finish" : "Next"}
          variant="secondary"
          onPress={advance}
          testID={currentIndex + 1 >= attempt.length ? "mobile-questionnaire-finish" : "mobile-questionnaire-next"}
        />
      ) : null}
    </View>
  );
}

function QuestionBody({
  question,
  answer,
  disabled,
  onAnswer,
}: {
  question: QuestionnaireAttemptQuestion;
  answer?: QuestionnaireAnswer;
  disabled: boolean;
  onAnswer: (answer?: QuestionnaireAnswer) => void;
}) {
  if (question.kind === "choice") {
    const selected = answer?.kind === "choice" ? answer.selectedOptionId : "";

    return (
      <View style={styles.stack}>
        {question.options.map((option) => (
          <Pressable
            key={option.id}
            disabled={disabled}
            onPress={() => onAnswer({ kind: "choice", selectedOptionId: option.id })}
            style={[styles.choice, selected === option.id && styles.choiceSelected]}
            testID={`mobile-questionnaire-choice-${option.id}`}
          >
            <Text style={styles.choiceText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  if (question.kind === "cloze") {
    const value = answer?.kind === "cloze" ? answer.value : "";
    const [prefix, suffix] = question.template.split("{{blank}}");

    return (
      <View style={styles.stack}>
        <Text style={styles.bodyText}>
          {prefix}
          {" ____ "}
          {suffix}
        </Text>
        <TextInput
          value={value}
          editable={!disabled}
          onChangeText={(nextValue) => onAnswer({ kind: "cloze", value: nextValue })}
          placeholder="Answer"
          style={styles.input}
          testID="mobile-questionnaire-cloze-answer-input"
        />
      </View>
    );
  }

  if (question.kind === "ordering") {
    const itemIds = answer?.kind === "ordering" ? answer.itemIds : question.items.map((item) => item.id);
    const itemsById = new Map(question.items.map((item) => [item.id, item]));

    function move(index: number, direction: -1 | 1) {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= itemIds.length) {
        return;
      }

      const nextItemIds = [...itemIds];
      [nextItemIds[index], nextItemIds[nextIndex]] = [nextItemIds[nextIndex], nextItemIds[index]];
      onAnswer({ kind: "ordering", itemIds: nextItemIds });
    }

    return (
      <View style={styles.stack}>
        {itemIds.map((itemId, index) => (
          <View key={itemId} style={styles.orderRow}>
            <Text style={styles.fill}>{itemsById.get(itemId)?.label ?? itemId}</Text>
            <View style={styles.orderActions}>
              <Button label="Up" disabled={disabled || index === 0} variant="ghost" onPress={() => move(index, -1)} />
              <Button label="Down" disabled={disabled || index === itemIds.length - 1} variant="ghost" onPress={() => move(index, 1)} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  const selectedMatches = answer?.kind === "matching" ? answer.selectedMatches : {};

  return (
    <View style={styles.stack}>
      {question.leftItems.map((leftItem) => (
        <View key={leftItem.id} style={styles.subPanel}>
          <Text style={styles.cardTitle}>{leftItem.label}</Text>
          <View style={styles.stack}>
            {question.rightItems.map((rightItem) => (
              <Pressable
                key={rightItem.id}
                disabled={disabled}
                onPress={() =>
                  onAnswer({
                    kind: "matching",
                    selectedMatches: {
                      ...selectedMatches,
                      [leftItem.id]: rightItem.id,
                    },
                  })
                }
                style={[styles.choice, selectedMatches[leftItem.id] === rightItem.id && styles.choiceSelected]}
                testID={`mobile-questionnaire-match-${leftItem.id}-${rightItem.id}`}
              >
                <Text style={styles.choiceText}>{rightItem.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function QuestionFeedback({ question, result }: { question: QuestionnaireAttemptQuestion; result: QuestionnaireAnswerResult }) {
  return (
    <View style={[styles.feedback, result.isCorrect ? styles.feedbackCorrect : styles.feedbackReview]} testID="mobile-questionnaire-feedback">
      <Text style={styles.feedbackTitle}>{result.isCorrect ? "Correct" : "Review this"}</Text>
      {!result.isCorrect || question.kind !== "choice" ? <Text style={styles.bodyText}>Correct answer: {result.correctAnswer}</Text> : null}
      <Text style={styles.mutedText}>{question.explanation}</Text>
    </View>
  );
}

export function PassiveFlashcardFeedScreen({
  feed,
  adapters,
  initialVisibleCount = 12,
}: {
  feed: PassiveFlashcardFeed;
  initialVisibleCount?: number;
} & ScreenProps) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const visibleCards = useMemo(() => buildPassiveFlashcardWindow(feed.cards, visibleCount), [feed.cards, visibleCount]);

  function recordPosition(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const viewportHeight = Math.max(event.nativeEvent.layoutMeasurement.height, 1);
    const sequenceIndex = Math.max(0, Math.min(visibleCards.length - 1, Math.round(event.nativeEvent.contentOffset.y / viewportHeight)));
    const visibleCard = visibleCards[sequenceIndex];

    if (visibleCards.length - sequenceIndex < 4) {
      setVisibleCount((current) => current + 12);
    }

    void adapters.progress?.record(
      {
        surface: "passive-feed",
        slug: feed.pathSlug,
        title: feed.title,
        summary: feed.summary,
        href: feed.route,
        eyebrow: "Flashcards",
      },
      "started",
      { sequenceIndex, cardId: visibleCard?.card.id },
    );
  }

  return (
    <View style={styles.screen} testID="mobile-passive-flashcard-feed">
      <View style={styles.fixedHeader}>
        <Button label="Path" variant="ghost" onPress={() => adapters.navigation.navigate(`/paths/${feed.pathSlug}`)} />
        <View style={styles.fill}>
          <Text style={styles.brandTitle}>{feed.title}</Text>
          <Text style={styles.brandSubtitle}>Passive refresh</Text>
        </View>
      </View>
      <FlatList
        data={visibleCards}
        keyExtractor={(item) => item.instanceId}
        pagingEnabled
        onScroll={recordPosition}
        scrollEventThrottle={250}
        renderItem={({ item }) => <PassiveFlashcard card={item.card} sequenceIndex={item.sequenceIndex} />}
      />
    </View>
  );
}

function PassiveFlashcard({ card, sequenceIndex }: { card: PassiveFlashcardCard; sequenceIndex: number }) {
  return (
    <View style={styles.flashcardPage} testID={`mobile-passive-flashcard-card-${sequenceIndex}`}>
      <View style={styles.card}>
        <View style={styles.pillRow}>
          <Pill label={cardTypeLabels[card.type]} tone={card.type === "snippet" ? "blue" : card.type === "interview" ? "amber" : "purple"} />
          <DifficultyPill difficulty={card.difficulty} />
        </View>
        <Text style={styles.heroTitle}>{card.title}</Text>
        <Text style={styles.bodyText}>{card.prompt}</Text>
        <Text style={styles.mutedText}>{card.explanation}</Text>
        {card.code ? <CodeBlock code={card.code} language="python" /> : null}
        <TagRow tags={card.tags} />
      </View>
    </View>
  );
}

export function InterviewCatalogScreen({ index, adapters }: { index: ContentIndex } & ScreenProps) {
  const realWorld = index.interviewCollections.filter((collection) => collection.kind === "real-world");
  const companies = index.interviewCollections.filter((collection) => collection.kind === "company");

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Interview prep" />
      <Text style={styles.eyebrow}>Interview prep</Text>
      <Text style={styles.heroTitle}>Practice real interview judgment and coding patterns.</Text>
      <Text style={styles.cardTitle}>Real-world interviews</Text>
      <View style={styles.stack} testID="mobile-real-world-interview-list">
        {realWorld.map((collection) => (
          <Pressable key={collection.slug} onPress={() => adapters.navigation.navigate(collection.route)} style={styles.card} testID={`mobile-collection-${collection.slug}`}>
            <Text style={styles.cardTitle}>{collection.name}</Text>
            <Text style={styles.mutedText}>{collection.summary}</Text>
            <Pill label={`${collection.questions.length} exercises`} tone="amber" />
          </Pressable>
        ))}
      </View>
      <Text style={styles.cardTitle}>Company interview prep</Text>
      <View style={styles.stack} testID="mobile-interview-company-list">
        {companies.map((collection) => (
          <Pressable key={collection.slug} onPress={() => adapters.navigation.navigate(collection.route)} style={styles.card} testID={`mobile-company-${collection.slug}`}>
            <Text style={styles.cardTitle}>{collection.name}</Text>
            <Text style={styles.mutedText}>{collection.summary}</Text>
            <Pill label={`${collection.questions.length} questions`} tone="blue" />
          </Pressable>
        ))}
      </View>
    </AppScreen>
  );
}

export function InterviewCollectionScreen({ collection, adapters }: { collection: InterviewCollection } & ScreenProps) {
  return (
    <AppScreen>
      <Header adapters={adapters} subtitle={collection.kind === "company" ? "Company questions" : "Real-world interviews"} />
      <Text style={styles.heroTitle}>{collection.name}</Text>
      <Text style={styles.heroCopy}>{collection.summary}</Text>
      <View style={styles.stack}>
        {collection.questions.map((question) => (
          <Pressable key={question.slug} onPress={() => adapters.navigation.navigate(question.route)} style={styles.card} testID={`mobile-question-${question.slug}`}>
            <View style={styles.pillRow}>
              <DifficultyPill difficulty={question.difficulty} />
              <Pill label={question.collectionKind === "real-world" ? "Real-world" : question.collectionName} tone="blue" />
            </View>
            <Text style={styles.cardTitle}>{question.title}</Text>
            <Text style={styles.mutedText}>{question.summary}</Text>
            <TagRow tags={question.tags} />
          </Pressable>
        ))}
      </View>
    </AppScreen>
  );
}

export function InterviewQuestionScreen({ question, adapters }: { question: InterviewQuestion } & ScreenProps) {
  if (question.kind === "web") {
    return <WebInterviewQuestionScreen question={question} adapters={adapters} />;
  }

  return <AlgorithmInterviewQuestionScreen question={question} adapters={adapters} />;
}

function AlgorithmInterviewQuestionScreen({ question, adapters }: { question: Extract<InterviewQuestion, { kind: "algorithm" }> } & ScreenProps) {
  const [selectedTrackId, setSelectedTrackId] = useState(question.solutionTracks[0]?.id ?? "");
  const [language, setLanguage] = useState<"python" | "typescript" | "java">("python");
  const selectedTrack = question.solutionTracks.find((track) => track.id === selectedTrackId) ?? question.solutionTracks[0];

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Interview question" />
      <View style={styles.pillRow}>
        <DifficultyPill difficulty={question.difficulty} />
        <Pill label={question.collectionName} tone="blue" />
      </View>
      <Text style={styles.heroTitle}>{question.title}</Text>
      <Text style={styles.heroCopy}>{question.summary}</Text>
      <Text style={styles.bodyText}>{question.prompt}</Text>
      {question.examples.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Examples</Text>
          {question.examples.map((example, index) => (
            <View key={`${example.input}-${index}`} style={styles.subPanel}>
              <Text style={styles.bodyText}>Input: {example.input}</Text>
              <Text style={styles.bodyText}>Output: {example.output}</Text>
              {example.explanation ? <Text style={styles.mutedText}>{example.explanation}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
      <HorizontalOptions
        label="Approach"
        options={question.solutionTracks.map((track) => ({ value: track.id, label: track.title }))}
        value={selectedTrackId}
        onChange={setSelectedTrackId}
      />
      <HorizontalOptions
        label="Language"
        options={[
          { value: "python", label: "Python" },
          { value: "typescript", label: "TypeScript" },
          { value: "java", label: "Java" },
        ]}
        value={language}
        onChange={(value) => setLanguage(value as "python" | "typescript" | "java")}
      />
      {selectedTrack ? <SolutionTrack track={selectedTrack} language={language} /> : null}
    </AppScreen>
  );
}

function SolutionTrack({ track, language }: { track: InterviewAlgorithmSolutionTrack; language: "python" | "typescript" | "java" }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{track.title}</Text>
      <Text style={styles.mutedText}>{track.summary}</Text>
      {track.steps.map((step) => (
        <View key={step.title} style={styles.subPanel}>
          <Text style={styles.cardTitle}>{step.title}</Text>
          <Text style={styles.mutedText}>{step.explanation}</Text>
        </View>
      ))}
      <Text style={styles.bodyText}>{track.explanation}</Text>
      <CodeBlock code={track.languages[language].code} language={track.languages[language].label} />
      <View style={styles.pillRow}>
        <Pill label={`Time ${track.complexity.time}`} tone="blue" />
        <Pill label={`Space ${track.complexity.space}`} tone="green" />
      </View>
    </View>
  );
}

function WebInterviewQuestionScreen({ question, adapters }: { question: Extract<InterviewQuestion, { kind: "web" }> } & ScreenProps) {
  const [selectedTrackId, setSelectedTrackId] = useState(question.solutionTracks[0].id);
  const selectedTrack = question.solutionTracks.find((track) => track.id === selectedTrackId) ?? question.solutionTracks[0];
  const [selectedFile, setSelectedFile] = useState(selectedTrack.project.activeFile);
  const activeFile = selectedTrack.project.files[selectedFile] ? selectedFile : selectedTrack.project.activeFile;

  function selectTrack(trackId: string) {
    const nextTrack = question.solutionTracks.find((track) => track.id === trackId) ?? question.solutionTracks[0];
    setSelectedTrackId(nextTrack.id);
    setSelectedFile(nextTrack.project.activeFile);
  }

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Real-world interview" />
      <View style={styles.pillRow}>
        <DifficultyPill difficulty={question.difficulty} />
        <Pill label="Real-world" tone="amber" />
      </View>
      <Text style={styles.heroTitle}>{question.title}</Text>
      <Text style={styles.heroCopy}>{question.summary}</Text>
      <Text style={styles.bodyText}>{question.prompt}</Text>

      <View style={styles.card} testID="mobile-web-interview-evaluation">
        <Text style={styles.cardTitle}>What the interviewer is assessing</Text>
        <Text style={styles.bodyText}>{question.evaluation.intent}</Text>
        {question.evaluation.expectedSignals.map((signal) => <Text key={signal} style={styles.mutedText}>• {signal}</Text>)}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Acceptance criteria</Text>
        {question.evaluation.acceptanceCriteria.map((item) => (
          <View key={item.title} style={styles.subPanel}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.mutedText}>{item.explanation}</Text></View>
        ))}
      </View>

      <View style={styles.card} testID="mobile-web-interview-red-flags">
        <Text style={styles.cardTitle}>Red flags</Text>
        {question.evaluation.redFlags.map((item) => (
          <View key={item.title} style={styles.subPanel}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.mutedText}>{item.explanation}</Text></View>
        ))}
      </View>

      <HorizontalOptions
        label="Approach"
        options={question.solutionTracks.map((track) => ({ value: track.id, label: track.title }))}
        value={selectedTrack.id}
        onChange={selectTrack}
      />
      <View style={styles.card} testID="mobile-web-solution">
        <Text style={styles.cardTitle}>{selectedTrack.title}</Text>
        <Text style={styles.mutedText}>{selectedTrack.summary}</Text>
        {selectedTrack.steps.map((step) => <View key={step.title} style={styles.subPanel}><Text style={styles.cardTitle}>{step.title}</Text><Text style={styles.mutedText}>{step.explanation}</Text></View>)}
        <Text style={styles.bodyText}>{selectedTrack.explanation}</Text>
        <Text style={styles.cardTitle}>Why it would be accepted</Text>
        <Text style={styles.mutedText}>{selectedTrack.acceptanceRationale}</Text>
        {selectedTrack.tradeoffs.map((tradeoff) => <Text key={tradeoff} style={styles.mutedText}>• {tradeoff}</Text>)}
      </View>
      <HorizontalOptions
        label="Source file"
        options={selectedTrack.project.visibleFiles.map((path) => ({ value: path, label: path.replace(/^\//, "") }))}
        value={activeFile}
        onChange={setSelectedFile}
      />
      <CodeBlock code={selectedTrack.project.files[activeFile].code} language={activeFile.split(".").pop()} />
      <View style={styles.feedback} testID="mobile-web-playground-note">
        <Text style={styles.feedbackTitle}>Interactive runner available on web</Text>
        <Text style={styles.mutedText}>Native keeps every explanation and source file offline; editing and execution use the web playground.</Text>
      </View>
      {question.sourceNote ? <Text style={styles.mutedText}>{question.sourceNote}</Text> : null}
    </AppScreen>
  );
}

export function LoginScreen({ adapters }: ScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const auth = adapters.auth;

  async function run(action?: () => Promise<void>, success = "Done") {
    if (!action) {
      setMessage("Auth is not configured.");
      return;
    }

    try {
      await action();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete auth request.");
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <AppScreen>
        <Header adapters={adapters} subtitle="Sign in" />
        <Text style={styles.heroTitle}>Save your progress.</Text>
        <Text style={styles.heroCopy}>Sign in to sync reading and practice progress across devices.</Text>
        {!auth?.isConfigured ? <Text style={styles.emptyText}>Supabase public environment variables are not configured.</Text> : null}
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={styles.input} />
        <Button label="Sign in" onPress={() => run(() => auth?.signInWithPassword?.(email, password) ?? Promise.resolve(), "Signed in")} testID="mobile-sign-in" />
        <Button label="Create account" variant="secondary" onPress={() => run(() => auth?.signUpWithPassword?.(email, password) ?? Promise.resolve(), "Check your email")} />
        <Button label="Continue with Google" variant="ghost" onPress={() => run(() => auth?.signInWithOAuth?.("google") ?? Promise.resolve(), "Opening Google")} />
        <Button label="Continue with Apple" variant="ghost" onPress={() => run(() => auth?.signInWithOAuth?.("apple") ?? Promise.resolve(), "Opening Apple")} />
        {message ? <Text style={styles.mutedText}>{message}</Text> : null}
      </AppScreen>
    </KeyboardAvoidingView>
  );
}

export function KeepReadingSection({
  items,
  isSignedIn,
  adapters,
}: {
  items: ProgressDisplayItem[];
  isSignedIn: boolean;
} & ScreenProps) {
  return (
    <View style={styles.card} testID="mobile-keep-reading">
      <View style={styles.pillRow}>
        <Pill label={isSignedIn ? "Signed in" : "On this device"} tone={isSignedIn ? "green" : "amber"} />
      </View>
      <Text style={styles.cardTitle}>Keep reading</Text>
      {items.length === 0 ? (
        <Text style={styles.mutedText}>Open a path, article, or practice session to start a local resume list.</Text>
      ) : (
        items.map((item) => (
          <Pressable key={item.id} onPress={() => adapters.navigation.navigate(item.href)} style={styles.subPanel}>
            <Text style={styles.cardEyebrow}>{item.eyebrow}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.mutedText}>{item.summary}</Text>
          </Pressable>
        ))
      )}
    </View>
  );
}

export function SaveProgressPrompt({ itemCount, adapters }: { itemCount: number } & ScreenProps) {
  if (itemCount === 0) {
    return null;
  }

  return (
    <View style={styles.savePrompt} testID="mobile-save-progress-prompt">
      <Text style={styles.bodyText}>{itemCount} local progress item{itemCount === 1 ? "" : "s"} can sync after sign in.</Text>
      <Button label="Sign in" onPress={() => adapters.navigation.navigate("/login")} />
    </View>
  );
}

export function MarkdownReader({ markdown, adapters }: { markdown: string } & ScreenProps) {
  const blocks = useMemo(() => splitMermaidBlocks(markdown), [markdown]);

  return (
    <View style={styles.markdownWrap} testID="mobile-markdown-renderer">
      {blocks.map((block, index) =>
        block.kind === "mermaid" ? (
          <MermaidBlock key={`mermaid-${index}`} source={block.source} adapters={adapters} />
        ) : (
          <Markdown key={`markdown-${index}`} style={markdownStyles}>
            {block.source}
          </Markdown>
        ),
      )}
    </View>
  );
}

export function MermaidBlock({ source, title, adapters }: { source: string; title?: string } & ScreenProps) {
  const html = adapters.mermaidScript
    ? `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{margin:0;padding:16px;background:#fff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}.mermaid{min-width:560px}</style></head><body><pre class="mermaid">${escapeHtml(source)}</pre><script>${adapters.mermaidScript}</script><script>mermaid.initialize({startOnLoad:true,securityLevel:"strict",theme:"base"});</script></body></html>`
    : "";

  return (
    <View style={styles.mermaidBlock} testID="mobile-mermaid-block">
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {html ? (
        <WebView originWhitelist={["*"]} source={{ html }} style={styles.webView} testID="mobile-mermaid-webview" />
      ) : (
        <View style={styles.feedback}>
          <Text style={styles.feedbackTitle}>Diagram source</Text>
          <Text style={styles.mutedText}>Bundled Mermaid runtime is unavailable, so the source is shown instead.</Text>
        </View>
      )}
      <CodeBlock code={source} language="mermaid" />
    </View>
  );
}

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <ScrollView horizontal style={styles.codeBlock} contentContainerStyle={styles.codeContent} testID="mobile-code-block">
      <View>
        {language ? <Text style={styles.codeLanguage}>{language}</Text> : null}
        <Text style={styles.codeText}>{code}</Text>
      </View>
    </ScrollView>
  );
}

export function DifficultyPill({ difficulty }: { difficulty: Difficulty }) {
  const tone = difficulty === "foundation" ? "green" : difficulty === "practitioner" ? "blue" : difficulty === "senior" ? "amber" : "purple";
  return <Pill label={difficultyLabels[difficulty]} tone={tone} />;
}

function TagRow({ tags }: { tags: string[] }) {
  return (
    <View style={styles.pillRow}>
      {tags.slice(0, 6).map((tag) => (
        <Pill key={tag} label={tag} tone="green" />
      ))}
    </View>
  );
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "green" | "blue" | "amber" | "purple" }) {
  const toneStyle =
    tone === "green"
      ? styles.pillGreen
      : tone === "blue"
        ? styles.pillBlue
        : tone === "amber"
          ? styles.pillAmber
          : tone === "purple"
            ? styles.pillPurple
            : styles.pillNeutral;

  return (
    <View style={[styles.pill, toneStyle]}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  testID?: string;
}) {
  const buttonStyle = variant === "secondary" ? styles.secondaryButton : variant === "ghost" ? styles.ghostButton : styles.primaryButton;
  const textStyle = variant === "ghost" ? styles.ghostButtonText : styles.primaryButtonText;

  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[buttonStyle, disabled && styles.disabled]} testID={testID}>
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

function HorizontalOptions({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.optionGroup}>
      <Text style={styles.cardEyebrow}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
        {options.map((option) => (
          <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.option, value === option.value && styles.optionSelected]}>
            <Text style={styles.optionText}>{option.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function eventPoint(event: GestureResponderEvent): LanguageStrokePoint {
  const { locationX, locationY } = event.nativeEvent;
  const size = 280;

  return [Math.min(100, Math.max(0, (locationX / size) * 100)), Math.min(100, Math.max(0, (locationY / size) * 100))];
}

function pointsToPath(points: LanguageStrokePoint[]) {
  if (points.length === 0) {
    return "";
  }

  const [first, ...rest] = points;
  return [`M ${first[0]} ${first[1]}`, ...rest.map((point) => `L ${point[0]} ${point[1]}`)].join(" ");
}

function getNodeDisplay(index: ContentIndex, node: LearningPathNode) {
  if (node.kind === "document") {
    const document = index.documents.find((item) => item.slug === node.slug);

    return {
      title: document?.title ?? node.slug,
      summary: document?.summary ?? "Document",
      kindLabel: "Document",
      difficulty: document?.difficulty,
    };
  }

  if (node.kind === "diagram") {
    const diagram = index.diagrams.find((item) => item.slug === node.slug);

    return {
      title: diagram?.title ?? node.slug,
      summary: diagram ? `Mermaid diagram stored in ${diagram.sourcePath}.` : "Diagram",
      kindLabel: "Diagram",
      difficulty: undefined,
    };
  }

  const exercise = index.exercises.find((item) => item.slug === node.slug);

  return {
    title: exercise?.title ?? node.slug,
    summary: exercise ? `${exercise.concept} practice` : "Practice",
    kindLabel: exercise ? exerciseKindLabel(exercise) : "Practice",
    difficulty: exercise?.difficulty,
  };
}

function exerciseKindLabel(exercise: LearningExercise) {
  if (exercise.type === "flashcard") {
    return "Flashcard";
  }

  if (exercise.type === "cloze") {
    return "Fill the gap";
  }

  if (exercise.type === "writing") {
    return "Writing";
  }

  return "Questionnaire";
}

function getNativeEffectiveAnswer(question: QuestionnaireAttemptQuestion, answer?: QuestionnaireAnswer): QuestionnaireAnswer {
  if (question.kind === "choice") {
    return answer?.kind === "choice" ? answer : { kind: "choice", selectedOptionId: "" };
  }

  if (question.kind === "cloze") {
    return answer?.kind === "cloze" ? answer : { kind: "cloze", value: "" };
  }

  if (question.kind === "ordering") {
    return answer?.kind === "ordering" ? answer : { kind: "ordering", itemIds: question.items.map((item) => item.id) };
  }

  return answer?.kind === "matching" ? answer : { kind: "matching", selectedMatches: {} };
}

function getPathFromHref(href?: string) {
  if (!href) {
    return undefined;
  }

  const query = href.split("?")[1];

  if (!query) {
    return undefined;
  }

  return new URLSearchParams(query).get("path") ?? undefined;
}

function splitMermaidBlocks(markdown: string) {
  const blocks: Array<{ kind: "markdown" | "mermaid"; source: string }> = [];
  const pattern = /```mermaid\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(markdown))) {
    if (match.index > lastIndex) {
      blocks.push({ kind: "markdown", source: markdown.slice(lastIndex, match.index) });
    }

    blocks.push({ kind: "mermaid", source: match[1].trim() });
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < markdown.length) {
    blocks.push({ kind: "markdown", source: markdown.slice(lastIndex) });
  }

  return blocks.filter((block) => block.source.trim().length > 0);
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContent: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: 96,
  },
  screenEyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md,
  },
  fixedHeader: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderBottomColor: colors.line,
    borderBottomWidth: 2,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  brand: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    minWidth: 0,
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderColor: colors.accentStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  brandMarkText: {
    color: colors.panel,
    fontSize: 18,
    fontWeight: "900",
  },
  brandTitle: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: "900",
  },
  brandSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 39,
  },
  heroCopy: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 25,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  stack: {
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  discoverySection: {
    gap: spacing.md,
  },
  discoverySectionHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  discoverySectionTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  discoveryViewAll: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  discoveryViewAllText: {
    color: colors.panel,
    fontSize: 13,
    fontWeight: "900",
  },
  discoveryRow: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  discoveryCardCompact: {
    minHeight: 210,
    width: 280,
  },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    gap: spacing.md,
    padding: spacing.lg,
  },
  subPanel: {
    backgroundColor: colors.panelMuted,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.md,
  },
  japaneseGlyph: {
    color: colors.text,
    fontSize: 64,
    fontWeight: "900",
    lineHeight: 72,
  },
  writingPad: {
    alignSelf: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    height: 280,
    overflow: "hidden",
    width: 280,
  },
  characterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  characterTile: {
    alignItems: "center",
    backgroundColor: colors.panelMuted,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    height: 74,
    justifyContent: "center",
    width: 64,
  },
  characterTileGlyph: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
  },
  characterTileReading: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
  },
  cardEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
  },
  bodyText: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 26,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
  },
  emptyText: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "800",
    padding: spacing.lg,
  },
  fill: {
    flex: 1,
    minWidth: 0,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    borderRadius: radii.md,
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
  },
  pillNeutral: {
    backgroundColor: colors.panelMuted,
    borderColor: colors.line,
  },
  pillGreen: {
    backgroundColor: colors.greenSoft,
    borderColor: "#6dd8cf",
  },
  pillBlue: {
    backgroundColor: colors.blueSoft,
    borderColor: "#9cc7ff",
  },
  pillAmber: {
    backgroundColor: colors.amberSoft,
    borderColor: "#f7cf5d",
  },
  pillPurple: {
    backgroundColor: colors.purpleSoft,
    borderColor: "#c8b8ff",
  },
  nodeRow: {
    backgroundColor: colors.panelMuted,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  nodeIndex: {
    backgroundColor: colors.blueSoft,
    borderColor: "#9cc7ff",
    borderRadius: radii.md,
    borderWidth: 2,
    color: colors.blue,
    fontSize: 14,
    fontWeight: "900",
    height: 40,
    overflow: "hidden",
    paddingTop: 9,
    textAlign: "center",
    width: 40,
  },
  nodeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  nodeSummary: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  optionGroup: {
    gap: spacing.sm,
  },
  optionRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  option: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionSelected: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.accent,
  },
  optionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderColor: colors.accentStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.blue,
    borderColor: colors.blueStrong,
    borderRadius: radii.md,
    borderWidth: 2,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  ghostButton: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryButtonText: {
    color: colors.panel,
    fontSize: 14,
    fontWeight: "900",
  },
  ghostButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.55,
  },
  feedback: {
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.md,
  },
  feedbackCorrect: {
    backgroundColor: colors.greenSoft,
    borderColor: "#6dd8cf",
  },
  feedbackReview: {
    backgroundColor: colors.amberSoft,
    borderColor: "#f7cf5d",
  },
  feedbackTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  positionRow: {
    alignItems: "center",
    backgroundColor: colors.panelMuted,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  positionText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  choice: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    padding: spacing.md,
  },
  choiceSelected: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.accent,
  },
  choiceText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
  },
  orderRow: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  orderActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  flashcardPage: {
    flex: 1,
    minHeight: 640,
    justifyContent: "center",
    padding: spacing.lg,
  },
  footer: {
    backgroundColor: colors.panel,
    borderTopColor: colors.line,
    borderTopWidth: 2,
    padding: spacing.md,
  },
  savePrompt: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    gap: spacing.md,
    padding: spacing.md,
  },
  markdownWrap: {
    gap: spacing.md,
  },
  mermaidBlock: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 2,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.md,
  },
  webView: {
    backgroundColor: colors.panel,
    height: 320,
  },
  codeBlock: {
    backgroundColor: "#101820",
    borderColor: "#14212b",
    borderRadius: radii.md,
    borderWidth: 2,
    maxHeight: 340,
  },
  codeContent: {
    padding: spacing.md,
  },
  codeLanguage: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  codeText: {
    color: "#d9e7ef",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 13,
    lineHeight: 20,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: colors.textStrong,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 26,
  },
  heading1: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },
  heading2: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 31,
    marginTop: spacing.xl,
  },
  heading3: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
    marginTop: spacing.lg,
  },
  paragraph: {
    marginBottom: spacing.md,
  },
  fence: {
    backgroundColor: "#101820",
    borderRadius: radii.md,
    color: "#d9e7ef",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    padding: spacing.md,
  },
  code_inline: {
    backgroundColor: colors.panelMuted,
    borderColor: colors.line,
    borderRadius: radii.sm,
    color: colors.blue,
    fontWeight: "800",
    paddingHorizontal: 4,
  },
  blockquote: {
    backgroundColor: colors.panelMuted,
    borderLeftColor: colors.accent,
    borderLeftWidth: 5,
    paddingHorizontal: spacing.md,
  },
  link: {
    color: colors.blue,
    fontWeight: "900",
  },
});
