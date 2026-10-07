import { AdaptiveText as Text } from "./AdaptiveText";
import {
  buildPassiveFlashcardWindow,
  buildWritingPracticeSheets,
  createExerciseNotebook,
  getWritingMatchPairs,
  getWritingStrokePath,
  getContentIndex,
  calculateQuestionnaireSkillScores,
  checkQuestionAnswer,
  createQuestionnaireAttempt,
  convertJapaneseInput,
  getJapaneseCharacterGroups,
  getHomeDiscoverySections,
  getLanguageCharacterBySlug,
  getPathNodeRoute,
  getSourcesByRefs,
  searchJapanese,
  createDiscoveryItems,
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
} from "@codematica/core";
import Markdown from "react-native-markdown-display";
import type { ASTNode, RenderRules } from "react-native-markdown-display";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import { WebView } from "react-native-webview";
import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  FlatList,
  Image,
  Modal,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import type { CodematicaAdapters, ProgressTarget } from "./adapters";
import { LocalSearchFeedback, useLocalSearch } from "./LocalSearch";
import { colors, radii, spacing } from "./tokens";
import { Button, Disclosure } from "./Button";
import { JapaneseNotebookPractice, NotebookDrawingContext, NotebookScrollContext } from "./JapaneseNotebookPractice";

// Metro bundles these local images for offline native use.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const patchBrandMark = require("./assets/brand/patch-mark.png");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const codematicaWordmark = require("./assets/brand/wordmark.png");

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

const nativeDestinations = [
  { href: "/", label: "Play", path: "M3 10 12 3 21 10V21H15V14H9V21H3Z" },
  { href: "/learn", label: "Learn", path: "M3 3h8v18H3ZM13 3h8v18h-8Z" },
  { href: "/paths", label: "Paths", path: "m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16" },
  { href: "/browse", label: "Lessons", path: "M12 5v16M3 3h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z" },
  { href: "/practice", label: "Practice", path: "m13 2-9 12h7l-1 8 10-12h-7Z" },
  { href: "/interviews", label: "Interviews", path: "m8 5-7 7 7 7m8-14 7 7-7 7m-3-17-2 20" },
  { href: "/languages", label: "Languages", path: "M2 5h12M8 2v3m4 0c-1 7-5 10-10 12m2-9c2 4 5 7 9 9m1 5 5-13 5 13m-8-4h6" },
];

/** Persistent shell navigation; the Expo adapter owns routing and safe-area insets. */
export function NativeNavigation({ pathname, navigate, wide, isAdmin = false, account, accountLoading = false }: {
  pathname: string;
  navigate: (href: string) => void;
  wide: boolean;
  isAdmin?: boolean;
  account?: { name: string; email?: string; signOut: () => Promise<void> };
  accountLoading?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [languagesOpen, setLanguagesOpen] = useState(pathname.includes("japanese"));
  const active = pathname.startsWith("/play/") ? "/" : pathname.startsWith("/practice/languages/japanese") ? "/languages" : pathname.startsWith("/docs/") || pathname.startsWith("/diagrams/") ? "/browse" : `/${pathname.split("/")[1]}`;
  const adminDestination = { href: "/admin/linkedin", label: "LinkedIn", path: "M4 4h16v16H4ZM8 10v7m4-7v7m0-4a3 3 0 0 1 6 0v4" };
  const adminDestinations = [adminDestination, { href: "/admin/interview-preparation", label: "Interview preparation", path: "M3 7h18v14H3ZM8 7V3h8v4M3 12h18" }];
  const items = wide ? nativeDestinations : nativeDestinations.filter(({ href }) => !["/browse", "/languages", "/interviews"].includes(href));
  const menuItems = nativeDestinations.filter(({ href }) => ["/browse", "/languages", "/interviews"].includes(href));
  const moreSelected = ["/browse", "/languages", "/interviews", "/login", "/admin"].includes(active);
  const go = (href: string) => { setMenuOpen(false); navigate(href); };

  function destination({ href, label, path }: typeof nativeDestinations[number], inMenu = false) {
    const selected = href.startsWith("/admin/") ? pathname === href || pathname.startsWith(`${href}/`) : active === href;
    return <Pressable key={href} accessibilityRole={inMenu ? "button" : "tab"} accessibilityLabel={label} accessibilityState={{ selected }} onPress={() => go(href)}
      style={({ pressed }) => [wide || inMenu ? styles.navigationRailItem : styles.navigationItem, selected && styles.navigationSelected, pressed && styles.navigationPressed]}
      testID={`mobile-${inMenu ? "menu" : "nav"}-${label.toLowerCase()}`}>
      <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}><Path d={path} stroke={selected ? colors.accentStrong : colors.textMuted} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
      <Text numberOfLines={wide || inMenu ? undefined : 1} adjustsFontSizeToFit={!wide && !inMenu} style={[styles.navigationLabel, (wide || inMenu) && styles.navigationRailLabel, selected && styles.navigationSelectedText]}>{label}</Text>
    </Pressable>;
  }

  const accountControl = accountLoading ? <Text accessibilityRole="text" accessibilityLiveRegion="polite" style={styles.mutedText}>Checking account…</Text> : account ? <NativeAccountMenu key={account.email ?? account.name} account={account} onDone={() => go("/")} /> : <Button label="Sign in" variant="ghost" tone="neutral" onPress={() => go("/login")} testID={wide ? "mobile-nav-sign-in" : "mobile-menu-sign-in"} />;

  function languageLinks(inMenu = false) {
    return <View style={styles.languageBranch}>
      <Button label="Japanese" variant="ghost" tone="neutral" onPress={() => go("/languages/japanese")} testID={`mobile-${inMenu ? "menu" : "nav"}-japanese`} />
      <Button label="Notebook practice" variant="ghost" tone="neutral" onPress={() => go("/languages/japanese/notebooks")} testID={`mobile-${inMenu ? "menu" : "nav"}-notebooks`} />
    </View>;
  }

  return <View style={wide ? styles.navigationRail : styles.navigationBar} testID={wide ? "mobile-navigation-rail" : "mobile-navigation-bar"}>
    {wide ? <>
      <Pressable accessibilityRole="button" accessibilityLabel="Codematica home" onPress={() => navigate("/")} style={styles.navigationBrand}>
        <Image source={patchBrandMark} style={styles.brandMark} resizeMode="contain" accessible={false} />
        <Image source={codematicaWordmark} style={styles.brandWordmark} resizeMode="contain" accessible={false} />
      </Pressable>
      <ScrollView style={styles.navigationScroll} contentContainerStyle={styles.navigationScrollContent} testID="mobile-navigation-scroll">
        {items.map(item => <Fragment key={item.href}>{destination(item)}{item.href === "/languages" ? <>
          <Pressable accessibilityRole="button" accessibilityLabel="Supported languages" accessibilityState={{ expanded: languagesOpen }} onPress={() => setLanguagesOpen(value => !value)} style={styles.languageToggle} testID="mobile-nav-languages-expand"><Text style={styles.mutedText}>Supported languages {languagesOpen ? "−" : "+"}</Text></Pressable>
          {languagesOpen ? languageLinks() : null}
        </> : null}</Fragment>)}
        {isAdmin ? <View style={styles.adminSection}><Text accessibilityRole="header" style={styles.cardEyebrow}>Admin</Text>{adminDestinations.map(item => destination(item))}</View> : null}
      </ScrollView>
      <View style={styles.navigationFooter}>{accountControl}</View>
    </> : <>
      {items.map(item => destination(item))}
      <Pressable accessibilityRole="button" accessibilityLabel="More" accessibilityState={{ selected: moreSelected, expanded: menuOpen }} onPress={() => setMenuOpen(true)} style={[styles.navigationItem, moreSelected && styles.navigationSelected]} testID="mobile-nav-more">
        <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>{[5,12,19].map(cx => <Circle key={cx} cx={cx} cy={12} r={1.5} fill={colors.textMuted} />)}</Svg>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.navigationLabel}>More</Text>
      </Pressable>
    </>}
    <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
      <View style={styles.navigationBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close menu" onPress={() => setMenuOpen(false)} />
        <ScrollView style={styles.navigationSheet} contentContainerStyle={styles.navigationSheetContent} accessibilityViewIsModal keyboardShouldPersistTaps="handled">
          <View style={styles.discoverySectionHeader}><Text accessibilityRole="header" style={styles.cardTitle}>Explore Codematica</Text><Button label="Close" variant="ghost" tone="neutral" onPress={() => setMenuOpen(false)} testID="mobile-menu-close" /></View>
          {menuItems.map(item => <Fragment key={item.href}>{destination(item, true)}{item.href === "/languages" ? languageLinks(true) : null}</Fragment>)}
          {isAdmin ? <View style={styles.adminSection}><Text accessibilityRole="header" style={styles.cardEyebrow}>Admin</Text>{adminDestinations.map(item => destination(item, true))}</View> : null}
          <View style={styles.navigationFooter}>{accountControl}</View>
        </ScrollView>
      </View>
    </Modal>
  </View>;
}

