import Fuse from "fuse.js";
import type { ContentIndex, ContentStatus, Difficulty, DiscoveryReferenceKind, DiscoverySectionId, LearningExercise } from "./content/schema";

export type DiscoveryItemKind = DiscoveryReferenceKind | "interview-company";

export type DiscoveryResult = {
  id: string;
  sourceSlug: string;
  kind: DiscoveryItemKind;
  section: DiscoverySectionId;
  title: string;
  summary: string;
  route: string;
  eyebrow: string;
  status: ContentStatus;
  difficulty?: Difficulty;
  tags: string[];
  searchText: string;
  score: number;
};

export type HomeDiscoverySection = {
  id: DiscoverySectionId;
  title: string;
  description: string;
  route: string;
  items: DiscoveryResult[];
};

const sectionDetails: Record<DiscoverySectionId, Omit<HomeDiscoverySection, "id" | "items">> = {
  paths: {
    title: "Learning paths",
    description: "Follow an ordered course from lesson to practice.",
    route: "/paths",
  },
  lessons: {
    title: "Lessons & diagrams",
    description: "Read focused guides and inspect visual explanations.",
    route: "/browse",
  },
  interviews: {
    title: "Interview prep",
    description: "Work through company-style coding questions.",
    route: "/interviews",
  },
  practice: {
    title: "Practice & review",
    description: "Test recall with questions, writing, and quick review.",
    route: "/practice",
  },
  languages: {
    title: "Languages",
    description: "Study writing systems, vocabulary, and pronunciation.",
    route: "/languages",
  },
};

export function createDiscoveryItems(index: ContentIndex): DiscoveryResult[] {
  const items: DiscoveryResult[] = [
    ...index.learningPaths
      .filter((item) => item.status === "published")
      .map((item) =>
        discoveryItem({
          id: item.id,
          sourceSlug: item.slug,
          kind: "path",
          section: "paths",
          title: item.title,
          summary: item.summary,
          route: item.route,
          eyebrow: `${capitalize(item.kind)} path · ${item.category}`,
          status: item.status,
          tags: [item.kind, item.category],
          searchText: [item.audience, ...item.units.flatMap((unit) => [unit.title, unit.summary])].join(" "),
        }),
      ),
    ...index.documents
      .filter((item) => item.status === "published")
      .map((item) =>
        discoveryItem({
          id: item.id,
          sourceSlug: item.slug,
          kind: "document",
          section: "lessons",
          title: item.title,
          summary: item.summary,
          route: item.route,
          eyebrow: `${item.track} lesson`,
          status: item.status,
          difficulty: item.difficulty,
          tags: item.tags,
          searchText: [item.topic, item.plainText, ...item.headings.map((heading) => heading.text)].join(" "),
        }),
      ),
    ...index.diagrams.map((item) =>
      discoveryItem({
        id: item.id,
        sourceSlug: item.slug,
        kind: "diagram",
        section: "lessons",
        title: item.title,
        summary: "A rendered Mermaid diagram with its source available for study.",
        route: item.route,
        eyebrow: "Visual guide",
        status: "published",
        tags: ["diagram", "mermaid"],
        searchText: item.source,
      }),
    ),
    ...index.exercises
      .filter((item) => item.status === "published")
      .map((item) =>
        discoveryItem({
          id: item.id,
          sourceSlug: item.slug,
          kind: "exercise",
          section: "practice",
          title: item.title,
          summary: `${item.concept} practice using ${exerciseTypeLabel(item).toLowerCase()}.`,
          route: item.route,
          eyebrow: exerciseTypeLabel(item),
          status: item.status,
          difficulty: item.difficulty,
          tags: [...item.tags, item.type],
          searchText: exerciseSearchText(item),
        }),
      ),
    ...index.passiveFlashcardFeeds
      .filter((item) => item.status === "published")
      .map((item) =>
        discoveryItem({
          id: item.id,
          sourceSlug: item.slug,
          kind: "flashcard-feed",
          section: "practice",
          title: item.title,
          summary: item.summary,
          route: item.route,
          eyebrow: "Quick review feed",
          status: item.status,
          tags: ["flashcards", "review", item.pathSlug],
          searchText: [item.audience, ...item.cards.flatMap((card) => [card.title, card.prompt, ...card.tags])].join(" "),
        }),
      ),
    ...index.interviewCompanies
      .filter((company) => company.status === "published")
      .flatMap((company) => [
        discoveryItem({
          id: company.id,
          sourceSlug: company.slug,
          kind: "interview-company",
          section: "interviews",
          title: company.name,
          summary: company.summary,
          route: company.route,
          eyebrow: `${company.questions.length} interview questions`,
          status: company.status,
          tags: [company.name, "interview"],
          searchText: company.questions.map((question) => question.title).join(" "),
        }),
        ...company.questions.map((question) =>
          discoveryItem({
            id: question.id,
            sourceSlug: `${company.slug}/${question.slug}`,
            kind: "interview-question",
            section: "interviews",
            title: question.title,
            summary: question.summary,
            route: question.route,
            eyebrow: `${company.name} interview question`,
            status: "published",
            difficulty: question.difficulty,
            tags: question.tags,
            searchText: [question.prompt, ...question.constraints].join(" "),
          }),
        ),
      ]),
    ...index.languageCharacters
      .filter((item) => item.status === "published")
      .map((item) =>
        discoveryItem({
          id: item.id,
          sourceSlug: item.slug,
          kind: "language-character",
          section: "languages",
          title: `${item.glyph} · ${item.title}`,
          summary: `${item.romaji} /${item.ipa}/ · ${item.meanings.join(", ")}`,
          route: item.route,
          eyebrow: `Japanese ${item.writingSystem}`,
          status: item.status,
          tags: item.tags,
          searchText: [item.glyph, item.romaji, item.ipa, ...item.meanings, ...item.readings.flatMap((reading) => [reading.value, reading.ipa])].join(" "),
        }),
      ),
    ...index.languageVocabulary
      .filter((item) => item.status === "published")
      .map((item) =>
        discoveryItem({
          id: item.id,
          sourceSlug: item.slug,
          kind: "language-vocabulary",
          section: "languages",
          title: `${item.expression} · ${item.romaji}`,
          summary: `${item.reading} /${item.ipa}/ · ${item.meanings.join(", ")}`,
          route: item.route,
          eyebrow: "Japanese vocabulary",
          status: item.status,
          tags: item.tags,
          searchText: [item.expression, item.reading, item.romaji, item.ipa, ...item.meanings].join(" "),
        }),
      ),
  ];

  if (index.languageCharacters.some((item) => item.language === "ja" && item.status === "published")) {
    items.push(
      discoveryItem({
        id: "language-hub-japanese",
        sourceSlug: "japanese",
        kind: "language-hub",
        section: "languages",
        title: "Japanese",
        summary: "Practice kana, kanji, vocabulary, pronunciation, and handwriting.",
        route: "/languages/japanese",
        eyebrow: "Language hub",
        status: "published",
        tags: ["japanese", "kana", "kanji", "vocabulary", "writing"],
        searchText: "hiragana katakana romaji ipa foundations",
      }),
    );
  }

  return dedupeByRoute(items);
}

