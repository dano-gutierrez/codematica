import {
  buildPassiveFlashcardWindow,
  calculateQuestionnaireSkillScores,
  checkWritingAttempt,
  checkQuestionAnswer,
  createQuestionnaireAttempt,
  getAssistedStrokeCompletion,
  getJapaneseCharacterGroups,
  getHomeDiscoverySections,
  getLanguageCharacterBySlug,
  getPathNodeRoute,
  getSourcesByRefs,
  normalizeWritingStroke,
  searchJapanese,
  searchDiscovery,
  createDiscoveryItems,
  searchContent,
  type ContentIndex,
  type ContentSource,
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
  type ReviewRating,
  type SkillProgress,
  type QuestionnaireAnswer,
  type QuestionnaireAnswerResult,
  type QuestionnaireAttemptQuestion,
  type QuestionnaireExercise,
  type SearchResult,
  type WritingCheckResult,
  type WritingStroke,
} from "@codematica/core";
import Markdown from "react-native-markdown-display";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import { WebView } from "react-native-webview";
import { Fragment, useMemo, useState } from "react";
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
  useWindowDimensions,
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

      {learningPath.progression ? (
        <View style={styles.card} testID="mobile-path-progression-roadmap">
          <Text style={styles.cardEyebrow}>Career milestones · published stages earn stamps</Text>
          <Text style={styles.cardTitle}>{learningPath.progression.roadmapLabel}</Text>
          {learningPath.progression.reviewRoute ? <Button label="Review skills" variant="ghost" onPress={() => adapters.navigation.navigate(learningPath.progression!.reviewRoute!)} /> : null}
          {learningPath.progression.stages.map((stage, stageIndex) => (
            <View key={stage.id} style={styles.subPanel}>
              <View style={styles.pillRow}><Pill label={`Stage ${stageIndex + 1}`} tone="amber" /><Pill label={stage.level} tone="blue" /><Pill label={stage.status} tone={stage.status === "published" ? "green" : "amber"} /></View>
              <Text style={styles.cardTitle}>{stage.label}</Text>
              <Text style={styles.mutedText}>{stage.summary}</Text>
              <Text style={styles.mutedText}>About {stage.estimatedMinutes} minutes{stage.passThreshold === undefined ? " · companion planned" : ` · checkpoint ${Math.round(stage.passThreshold * 100)}%`}</Text>
              {stage.outcomes.map((outcome) => <Text key={outcome.id} style={styles.bodyText}>• {outcome.statement}</Text>)}
              {stage.checkpointExerciseSlug ? <Button label="Open checkpoint" variant="secondary" onPress={() => adapters.navigation.navigate(`/practice/${stage.checkpointExerciseSlug}?path=${learningPath.slug}`)} /> : null}
            </View>
          ))}
        </View>
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
            onPress={() => href.startsWith("http") ? adapters.navigation.openExternalUrl?.(href) : adapters.navigation.navigate(href)}
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
  const automationSlug = result.route.replace(/^\/(?:docs|diagrams)\//, "").replaceAll("/", "-");
  return (
    <Pressable onPress={() => adapters.navigation.navigate(result.route)} style={styles.card} testID={`mobile-result-${result.kind}-${automationSlug}`}>
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
  const flashcards = index.passiveFlashcardFeeds.find((feed) => feed.pathSlug === "japanese-foundations" && feed.status === "published");

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Japanese" />
      <Text style={styles.eyebrow}>Japanese</Text>
      <Text style={styles.heroTitle}>Practice kana, kanji, and writing.</Text>
      <Text style={styles.heroCopy}>Search beginner Japanese characters and phrases with romaji and IPA support.</Text>
      <View style={styles.actionRow}>
        <Button label="Learn" onPress={() => adapters.navigation.navigate("/paths/japanese-foundations")} testID="mobile-japanese-path-link" />
        <Button label="Review" variant="secondary" onPress={() => adapters.navigation.navigate("/languages/japanese/review")} testID="mobile-japanese-review-link" />
        {flashcards ? <Button label="Flashcards" variant="secondary" onPress={() => adapters.navigation.navigate(flashcards.route)} testID="mobile-japanese-flashcards-link" /> : null}
        <Button label="Hiragana guide" variant="ghost" onPress={() => adapters.navigation.navigate("/docs/languages/japanese-hiragana-foundations?path=japanese-foundations")} testID="mobile-japanese-hiragana-guide-link" />
        <Button label="Katakana guide" variant="ghost" onPress={() => adapters.navigation.navigate("/docs/languages/japanese-katakana-foundations?path=japanese-foundations")} testID="mobile-japanese-katakana-guide-link" />
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search あ, ア, coffee, nihon, /ɲihoɴ/"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        testID="mobile-japanese-search-input"
      />
      {query ? (
        <View style={styles.stack} testID="mobile-japanese-results">
          {results.map((result) => (
            <JapaneseResultCard key={`${result.kind}-${result.item.slug}`} result={result} adapters={adapters} />
          ))}
        </View>
      ) : null}
      {!query ? (
        <View style={styles.stack}>
          <CharacterStrip title="Basic hiragana" characters={groups.hiragana.filter((character) => character.tags.includes("basic-hiragana"))} adapters={adapters} />
          <CharacterStrip title="Hiragana IME and sound extras" characters={groups.hiragana.filter((character) => character.tags.includes("supplement"))} adapters={adapters} />
          <CharacterStrip title="Basic katakana" characters={groups.katakana.filter((character) => character.tags.includes("basic-katakana"))} adapters={adapters} />
          <CharacterStrip title="Katakana sound extras" characters={groups.katakana.filter((character) => character.tags.includes("supplement"))} adapters={adapters} />
          <CharacterStrip title="Starter kanji" characters={groups.kanji} adapters={adapters} />
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Beginner words and greetings</Text>
            {index.languageVocabulary.filter((item) => item.language === "ja" && item.status === "published").map((vocabulary) => (
              <Pressable key={vocabulary.slug} onPress={() => adapters.navigation.navigate(vocabulary.route)} style={styles.subPanel}>
                <Text style={styles.japaneseGlyph} accessibilityLanguage="ja-JP">{vocabulary.expression}</Text>
                <Text style={styles.bodyText}>{vocabulary.romaji}</Text>
                <Text style={styles.mutedText}>{vocabulary.meanings.join(", ")}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      <View style={styles.card} testID="mobile-japanese-resources">
        <Text style={styles.cardTitle}>Trusted resource shelf</Text>
        <Text style={styles.mutedText}>External materials stay with their publishers and are labeled by access and reuse rights.</Text>
        {index.languageResources.map((resource) => (
          <Pressable
            key={resource.id}
            onPress={() => adapters.navigation.openExternalUrl?.(resource.url)}
            accessibilityRole="link"
            accessibilityHint={`Opens ${resource.publisher} in a browser`}
            style={styles.subPanel}
          >
            <Text style={styles.cardTitle}>{resource.title}</Text>
            <Text style={styles.mutedText}>{resource.description}</Text>
            <Text style={styles.cardEyebrow}>{resource.access} · {resource.reusePolicy === "link-only" ? "link only" : "licensed embed"} · {resource.publisher}</Text>
          </Pressable>
        ))}
      </View>
    </AppScreen>
  );
}

export function JapaneseReviewScreen({
  index,
  learningPath,
  progress,
  onRate,
  adapters,
}: {
  index: ContentIndex;
  learningPath: LearningPath;
  progress: SkillProgress[];
  onRate: (skillId: string, rating: ReviewRating) => void;
} & ScreenProps) {
  const skills = learningPath.progression?.skills ?? [];
  const [selectedSkillId, setSelectedSkillId] = useState(skills[0]?.id ?? "");
  const [renderedAt] = useState(() => Date.now());
  const selected = skills.find((skill) => skill.id === selectedSkillId) ?? skills[0];
  const selectedProgress = progress.find((row) => row.pathSlug === learningPath.slug && row.skillId === selected?.id);
  const dueCount = progress.filter((row) => new Date(row.nextReviewAt).getTime() <= renderedAt).length;
  const flashcards = index.passiveFlashcardFeeds.find((feed) => feed.pathSlug === learningPath.slug && feed.status === "published");

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Japanese review" />
      <Text style={styles.eyebrow}>Always open · {dueCount} due</Text>
      <Text style={styles.heroTitle}>Review what is ready.</Text>
      <Text style={styles.heroCopy}>The queue recommends practice. It never locks lessons, flashcards, handwriting, or the dictionary.</Text>
      <View style={styles.actionRow}>
        {flashcards ? <Button label="Browse all flashcards" onPress={() => adapters.navigation.navigate(flashcards.route)} testID="mobile-japanese-review-flashcards" /> : null}
        <Button label="Dictionary" variant="ghost" onPress={() => adapters.navigation.navigate("/languages/japanese")} />
      </View>
      <View style={styles.card} testID="mobile-japanese-review-skills">
        <Text style={styles.cardTitle}>All skill cards</Text>
        {skills.map((skill) => {
          const row = progress.find((item) => item.pathSlug === learningPath.slug && item.skillId === skill.id);
          return (
            <Pressable key={skill.id} onPress={() => setSelectedSkillId(skill.id)} accessibilityRole="button" accessibilityState={{ selected: selected?.id === skill.id }} style={[styles.subPanel, selected?.id === skill.id ? styles.optionSelected : null]}>
              <Text style={styles.cardTitle}>{skill.label}</Text>
              <Text style={styles.mutedText}>{row ? `Box ${row.reviewBox} · ${row.masteryState}` : "New · available now"}</Text>
            </Pressable>
          );
        })}
      </View>
      {selected ? (
        <View style={styles.card} testID="mobile-japanese-review-card">
          <Text style={styles.cardEyebrow}>{selected.category} practice</Text>
          <Text style={styles.cardTitle}>{selected.label}</Text>
          <Text style={styles.bodyText}>{selected.description}</Text>
          <Text style={styles.mutedText}>Recall one example before rating how independently you remembered it.</Text>
          <View style={styles.actionRow}>
            {(["again", "hard", "good", "easy"] as const).map((rating) => <Button key={rating} label={rating.charAt(0).toUpperCase() + rating.slice(1)} variant="ghost" onPress={() => onRate(selected.id, rating)} testID={`mobile-japanese-review-${rating}`} />)}
          </View>
          {selectedProgress ? <Text style={styles.mutedText}>Best {Math.round(selectedProgress.bestScore * 100)}% · box {selectedProgress.reviewBox}</Text> : null}
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
            <Text style={styles.characterTileGlyph} accessibilityLanguage="ja-JP">{character.glyph}</Text>
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
      <Text style={styles.japaneseGlyph} accessibilityLanguage="ja-JP">{character.glyph}</Text>
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
      <Text style={styles.japaneseGlyph} accessibilityLanguage="ja-JP">{vocabulary.expression}</Text>
      <Text style={styles.cardTitle}>{vocabulary.romaji}</Text>
      <Text style={styles.mutedText}>{vocabulary.meanings.join(", ")}</Text>
    </Pressable>
  );
}

export function JapaneseCharacterDetailScreen({ character, relatedVocabulary = [], adapters }: { character: LanguageCharacter; relatedVocabulary?: LanguageVocabulary[] } & ScreenProps) {
  const { width } = useWindowDimensions();
  const writingPadSize = Math.min(width >= 900 ? 560 : width >= 600 ? 480 : 360, Math.max(260, width - 48));
  const writingExercise: Extract<LearningExercise, { type: "writing" }> = {
    id: `character-${character.id}`,
    slug: `${character.slug}/writing`,
    route: character.route,
    sourcePath: character.sourcePath,
    contentHash: character.contentHash,
    title: `Practice ${character.glyph}`,
    type: "writing",
    documentSlug: "languages/japanese-romaji-kana-input",
    concept: "Single-character handwriting",
    difficulty: "foundation",
    tags: ["japanese", "handwriting"],
    status: "published",
    prompt: "Trace the highlighted strokes in order, then switch to free mode and write from memory.",
    characterSlugs: [character.slug],
    modes: ["assisted", "free"],
    explanation: "This practice is transient and does not store raw stroke coordinates.",
  };

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Japanese character" />
      <Button label="Japanese" variant="ghost" onPress={() => adapters.navigation.navigate("/languages/japanese")} />
      <View style={styles.card}>
        <View style={styles.pillRow}>
          <Pill label={character.writingSystem} tone={character.writingSystem === "kanji" ? "amber" : "green"} />
          <Pill label={`/${character.ipa}/`} tone="blue" />
        </View>
        <Text style={styles.japaneseGlyph} accessibilityLanguage="ja-JP">{character.glyph}</Text>
        <Text style={styles.heroTitle}>{character.title}</Text>
        <Text style={styles.heroCopy}>{character.summary}</Text>
        <Text style={styles.cardTitle}>{character.meanings.join(", ")}</Text>
        {character.inputSequences.length ? <Text style={styles.mutedText}>IME input: {character.inputSequences.join(" or ")}</Text> : null}
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
        <View style={[styles.writingPad, { height: writingPadSize, width: writingPadSize }]}>
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Path d="M 50 0 L 50 100 M 0 50 L 100 50" stroke={colors.lineSoft} strokeWidth={0.8} fill="none" />
            {character.strokes.map((stroke, index) => (
              <Fragment key={stroke.id}>
                <Path d={pointsToPath(stroke.points)} stroke={colors.text} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Circle cx={stroke.points[0][0]} cy={stroke.points[0][1]} r={4.5} fill={colors.accent} />
                <SvgText x={stroke.points[0][0]} y={stroke.points[0][1] + 2} textAnchor="middle" fontSize={5} fontWeight="800" fill="#fff">{index + 1}</SvgText>
              </Fragment>
            ))}
          </Svg>
        </View>
      </View>
      <View style={styles.card} testID="mobile-japanese-character-practice">
        <Text style={styles.cardTitle}>Practice writing {character.glyph}</Text>
        <WritingPractice exercise={writingExercise} adapters={adapters} onProgress={() => undefined} />
      </View>
      {relatedVocabulary.length || character.examples.length ? (
        <View style={styles.card} testID="mobile-japanese-character-examples">
          <Text style={styles.cardTitle}>Words and examples</Text>
          {relatedVocabulary.map((vocabulary) => (
            <Pressable key={vocabulary.slug} onPress={() => adapters.navigation.navigate(vocabulary.route)} style={styles.subPanel}>
              <Text style={styles.japaneseGlyph} accessibilityLanguage="ja-JP">{vocabulary.expression}</Text>
              <Text style={styles.bodyText}>{vocabulary.reading} · {vocabulary.romaji}</Text>
              {vocabulary.inputSequences.length ? <Text style={styles.mutedText}>IME: {vocabulary.inputSequences.join(" or ")}</Text> : null}
              <Text style={styles.mutedText}>{vocabulary.meanings.join(", ")}</Text>
            </Pressable>
          ))}
          {character.examples.map((example) => (
            <View key={example.id} style={styles.subPanel}>
              <Text style={styles.cardTitle}>{example.japanese}</Text>
              <Text style={styles.bodyText}>{example.romaji} — {example.translation}</Text>
              <Text style={styles.mutedText}>{example.explanation}</Text>
            </View>
          ))}
        </View>
      ) : null}
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
        <Text style={styles.japaneseGlyph} accessibilityLanguage="ja-JP">{vocabulary.expression}</Text>
        <Text style={styles.heroTitle}>{vocabulary.romaji}</Text>
        <Text style={styles.heroCopy}>{vocabulary.reading}</Text>
        <Text style={styles.cardTitle}>{vocabulary.meanings.join(", ")}</Text>
        {vocabulary.inputSequences.length ? <Text style={styles.mutedText}>IME input: {vocabulary.inputSequences.join(" or ")}</Text> : null}
      </View>
      {vocabulary.segments.length ? (
        <View style={styles.card} testID="mobile-japanese-vocabulary-breakdown">
          <Text style={styles.cardTitle}>Kanji and hiragana breakdown</Text>
          {vocabulary.segments.map((segment, index) => (
            <View key={`${segment.text}-${index}`} style={styles.subPanel}>
              <Text style={styles.japaneseGlyph} accessibilityLanguage="ja-JP">{segment.text}</Text>
              <Text style={styles.bodyText}>{segment.reading} · {segment.romaji}</Text>
              <Text style={styles.mutedText}>{segment.meaning}</Text>
              <View style={styles.pillRow}>
                {segment.characterSlugs.flatMap((slug) => {
                  const character = getLanguageCharacterBySlug(slug);
                  return character ? [<Button key={slug} label={character.glyph} variant="ghost" onPress={() => adapters.navigation.navigate(character.route)} />] : [];
                })}
              </View>
            </View>
          ))}
        </View>
      ) : null}
      {vocabulary.examples.length ? (
        <View style={styles.card} testID="mobile-japanese-vocabulary-examples">
          <Text style={styles.cardTitle}>Example phrases</Text>
          {vocabulary.examples.map((example) => (
            <View key={example.id} style={styles.subPanel}>
              <Text style={styles.cardTitle}>{example.japanese}</Text>
              <Text style={styles.bodyText}>{example.reading} · {example.romaji}</Text>
              {example.inputSequences.length ? <Text style={styles.mutedText}>IME: {example.inputSequences.join(" or ")}</Text> : null}
              <Text style={styles.bodyText}>{example.translation}</Text>
              <Text style={styles.mutedText}>{example.explanation}</Text>
            </View>
          ))}
        </View>
      ) : null}
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
      <SourceReferencePanel sources={getSourcesByRefs(document.sourceRefs)} adapters={adapters} />
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
          <SourceReferencePanel sources={getSourcesByRefs(exercise.sourceRefs)} adapters={adapters} />
          {exercise.type === "flashcard" ? (
            <FlashcardPractice exercise={exercise} nextHref={nextHref} adapters={adapters} onProgress={onProgress} />
          ) : exercise.type === "cloze" ? (
            <ClozePractice exercise={exercise} nextHref={nextHref} adapters={adapters} onProgress={onProgress} />
          ) : exercise.type === "writing" ? (
            <WritingPractice exercise={exercise} nextHref={nextHref} adapters={adapters} onProgress={onProgress} />
          ) : exercise.type === "guided-lab" ? (
            <GuidedLabPractice exercise={exercise} nextHref={nextHref} adapters={adapters} onProgress={onProgress} />
          ) : (
            <QuestionnairePractice exercise={exercise} nextHref={nextHref} adapters={adapters} onProgress={onProgress} />
          )}
        </View>
      </AppScreen>
    </KeyboardAvoidingView>
  );
}

function SourceReferencePanel({ sources, adapters }: { sources: ContentSource[] } & ScreenProps) {
  if (sources.length === 0) return null;
  return (
    <View style={styles.subPanel} testID="mobile-source-references">
      <Text style={styles.cardEyebrow}>Primary sources</Text>
      <Text style={styles.mutedText}>These upstream pages are authoritative. Codematica is the study and progress companion.</Text>
      {sources.map((source) => <Button key={source.id} label={`${source.title} · ${source.provider}`} variant="ghost" onPress={() => adapters.navigation.openExternalUrl?.(source.url)} />)}
    </View>
  );
}

function GuidedLabPractice({
  exercise,
  nextHref,
  adapters,
  onProgress,
}: {
  exercise: Extract<LearningExercise, { type: "guided-lab" }>;
  nextHref?: string;
  onProgress: (status: ProgressStatus, position?: Record<string, unknown>) => void | Promise<void>;
} & ScreenProps) {
  const [predictionId, setPredictionId] = useState<string>();
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const complete = Boolean(predictionId) && evidenceIds.length === exercise.evidenceChecklist.length;

  return (
    <View style={styles.stack} testID="mobile-guided-lab-session">
      <Text style={styles.cardEyebrow}>Briefing · about {exercise.estimatedMinutes} minutes</Text>
      <Text style={styles.bodyText}>{exercise.briefing}</Text>
      {exercise.objectives.map((objective) => <Text key={objective} style={styles.mutedText}>• {objective}</Text>)}
      <View style={styles.subPanel}>
        <Text style={styles.cardTitle}>Commit your prediction</Text>
        <Text style={styles.bodyText}>{exercise.prediction.prompt}</Text>
        {exercise.prediction.options.map((option) => (
          <Pressable key={option.id} onPress={() => { setPredictionId(option.id); void onProgress("started", { predictionCommitted: true }); }} style={[styles.choice, predictionId === option.id && styles.choiceSelected]}>
            <Text style={styles.choiceText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      {exercise.steps.map((step, index) => <View key={step.id} style={styles.subPanel}><Text style={styles.cardEyebrow}>Step {index + 1}</Text><Text style={styles.cardTitle}>{step.title}</Text><Text style={styles.mutedText}>{step.instructions}</Text></View>)}
      <View style={styles.subPanel}>
        <Text style={styles.cardTitle}>Evidence checklist</Text>
        {exercise.evidenceChecklist.map((item) => {
          const checked = evidenceIds.includes(item.id);
          return <Pressable key={item.id} onPress={() => setEvidenceIds((current) => checked ? current.filter((id) => id !== item.id) : [...current, item.id])} style={[styles.choice, checked && styles.choiceSelected]}><Text style={styles.choiceText}>{checked ? "✓ " : "○ "}{item.label}</Text></Pressable>;
        })}
      </View>
      <View style={styles.subPanel}>
        <Text style={styles.cardTitle}>Reflect and extend</Text>
        {exercise.reflectionPrompts.map((prompt) => <View key={prompt}><Text style={styles.bodyText}>{prompt}</Text><TextInput multiline placeholder="Private working note (not saved)" style={styles.input} /></View>)}
        <Text style={styles.mutedText}>Extension: {exercise.extensionChallenge}</Text>
      </View>
      <Button label="Complete lab" disabled={!complete} onPress={() => void onProgress("completed", { predictionCommitted: true, evidenceCount: evidenceIds.length, evidenceTotal: exercise.evidenceChecklist.length })} testID="mobile-guided-lab-complete" />
      {complete && nextHref ? <Button label="Next node" variant="secondary" onPress={() => adapters.navigation.navigate(nextHref)} /> : null}
    </View>
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
  const { width } = useWindowDimensions();
  const writingPadSize = Math.min(width >= 900 ? 560 : width >= 600 ? 480 : 360, Math.max(260, width - 64));
  const characters = exercise.characterSlugs.flatMap((slug) => {
    const character = getLanguageCharacterBySlug(slug);
    return character ? [character] : [];
  });
  const [mode, setMode] = useState<"assisted" | "free">(exercise.modes.includes("assisted") ? "assisted" : "free");
  const [characterIndex, setCharacterIndex] = useState(0);
  const [strokes, setStrokes] = useState<WritingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<WritingStroke | undefined>();
  const [result, setResult] = useState<WritingCheckResult | undefined>();
  const [assistedFeedback, setAssistedFeedback] = useState<string | undefined>();
  const character = characters[characterIndex];

  function resetForCharacter(nextIndex = characterIndex) {
    setCharacterIndex(nextIndex);
    setStrokes([]);
    setCurrentStroke(undefined);
    setResult(undefined);
    setAssistedFeedback(undefined);
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
    if (mode === "assisted" && expectedStroke) {
      const completion = getAssistedStrokeCompletion(expectedStroke, normalizedStroke);
      if (!completion.shouldComplete) {
        setCurrentStroke(undefined);
        setAssistedFeedback(`Try stroke ${strokes.length + 1} again. Start at the numbered dot.`);
        return;
      }
      setStrokes((value) => [...value, { points: expectedStroke.points }]);
    } else {
      setStrokes((value) => [...value, normalizedStroke]);
    }
    setCurrentStroke(undefined);
    setAssistedFeedback(undefined);
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
        {character.inputSequences.length ? <Text style={styles.mutedText}>IME: {character.inputSequences.join(" or ")}</Text> : null}
        <Text style={styles.mutedText}>{character.meanings.join(", ")}</Text>
      </View>
      <View
        style={[styles.writingPad, { height: writingPadSize, width: writingPadSize }]}
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
            ? character.strokes.slice(strokes.length).map((stroke, index) => <Path key={stroke.id} d={pointsToPath(stroke.points)} stroke={index === 0 ? colors.accent : colors.line} strokeWidth={index === 0 ? 5 : 3} strokeLinecap="round" strokeLinejoin="round" fill="none" />)
            : null}
          {mode === "assisted" && character.strokes[strokes.length] ? (
            <>
              <Circle cx={character.strokes[strokes.length]!.points[0][0]} cy={character.strokes[strokes.length]!.points[0][1]} r={5} fill={colors.accent} />
              <SvgText x={character.strokes[strokes.length]!.points[0][0]} y={character.strokes[strokes.length]!.points[0][1] + 2} textAnchor="middle" fontSize={6} fontWeight="800" fill="#fff">{strokes.length + 1}</SvgText>
            </>
          ) : null}
          {[...strokes, ...(currentStroke ? [currentStroke] : [])].map((stroke, index) => (
            <Path key={`${index}-${stroke.points.length}`} d={pointsToPath(stroke.points)} stroke={colors.text} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
        </Svg>
      </View>
      {assistedFeedback ? <View style={styles.feedback} testID="mobile-writing-assisted-feedback"><Text style={styles.feedbackTitle}>{assistedFeedback}</Text></View> : null}
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
        <Button label="Check" disabled={strokes.length === 0 || Boolean(result) || strokes.length !== character.strokes.length} onPress={checkCurrentCharacter} testID="mobile-writing-check" />
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
  const [graded, setGraded] = useState<Record<string, boolean>>({});
  const question = attempt[currentIndex];

  function resetAnswer(nextAnswer?: QuestionnaireAnswer) {
    setAnswer(nextAnswer);
    setResult(undefined);
  }

  function checkAnswer() {
    const effectiveAnswer = getNativeEffectiveAnswer(question, answer);
    const checked = checkQuestionAnswer(question, effectiveAnswer);
    setResult(checked);
    setGraded((current) => ({ ...current, [question.id]: checked.isCorrect }));
  }

  function advance() {
    if (currentIndex + 1 >= attempt.length) {
      const scores = calculateQuestionnaireSkillScores(attempt.map((attemptQuestion) => ({ question: attemptQuestion, isCorrect: graded[attemptQuestion.id] ?? false })));
      void onProgress("completed", { questionIndex: currentIndex, totalQuestions: attempt.length, score: scores.overall, skillScores: scores.skills });
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
    setGraded({});
  }

  if (complete) {
    return (
      <View style={styles.stack} testID="mobile-questionnaire-complete">
        <View style={[styles.feedback, styles.feedbackCorrect]}>
          <Text style={styles.feedbackTitle}>Refresh complete</Text>
          <Text style={styles.mutedText}>You reached the end of this practice session.</Text>
          <Text style={styles.mutedText}>Score {Math.round(calculateQuestionnaireSkillScores(attempt.map((attemptQuestion) => ({ question: attemptQuestion, isCorrect: graded[attemptQuestion.id] ?? false }))).overall * 100)}%</Text>
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
        testID="mobile-passive-flashcard-list"
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
          <Markdown
            key={`markdown-${index}`}
            style={markdownStyles}
            onLinkPress={(href) => {
              if (href.startsWith("/")) {
                adapters.navigation.navigate(href);
                return false;
              }
              adapters.navigation.openExternalUrl?.(href);
              return false;
            }}
          >
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
  if (node.kind === "source") {
    const source = index.sources.find((item) => item.id === node.sourceRef);
    const document = node.companionKind === "document" ? index.documents.find((item) => item.slug === node.slug) : undefined;
    const exercise = node.companionKind === "exercise" ? index.exercises.find((item) => item.slug === node.slug) : undefined;
    return {
      title: document?.title ?? exercise?.title ?? source?.title ?? node.slug,
      summary: document?.summary ?? (exercise ? `${exercise.concept} practice` : `Open the authoritative ${source?.provider ?? "upstream"} source.`),
      kindLabel: document || exercise ? `Source + ${node.companionKind}` : `Official source · ${node.activity}`,
      difficulty: document?.difficulty ?? exercise?.difficulty,
    };
  }

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

  if (exercise.type === "guided-lab") return "Guided lab";

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
    fontSize: 13,
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
    fontSize: 17,
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
    overflow: "hidden",
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
    fontSize: 13,
    fontWeight: "900",
  },
  cardEyebrow: {
    color: colors.textMuted,
    fontSize: 13,
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
    fontSize: 17,
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
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: "900",
  },
  ghostButtonText: {
    color: colors.text,
    fontSize: 16,
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