function NativeAccountMenu({ account, onDone }: {
  account: { name: string; email?: string; signOut: () => Promise<void> };
  onDone: () => void;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const signOutPending = useRef(false);
  async function signOut() {
    if (signOutPending.current) return;
    signOutPending.current = true;
    setSigningOut(true);
    setSignOutError("");
    try { await account.signOut(); setAccountOpen(false); onDone(); }
    catch { setSignOutError("Couldn't sign out. Please try again."); }
    finally { signOutPending.current = false; setSigningOut(false); }
  }

  return <View style={styles.accountSection}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Account: ${account.name}`} accessibilityState={{ expanded: accountOpen }} onPress={() => setAccountOpen(value => !value)} style={styles.accountTrigger} testID="mobile-account-trigger">
      <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}><Path d="M4 21v-3a8 8 0 0 1 16 0v3M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0" fill="none" stroke={colors.textStrong} strokeWidth={1.7} /></Svg>
      <Text style={[styles.bodyText, styles.fill]}>{account.name}</Text>
      <Svg width={18} height={18} viewBox="0 0 24 24" accessible={false}><Path d={accountOpen ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} fill="none" stroke={colors.textStrong} strokeWidth={2} /></Svg>
    </Pressable>
    {accountOpen ? <View style={styles.stack}>
      {account.email ? <Text selectable style={styles.mutedText}>{account.email}</Text> : null}
      <Button label={signingOut ? "Signing out…" : "Sign out"} variant="ghost" tone="danger" busy={signingOut} onPress={() => void signOut()} testID="mobile-sign-out" />
      {signOutError ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.errorText}>{signOutError}</Text> : null}
    </View> : null}
  </View>;
}

export function AppScreen({ title, children, footer, keyboardAware = false, keyboardShouldPersistTaps, scrollResetKey }: {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  keyboardAware?: boolean;
  keyboardShouldPersistTaps?: "never" | "always" | "handled";
  scrollResetKey?: number;
}) {
  const [drawing, setDrawing] = useState(false);
  const pageScroll = useRef<ScrollView>(null);
  const pageBounds = useRef({ y: 0, viewport: 0, content: 0 });
  const previousReset = useRef(scrollResetKey);
  useEffect(() => {
    if (previousReset.current === scrollResetKey) return;
    previousReset.current = scrollResetKey;
    Keyboard.dismiss();
    pageBounds.current.y = 0;
    pageScroll.current?.scrollTo({ y: 0, animated: false });
  }, [scrollResetKey]);
  const scrollNotebookPage = useCallback((deltaY: number) => {
    const bounds = pageBounds.current;
    bounds.y = Math.max(0, Math.min(Math.max(0, bounds.content - bounds.viewport), bounds.y + deltaY));
    pageScroll.current?.scrollTo({ y: bounds.y, animated: false });
  }, []);
  const content = <>
      <ScrollView
        ref={pageScroll}
        testID={keyboardAware ? "keyboard-aware-scroll" : "mobile-page-scroll"}
        scrollEnabled={!drawing}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? (keyboardAware ? "handled" : undefined)}
        keyboardDismissMode={keyboardAware ? "on-drag" : undefined}
        contentContainerStyle={styles.screenContent}
        onLayout={(event) => { pageBounds.current.viewport = event.nativeEvent.layout.height; }}
        onContentSizeChange={(_width, height) => { pageBounds.current.content = height; }}
        onScroll={(event) => { pageBounds.current.y = event.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        {title ? <Text style={styles.screenEyebrow}>{title}</Text> : null}
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </>;
  return (
    <NotebookScrollContext.Provider value={scrollNotebookPage}>
      <NotebookDrawingContext.Provider value={setDrawing}>
        {keyboardAware ? <KeyboardAvoidingView testID="keyboard-aware-screen" behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>{content}</KeyboardAvoidingView> : <View style={styles.screen}>{content}</View>}
      </NotebookDrawingContext.Provider>
    </NotebookScrollContext.Provider>
  );
}

export function Header({ adapters, subtitle = "Path map" }: { adapters: CodematicaAdapters; subtitle?: string }) {
  const { width, fontScale } = useWindowDimensions();
  const stacked = fontScale > 1.4 && width / fontScale < 350;
  return (
    <View testID="mobile-page-header" style={[styles.header, stacked && { flexDirection: "column", alignItems: "flex-start" }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Codematica home, ${subtitle}`} onPress={() => adapters.navigation.navigate("/")} style={[styles.brand, stacked && { flex: 0, width: "100%" }]} testID="mobile-home-link">
        <Image source={patchBrandMark} style={styles.brandMark} resizeMode="contain" accessible={false} />
        <View style={styles.fill}>
          <Image source={codematicaWordmark} style={styles.brandWordmark} resizeMode="contain" accessible={false} />
        </View>
      </Pressable>
      <Button label="Browse" variant="ghost" tone="neutral" onPress={() => adapters.navigation.navigate("/browse")} testID="mobile-browse-link" />
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
      <Text accessibilityRole="header" style={styles.heroTitle}>Learning paths</Text>
      <Text style={styles.heroCopy}>Follow guided learning paths.</Text>

      <KeepReadingSection items={keepReadingItems} isSignedIn={isSignedIn} adapters={adapters} />

      <View style={styles.actionRow}>
        <Button label="Content library" onPress={() => adapters.navigation.navigate("/browse")} testID="mobile-home-browse" />
        <Button label="Interview prep" variant="secondary" onPress={() => adapters.navigation.navigate("/interviews")} testID="mobile-home-interviews" />
      </View>

      <View style={styles.stack} testID="mobile-learning-path-list">
        {index.learningPaths.map((learningPath) => (
          <PathOverview key={learningPath.slug} learningPath={learningPath} adapters={adapters} />
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
  const { width, fontScale } = useWindowDimensions();
  const shortcutMinWidth = Math.min(80 * fontScale, width - 2 * spacing.lg);
  const stackedSectionHeaders = fontScale > 1.4 && width / fontScale < 350;
  const [query, setQuery] = useState("");
  const search = useLocalSearch({ index, kind: "discovery", query, runtimeScript: adapters.searchScript });
  const sections = useMemo(() => getHomeDiscoverySections(index), [index]);
  const results = search.results;
  const searching = query.trim().length > 0;
  const searchPending = search.pending;

  return (
    <AppScreen keyboardAware>
      {search.runtime}
      <Header adapters={adapters} subtitle="Learning home" />
      <Text accessibilityRole="header" style={styles.heroTitle}>What will you learn today?</Text>
      <SearchField label="Search all content" value={query} onChange={setQuery} placeholder="Search topics" testID="mobile-home-global-search" />

      {searching ? (
        <View style={styles.stack} testID="mobile-home-search-results">
          <Text accessibilityLiveRegion="polite" style={styles.cardEyebrow}>{search.error ? "Search unavailable" : searchPending ? "Searching…" : `${results.length} results`}</Text>
          <LocalSearchFeedback error={search.error} retry={search.retry} />
          {!searchPending ? results.map((result) => <MobileDiscoveryCard key={`${result.kind}-${result.id}`} item={result} adapters={adapters} showSummary={false} />) : null}
          {!searchPending && !search.error && results.length === 0 ? <Text style={styles.emptyText}>No content matches that search.</Text> : null}
        </View>
      ) : (
        <>
          <View style={styles.homeShortcuts} testID="mobile-home-shortcuts">
            {nativeDestinations.filter(({ href }) => href !== "/" && href !== "/learn").map(({ href, label, path }) => <Pressable key={href} accessibilityRole="button" accessibilityLabel={label} style={[styles.homeShortcut, { minWidth: shortcutMinWidth, flexBasis: shortcutMinWidth }]} onPress={() => adapters.navigation.navigate(href)} testID={`mobile-home-explore-${label.toLowerCase()}`}><View style={styles.homeShortcutIcon}><Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}><Path d={path} stroke={colors.accentStrong} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg></View><Text style={styles.navigationLabel}>{label}</Text></Pressable>)}
          </View>
          <KeepReadingSection items={keepReadingItems} isSignedIn={isSignedIn} adapters={adapters} showSummary={false} />
          {sections.map((section) => (
            <View key={section.id} style={styles.discoverySection} testID={`mobile-home-section-${section.id}`}>
              <View style={[styles.discoverySectionHeader, stackedSectionHeaders && { flexDirection: "column", alignItems: "stretch" }]}>
                <View style={[styles.fill, stackedSectionHeaders && { flex: 0 }]}>
                  <Text accessibilityRole="header" style={styles.discoverySectionTitle}>{section.title}</Text>
                </View>
                <Button label="View all" accessibilityLabel={`View all ${section.id === "paths" ? "learning paths" : section.id}`} variant="ghost" tone="success" onPress={() => adapters.navigation.navigate(section.route)} testID={`mobile-home-view-all-${section.id}`} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoveryRow}>
                {section.items.map((item) => <MobileDiscoveryCard key={`${item.kind}-${item.id}`} item={item} adapters={adapters} compact showSummary={false} />)}
              </ScrollView>
            </View>
          ))}
        </>
      )}
    </AppScreen>
  );
}

/** Named keyboard-safe search with a touch-visible clear action. */
function SearchField({ label, value, onChange, placeholder, testID }: {
  label: string; value: string; onChange: (value: string) => void; placeholder: string; testID: string;
}) {
  const input = useRef<TextInput>(null);
  const labelID = useId();
  return <View style={styles.loginField}>
    <Text nativeID={labelID} style={styles.fieldLabel}>{label}</Text>
    <TextInput ref={input} accessibilityLabel={label} accessibilityLabelledBy={labelID} value={value} onChangeText={onChange} returnKeyType="search" placeholder={placeholder} placeholderTextColor={colors.textMuted} style={styles.input} testID={testID} />
    {value ? <Button label="Clear search" tone="neutral" variant="secondary" onPress={() => { onChange(""); input.current?.focus(); }} /> : null}
  </View>;
}

export function PracticeCatalogScreen({ index, adapters }: { index: ContentIndex } & ScreenProps) {
  const [query, setQuery] = useState("");
  const items = useMemo(
    () => createDiscoveryItems(index).filter((item) => item.section === "practice" && (!query.trim() || `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLocaleLowerCase("en-US").includes(query.trim().toLocaleLowerCase("en-US")))),
    [index, query],
  );

  return (
    <AppScreen keyboardAware>
      <Header adapters={adapters} subtitle="Practice & review" />
      <Text accessibilityRole="header" style={styles.heroTitle}>Practice & review</Text>
      <SearchField label="Search practice" value={query} onChange={setQuery} placeholder="Search practice activities" testID="mobile-practice-catalog-search" />
      <Text accessibilityLiveRegion="polite" style={styles.mutedText}>{items.length} activities</Text>
      <View style={styles.stack} testID="mobile-practice-catalog">
        {items.length === 0 ? <Text style={styles.emptyText}>No practice matches. Try another search.</Text> : null}
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
      <Text accessibilityRole="header" style={styles.heroTitle}>Languages</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Japanese" onPress={() => adapters.navigation.navigate("/languages/japanese")} style={[styles.card, { borderColor: colors.sectionLanguages }]} testID="mobile-language-japanese">
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

function MobileDiscoveryCard({ item, adapters, compact = false, showSummary = true }: { item: DiscoveryResult; compact?: boolean; showSummary?: boolean } & ScreenProps) {
  return (
    <Pressable
      onPress={() => adapters.navigation.navigate(item.route)}
      accessibilityRole="button"
      accessibilityLabel={[item.title, item.eyebrow, item.difficulty ? difficultyLabels[item.difficulty] : undefined].filter(Boolean).join(", ")}
      accessibilityHint={showSummary ? item.summary : undefined}
      style={[styles.card, compact && styles.discoveryCardCompact]}
      testID={`mobile-discovery-${item.kind}-${item.sourceSlug.replaceAll("/", "-")}`}
    >
      <Text style={[styles.cardEyebrow, { color: discoverySectionColor(item.section) }]}>{item.eyebrow}</Text>
      <Text style={styles.cardTitle}>{item.title}</Text>
      {showSummary ? <Text style={styles.mutedText}>{item.summary}</Text> : null}
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
      <Text accessibilityRole="header" style={styles.heroTitle}>{learningPath.title}</Text>
      <Text style={styles.heroCopy}>{learningPath.summary}</Text>
      {flashcardFeed ? (
        <Button label="Flashcard feed" onPress={() => adapters.navigation.navigate(flashcardFeed.route)} testID="mobile-path-flashcards" />
      ) : null}

      {learningPath.progression ? (
        <View style={styles.discoverySection} testID="mobile-path-progression-roadmap">
          <Text style={styles.cardEyebrow}>Learning milestones</Text>
          <Text accessibilityRole="header" style={styles.cardTitle}>{learningPath.progression.roadmapLabel}</Text>
          {learningPath.progression.reviewRoute ? <Button label="Review skills" variant="ghost" onPress={() => adapters.navigation.navigate(learningPath.progression!.reviewRoute!)} /> : null}
          {learningPath.progression.stages.map((stage, stageIndex) => (
            <View key={stage.id} style={styles.sectionRow}>
              <View style={styles.pillRow}><Pill label={`Stage ${stageIndex + 1}`} tone="amber" /><Pill label={stage.level} tone="blue" /><Pill label={stage.status} tone={stage.status === "published" ? "green" : "amber"} /></View>
              <Text accessibilityRole="header" style={styles.cardTitle}>{stage.label}</Text>
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
          <View key={unit.slug} style={styles.discoverySection}>
            <Text style={styles.cardEyebrow}>Unit {unitIndex + 1}</Text>
            <Text accessibilityRole="header" style={styles.cardTitle}>{unit.title}</Text>
            <Text style={styles.mutedText}>{unit.summary}</Text>
            <PathNodes index={index} learningPath={learningPath} nodes={unit.nodes} adapters={adapters} />
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

function PathOverview({
  learningPath,
  adapters,
}: {
  learningPath: LearningPath;
} & ScreenProps) {
  const nodeCount = learningPath.units.reduce((sum, unit) => sum + unit.nodes.length, 0);

  return (
    <View style={styles.card} testID={`mobile-path-card-${learningPath.slug}`}>
      <View style={styles.pillRow}>
        <Pill label={learningPath.kind} />
        <Pill label={learningPath.category} tone="blue" />
        <Pill label={`${nodeCount} activities`} tone="amber" />
      </View>
      <Text style={styles.cardTitle}>{learningPath.title}</Text>
      <Text style={styles.mutedText}>{learningPath.summary}</Text>
      <Button label="Open path" accessibilityLabel={`Open ${learningPath.title}`} onPress={() => adapters.navigation.navigate(learningPath.route)} testID={`mobile-open-path-${learningPath.slug}`} />
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
            accessibilityRole={href.startsWith("http") ? "link" : "button"}
            accessibilityLabel={display.title}
            accessibilityHint={href.startsWith("http") ? "Opens the source in a browser" : display.summary}
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

  const search = useLocalSearch({ index, kind: "content", query, filters: { track: track === "all" ? undefined : track, difficulty: difficulty === "all" ? undefined : difficulty }, runtimeScript: adapters.searchScript });
  const results = search.results;
  const searchPending = search.pending;

  return (
    <AppScreen keyboardAware>
      {search.runtime}
      <Header adapters={adapters} subtitle="Content library" />
      <Text accessibilityRole="header" style={styles.heroTitle}>Lessons & diagrams</Text>
      <SearchField label="Search lessons" value={query} onChange={setQuery} placeholder="Search concepts, patterns, failures" testID="mobile-knowledge-search-input" />

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

      <Text accessibilityLiveRegion="polite" style={styles.mutedText}>{search.error ? "Search unavailable" : searchPending ? "Searching…" : `${results.length} results${results.length === 40 ? " · showing the first 40" : ""}`}</Text>
      <LocalSearchFeedback error={search.error} retry={search.retry} />
      <View style={styles.stack} testID="mobile-search-results">
        {results.map((result) => (
          <SearchResultCard key={`${result.kind}-${result.id}`} result={result} adapters={adapters} />
        ))}
        {!searchPending && !search.error && results.length === 0 ? <Text style={styles.emptyText}>No lessons or diagrams match these filters.</Text> : null}
      </View>
    </AppScreen>
  );
}

function SearchResultCard({ result, adapters }: { result: SearchResult } & ScreenProps) {
  const automationSlug = result.route.replace(/^\/(?:docs|diagrams)\//, "").replaceAll("/", "-");
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={result.title} accessibilityHint={result.snippet || result.summary} onPress={() => adapters.navigation.navigate(result.route)} style={styles.card} testID={`mobile-result-${result.kind}-${automationSlug}`}>
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
  const [wordsOpen, setWordsOpen] = useState(false);
  const groups = useMemo(() => getJapaneseCharacterGroups(index), [index]);
  const results = useMemo(() => searchJapanese(index, query), [index, query]);
  const flashcards = index.passiveFlashcardFeeds.find((feed) => feed.pathSlug === "japanese-foundations" && feed.status === "published");

  return (
    <AppScreen keyboardAware>
      <Header adapters={adapters} subtitle="Japanese" />
      <Text accessibilityRole="header" style={styles.heroTitle}>Japanese</Text>
      <Text style={styles.heroCopy}>Find beginner Japanese characters and phrases with romaji and IPA.</Text>
      <View style={styles.actionRow}>
        <Button label="Notebook practice" tone="info" variant="secondary" onPress={()=>adapters.navigation.navigate("/languages/japanese/notebooks")} testID="mobile-japanese-notebooks"/>
        <Button label="Learn" onPress={() => adapters.navigation.navigate("/paths/japanese-foundations")} testID="mobile-japanese-path-link" />
        <Button label="Review" variant="secondary" onPress={() => adapters.navigation.navigate("/languages/japanese/review")} testID="mobile-japanese-review-link" />
        {flashcards ? <Button label="Flashcards" variant="secondary" onPress={() => adapters.navigation.navigate(flashcards.route)} testID="mobile-japanese-flashcards-link" /> : null}
        <Button label="Hiragana writing" variant="ghost" onPress={() => adapters.navigation.navigate("/practice/languages/japanese-hiragana-vowels-writing?path=japanese-foundations")} testID="mobile-japanese-writing-sheets-link" />
        <Button label="Katakana writing" variant="ghost" onPress={() => adapters.navigation.navigate("/practice/languages/japanese-katakana-vowels-writing?path=japanese-foundations")} testID="mobile-japanese-katakana-sheets-link" />
        <Button label="Hiragana guide" variant="ghost" onPress={() => adapters.navigation.navigate("/docs/languages/japanese-hiragana-foundations?path=japanese-foundations")} testID="mobile-japanese-hiragana-guide-link" />
        <Button label="Katakana guide" variant="ghost" onPress={() => adapters.navigation.navigate("/docs/languages/japanese-katakana-foundations?path=japanese-foundations")} testID="mobile-japanese-katakana-guide-link" />
      </View>
      <SearchField label="Search Japanese" value={query} onChange={setQuery} placeholder="Search あ, ア, coffee, nihon, /ɲihoɴ/" testID="mobile-japanese-search-input" />
      {query ? <Text accessibilityLiveRegion="polite" style={styles.mutedText}>{results.length ? `${results.length} matches` : "No matches. Try a character, word or romaji."}</Text> : null}
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
          <View style={styles.stack}>
            <Button label="Words and greetings" tone="neutral" variant="secondary" accessibilityState={{ expanded: wordsOpen }} onPress={() => setWordsOpen(value => !value)} />
            {wordsOpen ? index.languageVocabulary.filter(item => item.language === "ja" && item.status === "published").map(vocabulary => <VocabularyCard key={vocabulary.slug} vocabulary={vocabulary} adapters={adapters} />) : null}
          </View>
        </View>
      ) : null}
      <View style={styles.card} testID="mobile-japanese-resources">
        <Text style={styles.cardTitle}>Trusted resources</Text>
        <Text style={styles.mutedText}>External materials link to their publishers and list access and reuse rights.</Text>
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
  learningPath,
  progress,
  onRate,
  adapters,
  hasListening = false,
  loading = false,
  loadError = false,
  onReload,
}: {
  learningPath: LearningPath;
  progress: SkillProgress[];
  onRate: (skillId: string, rating: ReviewRating) => void | Promise<void>;
  loading?: boolean;
  loadError?: boolean;
  onReload?: () => void;
  hasListening?: boolean;
} & ScreenProps) {
  const skills = learningPath.progression?.skills ?? [];
  const [selectedSkillId, setSelectedSkillId] = useState(skills[0]?.id ?? "");
  const [saves, setSaves] = useState<Partial<Record<string, { rating: ReviewRating; status: "saving" | "saved" | "error"; conflict?: boolean }>>>({});
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const ratedSkillsRef = useRef(new Set<string>());
  const [renderedAt] = useState(() => Date.now());
  const selected = skills.find((skill) => skill.id === selectedSkillId) ?? skills[0];
  const selectedProgress = progress.find((row) => row.pathSlug === learningPath.slug && row.skillId === selected?.id);
  const selectedSave = selected ? saves[selected.id] : undefined;
  const selectedRating = selectedSave?.rating;
  const dueCount = progress.filter((row) => new Date(row.nextReviewAt).getTime() <= renderedAt).length;

  async function saveRating(skillId: string, rating: ReviewRating) {
    if (savingRef.current || loading || loadError) return;
    savingRef.current = true;
    setSaving(true);
    setSaves(current => ({ ...current, [skillId]: { rating, status: "saving" } }));
    try {
      await onRate(skillId, rating);
      if (mounted.current) setSaves(current => ({ ...current, [skillId]: { rating, status: "saved" } }));
    } catch (error) {
      if (mounted.current) setSaves(current => ({ ...current, [skillId]: { rating, status: "error", conflict: error instanceof Error && error.name === "ReviewSaveConflict" } }));
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  function reload() {
    if (savingRef.current) return;
    ratedSkillsRef.current.clear();
    setSaves({});
    onReload?.();
  }

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Japanese review" />
      <Text style={styles.eyebrow}>Always open · {dueCount} due</Text>
      <Text accessibilityRole="header" style={styles.heroTitle}>Ready to review</Text>
      <Text style={styles.heroCopy}>Use this queue to practice skill recall. Other practice modes remain available on their study screens.</Text>
      <View style={styles.actionRow}>
        <Button label="Dictionary" variant="ghost" onPress={() => adapters.navigation.navigate("/languages/japanese")} />
        <Button label="N5 flashcards" variant="ghost" onPress={() => adapters.navigation.navigate("/languages/japanese/review/flashcards")} testID="mobile-japanese-review-flashcards" />
        <Button label="Open-answer writing" variant="ghost" onPress={() => adapters.navigation.navigate("/languages/japanese/review/writing")} testID="mobile-japanese-review-writing" />
        {hasListening ? <Button label="Listening" variant="ghost" onPress={() => adapters.navigation.navigate("/languages/japanese/review/listening")} testID="mobile-japanese-review-listening" /> : null}
      </View>
      {loading ? <Text accessibilityLiveRegion="polite" style={styles.mutedText}>Loading saved progress…</Text> : null}
      {loadError ? <View style={styles.stack}><Text accessibilityRole="alert" style={styles.errorText}>Couldn’t load progress on this device. Your saved data has been kept.</Text>{onReload ? <Button label="Reload progress" tone="warning" disabled={saving} onPress={reload} /> : null}</View> : null}
      <View style={styles.card} testID="mobile-japanese-review-skills">
        <Text style={styles.cardTitle}>All skill cards</Text>
        {skills.map((skill) => {
          const row = progress.find((item) => item.pathSlug === learningPath.slug && item.skillId === skill.id);
          return (
            <Pressable key={skill.id} testID={`mobile-japanese-review-skill-${skill.id}`} disabled={saving} onPress={() => setSelectedSkillId(skill.id)} accessibilityRole="button" accessibilityState={{ selected: selected?.id === skill.id, disabled: saving }} style={[styles.subPanel, selected?.id === skill.id ? styles.optionSelected : null]}>
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
          <Text style={styles.mutedText}>Recall an example, then rate how much help you needed.</Text>
          <View style={styles.actionRow}>
            {(["again", "hard", "good", "easy"] as const).map((rating) => (
              <Button
                key={rating}
                label={rating.charAt(0).toUpperCase() + rating.slice(1)}
                variant="secondary"
                tone={rating === "again" ? "danger" : rating === "hard" ? "warning" : rating === "good" ? "success" : "info"}
                disabled={saving || loading || loadError || Boolean(selectedRating)}
                busy={selectedSave?.status === "saving" && selectedRating === rating}
                selected={selectedRating === rating}
                onPress={() => {
                  if (savingRef.current || loading || loadError || ratedSkillsRef.current.has(selected.id)) return;
                  ratedSkillsRef.current.add(selected.id);
                  void saveRating(selected.id, rating);
                }}
                testID={`mobile-japanese-review-${rating}`}
              />
            ))}
          </View>
          {selectedSave ? (
            <View style={styles.stack}>
              {selectedSave.status === "saving" ? <Text accessibilityLiveRegion="polite" style={styles.mutedText}>Saving on this device…</Text> : selectedSave.status === "error" ? <>
                <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.errorText}>{selectedSave.conflict ? "This skill changed. Reload progress before another recall." : "Couldn’t confirm this save. Your selected rating is kept here."}</Text>
                {selectedSave.conflict ? onReload ? <Button label="Reload progress" tone="warning" disabled={saving} onPress={reload} /> : null : <Button label="Retry save" tone="warning" disabled={saving} onPress={() => void saveRating(selected.id, selectedSave.rating)} testID="mobile-japanese-review-retry" />}
              </> : <View style={styles.reviewSavedPanel}>
                <Text accessibilityLiveRegion="polite" style={styles.reviewSavedText}>{selectedSave.rating.charAt(0).toUpperCase() + selectedSave.rating.slice(1)} saved on this device. This recall counts as one attempt.</Text>
                <Button label="Practice again" tone="warning" variant="ghost" disabled={saving} onPress={() => {
                  ratedSkillsRef.current.delete(selected.id);
                  setSaves(current => ({ ...current, [selected.id]: undefined }));
                }} testID="mobile-japanese-review-reset" />
              </View>}
            </View>
          ) : null}
          {selectedProgress ? <Text style={styles.mutedText}>Best {Math.round(selectedProgress.bestScore * 100)}% · box {selectedProgress.reviewBox}</Text> : null}
        </View>
      ) : null}
    </AppScreen>
  );
}

export function JapaneseFlashcardReviewScreen({ vocabulary, adapters }: { vocabulary: LanguageVocabulary[] } & ScreenProps) {
  const ordered = useMemo(() => [...vocabulary].sort((left, right) => left.studyOrder - right.studyOrder), [vocabulary]);
  const [index, setIndex] = useState(0); const [revealed, setRevealed] = useState(false); const card = ordered[index];
  return <AppScreen><Header adapters={adapters} subtitle="Japanese flashcards" /><Text style={styles.eyebrow}>N5 cumulative review</Text><Text accessibilityRole="header" style={styles.heroTitle}>Build a 650-word foundation.</Text>{card ? <><Pressable accessibilityRole="button" accessibilityLabel={`${revealed ? "Hide" : "Reveal"} reading and meaning for ${card.expression}`} accessibilityState={{ expanded: revealed }} onPress={() => setRevealed((value) => !value)} style={styles.card} testID="mobile-japanese-flashcard"><Text style={styles.positionText}>Card {index + 1} of {ordered.length}</Text><Text accessibilityLanguage="ja-JP" style={styles.japaneseGlyph}>{card.expression}</Text>{revealed ? <><Text accessibilityLanguage="ja-JP" style={styles.cardTitle}>{card.reading}</Text><Text style={styles.bodyText}>{card.meanings.join(", ")}</Text></> : <Text style={styles.mutedText}>Tap to reveal</Text>}</Pressable><View style={styles.actionRow}><Button label="Previous" variant="ghost" disabled={index === 0} onPress={() => { setIndex((value) => value - 1); setRevealed(false); }} /><Button label="Next" disabled={index === ordered.length - 1} onPress={() => { setIndex((value) => value + 1); setRevealed(false); }} /></View></> : <Text style={styles.emptyText}>No vocabulary is available.</Text>}</AppScreen>;
}

export function JapanesePracticeModeScreen({ title, description, exercises, adapters }: { title: string; description: string; exercises: QuestionnaireExercise[] } & ScreenProps) {
  return <AppScreen><Header adapters={adapters} subtitle={title} /><Text accessibilityRole="header" style={styles.heroTitle}>{title}</Text><Text style={styles.heroCopy}>{description}</Text><View style={styles.stack}>{exercises.map((exercise, index) => <Pressable accessibilityRole="button" accessibilityLabel={exercise.title} key={exercise.slug} onPress={() => adapters.navigation.navigate(exercise.route)} style={styles.card} testID={`mobile-japanese-practice-unit-${index + 1}`}><Text style={styles.positionText}>Unit {index + 1}</Text><Text style={styles.cardTitle}>{exercise.title}</Text><Text style={styles.mutedText}>{exercise.questions.length} questions</Text></Pressable>)}</View>{exercises.length === 0 ? <View style={styles.card} testID="mobile-japanese-listening-pending"><Text style={styles.cardTitle}>Audio review is in progress.</Text><Text style={styles.mutedText}>Draft clips stay unavailable until a Japanese speaker approves them.</Text></View> : null}</AppScreen>;
}

function JapaneseResultCard({ result, adapters }: { result: JapaneseSearchResult } & ScreenProps) {
  if (result.kind === "character") {
    return <CharacterCard character={result.item} adapters={adapters} />;
  }

  return <VocabularyCard vocabulary={result.item} adapters={adapters} />;
}

function CharacterStrip({ title, characters, adapters }: { title: string; characters: LanguageCharacter[] } & ScreenProps) {
  const { fontScale } = useWindowDimensions();
  return (
    <View style={styles.stack}>
      <Text accessibilityRole="header" style={styles.cardTitle}>{title}</Text>
      <View style={styles.characterGrid}>
        {characters.map((character) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`${character.glyph} · ${character.romaji}`} key={character.slug} onPress={() => adapters.navigation.navigate(character.route)} style={[styles.characterTile, { width: Math.max(64, Math.ceil(64 * fontScale)), maxWidth: "100%" }]}>
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
    <Pressable accessibilityRole="button" accessibilityLabel={`${character.glyph} · ${character.title}`} onPress={() => adapters.navigation.navigate(character.route)} style={styles.card} testID={`mobile-japanese-character-${character.slug.replaceAll("/", "-")}`}>
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
    <Pressable accessibilityRole="button" accessibilityLabel={`${vocabulary.expression} · ${vocabulary.romaji}`} onPress={() => adapters.navigation.navigate(vocabulary.route)} style={styles.card} testID={`mobile-japanese-vocabulary-${vocabulary.slug.replaceAll("/", "-")}`}>
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
  const writingExercise = useMemo<Extract<LearningExercise, { type: "writing" }>>(() => ({
    id: `character-${character.id}`,
    slug: `characters/${character.glyph.codePointAt(0)!.toString(16)}`,
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
    prompt: "Fill the notebook with 24 repetitions. Write anywhere on the paper.",
    characterSlugs: [character.slug],
    modes: ["assisted", "free"],
    explanation: "Your handwriting is saved only on this device. Recognizable shapes are enough.",
  }), [character]);

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Japanese character" />
      <Button label="Japanese" variant="ghost" onPress={() => adapters.navigation.navigate("/languages/japanese")} />
      <View style={styles.stack}>
        <View style={styles.pillRow}>
          <Pill label={character.writingSystem} tone={character.writingSystem === "kanji" ? "amber" : "green"} />
          <Pill label={`/${character.ipa}/`} tone="blue" />
        </View>
        <Text style={styles.japaneseGlyph} accessibilityLanguage="ja-JP">{character.glyph}</Text>
        <Text accessibilityRole="header" style={styles.heroTitle}>{character.title}</Text>
        <Text style={styles.heroCopy}>{character.summary}</Text>
        <Text style={styles.cardTitle}>{character.meanings.join(", ")}</Text>
        {character.inputSequences.length ? <Text style={styles.mutedText}>IME input: {character.inputSequences.join(" or ")}</Text> : null}
      </View>
      <View style={styles.stack}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Readings</Text>
        {character.readings.map((reading) => (
          <Text key={`${reading.label}-${reading.value}`} style={styles.bodyText}>
            {reading.label}: {reading.value} /{reading.ipa}/
          </Text>
        ))}
      </View>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Stroke model</Text>
        <View style={[styles.writingPad, { height: writingPadSize, width: writingPadSize }]}>
          <Svg width="100%" height="100%" viewBox="0 0 100 100" accessible accessibilityRole="image" accessibilityLabel={`Stroke order for ${character.glyph}`}>
            <Path d="M 50 0 L 50 100 M 0 50 L 100 50" stroke={colors.lineSoft} strokeWidth={0.8} fill="none" />
            {character.strokes.map((stroke, index) => (
              <Fragment key={stroke.id}>
                <Path d={getWritingStrokePath(stroke.points)} stroke={colors.text} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Circle cx={stroke.points[0][0]} cy={stroke.points[0][1]} r={4.5} fill={colors.accent} />
                <SvgText x={stroke.points[0][0]} y={stroke.points[0][1] + 2} textAnchor="middle" fontSize={5} fontWeight="800" fill="#fff">{index + 1}</SvgText>
              </Fragment>
            ))}
          </Svg>
        </View>
      </View>
      <View style={styles.stack} testID="mobile-japanese-character-practice">
        <Text accessibilityRole="header" style={styles.cardTitle}>Practice writing {character.glyph}</Text>
        <WritingPractice exercise={writingExercise} adapters={adapters} onProgress={() => undefined} />
      </View>
      {relatedVocabulary.length || character.examples.length ? (
        <View style={styles.stack} testID="mobile-japanese-character-examples">
          <Text accessibilityRole="header" style={styles.cardTitle}>Words and examples</Text>
          {relatedVocabulary.map((vocabulary) => (
            <Pressable key={vocabulary.slug} accessibilityRole="button" accessibilityLabel={`${vocabulary.expression} · ${vocabulary.romaji}`} onPress={() => adapters.navigation.navigate(vocabulary.route)} style={styles.card}>
              <Text style={styles.japaneseGlyph} accessibilityLanguage="ja-JP">{vocabulary.expression}</Text>
              <Text style={styles.bodyText}>{vocabulary.reading} · {vocabulary.romaji}</Text>
              {vocabulary.inputSequences.length ? <Text style={styles.mutedText}>IME: {vocabulary.inputSequences.join(" or ")}</Text> : null}
              <Text style={styles.mutedText}>{vocabulary.meanings.join(", ")}</Text>
            </Pressable>
          ))}
          {character.examples.map((example) => (
            <View key={example.id} style={styles.stack}>
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
      <View style={styles.stack}>
        <View style={styles.pillRow}>
          <Pill label="Vocabulary" tone="purple" />
          <Pill label={`/${vocabulary.ipa}/`} tone="blue" />
        </View>
        <Text style={styles.japaneseGlyph} accessibilityLanguage="ja-JP">{vocabulary.expression}</Text>
        <Text accessibilityRole="header" style={styles.heroTitle}>{vocabulary.romaji}</Text>
        <Text style={styles.heroCopy}>{vocabulary.reading}</Text>
        <Text style={styles.cardTitle}>{vocabulary.meanings.join(", ")}</Text>
        {vocabulary.inputSequences.length ? <Text style={styles.mutedText}>IME input: {vocabulary.inputSequences.join(" or ")}</Text> : null}
      </View>
      {vocabulary.segments.length ? (
        <View style={styles.stack} testID="mobile-japanese-vocabulary-breakdown">
          <Text accessibilityRole="header" style={styles.cardTitle}>Kanji and hiragana breakdown</Text>
          {vocabulary.segments.map((segment, index) => (
            <View key={`${segment.text}-${index}`} style={styles.stack}>
              <Text style={styles.japaneseGlyph} accessibilityLanguage="ja-JP">{segment.text}</Text>
              <Text style={styles.bodyText}>{segment.reading} · {segment.romaji}</Text>
              <Text style={styles.mutedText}>{segment.meaning}</Text>
              <View style={styles.pillRow}>
                {segment.characterSlugs.flatMap((slug) => {
                  const character = getLanguageCharacterBySlug(slug);
                  return character ? [<Button key={slug} label={character.glyph} accessibilityLabel={`Open ${character.glyph} · ${character.title}`} variant="ghost" onPress={() => adapters.navigation.navigate(character.route)} />] : [];
                })}
              </View>
            </View>
          ))}
        </View>
      ) : null}
      {vocabulary.examples.length ? (
        <View style={styles.stack} testID="mobile-japanese-vocabulary-examples">
          <Text accessibilityRole="header" style={styles.cardTitle}>Example phrases</Text>
          {vocabulary.examples.map((example) => (
            <View key={example.id} style={styles.stack}>
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
      <Text accessibilityRole="header" style={styles.heroTitle}>{document.title}</Text>
      <Text style={styles.heroCopy}>{document.summary}</Text>
      <SourceReferencePanel sources={getSourcesByRefs(document.sourceRefs)} adapters={adapters} />
      <TagRow tags={document.tags} />
      <MarkdownReader markdown={document.markdown} adapters={adapters} />
      {referencedDiagrams.length > 0 ? (
        <View style={styles.stack}>
          <Text accessibilityRole="header" style={styles.cardTitle}>Diagrams</Text>
          {referencedDiagrams.map((diagram) => (
            <Button key={diagram.slug} label={diagram.title} variant="ghost" onPress={() => adapters.navigation.navigate(diagram.route)} />
          ))}
        </View>
      ) : null}
      {nextHref ? (
        <Button
          label="Next activity"
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
      <Text accessibilityRole="header" style={styles.heroTitle}>{diagram.title}</Text>
      <MermaidBlock source={diagram.source} adapters={adapters} />
      {nextHref ? <Button label="Next activity" onPress={() => adapters.navigation.navigate(nextHref)} testID="mobile-diagram-next-node" /> : null}
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
  const [scrollResetKey, setScrollResetKey] = useState(0);
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
    <AppScreen keyboardAware scrollResetKey={scrollResetKey}>
        <Header adapters={adapters} subtitle="Practice" />
        <View style={styles.stack} testID="mobile-practice-card">
          <View style={styles.pillRow}>
            <Pill label={exerciseKindLabel(exercise)} tone="purple" />
            <DifficultyPill difficulty={exercise.difficulty} />
            <Pill label={exercise.concept} tone="green" />
          </View>
          <Text accessibilityRole="header" style={styles.heroTitle}>{exercise.title}</Text>
          <SourceReferencePanel sources={getSourcesByRefs(exercise.sourceRefs)} adapters={adapters} />
          {exercise.type === "flashcard" ? (
            <FlashcardPractice exercise={exercise} nextHref={nextHref} adapters={adapters} onProgress={onProgress} />
          ) : exercise.type === "cloze" ? (
            <ClozePractice exercise={exercise} nextHref={nextHref} adapters={adapters} onProgress={onProgress} />
          ) : exercise.type === "writing" ? (
            <WritingPractice exercise={exercise} nextHref={nextHref} adapters={adapters} onProgress={onProgress} />
          ) : exercise.type === "guided-lab" ? (
            <GuidedLabPractice exercise={exercise} nextHref={nextHref} adapters={adapters} onProgress={onProgress} onRestart={() => setScrollResetKey(value => value + 1)} />
          ) : (
            <QuestionnairePractice exercise={exercise} nextHref={nextHref} adapters={adapters} onProgress={onProgress} />
          )}
        </View>
      </AppScreen>
  );
}

function SourceReferencePanel({ sources, adapters }: { sources: ContentSource[] } & ScreenProps) {
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState<string>();
  const [opening, setOpening] = useState<string>();
  const busy = useRef(false);
  if (sources.length === 0) return null;
  async function openSource(source: ContentSource) {
    if (busy.current || !adapters.navigation.openExternalUrl) return;
    busy.current = true; setOpening(source.id); setMessage(undefined);
    try { await adapters.navigation.openExternalUrl(source.url); }
    catch { setMessage("Couldn't open this source. Please try again."); }
    finally { busy.current = false; setOpening(undefined); }
  }
  return (
    <View style={styles.disclosure} testID="mobile-source-references">
      <Button label="Primary sources" variant="ghost" tone="neutral" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} />
      {expanded ? <View style={styles.stack}>
        {sources.map((source) => <Button key={source.id} label={`${source.title} · ${source.provider}`} variant="ghost" tone="info" disabled={!adapters.navigation.openExternalUrl || Boolean(opening && opening !== source.id)} busy={opening === source.id} onPress={() => void openSource(source)} testID={`mobile-source-${source.id}`} />)}
        {message ? <Text accessibilityLiveRegion="polite" style={styles.mutedText}>{message}</Text> : null}
      </View> : null}
    </View>
  );
}

function GuidedLabPractice({
  exercise,
  nextHref,
  adapters,
  onProgress,
  onRestart,
}: {
  exercise: Extract<LearningExercise, { type: "guided-lab" }>;
  nextHref?: string;
  onRestart: () => void;
  onProgress: (status: ProgressStatus, position?: Record<string, unknown>) => void | Promise<void>;
} & ScreenProps) {
  const [predictionId, setPredictionId] = useState<string>();
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const complete = Boolean(predictionId) && evidenceIds.length === exercise.evidenceChecklist.length;
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [startFailed, setStartFailed] = useState(false);
  const busy = useRef(false);
  const acknowledged = useRef(false);
  const version = useRef(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  async function choosePrediction(id: string) {
    if (busy.current || acknowledged.current) return;
    setPredictionId(id);
    setStartFailed(false);
    const request = ++version.current;
    try { await onProgress("started", { predictionCommitted: true }); }
    catch { if (mounted.current && request === version.current) setStartFailed(true); }
  }

  async function finish() {
    if (!complete || busy.current || acknowledged.current) return;
    busy.current = true;
    const request = ++version.current;
    setSaving(true); setFailed(false); setStartFailed(false);
    try {
      await onProgress("completed", { predictionCommitted: true, evidenceCount: evidenceIds.length, evidenceTotal: exercise.evidenceChecklist.length });
      if (mounted.current && request === version.current) { acknowledged.current = true; setSaved(true); }
    } catch { if (mounted.current && request === version.current) setFailed(true); }
    finally { busy.current = false; if (mounted.current && request === version.current) setSaving(false); }
  }

  function restart() {
    if (busy.current) return;
    version.current++; acknowledged.current = false;
    setSaved(false); setFailed(false); setStartFailed(false);
    setPredictionId(undefined); setEvidenceIds([]); setNotes({});
    onRestart();
  }


  return (
    <View style={styles.stack} testID="mobile-guided-lab-session">
      <Text style={styles.cardEyebrow}>Briefing · about {exercise.estimatedMinutes} minutes</Text>
      <Text style={styles.bodyText}>{exercise.briefing}</Text>
      {exercise.objectives.map((objective) => <Text key={objective} style={styles.mutedText}>• {objective}</Text>)}
      <View style={styles.subPanel}>
        <Text style={styles.cardTitle}>Choose your prediction</Text>
        <Text style={styles.bodyText}>{exercise.prediction.prompt}</Text>
        {exercise.prediction.options.map((option) => (
          <Pressable key={option.id} testID={`mobile-guided-lab-prediction-${option.id}`} disabled={saving || saved} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: predictionId === option.id, disabled: saving || saved }} onPress={() => void choosePrediction(option.id)} style={[styles.choice, predictionId === option.id && styles.choiceSelected]}>
            <Text style={styles.choiceText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      {exercise.steps.map((step, index) => <View key={step.id} style={styles.subPanel}><Text style={styles.cardEyebrow}>Step {index + 1}</Text><Text style={styles.cardTitle}>{step.title}</Text><Text style={styles.mutedText}>{step.instructions}</Text></View>)}
      <View style={styles.subPanel}>
        <Text style={styles.cardTitle}>Evidence checklist</Text>
        {exercise.evidenceChecklist.map((item) => {
          const checked = evidenceIds.includes(item.id);
          return <Pressable key={item.id} testID={`mobile-guided-lab-evidence-${item.id}`} disabled={saving || saved} accessibilityRole="checkbox" accessibilityLabel={item.label} accessibilityState={{ checked, disabled: saving || saved }} onPress={() => setEvidenceIds((current) => checked ? current.filter((id) => id !== item.id) : [...current, item.id])} style={[styles.choice, checked && styles.choiceSelected]}><Text style={styles.choiceText}>{checked ? "✓ " : "○ "}{item.label}</Text></Pressable>;
        })}
      </View>
      <View style={styles.subPanel}>
        <Text style={styles.cardTitle}>Reflect and extend</Text>
        {exercise.reflectionPrompts.map((prompt) => <View key={prompt}><Text style={styles.bodyText}>{prompt}</Text><TextInput accessibilityLabel={prompt} value={notes[prompt] ?? ""} onChangeText={value => setNotes(current => ({ ...current, [prompt]: value }))} testID={`mobile-guided-lab-note-${exercise.reflectionPrompts.indexOf(prompt)}`} multiline placeholder="Private working note (not saved)" style={[styles.input, { minHeight: 100, textAlignVertical: "top" }]} /></View>)}
        <Text style={styles.mutedText}>Extension: {exercise.extensionChallenge}</Text>
      </View>
      {saving ? <Text accessibilityLiveRegion="polite" style={styles.mutedText}>Completing lab…</Text> : null}
      {failed ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.errorText}>Couldn’t save progress. Your choices and working notes are still here.</Text> : startFailed ? <Text accessibilityRole="alert" style={styles.errorText}>Couldn’t save progress. Keep working and retry when completing the lab.</Text> : null}
      {saved ? <View style={styles.stack}><Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.reviewSavedText}>Lab complete.</Text><Button label="Practice again" variant="ghost" tone="warning" onPress={restart} testID="mobile-guided-lab-restart" /></View> : <Button label={failed ? "Retry completion" : "Complete lab"} tone={failed ? "warning" : "success"} disabled={!complete} busy={saving} onPress={() => void finish()} testID="mobile-guided-lab-complete" />}
      {complete && nextHref ? <Button label={nextHref.endsWith("/flashcards") ? "Start review feed" : "Next activity"} variant="secondary" onPress={() => adapters.navigation.navigate(nextHref)} /> : null}
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
      {revealed ? <Button label="Reset" variant="secondary" tone="warning" onPress={() => setRevealed(false)} /> : null}
      {revealed && nextHref ? <Button label={nextHref.endsWith("/flashcards") ? "Start review feed" : "Next activity"} variant="secondary" onPress={() => adapters.navigation.navigate(nextHref)} /> : null}
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
      <TextInput accessibilityLabel="Answer" value={answer} onChangeText={(value) => { setAnswer(value); setResult(undefined); }} placeholder="Answer" style={styles.input} testID="mobile-cloze-answer-input" />
      <Button label="Check answer" onPress={checkAnswer} testID="mobile-cloze-check" />
      {result ? (
        <View accessibilityLiveRegion="polite" style={[styles.feedback, result === "correct" ? styles.feedbackCorrect : styles.feedbackReview]} testID="mobile-cloze-feedback">
          <Text style={styles.feedbackTitle}>{result === "correct" ? "Correct" : "Try again"}</Text>
          <Text style={styles.mutedText}>{exercise.explanation}</Text>
        </View>
      ) : null}
      {result && nextHref ? <Button label={nextHref.endsWith("/flashcards") ? "Start review feed" : "Next activity"} variant="secondary" onPress={() => adapters.navigation.navigate(nextHref)} /> : null}
    </View>
  );
}

function WritingPractice({ exercise, nextHref, adapters, onProgress }: {
  exercise: Extract<LearningExercise, { type: "writing" }>; nextHref?: string;
  onProgress: (status: ProgressStatus, position?: Record<string, unknown>) => void | Promise<void>;
} & ScreenProps) {
  const notebook=useMemo(()=>createExerciseNotebook(exercise,getContentIndex()),[exercise]);
  const sheets=useMemo(()=>buildWritingPracticeSheets(exercise.characterSlugs.flatMap(slug=>{const c=getLanguageCharacterBySlug(slug);return c ? [c] : [];}),getContentIndex()),[exercise]);
  const [activity,setActivity]=useState("write");
  return <View style={styles.stack} testID="mobile-writing-practice"><Text style={styles.bodyText}>{exercise.prompt}</Text><View style={styles.actionRow}><Button label="Write · planas" selected={activity==="write"} onPress={()=>setActivity("write")} testID="mobile-writing-activity-write"/><Button label="Match pairs" selected={activity==="match"} onPress={()=>setActivity("match")} testID="mobile-writing-activity-match"/></View>{activity==="match" ? <NativeWritingMatch sheets={sheets}/> : <JapaneseNotebookPractice notebook={notebook} adapters={adapters} nextHref={nextHref} onProgress={onProgress}/>}</View>;
}

function NativeWritingMatch({ sheets }: { sheets: ReturnType<typeof buildWritingPracticeSheets> }) {
  const pairs = useMemo(() => getWritingMatchPairs(sheets), [sheets]);
  const [selected, setSelected] = useState<{ kana?: string; romaji?: string }>({});
  const [matched, setMatched] = useState<string[]>([]);
  const [message, setMessage] = useState("Choose a Japanese tile and its reading.");
  const [round, setRound] = useState(0);
  const readings = [...pairs.slice((round + 1) % pairs.length), ...pairs.slice(0, (round + 1) % pairs.length)];
  function choose(side: "kana" | "romaji", id: string) {
    const next = { ...selected, [side]: id };
    if (next.kana && next.romaji) {
      if (next.kana === next.romaji) { setMatched((value) => [...value, id]); setSelected({}); setMessage(matched.length + 1 === pairs.length ? "Nicely done! Every pair matched." : "Nice match. Keep going!"); }
      else { setSelected({ [side === "kana" ? "romaji" : "kana"]: selected[side === "kana" ? "romaji" : "kana"] }); setMessage("Try another pair. You have time."); }
    } else { setSelected(next); setMessage("Now choose its matching tile."); }
  }
  return <View style={styles.stack} testID="mobile-writing-match"><Text style={styles.cardTitle} accessibilityRole="header">Tap the matching pairs</Text><Text style={styles.mutedText}>{matched.length} / {pairs.length} matched</Text>
    <View style={styles.writingFeedbackSlot} accessibilityLiveRegion="polite"><Text style={styles.cardTitle}>{message}</Text></View>
    <View style={styles.writingMatchGrid}>{(["kana", "romaji"] as const).map((side) => <View key={side} style={styles.writingMatchColumn}>{(side === "kana" ? pairs : readings).map((pair) => <Pressable key={pair.id} accessibilityRole="button" accessibilityState={{ selected: selected[side] === pair.id, disabled: matched.includes(pair.id) }} disabled={matched.includes(pair.id)} onPress={() => choose(side, pair.id)} style={[styles.writingMatchTile, selected[side] === pair.id && styles.writingTileSelected, matched.includes(pair.id) && styles.writingTileMatched]} testID={`mobile-writing-match-${side}-${pair.id}`}><Text style={styles.cardTitle} accessibilityLanguage={side === "kana" ? "ja-JP" : "en-US"}>{side === "kana" ? pair.label : pair.romaji}{matched.includes(pair.id) ? " ✓" : ""}</Text></Pressable>)}</View>)}</View>
<Button label="Practice again" tone="warning" variant="secondary" disabled={matched.length !== pairs.length} onPress={() => { setRound((value) => value + 1); setMatched([]); setSelected({}); setMessage("A fresh round. Match the same pairs again."); }} testID="mobile-writing-match-repeat" />
  </View>;
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
          <Text style={styles.feedbackTitle}>Practice complete</Text>
          <Text style={styles.mutedText}>You finished this practice session.</Text>
          <Text style={styles.mutedText}>Score {Math.round(calculateQuestionnaireSkillScores(attempt.map((attemptQuestion) => ({ question: attemptQuestion, isCorrect: graded[attemptQuestion.id] ?? false }))).overall * 100)}%</Text>
        </View>
        <Button label="Restart" tone="warning" variant="ghost" onPress={restart} />
        {nextHref ? <Button label={nextHref.endsWith("/flashcards") ? "Start review feed" : "Next activity"} variant="secondary" onPress={() => adapters.navigation.navigate(nextHref)} /> : null}
      </View>
    );
  }

  return (
    <View style={styles.stack} testID="mobile-questionnaire-session">
      <View style={styles.positionRow}>
        <Text style={styles.positionText}>
          Question {currentIndex + 1} of {attempt.length}
        </Text>
        <Text style={styles.positionText}>{{ choice: "Multiple choice", "listening-choice": "Listening", "open-answer": "Write an answer", cloze: "Fill in the blank", ordering: "Order steps", matching: "Match pairs" }[question.kind]}</Text>
      </View>
      <Text accessibilityRole="header" style={styles.cardTitle}>{question.prompt}</Text>
      <QuestionBody question={question} answer={answer} disabled={Boolean(result)} onAnswer={resetAnswer} adapters={adapters} />
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
  adapters,
}: {
  question: QuestionnaireAttemptQuestion;
  answer?: QuestionnaireAnswer;
  disabled: boolean;
  onAnswer: (answer?: QuestionnaireAnswer) => void;
  adapters: CodematicaAdapters;
}) {
  const openAnswerValue = answer?.kind === "open-answer" ? answer.value : "";
  const conversion = useMemo(() => convertJapaneseInput(openAnswerValue), [openAnswerValue]);

  if (question.kind === "choice" || question.kind === "listening-choice") {
    const selected = answer?.kind === question.kind ? answer.selectedOptionId : "";

    return (
      <View style={styles.stack}>
        {question.kind === "listening-choice" ? <ListeningControls key={question.audioId} audioId={question.audioId} audio={adapters.audio} /> : null}
        {question.options.map((option) => (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected === option.id, disabled }}
            disabled={disabled}
            onPress={() => onAnswer(question.kind === "choice" ? { kind: "choice", selectedOptionId: option.id } : { kind: "listening-choice", selectedOptionId: option.id })}
            style={[styles.choice, selected === option.id && styles.choiceSelected]}
            testID={`mobile-questionnaire-choice-${option.id}`}
          >
            <Text style={styles.choiceText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  if (question.kind === "open-answer") {
    const [prefix, suffix] = question.template.split("{{blank}}");
    return (
      <View style={styles.stack} testID="mobile-japanese-answer-input">
        <Text accessibilityLanguage="ja-JP" style={styles.bodyText}>{prefix}{openAnswerValue || " ____ "}{suffix}</Text>
        <TextInput
          value={openAnswerValue}
          editable={!disabled}
          onChangeText={(value) => onAnswer({ kind: "open-answer", value })}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLanguage="ja-JP"
          accessibilityLabel="Write in romaji or Japanese"
          accessibilityHint="Type romaji or Japanese. On iPad, write here with Apple Pencil Scribble."
          placeholder="Romaji or Japanese"
          style={styles.input}
          testID="mobile-questionnaire-open-answer-input"
        />
        <Text style={styles.mutedText}>Choose a conversion below. On iPad, write in the blank with Apple Pencil Scribble.</Text>
        {/[a-z]/i.test(openAnswerValue) ? (
          <View style={styles.actionRow} testID="mobile-japanese-ime-candidates">
            {conversion.candidates.map((candidate, index) => (
              <Button key={candidate} label={candidate} variant="ghost" disabled={disabled} onPress={() => onAnswer({ kind: "open-answer", value: candidate })} testID={`mobile-japanese-ime-candidate-${index}`} />
            ))}
          </View>
        ) : null}
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
          accessibilityLabel="Answer"
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
              <Button label="Up" accessibilityLabel={`Move ${itemsById.get(itemId)?.label ?? itemId} up`} tone="neutral" disabled={disabled || index === 0} variant="ghost" onPress={() => move(index, -1)} />
              <Button label="Down" accessibilityLabel={`Move ${itemsById.get(itemId)?.label ?? itemId} down`} tone="neutral" disabled={disabled || index === itemIds.length - 1} variant="ghost" onPress={() => move(index, 1)} />
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
                accessibilityRole="radio"
                accessibilityLabel={`${leftItem.label}: ${rightItem.label}`}
                accessibilityState={{ checked: selectedMatches[leftItem.id] === rightItem.id, disabled }}
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

function ListeningControls({ audioId, audio }: { audioId: string; audio: CodematicaAdapters["audio"] }) {
  const [message, setMessage] = useState("");
  const [speed, setSpeed] = useState(1);
  const version = useRef(0);
  useEffect(() => { const counter = version; return () => { counter.current++; }; }, []);
  async function play(rate: number) {
    const request = ++version.current;
    setMessage(""); setSpeed(rate);
    try {
      const played = await audio?.play(audioId, rate);
      if (request === version.current && !played) setMessage("Audio is unavailable. Try again later.");
    } catch { if (request === version.current) setMessage("Couldn't play this audio. Check your sound and connection, then retry."); }
  }
  return <View style={styles.subPanel} testID="mobile-japanese-audio-player">
    <Text style={styles.positionText}>AI-generated voice</Text>
    {audio ? <View style={styles.actionRow}>
      <Button label="Play / replay" tone="info" onPress={() => void play(1)} testID="mobile-japanese-audio-play" />
      <Button label="0.75× slow" tone="info" variant="secondary" selected={speed === 0.75} onPress={() => void play(0.75)} testID="mobile-japanese-audio-slow" />
    </View> : <Text style={styles.mutedText}>Listening audio is awaiting Japanese-language approval.</Text>}
    {message ? <><Text accessibilityLiveRegion="polite" style={styles.errorText}>{message}</Text><Button label="Retry audio" tone="warning" onPress={() => void play(speed)} /></> : null}
  </View>;
}

function QuestionFeedback({ question, result }: { question: QuestionnaireAttemptQuestion; result: QuestionnaireAnswerResult }) {
  return (
    <View accessible accessibilityLiveRegion="polite" style={[styles.feedback, result.isCorrect ? styles.feedbackCorrect : styles.feedbackReview]} testID="mobile-questionnaire-feedback">
      <Text style={styles.feedbackTitle}>{result.isCorrect ? "Correct" : "Review this"}</Text>
      {!result.isCorrect || (question.kind !== "choice" && question.kind !== "listening-choice") ? <Text style={styles.bodyText}>Correct answer: {result.correctAnswer}</Text> : null}
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
          <Text style={styles.brandSubtitle}>Quick review</Text>
        </View>
      </View>
      <FlatList
        testID="mobile-passive-flashcard-list"
        data={visibleCards}
        keyExtractor={(item) => item.instanceId}
        onScroll={recordPosition}
        scrollEventThrottle={250}
        renderItem={({ item }) => <PassiveFlashcard card={item.card} sequenceIndex={item.sequenceIndex} adapters={adapters} pathSlug={feed.pathSlug} />}
      />
    </View>
  );
}

function PassiveFlashcard({ card, sequenceIndex, adapters, pathSlug }: { card: PassiveFlashcardCard; sequenceIndex: number; pathSlug: string } & ScreenProps) {
  return (
    <View style={styles.flashcardPage} testID={`mobile-passive-flashcard-card-${sequenceIndex}`}>
      <View style={styles.card}>
        <View style={styles.pillRow}>
          <Pill label={cardTypeLabels[card.type]} tone={card.type === "snippet" ? "blue" : card.type === "interview" ? "amber" : "purple"} />
          <DifficultyPill difficulty={card.difficulty} />
        </View>
        <Text accessibilityRole="header" style={styles.heroTitle}>{card.title}</Text>
        <Text style={styles.bodyText}>{card.prompt}</Text>
        <Text style={styles.mutedText}>{card.explanation}</Text>
        {card.code ? <CodeBlock code={card.code} language={card.codeLanguage} /> : null}
        {card.sourceDocSlug ? <Button label="Review the lesson" variant="ghost" onPress={() => adapters.navigation.navigate(`/docs/${card.sourceDocSlug}?path=${encodeURIComponent(pathSlug)}`)} testID={`mobile-passive-flashcard-source-${sequenceIndex}`} /> : null}
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
      <Text accessibilityRole="header" style={styles.heroTitle}>Interview prep</Text>
      <Text style={styles.cardTitle}>Real-world interviews</Text>
      <View style={styles.stack} testID="mobile-real-world-interview-list">
        {realWorld.map((collection) => (
          <Pressable key={collection.slug} accessibilityRole="button" accessibilityLabel={collection.name} onPress={() => adapters.navigation.navigate(collection.route)} style={styles.card} testID={`mobile-collection-${collection.slug}`}>
            <Text style={styles.cardTitle}>{collection.name}</Text>
            <Text style={styles.mutedText}>{collection.summary}</Text>
            <Pill label={`${collection.questions.length} exercises`} tone="amber" />
          </Pressable>
        ))}
      </View>
      <Text style={styles.cardTitle}>Company interview prep</Text>
      <View style={styles.stack} testID="mobile-interview-company-list">
        {companies.map((collection) => (
          <Pressable key={collection.slug} accessibilityRole="button" accessibilityLabel={collection.name} onPress={() => adapters.navigation.navigate(collection.route)} style={styles.card} testID={`mobile-company-${collection.slug}`}>
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
      <Text accessibilityRole="header" style={styles.heroTitle}>{collection.name}</Text>
      <Text style={styles.heroCopy}>{collection.summary}</Text>
      <View style={styles.stack}>
        {collection.questions.map((question) => (
          <Pressable key={question.slug} accessibilityRole="button" accessibilityLabel={question.title} onPress={() => adapters.navigation.navigate(question.route)} style={styles.card} testID={`mobile-question-${question.slug}`}>
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

export function InterviewQuestionScreen({ question, adapters, nextHref }: { question: InterviewQuestion; nextHref?: string } & ScreenProps) {
  if (question.kind === "web") {
    return <WebInterviewQuestionScreen question={question} adapters={adapters} nextHref={nextHref} />;
  }

  return <AlgorithmInterviewQuestionScreen question={question} adapters={adapters} nextHref={nextHref} />;
}

function AlgorithmInterviewQuestionScreen({ question, adapters, nextHref }: { question: Extract<InterviewQuestion, { kind: "algorithm" }>; nextHref?: string } & ScreenProps) {
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
      <Text accessibilityRole="header" style={styles.heroTitle}>{question.title}</Text>
      <Text style={styles.heroCopy}>{question.summary}</Text>
      <Text accessibilityRole="header" style={styles.cardTitle}>{question.prompt}</Text>
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
      {nextHref ? <Button label="Next activity" testID="mobile-interview-next-node" onPress={() => adapters.navigation.navigate(nextHref)} /> : null}
    </AppScreen>
  );
}

function SolutionTrack({ track, language }: { track: InterviewAlgorithmSolutionTrack; language: "python" | "typescript" | "java" }) {
  return (
    <View style={styles.stack}>
      <Text style={styles.cardTitle}>{track.title}</Text>
      <Text style={styles.mutedText}>{track.summary}</Text>
      {track.steps.map((step) => (
        <View key={step.title} style={styles.disclosure}>
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

function WebInterviewQuestionScreen({ question, adapters, nextHref }: { question: Extract<InterviewQuestion, { kind: "web" }>; nextHref?: string } & ScreenProps) {
  const [selectedTrackId, setSelectedTrackId] = useState(question.solutionTracks[0].id);
  const selectedTrack = question.solutionTracks.find((track) => track.id === selectedTrackId) ?? question.solutionTracks[0];
  const [stepIndex, setStepIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [language, setLanguage] = useState("typescript");
  const [selectedFile, setSelectedFile] = useState(selectedTrack.project.activeFile);
  const activeFile = selectedTrack.project.files[selectedFile] ? selectedFile : selectedTrack.project.activeFile;

  function selectTrack(trackId: string) {
    const nextTrack = question.solutionTracks.find((track) => track.id === trackId) ?? question.solutionTracks[0];
    setSelectedTrackId(nextTrack.id);
    setSelectedFile(nextTrack.project.activeFile);
    setStepIndex(0);
    setRevealed(false);
  }

  return (
    <AppScreen>
      <Header adapters={adapters} subtitle="Real-world interview" />
      <View style={styles.pillRow}>
        <DifficultyPill difficulty={question.difficulty} />
        <Pill label="Real-world" tone="amber" />
      </View>
      <Text accessibilityRole="header" style={styles.heroTitle}>{question.title}</Text>
      <Text style={styles.heroCopy}>{question.summary}</Text>
      <Text accessibilityRole="header" style={styles.cardTitle}>{question.prompt}</Text>

      <Disclosure label="What to demonstrate"><View style={styles.stack} testID="mobile-web-interview-evaluation">
        <Text style={styles.bodyText}>{question.evaluation.intent}</Text>
        {question.evaluation.expectedSignals.map((signal) => <Text key={signal} style={styles.mutedText}>• {signal}</Text>)}
      </View></Disclosure>

      <Disclosure label="Acceptance criteria"><View style={styles.stack} testID="mobile-web-interview-criteria">
        {question.evaluation.acceptanceCriteria.map((item) => (
          <View key={item.title} style={styles.disclosure}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.mutedText}>{item.explanation}</Text></View>
        ))}
      </View></Disclosure>

      <Disclosure label="Red flags"><View style={styles.stack} testID="mobile-web-interview-red-flags">
        {question.evaluation.redFlags.map((item) => (
          <View key={item.title} style={styles.disclosure}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.mutedText}>{item.explanation}</Text></View>
        ))}
      </View></Disclosure>

      <HorizontalOptions
        label="Approach"
        options={question.solutionTracks.map((track) => ({ value: track.id, label: track.title }))}
        value={selectedTrack.id}
        onChange={selectTrack}
      />
      <View style={styles.stack} testID="mobile-web-solution">
        <Text style={styles.cardTitle}>{selectedTrack.title}</Text>
        <Text style={styles.mutedText}>{selectedTrack.summary}</Text>
        <Text style={styles.positionText} testID="mobile-web-recipe-position">{revealed ? "Full solution" : `Step ${stepIndex + 1} of ${selectedTrack.steps.length}`}</Text>
        {!revealed ? <View style={styles.actionRow}>
          <Button label="Previous step" tone="neutral" variant="secondary" disabled={stepIndex === 0} onPress={() => setStepIndex((value) => value - 1)} testID="mobile-web-previous-step" />
          <Button label={stepIndex === selectedTrack.steps.length - 1 ? "Reveal solution" : "Next step"} onPress={() => { if (stepIndex === selectedTrack.steps.length - 1) setRevealed(true); else setStepIndex((value) => value + 1); }} testID="mobile-web-next-step" />
          <Button label="Show full solution" tone="assist" variant="secondary" onPress={() => setRevealed(true)} testID="mobile-web-show-solution" />
        </View> : <Button label="Restart recipe" tone="warning" variant="ghost" onPress={() => { setStepIndex(0); setRevealed(false); }} />}
        {revealed && selectedTrack.python ? <HorizontalOptions label="Solution language" value={language} onChange={setLanguage} options={[{ value: "typescript", label: "TypeScript" }, { value: "python", label: "Python" }]} /> : null}
        {(revealed ? selectedTrack.steps : [selectedTrack.steps[stepIndex]]).map((step) => <View key={step.title} style={styles.disclosure}><Text style={styles.cardTitle}>{step.title}</Text><Text style={styles.mutedText}>{step.explanation}</Text></View>)}
        {revealed ? <>
        <Text style={styles.bodyText}>{selectedTrack.explanation}</Text>
        <Text style={styles.cardTitle}>How it meets the requirements</Text>
        <Text style={styles.mutedText}>{selectedTrack.acceptanceRationale}</Text>
        {selectedTrack.tradeoffs.map((tradeoff) => <Text key={tradeoff} style={styles.mutedText}>• {tradeoff}</Text>)}
        <Text style={styles.bodyText}>Time: {language === "python" && selectedTrack.python ? selectedTrack.python.complexity.time : selectedTrack.complexity.time}</Text>
        <Text style={styles.bodyText}>Space: {language === "python" && selectedTrack.python ? selectedTrack.python.complexity.space : selectedTrack.complexity.space}</Text>
        </> : null}
      </View>
      {revealed ? <>
      {language === "python" && selectedTrack.python ? <>
        <Text style={styles.bodyText}>{selectedTrack.python.explanation}</Text>
        <Text style={styles.mutedText}>Save as solution.py and use python3 -i solution.py locally to call its functions.</Text>
        <CodeBlock code={selectedTrack.python.code} language="python" />
      </> : <>

      <HorizontalOptions
        label="Source file"
        options={selectedTrack.project.visibleFiles.map((path) => ({ value: path, label: path.replace(/^\//, "") }))}
        value={activeFile}
        onChange={setSelectedFile}
      />
      <View style={styles.feedback} testID="mobile-web-playground-note">
        <Text style={styles.feedbackTitle}>Interactive runner available on web</Text>
        <Text style={styles.mutedText}>All explanations and source files are available offline. Use the web playground to edit and run code.</Text>
      </View>
      <CodeBlock code={selectedTrack.project.files[activeFile].code} language={activeFile.split(".").pop()} />
      </>}
      {nextHref ? <Button label="Continue to checkpoint" testID="mobile-interview-next-node" onPress={() => {
        void adapters.progress?.record({ surface: "interview", slug: `${question.collectionSlug}/${question.slug}`, title: question.title, summary: question.summary, href: question.route + (getPathFromHref(nextHref) ? `?path=${getPathFromHref(nextHref)}` : ""), pathSlug: getPathFromHref(nextHref), eyebrow: "Interview practice" }, "completed", { trackId: selectedTrack.id, recipeReviewed: true });
        adapters.navigation.navigate(nextHref);
      }} /> : null}
      </> : null}
      <SourceReferencePanel sources={getSourcesByRefs(question.sourceRefs)} adapters={adapters} />
      {question.sourceNote ? <Text style={styles.mutedText}>{question.sourceNote}</Text> : null}
    </AppScreen>
  );
}

export function LoginScreen({ adapters }: ScreenProps) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [syncPending, setSyncPending] = useState(false);
  const requestPending = useRef(false);
  const auth = adapters.auth;
  const configured = !!auth?.isConfigured;
  const passwordAction = mode === "sign-in" ? auth?.signInWithPassword : auth?.signUpWithPassword;

  async function run(action?: () => Promise<void | { progressSynced: boolean }>, success = "Done", authenticated = false) {
    if (requestPending.current) return;
    if (!configured || !action) {
      setFailed(true);
      setMessage("Sign-in is not set up here. You can keep learning on this device.");
      return;
    }
    requestPending.current = true;
    setBusy(true);
    setFailed(false);
    setMessage("");
    try {
      const result = await action();
      if (authenticated) setSignedIn(true);
      const pending = authenticated && result?.progressSynced === false;
      setSyncPending(pending);
      setMessage(pending ? "You're signed in. Your progress is still on this device. Retry sync or continue learning." : success);
    }
    catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : "Could not complete the account request. Please try again."); }
    finally { requestPending.current = false; setBusy(false); }
  }

  function submit() {
    if (signedIn || requestPending.current) return;
    if (!email.trim() || !password) { setFailed(true); setMessage("Enter your email and password."); return; }
    void run(passwordAction ? () => passwordAction(email.trim(), password) : undefined, mode === "sign-in" ? "Signed in" : "Check your email to confirm your account.", mode === "sign-in");
  }

  return <AppScreen keyboardAware>
    <Header adapters={adapters} subtitle="Account" />
    <View style={styles.loginForm}>
      <Text accessibilityRole="header" style={styles.heroTitle}>{mode === "sign-in" ? "Welcome back" : "Create your account"}</Text>
      <Text style={styles.heroCopy}>Keep your learning progress across devices.</Text>
      {!configured ? <Text style={styles.mutedText}>Sign-in is not set up here. You can keep learning on this device.</Text> : null}
      {auth?.signInWithOAuth ? <View style={styles.stack}>
        <Button label="Continue with Google" variant="secondary" tone="neutral" disabled={!configured || busy || signedIn} onPress={() => void run(() => auth.signInWithOAuth!("google"), "Opening Google")} />
        {auth.isAppleEnabled ? <Button label="Continue with Apple" variant="secondary" tone="neutral" disabled={!configured || busy || signedIn} onPress={() => void run(() => auth.signInWithOAuth!("apple"), "Opening Apple")} /> : null}
      </View> : null}
      <View style={styles.loginField}><Text style={styles.fieldLabel}>Email</Text><TextInput testID="mobile-login-email" accessibilityLabel="Email" value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" keyboardType="email-address" editable={configured && !busy && !signedIn} style={styles.input} /></View>
      <View style={styles.loginField}><Text style={styles.fieldLabel}>Password</Text><TextInput testID="mobile-login-password" accessibilityLabel="Password" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} textContentType={mode === "sign-in" ? "password" : "newPassword"} editable={configured && !busy && !signedIn} onSubmitEditing={submit} returnKeyType="go" style={styles.input} /></View>
      {mode === "sign-up" ? <Text style={styles.mutedText}>Use at least 6 characters.</Text> : null}
      <Button label={mode === "sign-in" ? "Sign in" : "Create account"} busy={busy} disabled={!configured || !passwordAction || signedIn} onPress={submit} testID="mobile-sign-in" />
      <Button label={mode === "sign-in" ? "Create an account" : "Use an existing account"} tone="info" variant="ghost" disabled={busy || signedIn} onPress={() => { setMode(value => value === "sign-in" ? "sign-up" : "sign-in"); setMessage(""); setFailed(false); }} />
      {signedIn ? <View style={styles.actionRow}>
        {syncPending ? <Button label="Retry sync" tone="warning" busy={busy} disabled={!auth?.syncAnonymousProgress} onPress={() => void run(auth?.syncAnonymousProgress, "Your progress is synced.", true)} /> : null}
        <Button label="Continue learning" variant="secondary" tone="success" disabled={busy} onPress={() => (adapters.navigation.replace ?? adapters.navigation.navigate)("/")} />
      </View> : null}
      {message ? <Text accessibilityRole={failed ? "alert" : "text"} accessibilityLiveRegion={failed ? "assertive" : "polite"} style={failed ? styles.errorText : styles.mutedText}>{message}</Text> : null}
    </View>
  </AppScreen>;
}

export function KeepReadingSection({
  items,
  isSignedIn,
  adapters,
  showSummary = true,
}: {
  items: ProgressDisplayItem[];
  isSignedIn: boolean;
  showSummary?: boolean;
} & ScreenProps) {
  return (
    <View style={styles.discoverySection} testID="mobile-keep-reading">
      <View style={styles.discoverySectionHeader}>
        <Text accessibilityRole="header" style={styles.cardTitle}>Keep reading</Text>
        <Text style={styles.mutedText}>{isSignedIn ? "Signed in" : "On this device"}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={styles.mutedText}>Your recent learning will appear here.</Text>
      ) : (
        items.map((item) => (
          <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Resume ${item.title}, ${item.eyebrow}`} onPress={() => adapters.navigation.navigate(item.href)} style={styles.subPanel}>
            <Text style={styles.cardEyebrow}>{item.eyebrow}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {showSummary ? <Text style={styles.mutedText}>{item.summary}</Text> : null}
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
      <Text style={styles.bodyText}>{adapters.auth?.isConfigured ? "Your progress is on this device. Sign in to sync it." : "Progress saved on this device."}</Text>
      {adapters.auth?.isConfigured ? <Button label="Sign in" tone="info" onPress={() => adapters.navigation.navigate("/login")} /> : null}
    </View>
  );
}

export function MarkdownReader({ markdown, adapters }: { markdown: string } & ScreenProps) {
  // Reparse third-party text on dimension changes; sibling diagram state stays mounted.
  useWindowDimensions();
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
            rules={markdownRules}
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
  const [expanded, setExpanded] = useState(false);
  const [failedSource, setFailedSource] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const failed = failedSource === source;
  const html = adapters.mermaidScript
    ? `<!doctype html><html lang="en"><head><title>Diagram preview</title><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{margin:0;padding:16px;background:#fff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}.mermaid{min-width:560px}h1{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}</style></head><body><main aria-label="Diagram preview"><h1>Diagram preview</h1><pre class="mermaid">${escapeHtml(source)}</pre></main><script>${adapters.mermaidScript}</script><script>mermaid.initialize({startOnLoad:true,securityLevel:"strict",theme:"base"});</script></body></html>`
    : "";

  return (
    <View style={styles.mermaidBlock} testID="mobile-mermaid-block">
      {title ? <Text accessibilityRole="header" style={styles.cardTitle}>{title}</Text> : null}
      {html && !failed ? (
        <WebView key={`${source}-${attempt}`} accessibilityLabel={title ? `${title} diagram preview` : "Diagram preview"} originWhitelist={["*"]} source={{ html }} style={styles.webView} testID="mobile-mermaid-webview" onError={() => setFailedSource(source)} />
      ) : (
        <View style={styles.stack}>
          <Text accessibilityLiveRegion="polite" style={styles.mutedText}>{failed ? "Couldn't open the diagram preview. Source is available below." : "Preview unavailable. Diagram source is available below."}</Text>
          {failed ? <Button label="Retry preview" tone="warning" variant="secondary" onPress={() => { setFailedSource(undefined); setAttempt(value => value + 1); }} /> : null}
        </View>
      )}
      {html && !failed ? <Button label="Diagram source" variant="ghost" tone="neutral" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} /> : null}
      {expanded || !html || failed ? <CodeBlock code={source} language="mermaid" /> : null}
    </View>
  );
}

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <View style={styles.codeBlock} testID="mobile-code-block">
      {language ? <Text style={styles.codeLanguage}>{language}</Text> : null}
      <ScrollView
        horizontal
        directionalLockEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator
        indicatorStyle="white"
        style={styles.codeScroll}
        contentContainerStyle={styles.codeContent}
        testID="mobile-code-scroll"
      >
        <Text style={styles.codeText} testID="mobile-code-source">{code}</Text>
      </ScrollView>
    </View>
  );
}