export function searchDiscovery(index: ContentIndex, query: string): DiscoveryResult[] {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const fuse = new Fuse(createDiscoveryItems(index), {
    includeScore: true,
    threshold: 0.34,
    ignoreLocation: true,
    keys: [
      { name: "title", weight: 0.42 },
      { name: "tags", weight: 0.24 },
      { name: "eyebrow", weight: 0.14 },
      { name: "summary", weight: 0.12 },
      { name: "searchText", weight: 0.08 },
    ],
  });

  return fuse
    .search(normalizedQuery)
    .map(({ item, score }) => ({
      ...item,
      score: item.title.toLocaleLowerCase("en-US") === normalizedQuery.toLocaleLowerCase("en-US") ? 100 : Math.round((1 - (score ?? 1)) * 100),
    }))
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
}

export function getHomeDiscoverySections(index: ContentIndex): HomeDiscoverySection[] {
  const items = createDiscoveryItems(index);
  const itemMap = new Map(items.map((item) => [`${item.kind}:${item.sourceSlug}`, item]));

  return (Object.keys(sectionDetails) as DiscoverySectionId[]).map((id) => ({
    id,
    ...sectionDetails[id],
    items: index.homeDiscovery.sections[id].flatMap((reference) => {
      const item = itemMap.get(`${reference.kind}:${reference.slug}`);
      return item ? [item] : [];
    }),
  }));
}

function discoveryItem(item: Omit<DiscoveryResult, "score">): DiscoveryResult {
  return { ...item, score: 0 };
}

function exerciseTypeLabel(exercise: LearningExercise) {
  if (exercise.type === "flashcard") return "Flashcard";
  if (exercise.type === "cloze") return "Fill the gap";
  if (exercise.type === "writing") return "Writing practice";
  return "Questionnaire";
}

function exerciseSearchText(exercise: LearningExercise) {
  if (exercise.type === "questionnaire") {
    return exercise.questions.map((question) => `${question.prompt} ${question.explanation}`).join(" ");
  }

  return `${exercise.prompt} ${exercise.explanation}`;
}

function dedupeByRoute(items: DiscoveryResult[]) {
  const routes = new Set<string>();
  return items.filter((item) => {
    if (routes.has(item.route)) return false;
    routes.add(item.route);
    return true;
  });
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
