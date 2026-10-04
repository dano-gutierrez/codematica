import { describe, expect, it } from "vitest";
import {
  getContentIndex,
  getDocumentBySlug,
  getExerciseBySlug,
  getInterviewCollectionBySlug,
  getInterviewCompanyBySlug,
  getInterviewQuestionBySlug,
  getLanguageCharacterBySlug,
  getLanguageVocabularyBySlug,
  getLearningPathBySlug,
  getNextPathNodeRoute,
  getPathNodeRoute,
  getNextPathNodeRoutesByPath,
  getPassiveFlashcardFeedByPathSlug,
  getReferencedDiagrams,
} from ".";

describe("generated content index", () => {
  it("extends reservation practice with room-date overlap and explicit expiry", () => {
    const document = getDocumentBySlug("system-design/fair-admission-and-reservations");
    const quiz = getExerciseBySlug("system-design/reservation-boundary-checkpoint");
    expect(document?.headings.map(h => h.id)).toContain("protect-room-dates-with-an-overlap-constraint");
    const sources = ["postgresql-17-ranges", "postgresql-17-btree-gist", "postgresql-17-exclusion", "postgresql-17-date-functions"];
    expect(document?.sourceRefs).toEqual(expect.arrayContaining(sources));
    if (quiz?.type !== "questionnaire") throw new Error("Reservation practice must remain a questionnaire");
    expect(quiz.documentSlug).toBe(document?.slug);
    expect(quiz.sourceRefs).toEqual(expect.arrayContaining(sources));
    expect(quiz.questions.map(q => q.id)).toEqual(["skip-result", "identity", "late-payment", "expiry-boundary", "room-overlap", "room-expiry"]);
    expect(quiz.questions.slice(4).map(q => q.kind === "choice" ? q.options.find(o => o.isCorrect)?.label : "wrong kind")).toEqual([
      "Enforce overlap exclusion for the same room; adjacent half-open stays may coexist.",
      "Commit the guarded transition to expired; elapsed time alone does not remove the hold from the constraint.",
    ]);
    for (const path of ["system-design-fundamentals", "backend-engineer-readiness"]) {
      expect(getNextPathNodeRoute(path, {kind:"document", slug:document!.slug})).toBe(`/practice/system-design/reservation-boundary-checkpoint?path=${path}`);
    }
  });
  it("uses attributed curved kana models, including the full third-stroke loop of あ", () => {
    const a = getLanguageCharacterBySlug("japanese/hiragana/a")!;
    const loop = a.strokes[2]!.points;
    expect(loop.length).toBeGreaterThan(80);
    expect(loop[0]![0]).toBeCloseTo(60.21, 1);
    expect(Math.min(...loop.map(([x]) => x))).toBeLessThan(25);
    expect(Math.max(...loop.map(([x]) => x))).toBeGreaterThan(80);
    expect(loop.at(-1)![0]).toBeGreaterThan(60);
    for (const kana of getContentIndex().languageCharacters.filter((character) => character.status === "published" && character.writingSystem !== "kanji")) {
      expect(kana.sources.some((source) => source.label.includes("KanjiVG") && source.label.includes("CC BY-SA 3.0"))).toBe(true);
    }
  });

  it("loads starter documents and diagrams", () => {
    const index = getContentIndex();

    expect(index.schemaVersion).toBe(12);
    expect(index.documents.length).toBeGreaterThanOrEqual(3);
    expect(index.diagrams.length).toBeGreaterThanOrEqual(2);
    expect(index.learningPaths.length).toBeGreaterThanOrEqual(2);
    expect(index.exercises.length).toBeGreaterThanOrEqual(4);
    expect(index.interviewCollections.length).toBeGreaterThanOrEqual(9);
    expect(index.passiveFlashcardFeeds.length).toBeGreaterThanOrEqual(1);
    expect(getDocumentBySlug("system-design/cache-invalidation")?.title).toBe("Cache Invalidation Under Product Pressure");
    expect(getLearningPathBySlug("system-design-fundamentals")?.title).toBe("System Design Fundamentals");
    expect(getExerciseBySlug("system-design/versioned-keys-cloze")?.type).toBe("cloze");
  });

  it("loads the Japanese foundations path and language data", () => {
    const path = getLearningPathBySlug("japanese-foundations");
    const hiragana = getLanguageCharacterBySlug("japanese/hiragana/a");
    const kanji = getLanguageCharacterBySlug("japanese/kanji/person");
    const vocabulary = getLanguageVocabularyBySlug("japanese/vocabulary/japan");
    const exercise = getExerciseBySlug("languages/japanese-starter-kanji-writing");

    expect(path?.title).toBe("Japanese Foundations: Kana to JLPT N5");
    const nodeSlugs = path?.units.flatMap((unit) => unit.nodes).map((node) => node.slug) ?? [];
    expect(nodeSlugs).toEqual(expect.arrayContaining([
      "languages/japanese-writing-systems",
      "languages/japanese-kana-explorer-checkpoint",
      "languages/japanese-n5-identity-and-demonstratives",
      "languages/japanese-n5-n5-integrated-readiness-open-answer",
    ]));
    expect(path?.units).toHaveLength(15);
    expect(path?.progression?.stages).toHaveLength(5);
    expect(hiragana?.glyph).toBe("あ");
    expect(hiragana?.ipa).toBe("a");
    expect(kanji?.strokes).toHaveLength(2);
    expect(vocabulary?.expression).toBe("日本");
    expect(exercise?.type).toBe("writing");
  });

  it("loads the always-available Japanese alphabet flashcard feed", () => {
    const feed = getPassiveFlashcardFeedByPathSlug("japanese-foundations");

    expect(feed?.title).toBe("Japanese Alphabet Flashcards");
    expect(feed?.route).toBe("/paths/japanese-foundations/flashcards");
    expect(feed?.cards.length).toBeGreaterThanOrEqual(30);
    expect(feed?.cards.some((card) => card.prompt.includes("シ") && card.prompt.includes("ツ"))).toBe(true);
  });

  it("loads the Python refresh path, documents, and questionnaires", () => {
    const path = getLearningPathBySlug("python-for-ts-js-engineers");
    const document = getDocumentBySlug("programming/python-runtime-model");
    const questionnaire = getExerciseBySlug("programming/python-runtime-questionnaire");

    expect(path?.title).toBe("Python For TypeScript And JavaScript Engineers");
    expect(path?.units.flatMap((unit) => unit.nodes).map((node) => node.slug)).toEqual([
      "programming/python-runtime-model",
      "programming/python-runtime-questionnaire",
      "programming/python-types-and-contracts",
      "programming/python-types-questionnaire",
      "programming/python-packaging-environments",
      "programming/python-packaging-questionnaire",
      "programming/python-async-testing-production",
      "programming/python-async-questionnaire",
    ]);
    expect(document?.track).toBe("Programming");
    expect(questionnaire?.type).toBe("questionnaire");
    expect(questionnaire?.route).toBe("/practice/programming/python-runtime-questionnaire");
  });

  it("loads the passive Python flashcard feed", () => {
    const feed = getPassiveFlashcardFeedByPathSlug("python-for-ts-js-engineers");

    expect(feed?.title).toBe("Python Flashcard Feed");
    expect(feed?.route).toBe("/paths/python-for-ts-js-engineers/flashcards");
    expect(feed?.cards).toHaveLength(320);
    expect(feed?.cards.map((card) => card.type)).toEqual(expect.arrayContaining(["concept", "practical", "snippet", "interview"]));
    expect(feed?.cards.some((card) => card.code?.includes("def "))).toBe(true);
  });

  it("loads the BFS and DFS learning path, questionnaires, and scrolling review feed", () => {
    const path = getLearningPathBySlug("breadth-first-and-depth-first-search");
    const fundamentals = getDocumentBySlug("programming/bfs-dfs-fundamentals");
    const applications = getDocumentBySlug("programming/bfs-dfs-interview-patterns");
    const fundamentalsQuiz = getExerciseBySlug("programming/bfs-dfs-fundamentals-questionnaire");
    const applicationsQuiz = getExerciseBySlug("programming/bfs-dfs-interview-patterns-questionnaire");
    const feed = getPassiveFlashcardFeedByPathSlug("breadth-first-and-depth-first-search");

    expect(path?.title).toBe("Breadth-First Search And Depth-First Search");
    expect(path?.units.flatMap((unit) => unit.nodes).map((node) => node.slug)).toEqual([
      "programming/bfs-dfs-fundamentals",
      "programming/bfs-dfs-fundamentals-questionnaire",
      "programming/bfs-dfs-interview-patterns",
      "programming/bfs-dfs-interview-patterns-questionnaire",
    ]);
    expect(fundamentals?.markdown).toContain("from collections import deque");
    expect(fundamentals?.markdown).toContain("export function bfs");
    expect(applications?.markdown).toContain("Number Of Islands");
    expect(applications?.markdown).toContain("BFS Versus DFS");
    expect(fundamentalsQuiz?.type).toBe("questionnaire");
    expect(applicationsQuiz?.type).toBe("questionnaire");
    expect(feed?.route).toBe("/paths/breadth-first-and-depth-first-search/flashcards");
    expect(feed?.cards.length).toBeGreaterThanOrEqual(12);
    expect(feed?.cards.map((card) => card.type)).toEqual(expect.arrayContaining(["concept", "practical", "snippet", "interview"]));
  });

  it("adds an optional advanced research source without inventing a local companion", () => {
    const path = getLearningPathBySlug("ai-engineering-langfuse-langchain")!;
    expect(path.units.map(u => u.slug)).toEqual([
      "llm-application-foundations", "langchain-building-blocks", "langfuse-tracing",
      "prompts-datasets-evals", "rag-quality", "agents-operations",
      "evidence-first-handoffs", "risk-governance", "advanced-agent-research",
    ]);
    const unit = path.units.at(-1)!;
    expect(unit.nodes).toEqual([expect.objectContaining({
      kind:"source",slug:"ai-engineering/stanford-self-improving-agents",
      sourceRef:"stanford-cs329a-autumn-2025",activity:"read",companionKind:"document",required:false,
    })]);
    const source = getContentIndex().sources.find(s => s.id === "stanford-cs329a-autumn-2025");
    expect(source).toMatchObject({provider:"Stanford University",url:"https://cs329a.stanford.edu/",upstream:{version:"Autumn 2025",maturity:"published"}});
    expect(source?.attribution).toContain("not enrollment");
    expect(source?.license).toBeUndefined();
    expect(getDocumentBySlug(unit.nodes[0]!.slug)).toBeUndefined();
    expect(getPathNodeRoute(unit.nodes[0]!, path.slug)).toBe("https://cs329a.stanford.edu/");
    expect(getNextPathNodeRoute(path.slug, {kind:"exercise",slug:"ai-engineering/llm-production-risk-governance-questionnaire"})).toBe("https://cs329a.stanford.edu/");
  });

  it("loads the Langfuse and LangChain AI engineering path", () => {
    const path = getLearningPathBySlug("ai-engineering-langfuse-langchain");
    const tracingDocument = getDocumentBySlug("ai-engineering/langfuse-tracing-fundamentals");
    const tracingQuiz = getExerciseBySlug("ai-engineering/langfuse-tracing-questionnaire");
    const feed = getPassiveFlashcardFeedByPathSlug("ai-engineering-langfuse-langchain");

    expect(path?.title).toBe("Langfuse And LangChain AI Engineering");
    expect(path?.route).toBe("/paths/ai-engineering-langfuse-langchain");
    expect(path?.units.flatMap((unit) => unit.nodes).map((node) => node.slug)).toEqual([
      "ai-engineering/llm-application-map",
      "ai-engineering/llm-observability-loop",
      "ai-engineering/llm-application-map-questionnaire",
      "ai-engineering/langchain-models-tools-rag",
      "ai-engineering/langchain-models-tools-rag-questionnaire",
      "ai-engineering/langfuse-tracing-fundamentals",
      "ai-engineering/langfuse-trace-lifecycle",
      "ai-engineering/langfuse-tracing-questionnaire",
      "ai-engineering/langfuse-prompts-datasets-evals",
      "ai-engineering/langfuse-prompts-datasets-evals-questionnaire",
      "ai-engineering/rag-quality-with-langchain-langfuse",
      "ai-engineering/rag-quality-questionnaire",
      "ai-engineering/langchain-agents-langgraph-operations",
      "ai-engineering/agent-tool-safety-flow",
      "ai-engineering/langchain-agents-langgraph-questionnaire",
      "ai-engineering/evidence-first-agent-handoffs",
      "ai-engineering/agent-handoff-checkpoint",
      "ai-engineering/llm-production-risk-governance",
      "ai-engineering/llm-production-risk-governance-questionnaire",
      "ai-engineering/stanford-self-improving-agents",
    ]);
    expect(tracingDocument?.track).toBe("AI Engineering");
    expect(tracingDocument?.diagramRefs).toEqual(["ai-engineering/langfuse-trace-lifecycle"]);
    expect(tracingQuiz?.type).toBe("questionnaire");
    expect(tracingQuiz?.route).toBe("/practice/ai-engineering/langfuse-tracing-questionnaire");
    expect(feed?.title).toBe("Langfuse And LangChain Flashcard Feed");
    expect(feed?.route).toBe("/paths/ai-engineering-langfuse-langchain/flashcards");
    expect(feed?.cards).toHaveLength(84);
    expect(feed?.cards.map((card) => card.type)).toEqual(expect.arrayContaining(["concept", "practical", "snippet", "interview"]));
    expect(feed?.cards.some((card) => card.code?.includes("trace_id"))).toBe(true);
  });

  it("places routing practice after capacity and preserves broker effect boundaries", () => {
    const path = getLearningPathBySlug("system-design-fundamentals");
    expect(path?.units.map(u => u.slug)).toEqual([
      "caching-contracts", "capacity-decisions", "routing-decisions", "api-security-boundaries", "reservation-boundaries",
    ]);
    const routing = getDocumentBySlug("system-design/routing-decision-lab");
    const quiz = getExerciseBySlug("system-design/routing-decision-checkpoint");
    expect(routing?.status).toBe("published");
    expect(routing?.sourceRefs).toEqual(["nginx-upstream-routing"]);
    expect(routing?.prerequisites).toEqual(["system-design/scaling-decision-worksheet"]);
    if (quiz?.type !== "questionnaire") throw new Error("Routing practice must be a questionnaire");
    expect(quiz.status).toBe("published");
    expect(quiz.documentSlug).toBe(routing?.slug);
    expect(quiz.questions.map(q => q.id)).toEqual(["signal", "affinity", "eligibility", "scope"]);
    expect(quiz.questions.map(q => q.kind === "choice" ? q.options.find(o => o.isCorrect)?.label : "wrong kind")).toEqual([
      "Treat connection count as one signal; measure queued work and latency for this workload.",
      "Affinity may change and IPs may be shared; keep authorization and durable session state independent.",
      "Exclude the ineligible backend before ranking; define a bounded no-capacity response.",
      "The toy’s stated routing and validation cases; real proxy behavior and throughput need separate tests.",
    ]);
    expect(getNextPathNodeRoute("system-design-fundamentals", {kind:"exercise",slug:"system-design/scaling-decision-checkpoint"})).toBe("/docs/system-design/routing-decision-lab?path=system-design-fundamentals");
    expect(getNextPathNodeRoute("system-design-fundamentals", {kind:"document",slug:"system-design/routing-decision-lab"})).toBe("/practice/system-design/routing-decision-checkpoint?path=system-design-fundamentals");
    expect(getNextPathNodeRoute("system-design-fundamentals", {kind:"exercise",slug:"system-design/routing-decision-checkpoint"})).toBe("/docs/system-design/cors-csrf-and-authorization?path=system-design-fundamentals");
    const durable = getDocumentBySlug("software-engineering/product-interview-durable-generation-architecture");
    expect(durable?.sourceRefs).toEqual(expect.arrayContaining(["kafka-41-delivery-design", "redis-pubsub-delivery", "redis-stream-ack", "redis-stream-autoclaim"]));
    expect(durable?.headings.map(h => h.id)).toEqual(expect.arrayContaining(["separate-kafka-progress-from-an-external-effect", "recover-redis-work-without-treating-an-ack-as-a-receipt"]));
  });

  it("links primary reservation and coalescing cases to existing lessons", () => {
    const reservation = getDocumentBySlug("system-design/fair-admission-and-reservations");
    const cache = getDocumentBySlug("system-design/cache-invalidation");
    expect(reservation?.sourceRefs).toContain("shopify-inventory-reservations-2026");
    expect(cache?.sourceRefs).toContain("discord-message-storage-2023");
    expect(reservation?.headings.map(h => h.id)).toContain("compare-a-bounded-pool-with-the-ledger");
    expect(cache?.headings.map(h => h.id)).toContain("study-coalescing-without-confusing-it-with-caching");
  });

  it("links the original handoff lab and checkpoint between agents and governance", () => {
    const path = "ai-engineering-langfuse-langchain";
    const document = getDocumentBySlug("ai-engineering/evidence-first-agent-handoffs");
    const checkpoint = getExerciseBySlug("ai-engineering/agent-handoff-checkpoint");
    expect(document?.sourceRefs).toEqual([
      "anthropic-long-running-harnesses", "anthropic-harness-design-experiment", "walkinglabs-harness-course",
    ]);
    if (checkpoint?.type !== "questionnaire") throw new Error("Handoff practice must be a questionnaire");
    expect(checkpoint.status).toBe("published");
    expect(document?.status).toBe("published");
    expect(checkpoint?.documentSlug).toBe(document?.slug);
    expect(checkpoint?.questions).toHaveLength(4);
    expect(getNextPathNodeRoute(path, { kind: "exercise", slug: "ai-engineering/langchain-agents-langgraph-questionnaire" })).toBe(
      "/docs/ai-engineering/evidence-first-agent-handoffs?path=ai-engineering-langfuse-langchain",
    );
    expect(getNextPathNodeRoute(path, { kind: "document", slug: "ai-engineering/evidence-first-agent-handoffs" })).toBe(
      "/practice/ai-engineering/agent-handoff-checkpoint?path=ai-engineering-langfuse-langchain",
    );
    expect(getNextPathNodeRoute(path, { kind: "exercise", slug: "ai-engineering/agent-handoff-checkpoint" })).toBe(
      "/docs/ai-engineering/llm-production-risk-governance?path=ai-engineering-langfuse-langchain",
    );
  });

  it("loads the database indexes and search path", () => {
    const path = getLearningPathBySlug("database-indexes-and-search");
    const hotDocument = getDocumentBySlug("databases/postgres-hot-updates");
    const hotQuiz = getExerciseBySlug("databases/postgres-hot-updates-questionnaire");
    const trigramDocument = getDocumentBySlug("databases/trigram-fuzzy-indexes");
    const trigramQuiz = getExerciseBySlug("databases/trigram-fuzzy-indexes-questionnaire");
    const feed = getPassiveFlashcardFeedByPathSlug("database-indexes-and-search");

    expect(path?.title).toBe("Database Indexes And Search");
    expect(path?.route).toBe("/paths/database-indexes-and-search");
    expect(path?.units.flatMap((unit) => unit.nodes).map((node) => node.slug)).toEqual([
      "databases/index-fundamentals",
      "databases/index-fundamentals-questionnaire",
      "databases/postgres-hot-updates",
      "databases/postgres-hot-updates-questionnaire",
      "databases/postgres-full-text-search",
      "databases/postgres-full-text-search-questionnaire",
      "databases/trigram-fuzzy-indexes",
      "databases/trigram-fuzzy-indexes-questionnaire",
      "databases/postgres-hybrid-search-query",
      "databases/postgres-hybrid-search-query-questionnaire",
      "databases/postgres-connection-pooling",
      "databases/postgres-connection-pooling-questionnaire",
    ]);
    expect(hotDocument?.track).toBe("Databases");
    expect(hotDocument?.tags).toEqual(expect.arrayContaining(["postgres", "hot-updates", "mvcc"]));
    expect(hotDocument?.markdown).toContain("n_tup_hot_upd");
    expect(hotQuiz?.type).toBe("questionnaire");
    expect(hotQuiz?.route).toBe("/practice/databases/postgres-hot-updates-questionnaire");
    expect(trigramDocument?.track).toBe("Databases");
    expect(trigramDocument?.tags).toEqual(expect.arrayContaining(["postgres", "pg-trgm", "fuzzy-search"]));
    expect(trigramQuiz?.type).toBe("questionnaire");
    expect(trigramQuiz?.route).toBe("/practice/databases/trigram-fuzzy-indexes-questionnaire");
    expect(feed?.title).toBe("Database Indexes And Search Flashcard Feed");
    expect(feed?.route).toBe("/paths/database-indexes-and-search/flashcards");
    expect(feed?.cards).toHaveLength(48);
    expect(feed?.cards.map((card) => card.type)).toEqual(expect.arrayContaining(["concept", "practical", "snippet", "interview"]));
    expect(feed?.cards.some((card) => card.code?.includes("gin_trgm_ops"))).toBe(true);
    expect(feed?.cards.some((card) => card.sourceDocSlug === "databases/postgres-hot-updates" && card.code?.includes("n_tup_hot_upd"))).toBe(true);
  });

  it("loads the Advanced Next.js 16 hard-only path", () => {
    const path = getLearningPathBySlug("advanced-nextjs-16");
    const forceDynamicDocument = getDocumentBySlug("frontend/nextjs-16-force-dynamic");
    const forceDynamicQuiz = getExerciseBySlug("frontend/nextjs-16-force-dynamic-questionnaire");
    const feed = getPassiveFlashcardFeedByPathSlug("advanced-nextjs-16");

    const expectedNodes = [
      "frontend/nextjs-16-rendering-model",
      "frontend/nextjs-16-rendering-model-questionnaire",
      "frontend/nextjs-16-force-dynamic",
      "frontend/nextjs-16-force-dynamic-questionnaire",
      "frontend/nextjs-16-cache-components",
      "frontend/nextjs-16-cache-components-questionnaire",
      "frontend/nextjs-16-data-fetching-caching",
      "frontend/nextjs-16-data-fetching-caching-questionnaire",
      "frontend/nextjs-16-invalidation-mutations",
      "frontend/nextjs-16-invalidation-mutations-questionnaire",
      "frontend/nextjs-16-painful-production-lessons",
      "frontend/nextjs-16-painful-production-lessons-questionnaire",
      "frontend/nextjs-16-performance-architecture",
      "frontend/nextjs-16-performance-architecture-questionnaire",
      "frontend/nextjs-16-migration-review",
      "frontend/nextjs-16-migration-review-questionnaire",
    ];

    expect(path?.title).toBe("Advanced Next.js 16");
    expect(path?.category).toBe("Front-End Development");
    expect(path?.route).toBe("/paths/advanced-nextjs-16");
    expect(path?.units).toHaveLength(8);
    expect(path?.units.flatMap((unit) => unit.nodes).map((node) => node.slug)).toEqual(expectedNodes);

    expect(forceDynamicDocument?.track).toBe("Front-End Development");
    expect(forceDynamicDocument?.difficulty).toBe("senior");
    expect(forceDynamicDocument?.markdown).toContain("export const dynamic = 'force-dynamic';");
    expect(forceDynamicDocument?.markdown).toContain("pages are dynamic by default");
    expect(forceDynamicDocument?.markdown).toContain("https://nextjs.org/docs/app/guides/migrating-to-cache-components");

    expect(forceDynamicQuiz?.type).toBe("questionnaire");
    expect(forceDynamicQuiz?.difficulty).toBe("senior");
    expect(forceDynamicQuiz?.route).toBe("/practice/frontend/nextjs-16-force-dynamic-questionnaire");
    expect(forceDynamicQuiz && "questions" in forceDynamicQuiz ? forceDynamicQuiz.questions : []).toHaveLength(6);

    expect(feed?.title).toBe("Advanced Next.js 16 One-Minute Briefs");
    expect(feed?.route).toBe("/paths/advanced-nextjs-16/flashcards");
    expect(feed?.cards).toHaveLength(96);
    expect(feed?.cards.map((card) => card.type)).toEqual(expect.arrayContaining(["concept", "practical", "snippet", "interview"]));
    expect(feed?.cards.every((card) => card.difficulty === "senior" || card.difficulty === "principal")).toBe(true);
    expect(feed?.cards.some((card) => card.code?.includes("'use cache'"))).toBe(true);
  });

  it("resolves diagram references from article frontmatter", () => {
    const document = getDocumentBySlug("system-design/cache-invalidation");

    expect(document).toBeDefined();
    expect(getReferencedDiagrams(document?.diagramRefs ?? []).map((diagram) => diagram.slug)).toEqual(["system-design/cache-aside"]);
  });

  it("resolves the next node route from a path-scoped exercise", () => {
    expect(getNextPathNodeRoute("system-design-fundamentals", { kind: "exercise", slug: "system-design/cache-product-contract" })).toBe(
      "/practice/system-design/versioned-keys-cloze?path=system-design-fundamentals",
    );
  });

  it("resolves the next node route from a path-scoped questionnaire", () => {
    expect(getNextPathNodeRoute("python-for-ts-js-engineers", { kind: "exercise", slug: "programming/python-runtime-questionnaire" })).toBe(
      "/docs/programming/python-types-and-contracts?path=python-for-ts-js-engineers",
    );
  });

  it("resolves the next node route from a path-scoped document", () => {
    expect(getNextPathNodeRoute("python-for-ts-js-engineers", { kind: "document", slug: "programming/python-runtime-model" })).toBe(
      "/practice/programming/python-runtime-questionnaire?path=python-for-ts-js-engineers",
    );
  });

  it("resolves the next node route through the AI engineering path", () => {
    expect(getNextPathNodeRoute("ai-engineering-langfuse-langchain", { kind: "document", slug: "ai-engineering/langfuse-tracing-fundamentals" })).toBe(
      "/diagrams/ai-engineering/langfuse-trace-lifecycle?path=ai-engineering-langfuse-langchain",
    );
  });

  it("resolves the next node route through the database indexes path", () => {
    expect(
      getNextPathNodeRoute("database-indexes-and-search", {
        kind: "exercise",
        slug: "databases/index-fundamentals-questionnaire",
      }),
    ).toBe("/docs/databases/postgres-hot-updates?path=database-indexes-and-search");
    expect(getNextPathNodeRoute("database-indexes-and-search", { kind: "document", slug: "databases/postgres-hot-updates" })).toBe(
      "/practice/databases/postgres-hot-updates-questionnaire?path=database-indexes-and-search",
    );
    expect(
      getNextPathNodeRoute("database-indexes-and-search", {
        kind: "exercise",
        slug: "databases/postgres-hot-updates-questionnaire",
      }),
    ).toBe("/docs/databases/postgres-full-text-search?path=database-indexes-and-search");
    expect(getNextPathNodeRoute("database-indexes-and-search", { kind: "document", slug: "databases/trigram-fuzzy-indexes" })).toBe(
      "/practice/databases/trigram-fuzzy-indexes-questionnaire?path=database-indexes-and-search",
    );
  });

  it("resolves the next node route through the Advanced Next.js 16 path", () => {
    expect(getNextPathNodeRoute("advanced-nextjs-16", { kind: "document", slug: "frontend/nextjs-16-force-dynamic" })).toBe(
      "/practice/frontend/nextjs-16-force-dynamic-questionnaire?path=advanced-nextjs-16",
    );
  });

  it("builds static path-scoped next route maps for content pages", () => {
    expect(getNextPathNodeRoutesByPath({ kind: "document", slug: "frontend/nextjs-16-force-dynamic" })).toEqual({
      "advanced-nextjs-16": "/practice/frontend/nextjs-16-force-dynamic-questionnaire?path=advanced-nextjs-16",
    });
  });

  it("omits paths where the current node has no next route", () => {
    expect(getNextPathNodeRoutesByPath({ kind: "exercise", slug: "frontend/nextjs-16-migration-review-questionnaire" })).toEqual({});
  });

  it("resolves interview companies and questions from the generated index", () => {
    const company = getInterviewCompanyBySlug("amazon");
    const question = getInterviewQuestionBySlug("amazon", "two-sum-product-pair");

    expect(company?.name).toBe("Amazon");
    expect(company?.route).toBe("/interviews/amazon");
    expect(question?.route).toBe("/interviews/amazon/two-sum-product-pair");
    expect(question?.solutionTracks).toHaveLength(2);
    expect(question?.kind).toBe("algorithm");
    expect(question?.kind === "algorithm" ? question.solutionTracks[0]?.languages : undefined).toEqual(
      expect.objectContaining({
        python: expect.objectContaining({ code: expect.any(String) }),
        typescript: expect.objectContaining({ code: expect.any(String) }),
        java: expect.objectContaining({ code: expect.any(String) }),
      }),
    );
  });

  it("resolves anonymous real-world web interviews and runnable projects", () => {
    const collection = getInterviewCollectionBySlug("real-world");
    const question = getInterviewQuestionBySlug("real-world", "mondrian-composition-generator");

    expect(collection?.kind).toBe("real-world");
    expect(getInterviewCompanyBySlug("real-world")).toBeUndefined();
    expect(question?.kind).toBe("web");
    expect(question?.route).toBe("/interviews/real-world/mondrian-composition-generator");
    expect(question?.kind === "web" ? question.solutionTracks : []).toHaveLength(3);
    expect(question?.kind === "web" ? question.solutionTracks.map((track) => track.project.runtime) : []).toEqual([
      "react-ts",
      "react-ts",
      "react-ts",
    ]);
  });

  it("loads graph-search interview questions with BFS and DFS solution tracks", () => {
    const islands = getInterviewQuestionBySlug("google", "number-of-islands");
    const shortestPath = getInterviewQuestionBySlug("google", "shortest-path-binary-matrix");
    const courseSchedule = getInterviewQuestionBySlug("google", "course-schedule");

    expect(islands?.kind).toBe("algorithm");
    expect(islands?.solutionTracks.map((track) => track.id)).toEqual(["bfs-flood-fill", "dfs-flood-fill"]);
    expect(islands?.kind === "algorithm" && islands.solutionTracks.every((track) => track.languages.python.code.length > 0)).toBe(true);
    expect(islands?.kind === "algorithm" && islands.solutionTracks.every((track) => track.languages.typescript.code.length > 0)).toBe(true);
    expect(shortestPath?.tags).toContain("bfs");
    expect(courseSchedule?.solutionTracks.map((track) => track.id)).toEqual(["dfs-color-cycle", "bfs-kahn-order"]);
  });

  it("loads the Mermaid authoring path with progressive examples and choice-only questionnaires", () => {
    const path = getLearningPathBySlug("mermaid-diagram-authoring");
    const fundamentals = getDocumentBySlug("programming/mermaid-syntax-fundamentals");
    const software = getDocumentBySlug("programming/mermaid-software-diagrams");
    const planning = getDocumentBySlug("programming/mermaid-planning-and-data-diagrams");
    const questionnaires = [
      getExerciseBySlug("programming/mermaid-syntax-fundamentals-questionnaire"),
      getExerciseBySlug("programming/mermaid-software-diagrams-questionnaire"),
      getExerciseBySlug("programming/mermaid-planning-and-data-diagrams-questionnaire"),
    ];
    const feed = getPassiveFlashcardFeedByPathSlug("mermaid-diagram-authoring");

    expect(path?.title).toBe("Reading And Writing Mermaid Diagrams");
    expect(path?.units.flatMap((unit) => unit.nodes).map((node) => node.slug)).toEqual([
      "programming/mermaid-syntax-fundamentals",
      "programming/mermaid-syntax-fundamentals-questionnaire",
      "programming/mermaid-software-diagrams",
      "programming/mermaid-software-diagrams-questionnaire",
      "programming/mermaid-planning-and-data-diagrams",
      "programming/mermaid-planning-and-data-diagrams-questionnaire",
    ]);
    expect(fundamentals?.mermaidBlocks.length).toBeGreaterThanOrEqual(3);
    expect(software?.mermaidBlocks.length).toBeGreaterThanOrEqual(4);
    expect(planning?.mermaidBlocks.length).toBeGreaterThanOrEqual(5);
    expect(fundamentals?.markdown).toContain("flowchart LR");
    expect(software?.markdown).toContain("sequenceDiagram");
    expect(software?.markdown).toContain("erDiagram");
    expect(planning?.markdown).toContain("gantt");
    expect(planning?.markdown).toContain("mindmap");

    for (const questionnaire of questionnaires) {
      expect(questionnaire?.type).toBe("questionnaire");
      const questions = questionnaire?.type === "questionnaire" ? questionnaire.questions : [];
      expect(questions.length).toBeGreaterThanOrEqual(6);
      expect(questions.every((question) => question.kind === "choice")).toBe(true);
      for (const question of questions) {
        if (question.kind !== "choice") continue;
        expect(question.options.filter((option) => option.isCorrect)).toHaveLength(1);
        expect(question.explanation).toContain("Incorrect options:");
      }
    }

    expect(feed?.route).toBe("/paths/mermaid-diagram-authoring/flashcards");
    expect(feed?.cards.length).toBeGreaterThanOrEqual(16);
    expect(feed?.cards.map((card) => card.type)).toEqual(expect.arrayContaining(["concept", "practical", "snippet", "interview"]));
  });
});