// The parser exposes sourceInfo at runtime but omits it from its AST type.
// Remove only its final newline; indentation and authored blank lines are source.
function renderMarkdownCode(node: ASTNode & { sourceInfo?: string }) {
  return <CodeBlock key={node.key} code={node.content.replace(/\n$/, "")} language={node.sourceInfo?.trim().split(/\s+/)[0]} />;
}

const markdownRules: RenderRules = {
  fence: renderMarkdownCode,
  code_block: renderMarkdownCode,
};

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
          <Button key={option.value} label={option.label} variant="secondary" tone="info" selected={value === option.value} onPress={() => onChange(option.value)} />
        ))}
      </ScrollView>
    </View>
  );
}



function getNodeDisplay(index: ContentIndex, node: LearningPathNode) {
  if (node.kind === "interview") {
    const question = index.interviewCollections.flatMap((collection) => collection.questions).find((item) => `${item.collectionSlug}/${item.slug}` === node.slug);
    return { title: question?.title ?? node.slug, summary: question?.summary ?? "Interview walkthrough", kindLabel: "Guided solutions", difficulty: question?.difficulty };
  }

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
      summary: diagram ? "Explore the diagram." : "Diagram",
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

  if (question.kind === "open-answer") {
    return answer?.kind === "open-answer" ? answer : { kind: "open-answer", value: "" };
  }

  if (question.kind === "listening-choice") {
    return answer?.kind === "listening-choice" ? answer : { kind: "listening-choice", selectedOptionId: "" };
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
  homeShortcuts: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 8 },
  homeShortcut: { flex: 1, alignItems: "center", gap: 8, minHeight: 64 },
  homeShortcutIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.greenSoft, alignItems: "center", justifyContent: "center" },
  navigationBar: { flexDirection: "row", gap: 4, padding: 8, borderTopWidth: 1, borderColor: colors.line, backgroundColor: colors.panel },
  navigationRail: { width: 224, backgroundColor: colors.panel, borderRightWidth: 1, borderColor: colors.line, padding: 16, gap: 8 },
  navigationScroll: { flex: 1 },
  navigationScrollContent: { gap: 6, paddingBottom: 16 },
  navigationFooter: { borderTopWidth: 1, borderColor: colors.line, paddingTop: 12 },
  accountSection: { gap: 8 },
  accountTrigger: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 48, paddingVertical: 8 },
  adminSection: { gap: 8, marginTop: 24 },
  languageBranch: { paddingLeft: 20, gap: 4 },
  languageToggle: { minHeight: 48, justifyContent: "center", paddingHorizontal: 12 },
  errorText: { color: "#b4233f", fontSize: 15, lineHeight: 22 },
  navigationBrand: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 48, marginVertical: 24 },
  navigationItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 5, minHeight: 54, paddingVertical: 6, borderRadius: 12 },
  navigationRailItem: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 52, padding: 14, borderRadius: 12 },
  navigationLabel: { fontSize: 10, fontWeight: "500", color: colors.textMuted },
  navigationRailLabel: { fontSize: 15 },
  navigationSelected: { backgroundColor: colors.greenSoft },
  navigationSelectedText: { color: colors.accentStrong, fontWeight: "600" },
  navigationPressed: { opacity: 0.65 },
  navigationBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#18262f66" },
  navigationSheet: { maxHeight: "85%", flexGrow: 0, backgroundColor: colors.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  navigationSheetContent: { padding: 24, paddingBottom: 48, gap: 12 },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loginForm: { width: "100%", maxWidth: 440, alignSelf: "center", gap: 16, paddingVertical: 24 },
  loginField: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: colors.textStrong },
  screenContent: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: 32,
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
  },
  screenEyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.background,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  fixedHeader: {
    alignItems: "center",
    backgroundColor: colors.panel,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  brand: {
    minHeight: 48,
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minWidth: 0,
  },
  brandMark: { height: 40, width: 40 },
  brandWordmark: { width: 128, height: 31, maxWidth: "100%" },
  brandTitle: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: "600",
  },
  brandSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "600",
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  heroCopy: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 23,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  disclosure: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md, gap: spacing.md },
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
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  discoverySectionTitle: {
    fontSize: 22,
    fontWeight: "600",
  },
  discoveryViewAll: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  discoveryViewAllText: {
    color: colors.accentStrong,
    fontSize: 13,
    fontWeight: "600",
  },
  discoveryRow: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  discoveryCardCompact: {
    width: 272,
  },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  subPanel: {
    backgroundColor: colors.panelMuted,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  japaneseGlyph: {
    color: colors.text,
    fontSize: 64,
    fontWeight: "600",
    lineHeight: 72,
  },
  writingSheetPicker: { gap: 10, paddingVertical: 12 },
  writingSheetTile: { minWidth: 100, minHeight: 76, padding: 14, borderRadius: 20, borderWidth: 2, borderBottomWidth: 4, borderColor: "#809b98", backgroundColor: colors.panel },
  writingTileSelected: { borderColor: colors.accent, backgroundColor: colors.greenSoft },
  writingTileMatched: { borderColor: colors.accent, backgroundColor: colors.greenSoft },
  writingProgressTrack: { height: 12, borderRadius: 20, backgroundColor: "#e0eae6", overflow: "hidden" },
  writingProgressFill: { height: "100%", borderRadius: 20, backgroundColor: colors.accent },
  writingExample: { gap: 8, minHeight: 320 },
  writingGlyph: { color: colors.text, fontSize: 48, lineHeight: 72 },
  writingFeedbackSlot: { minHeight: 100, justifyContent: "center", paddingVertical: 12, borderTopWidth: 1, borderColor: "#c1d2cf" },
  writingMatchGrid: { flexDirection: "row", gap: 14 },
  writingMatchColumn: { flex: 1, gap: 14 },
  writingMatchTile: { minHeight: 88, borderRadius: 22, borderWidth: 2, borderBottomWidth: 5, borderColor: "#809b98", backgroundColor: "#fffdf7", alignItems: "center", justifyContent: "center", padding: 10 },
  writingPad: {
    alignSelf: "center",
    backgroundColor: "#fffdf7",
    borderColor: "#809b98",
    borderRadius: 32,
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
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 74,
    padding: 8,
    justifyContent: "center",
    borderColor: colors.controlBorder,
  },
  characterTileGlyph: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 34,
  },
  characterTileReading: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  cardEyebrow: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 25,
  },
  bodyText: {
    color: colors.textStrong,
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 26,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 22,
  },
  emptyText: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
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
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
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
  sectionRow: { borderTopWidth: 1, borderColor: colors.line, paddingTop: spacing.lg, gap: spacing.md },
  nodeRow: {
    backgroundColor: colors.panelMuted,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  nodeIndex: {
    backgroundColor: colors.blueSoft,
    borderColor: "#9cc7ff",
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.blue,
    fontSize: 14,
    fontWeight: "600",
    minHeight: 40,
    paddingVertical: 9,
    textAlign: "center",
    width: 40,
  },
  nodeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  nodeSummary: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.panel,
    borderColor: colors.controlBorder,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "400",
    minHeight: 48,
    paddingVertical: 12,
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
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionSelected: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.accent,
  },
  ratingButtonSelected: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.accent,
  },
  reviewSavedPanel: {
    alignItems: "flex-start",
    backgroundColor: colors.greenSoft,
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  reviewSavedText: {
    color: colors.accentStrong,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  optionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderColor: colors.accentStrong,
    borderRadius: radii.md,
    borderWidth: 1,
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
    borderWidth: 1,
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
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primaryButtonText: {
    color: colors.panel,
    fontSize: 16,
    fontWeight: "600",
  },
  ghostButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.55,
  },
  feedback: {
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
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
    fontWeight: "600",
    textTransform: "uppercase",
  },
  positionRow: {
    alignItems: "center",
    backgroundColor: colors.panelMuted,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  positionText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  choice: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  choiceSelected: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.accent,
  },
  choiceText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  orderRow: {
    flexWrap: "wrap",
    alignItems: "center",
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
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
    borderWidth: 1,
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
    borderWidth: 1,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.md,
  },
  webView: {
    backgroundColor: colors.panel,
    height: 320,
  },
  codeBlock: {
    alignSelf: "stretch",
    backgroundColor: "#101820",
    borderColor: "#14212b",
    borderRadius: radii.md,
    borderWidth: 1,
    flexGrow: 0,
    flexShrink: 0,
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    marginVertical: spacing.sm,
  },
  codeScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  codeContent: {
    padding: spacing.md,
  },
  codeLanguage: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "600",
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    textTransform: "uppercase",
  },
  codeText: {
    flexShrink: 0,
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
    fontWeight: "400",
    lineHeight: 26,
  },
  heading1: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "600",
    lineHeight: 36,
  },
  heading2: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 31,
    marginTop: spacing.xl,
  },
  heading3: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 26,
    marginTop: spacing.lg,
  },
  paragraph: {
    marginBottom: spacing.md,
  },
  code_inline: {
    backgroundColor: colors.panelMuted,
    borderColor: colors.line,
    borderRadius: radii.sm,
    color: colors.blue,
    fontWeight: "600",
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
    fontWeight: "600",
  },
});
