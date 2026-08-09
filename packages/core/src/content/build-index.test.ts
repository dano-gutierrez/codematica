import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildContentIndex, collectMermaidDiagrams, serializeContentIndex } from "./build-index";
import { getContentIndex } from "./index";

async function makeTempRoot() {
  return mkdtemp(path.join(os.tmpdir(), "codematica-content-"));
}

async function writeKnowledge(rootDir: string, slug: string, diagramRefs: string[] = [], sourceRefs: string[] = []) {
  const filePath = path.join(rootDir, "content", "knowledge", `${slug}.md`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    `---
title: Test Document
slug: ${slug}
summary: This is a valid summary for a generated test document.
track: System Design
topic: Caching
difficulty: senior
tags: [caching]
prerequisites: []
diagramRefs: ${JSON.stringify(diagramRefs)}
sourceRefs: ${JSON.stringify(sourceRefs)}
status: published
---

## Test Heading

Cache aside is a useful pattern.
`,
  );
}

async function writeDiagram(rootDir: string, slug: string) {
  const filePath = path.join(rootDir, "content", "diagrams", `${slug}.mmd`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, "flowchart LR\n  A --> B\n");
}

async function writeExercise(rootDir: string, slug: string, overrides: Record<string, unknown> = {}) {
  const filePath = path.join(rootDir, "content", "exercises", `${slug}.json`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify(
      {
        slug,
        title: "Cache Aside Recall",
        type: "flashcard",
        documentSlug: "system-design/cache-invalidation",
        concept: "Cache invalidation",
        difficulty: "senior",
        tags: ["caching"],
        status: "published",
        prompt: "What makes cache invalidation a product contract?",
        answer: "The acceptable stale state is a user-facing tradeoff.",
        explanation: "Freshness, latency, cost, and ownership define the product behavior.",
        ...overrides,
      },
      null,
      2,
    ),
  );
}

async function writeQuestionnaire(rootDir: string, slug: string, overrides: Record<string, unknown> = {}) {
  const filePath = path.join(rootDir, "content", "exercises", `${slug}.json`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify(
      {
        slug,
        title: "Python Runtime Questionnaire",
        type: "questionnaire",
        documentSlug: "programming/python-runtime-model",
        concept: "Python runtime model",
        difficulty: "senior",
        tags: ["python", "javascript"],
        status: "published",
        questions: [
          {
            id: "choice-runtime",
            kind: "choice",
            prompt: "Which review note best describes Python annotations at runtime?",
            options: [
              { id: "compile", label: "They block execution like TypeScript compile errors.", isCorrect: false },
              { id: "metadata", label: "They are metadata for tools unless code explicitly inspects them.", isCorrect: true },
              { id: "jit", label: "They drive runtime JIT specialization.", isCorrect: false },
            ],
            explanation: "Python keeps annotations available to tools, but they do not enforce values by themselves.",
          },
          {
            id: "cloze-runtime",
            kind: "cloze",
            prompt: "Fill the gap.",
            template: "Use {{blank}} at the trust boundary instead of assuming annotations validate input.",
            acceptedAnswers: ["runtime validation", "validation"],
            explanation: "Python annotations are not a substitute for runtime parsing of untrusted data.",
          },
          {
            id: "order-runtime",
            kind: "ordering",
            prompt: "Order the boundary flow.",
            items: [
              { id: "receive", label: "Receive unknown input" },
              { id: "validate", label: "Validate and normalize" },
              { id: "use", label: "Use typed domain model" },
            ],
            correctOrder: ["receive", "validate", "use"],
            explanation: "The boundary should narrow unknown data before domain code depends on it.",
          },
          {
            id: "match-runtime",
            kind: "matching",
            prompt: "Match the Python concept to the JS/TS comparison.",
            pairs: [
              { id: "dict", prompt: "dict", match: "plain object or Map depending on key needs" },
              { id: "none", prompt: "None", match: "null-like singleton" },
            ],
            explanation: "The comparisons are useful starting points, but each has runtime differences.",
          },
        ],
        ...overrides,
      },
      null,
      2,
    ),
  );
}

async function writeLanguageCharacters(rootDir: string, overrides: Record<string, unknown> = {}) {
  const filePath = path.join(rootDir, "content", "languages", "japanese", "characters.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify(
      {
        kind: "characters",
        language: "ja",
        items: [
          {
            slug: "japanese/kanji/one",
            language: "ja",
            writingSystem: "kanji",
            glyph: "一",
            title: "Kanji One",
            summary: "The kanji for the number one.",
            meanings: ["one"],
            readings: [{ label: "on", value: "いち", ipa: "itɕi" }],
            romaji: "ichi",
            ipa: "itɕi",
            tags: ["kanji", "number"],
            status: "published",
            strokes: [{ id: "s1", points: [[18, 50], [82, 50]] }],
          },
        ],
        ...overrides,
      },
      null,
      2,
    ),
  );
}

async function writeWritingExercise(rootDir: string, slug: string, overrides: Record<string, unknown> = {}) {
  const filePath = path.join(rootDir, "content", "exercises", `${slug}.json`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify(
      {
        slug,
        title: "Starter Kanji Writing",
        type: "writing",
        documentSlug: "languages/japanese-starter-kanji",
        concept: "Starter kanji",
        difficulty: "foundation",
        tags: ["japanese", "kanji"],
        status: "published",
        prompt: "Write starter kanji with correct stroke order.",
        characterSlugs: ["japanese/kanji/one"],
        modes: ["assisted", "free"],
        explanation: "Writing checks use local stroke data.",
        ...overrides,
      },
      null,
      2,
    ),
  );
}

async function writeLanguageVocabulary(rootDir: string, characterSlug = "japanese/kanji/one") {
  const filePath = path.join(rootDir, "content", "languages", "japanese", "vocabulary.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify({
    kind: "vocabulary",
    language: "ja",
    items: [{
      slug: "japanese/vocabulary/one",
      expression: "一",
      reading: "いち",
      romaji: "ichi",
      ipa: "itɕi",
      meanings: ["one"],
      characterSlugs: ["japanese/kanji/one"],
      segments: [{ text: "一", reading: "いち", romaji: "ichi", meaning: "one", characterSlugs: [characterSlug] }],
      tags: ["number", "n5"],
      status: "published",
    }],
  }, null, 2));
}

async function writeLearningPath(rootDir: string, slug: string, nodeSlug = "system-design/cache-invalidation", overrides: Record<string, unknown> = {}) {
  const filePath = path.join(rootDir, "content", "learning-paths", `${slug}.json`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify(
      {
        slug,
        title: "System Design Fundamentals",
        summary: "A short path through cache design and practice.",
        kind: "skill",
        category: "System Design",
        audience: "Engineers preparing for production design reviews.",
        status: "published",
        units: [
          {
            slug: "caching",
            title: "Caching Contracts",
            summary: "Learn how cache behavior maps to product tradeoffs.",
            nodes: [
              { kind: "document", slug: nodeSlug },
              { kind: "diagram", slug: "system-design/cache-aside" },
              { kind: "exercise", slug: "system-design/cache-aside-recall" },
            ],
          },
        ],
        ...overrides,
      },
      null,
      2,
    ),
  );
}

async function writeSourceCatalog(rootDir: string) {
  const filePath = path.join(rootDir, "content", "sources", "test-sources.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify({
    sources: [{
      id: "test-primary-source",
      title: "Authoritative test source",
      provider: "Test University",
      url: "https://example.com/curriculum",
      attribution: "Test University curriculum authors",
      license: { name: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
      lastVerifiedAt: "2026-08-07",
      upstream: { maturity: "published" },
    }],
  }, null, 2));
}

async function writeDocumentOnlyLearningPath(rootDir: string, slug: string, nodeSlug: string) {
  const filePath = path.join(rootDir, "content", "learning-paths", `${slug}.json`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify(
      {
        slug,
        title: "Python For TypeScript And JavaScript Engineers",
        summary: "A short path through Python runtime and typing concepts.",
        kind: "skill",
        category: "Programming",
        audience: "TypeScript and JavaScript engineers refreshing Python.",
        status: "published",
        units: [
          {
            slug: "runtime",
            title: "Python Runtime",
            summary: "Learn how Python runtime behavior differs from JavaScript assumptions.",
            nodes: [{ kind: "document", slug: nodeSlug }],
          },
        ],
      },
      null,
      2,
    ),
  );
}

async function writePassiveFlashcardFeed(rootDir: string, overrides: Record<string, unknown> = {}) {
  const filePath = path.join(rootDir, "content", "flashcard-feeds", "python-for-ts-js-engineers.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify(
      {
        slug: "python-for-ts-js-engineers",
        pathSlug: "python-for-ts-js-engineers",
        title: "Python Flashcard Feed",
        summary: "Passive Python flashcards for short mobile refresh sessions.",
        audience: "TypeScript and JavaScript engineers refreshing senior Python concepts.",
        status: "published",
        cards: [
          {
            id: "names-bind-objects",
            type: "concept",
            title: "Names Bind Objects",
            prompt: "Python variables are names bound to objects, not typed storage boxes.",
            explanation: "Assignment rebinds a name. Mutating a list through one name changes the shared object that another name may also reference.",
            difficulty: "senior",
            tags: ["runtime", "objects"],
            sourceDocSlug: "programming/python-runtime-model",
          },
          {
            id: "annotations-are-contract-metadata",
            type: "interview",
            title: "Annotations Are Metadata",
            prompt: "Do Python annotations enforce input values at runtime?",
            explanation: "No. Type checkers and tools use annotations, but runtime validation must be explicit at trust boundaries.",
            difficulty: "senior",
            tags: ["typing", "validation"],
            sourceDocSlug: "programming/python-types-and-contracts",
            code: "def load_user(user_id: int) -> User:\n    ...",
          },
        ],
        ...overrides,
      },
      null,
      2,
    ),
  );
}

async function writeInterviewCompany(rootDir: string, slug: string, overrides: Record<string, unknown> = {}) {
  const filePath = path.join(rootDir, "content", "interviews", `${slug}.json`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify(
      {
        kind: "company",
        slug,
        name: "Amazon",
        logo: {
          src: "/company-logos/amazon.svg",
          alt: "Amazon logo",
        },
        summary: "Practice array, cache, and frequency-ranking problems common in Amazon-style interview prep.",
        status: "published",
        questions: [
          {
            kind: "algorithm",
            slug: "two-sum-product-pair",
            title: "Two Sum Product Pair",
            summary: "Find two values that add to a target while preserving their original positions.",
            prompt: "Given a list of integers and a target, return the indices of two numbers whose sum equals the target.",
            difficulty: "foundation",
            tags: ["arrays", "hash-map"],
            sourceLinks: [{ label: "Reported public Amazon list", url: "https://www.vervecopilot.com/blog/amazon-leetcode-interview-questions" }],
            resources: [{ label: "Hash table refresher", url: "https://en.wikipedia.org/wiki/Hash_table" }],
            examples: [
              {
                input: "nums = [2, 7, 11, 15], target = 9",
                output: "[0, 1]",
                explanation: "nums[0] + nums[1] is 9.",
              },
            ],
            constraints: ["Return any one valid pair.", "Each input has at most one expected pair for this prompt."],
            diagrams: [
              {
                title: "Complement lookup",
                mermaid: "flowchart LR\n  A[Read value] --> B[Need target - value]\n  B --> C{Seen?}\n  C -->|yes| D[Return pair]\n  C -->|no| E[Store value index]",
              },
            ],
            solutionTracks: [makeSolutionTrack("hash-map", "One pass hash map"), makeSolutionTrack("sorted-two-pointer", "Sorted two pointer")],
          },
        ],
        ...overrides,
      },
      null,
      2,
    ),
  );
}

async function writeRealWorldInterview(rootDir: string, overrides: Record<string, unknown> = {}) {
  const filePath = path.join(rootDir, "content", "interviews", "real-world.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify(
      {
        kind: "real-world",
        slug: "real-world",
        name: "Real-world interviews",
        summary: "Anonymous interview exercises based on real product-engineering sessions.",
        status: "published",
        questions: [
          {
            kind: "web",
            slug: "mondrian-composition-generator",
            title: "Generate a Mondrian-style Composition",
            summary: "Build a bounded random composition with React, TypeScript, and browser layout primitives.",
            prompt: "Create a browser-only application that generates a new Piet Mondrian-style composition whenever the page loads.",
            difficulty: "senior",
            tags: ["react", "typescript", "generative-art"],
            sourceLinks: [],
            sourceNote: "Based on a privately supplied real interview brief; the originating company is intentionally withheld.",
            resources: [],
            examples: [],
            constraints: ["Use orthogonal geometry and bounded randomness."],
            diagrams: [],
            evaluation: {
              intent: "Evaluate scoping, collaboration, visual decomposition, and maintainable implementation choices.",
              expectedSignals: ["Separate pure generation from rendering."],
              acceptanceCriteria: [{ title: "Bounded geometry", explanation: "Every generated region remains inside the composition." }],
              redFlags: [{ title: "Randomize during render", explanation: "Unstable render output causes flicker and makes behavior difficult to test." }],
            },
            solutionTracks: [makeWebSolutionTrack("css-grid"), makeWebSolutionTrack("recursive-subdivision"), makeWebSolutionTrack("svg-geometry")],
          },
        ],
        ...overrides,
      },
      null,
      2,
    ),
  );
}

function makeWebSolutionTrack(id: string) {
  return {
    id,
    title: `Web solution ${id}`,
    summary: "Generate valid rectangular geometry with a pure helper and render it with browser-native primitives.",
    steps: [
      { title: "Generate geometry", explanation: "Create bounded geometry once from a seed so React rerenders remain stable." },
      { title: "Render the result", explanation: "Map the generated model to declarative browser elements and accessible controls." },
    ],
    explanation: "The generator owns visual rules while the renderer only translates validated geometry into browser elements.",
    acceptanceRationale: "This is acceptable because it delivers the scoped visual grammar and leaves explicit extension seams.",
    tradeoffs: ["The MVP approximates the style instead of reproducing a specific painting."],
    complexity: { time: "O(n)", space: "O(n)" },
    project: {
      runtime: "react-ts",
      activeFile: "/App.tsx",
      visibleFiles: ["/App.tsx", "/generator.ts", "/styles.css"],
      files: {
        "/App.tsx": { code: "export default function App() { return <main>Composition</main>; }" },
        "/generator.ts": { code: "export function generate(seed: number) { return { seed }; }" },
        "/styles.css": { code: "main { min-height: 20rem; background: #f6f1df; }" },
      },
      dependencies: {},
    },
  };
}

function makeSolutionTrack(id: string, title: string) {
  return {
    id,
    title,
    summary: "Use a small deterministic data structure to reduce repeated scanning.",
    steps: [
      {
        title: "State the invariant",
        explanation: "Track what has already been seen so each next value can close the pair immediately.",
      },
      {
        title: "Return the first match",
        explanation: "When the needed complement is present, the stored index and current index form a complete answer.",
      },
    ],
    explanation: "The approach works because every earlier value is stored before later values are checked against it.",
    complexity: {
      time: "O(n)",
      space: "O(n)",
    },
    languages: {
      python: {
        label: "Python",
        code: "def two_sum(nums, target):\n    seen = {}\n    for i, value in enumerate(nums):\n        if target - value in seen:\n            return [seen[target - value], i]\n        seen[value] = i\n    return []",
      },
      typescript: {
        label: "TypeScript",
        code: "export function twoSum(nums: number[], target: number): number[] {\n  const seen = new Map<number, number>();\n  for (let i = 0; i < nums.length; i += 1) {\n    const need = target - nums[i];\n    if (seen.has(need)) return [seen.get(need)!, i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}",
      },
      java: {
        label: "Java",
        code: "int[] twoSum(int[] nums, int target) {\n  Map<Integer, Integer> seen = new HashMap<>();\n  for (int i = 0; i < nums.length; i++) {\n    int need = target - nums[i];\n    if (seen.containsKey(need)) return new int[] { seen.get(need), i };\n    seen.put(nums[i], i);\n  }\n  return new int[0];\n}",
      },
    },
  };
}

async function writeHomeDiscovery(rootDir: string) {
  const filePath = path.join(rootDir, "content", "discovery", "home.json");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify({
      sections: {
        paths: [{ kind: "path", slug: "missing-path" }],
        lessons: [{ kind: "document", slug: "missing/document" }],
        interviews: [{ kind: "interview-question", slug: "missing/question" }],
        practice: [{ kind: "exercise", slug: "missing/exercise" }],
        languages: [{ kind: "language-hub", slug: "japanese" }],
      },
    }),
  );
}

describe("buildContentIndex", () => {
  it("rebuilds the committed generated index from canonical repository content", async () => {
    const rootDir = path.resolve(import.meta.dirname, "../../../..");
    const rebuilt = await buildContentIndex({ rootDir });
    expect(serializeContentIndex(rebuilt)).toBe(serializeContentIndex(getContentIndex()));
    expect(rebuilt.languageAudio).toEqual(getContentIndex().languageAudio);
    expect(rebuilt.languageResources.length).toBeGreaterThan(0);
    expect(rebuilt.learningPaths.some((learningPath) => learningPath.progression)).toBe(true);
  });

  it("indexes documents and external Mermaid diagrams", async () => {
    const rootDir = await makeTempRoot();
    await writeDiagram(rootDir, "system-design/cache-aside");
    await writeKnowledge(rootDir, "system-design/cache-invalidation", ["system-design/cache-aside"]);
    await writeExercise(rootDir, "system-design/cache-aside-recall");
    await writeLearningPath(rootDir, "system-design-fundamentals");

    const index = await buildContentIndex({ rootDir });

    expect(index.schemaVersion).toBe(10);
    expect(index.documents).toHaveLength(1);
    expect(index.diagrams).toHaveLength(1);
    expect(index.exercises).toEqual([
      expect.objectContaining({
        slug: "system-design/cache-aside-recall",
        route: "/practice/system-design/cache-aside-recall",
        type: "flashcard",
      }),
    ]);
    expect(index.learningPaths).toEqual([
      expect.objectContaining({
        slug: "system-design-fundamentals",
        route: "/paths/system-design-fundamentals",
        units: [
          expect.objectContaining({
            nodes: [
              { kind: "document", slug: "system-design/cache-invalidation" },
              { kind: "diagram", slug: "system-design/cache-aside" },
              { kind: "exercise", slug: "system-design/cache-aside-recall" },
            ],
          }),
        ],
      }),
    ]);
    expect(index.tracks).toEqual([
      {
        name: "System Design",
        slug: "system-design",
        documentCount: 1,
        difficulties: ["senior"],
        topics: ["Caching"],
      },
    ]);
  });

  it("rejects incomplete primary-source contracts on source-linked paths", async () => {
    const missingPathSourceRoot = await makeTempRoot();
    await writeKnowledge(missingPathSourceRoot, "system-design/cache-invalidation");
    await writeLearningPath(missingPathSourceRoot, "missing-path-source", undefined, { sourceRefs: ["missing-source"] });
    await expect(buildContentIndex({ rootDir: missingPathSourceRoot })).rejects.toThrow(/references missing source/i);

    const requiredSourceRoot = await makeTempRoot();
    await writeKnowledge(requiredSourceRoot, "system-design/cache-invalidation");
    await writeLearningPath(requiredSourceRoot, "required-source", undefined, { sourcePolicy: "required" });
    await expect(buildContentIndex({ rootDir: requiredSourceRoot })).rejects.toThrow(/requires primary source references/i);

    const missingNodeSourceRoot = await makeTempRoot();
    await writeLearningPath(missingNodeSourceRoot, "missing-node-source", undefined, {
      units: [{
        slug: "source-unit",
        title: "Source Unit",
        summary: "Follow an authoritative source through a local companion.",
        nodes: [{ kind: "source", slug: "ml-systems/introduction", sourceRef: "missing-source", activity: "read", companionKind: "document" }],
      }],
    });
    await expect(buildContentIndex({ rootDir: missingNodeSourceRoot })).rejects.toThrow(/references missing source/i);

    const documentAttributionRoot = await makeTempRoot();
    await writeSourceCatalog(documentAttributionRoot);
    await writeKnowledge(documentAttributionRoot, "system-design/cache-invalidation");
    await writeLearningPath(documentAttributionRoot, "document-attribution", undefined, { sourcePolicy: "required", sourceRefs: ["test-primary-source"] });
    await expect(buildContentIndex({ rootDir: documentAttributionRoot })).rejects.toThrow(/document node.*needs a primary source/i);

    const exerciseAttributionRoot = await makeTempRoot();
    await writeSourceCatalog(exerciseAttributionRoot);
    await writeKnowledge(exerciseAttributionRoot, "system-design/cache-invalidation", [], ["test-primary-source"]);
    await writeExercise(exerciseAttributionRoot, "system-design/cache-aside-recall");
    await writeLearningPath(exerciseAttributionRoot, "exercise-attribution", undefined, {
      sourcePolicy: "required",
      sourceRefs: ["test-primary-source"],
      units: [{
        slug: "practice-unit",
        title: "Practice Unit",
        summary: "Practice against an authoritative source and retain evidence.",
        nodes: [{ kind: "exercise", slug: "system-design/cache-aside-recall" }],
      }],
    });
    await expect(buildContentIndex({ rootDir: exerciseAttributionRoot })).rejects.toThrow(/exercise node.*needs a primary source/i);
  });

  it("rejects path nodes that reference skills outside the career taxonomy", async () => {
    const rootDir = await makeTempRoot();
    await writeKnowledge(rootDir, "system-design/cache-invalidation");
    await writeLearningPath(rootDir, "unknown-career-skill", undefined, {
      units: [{
        slug: "career-unit",
        title: "Career Unit",
        summary: "Build a stable skill through a source-linked career unit.",
        nodes: [{ kind: "document", slug: "system-design/cache-invalidation", skillIds: ["unknown-skill"] }],
      }],
      progression: {
        framework: "career",
        roadmapLabel: "Career roadmap",
        skills: [{ id: "known-skill", label: "Known skill", category: "systems", description: "A valid career skill used by the learning path." }],
        stages: [{
          id: "future-stage",
          label: "Future Stage",
          level: "Planned",
          status: "planned",
          summary: "A future career stage with a stable outcome contract.",
          unitSlugs: ["career-unit"],
          outcomes: [{ id: "known-outcome", statement: "Apply the known skill in a bounded systems task.", skillId: "known-skill" }],
          requiredNodeSlugs: [],
          estimatedMinutes: 60,
        }],
      },
    });

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/references missing skill/i);
  });

  it("fails when home discovery references missing content", async () => {
    const rootDir = await makeTempRoot();
    await writeHomeDiscovery(rootDir);

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/home discovery.*references missing content/i);
  });

  it("indexes passive flashcard feeds for learning paths", async () => {
    const rootDir = await makeTempRoot();
    await writeKnowledge(rootDir, "programming/python-runtime-model");
    await writeKnowledge(rootDir, "programming/python-types-and-contracts");
    await writeDocumentOnlyLearningPath(rootDir, "python-for-ts-js-engineers", "programming/python-runtime-model");
    await writePassiveFlashcardFeed(rootDir);

    const index = await buildContentIndex({ rootDir });

    expect(index.passiveFlashcardFeeds).toEqual([
      expect.objectContaining({
        slug: "python-for-ts-js-engineers",
        pathSlug: "python-for-ts-js-engineers",
        route: "/paths/python-for-ts-js-engineers/flashcards",
        cards: [
          expect.objectContaining({ id: "names-bind-objects", type: "concept" }),
          expect.objectContaining({ id: "annotations-are-contract-metadata", type: "interview", code: expect.any(String) }),
        ],
      }),
    ]);
  });

  it("fails when a passive flashcard feed has duplicate card IDs", async () => {
    const rootDir = await makeTempRoot();
    await writeKnowledge(rootDir, "programming/python-runtime-model");
    await writeDocumentOnlyLearningPath(rootDir, "python-for-ts-js-engineers", "programming/python-runtime-model");
    await writePassiveFlashcardFeed(rootDir, {
      cards: [
        {
          id: "duplicate-card",
          type: "concept",
          title: "First Duplicate",
          prompt: "Python names are bindings to objects.",
          explanation: "The card is valid by itself but duplicates another card ID in the same feed.",
          difficulty: "senior",
          tags: ["runtime"],
          sourceDocSlug: "programming/python-runtime-model",
        },
        {
          id: "duplicate-card",
          type: "practical",
          title: "Second Duplicate",
          prompt: "Review shared mutable defaults carefully.",
          explanation: "The repeated ID should fail index generation before the feed is shipped.",
          difficulty: "senior",
          tags: ["runtime"],
          sourceDocSlug: "programming/python-runtime-model",
        },
      ],
    });

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/duplicate passive flashcard card id/i);
  });

  it("fails when a passive flashcard feed references a missing path", async () => {
    const rootDir = await makeTempRoot();
    await writeKnowledge(rootDir, "programming/python-runtime-model");
    await writePassiveFlashcardFeed(rootDir);

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/references missing learning path/);
  });

  it("fails when a passive flashcard card references a missing document", async () => {
    const rootDir = await makeTempRoot();
    await writeKnowledge(rootDir, "programming/python-runtime-model");
    await writeDocumentOnlyLearningPath(rootDir, "python-for-ts-js-engineers", "programming/python-runtime-model");
    await writePassiveFlashcardFeed(rootDir, {
      cards: [
        {
          id: "missing-doc",
          type: "concept",
          title: "Missing Doc",
          prompt: "Cards may point back to source documents.",
          explanation: "A source document slug must resolve so authors do not create stale references.",
          difficulty: "senior",
          tags: ["docs"],
          sourceDocSlug: "programming/missing-python-doc",
        },
      ],
    });

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/references missing document/);
  });

  it("fails when a document references a missing external diagram", async () => {
    const rootDir = await makeTempRoot();
    await writeKnowledge(rootDir, "system-design/cache-invalidation", ["system-design/missing"]);

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/references missing diagram/);
  });

  it("fails when a path references a missing node", async () => {
    const rootDir = await makeTempRoot();
    await writeDiagram(rootDir, "system-design/cache-aside");
    await writeKnowledge(rootDir, "system-design/cache-invalidation", ["system-design/cache-aside"]);
    await writeExercise(rootDir, "system-design/cache-aside-recall");
    await writeLearningPath(rootDir, "system-design-fundamentals", "system-design/missing");

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/references missing document/);
  });

  it("fails when an exercise references a missing document", async () => {
    const rootDir = await makeTempRoot();
    await writeDiagram(rootDir, "system-design/cache-aside");
    await writeKnowledge(rootDir, "system-design/cache-invalidation", ["system-design/cache-aside"]);
    await writeExercise(rootDir, "system-design/cache-aside-recall", {
      documentSlug: "system-design/missing",
    });
    await writeLearningPath(rootDir, "system-design-fundamentals");

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/references missing document/);
  });

  it("fails when a writing exercise references a missing language character", async () => {
    const rootDir = await makeTempRoot();
    await writeKnowledge(rootDir, "languages/japanese-starter-kanji");
    await writeLanguageCharacters(rootDir);
    await writeWritingExercise(rootDir, "languages/japanese-starter-kanji-writing", {
      characterSlugs: ["japanese/kanji/missing"],
    });

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/references missing language character/);
  });

  it("fails when a vocabulary breakdown references a missing language character", async () => {
    const rootDir = await makeTempRoot();
    await writeLanguageCharacters(rootDir);
    await writeLanguageVocabulary(rootDir, "japanese/kanji/missing");

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/references missing language character/);
  });

  it("indexes writing exercises and language characters", async () => {
    const rootDir = await makeTempRoot();
    await writeKnowledge(rootDir, "languages/japanese-starter-kanji");
    await writeLanguageCharacters(rootDir);
    await writeWritingExercise(rootDir, "languages/japanese-starter-kanji-writing");

    const index = await buildContentIndex({ rootDir });

    expect(index.languageCharacters).toEqual([
      expect.objectContaining({
        slug: "japanese/kanji/one",
        route: "/languages/japanese/characters/kanji/one",
        glyph: "一",
      }),
    ]);
    expect(index.exercises).toEqual([
      expect.objectContaining({
        slug: "languages/japanese-starter-kanji-writing",
        type: "writing",
        characterSlugs: ["japanese/kanji/one"],
      }),
    ]);
  });

  it("fails when a cloze exercise does not contain exactly one blank", async () => {
    const rootDir = await makeTempRoot();
    await writeDiagram(rootDir, "system-design/cache-aside");
    await writeKnowledge(rootDir, "system-design/cache-invalidation", ["system-design/cache-aside"]);
    await writeExercise(rootDir, "system-design/cache-aside-recall", {
      type: "cloze",
      prompt: "Fill the gap.",
      template: "Use {{blank}} when {{blank}}.",
      acceptedAnswers: ["versioned keys"],
      explanation: "Cloze prompts must have one answer slot.",
    });
    await writeLearningPath(rootDir, "system-design-fundamentals");

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/exactly one \{\{blank\}\}/);
  });

  it("fails on duplicate exercise slugs", async () => {
    const rootDir = await makeTempRoot();
    await writeDiagram(rootDir, "system-design/cache-aside");
    await writeKnowledge(rootDir, "system-design/cache-invalidation", ["system-design/cache-aside"]);
    await writeExercise(rootDir, "system-design/cache-aside-recall");
    await writeExercise(rootDir, "system-design/cache-aside-copy", {
      slug: "system-design/cache-aside-recall",
    });
    await writeLearningPath(rootDir, "system-design-fundamentals");

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/Duplicate exercise slug/);
  });

  it("indexes questionnaire exercises", async () => {
    const rootDir = await makeTempRoot();
    await writeKnowledge(rootDir, "programming/python-runtime-model");
    await writeQuestionnaire(rootDir, "programming/python-runtime-questionnaire");

    const index = await buildContentIndex({ rootDir });

    expect(index.exercises).toEqual([
      expect.objectContaining({
        slug: "programming/python-runtime-questionnaire",
        route: "/practice/programming/python-runtime-questionnaire",
        type: "questionnaire",
        questions: expect.arrayContaining([
          expect.objectContaining({ id: "choice-runtime", kind: "choice" }),
          expect.objectContaining({ id: "cloze-runtime", kind: "cloze" }),
          expect.objectContaining({ id: "order-runtime", kind: "ordering" }),
          expect.objectContaining({ id: "match-runtime", kind: "matching" }),
        ]),
      }),
    ]);
  });

  it("fails when a questionnaire has duplicate question IDs", async () => {
    const rootDir = await makeTempRoot();
    await writeKnowledge(rootDir, "programming/python-runtime-model");
    await writeQuestionnaire(rootDir, "programming/python-runtime-questionnaire", {
      questions: [
        {
          id: "duplicate",
          kind: "choice",
          prompt: "Which review note best describes Python annotations at runtime?",
          options: [
            { id: "compile", label: "They block execution like TypeScript compile errors.", isCorrect: false },
            { id: "metadata", label: "They are metadata for tools unless code explicitly inspects them.", isCorrect: true },
          ],
          explanation: "Python keeps annotations available to tools, but they do not enforce values by themselves.",
        },
        {
          id: "duplicate",
          kind: "cloze",
          prompt: "Fill the gap.",
          template: "Use {{blank}} at the trust boundary instead of assuming annotations validate input.",
          acceptedAnswers: ["runtime validation"],
          explanation: "Python annotations are not a substitute for runtime parsing of untrusted data.",
        },
      ],
    });

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/duplicate questionnaire question id/i);
  });

  it("fails when a choice question does not have exactly one correct option", async () => {
    const rootDir = await makeTempRoot();
    await writeKnowledge(rootDir, "programming/python-runtime-model");
    await writeQuestionnaire(rootDir, "programming/python-runtime-questionnaire", {
      questions: [
        {
          id: "bad-choice",
          kind: "choice",
          prompt: "Which review note best describes Python annotations at runtime?",
          options: [
            { id: "compile", label: "They block execution like TypeScript compile errors.", isCorrect: true },
            { id: "metadata", label: "They are metadata for tools unless code explicitly inspects them.", isCorrect: true },
          ],
          explanation: "Python keeps annotations available to tools, but they do not enforce values by themselves.",
        },
      ],
    });

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/exactly one correct option/i);
  });

  it("fails when questionnaire cloze templates do not contain exactly one blank", async () => {
    const rootDir = await makeTempRoot();
    await writeKnowledge(rootDir, "programming/python-runtime-model");
    await writeQuestionnaire(rootDir, "programming/python-runtime-questionnaire", {
      questions: [
        {
          id: "bad-cloze",
          kind: "cloze",
          prompt: "Fill the gap.",
          template: "Use {{blank}} after {{blank}}.",
          acceptedAnswers: ["runtime validation"],
          explanation: "Python annotations are not a substitute for runtime parsing of untrusted data.",
        },
      ],
    });

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/questionnaire cloze question.*exactly one \{\{blank\}\}/i);
  });

  it("fails when ordering items or correct order IDs are invalid", async () => {
    const rootDir = await makeTempRoot();
    await writeKnowledge(rootDir, "programming/python-runtime-model");
    await writeQuestionnaire(rootDir, "programming/python-runtime-questionnaire", {
      questions: [
        {
          id: "bad-order",
          kind: "ordering",
          prompt: "Order the boundary flow.",
          items: [
            { id: "receive", label: "Receive unknown input" },
            { id: "receive", label: "Validate and normalize" },
          ],
          correctOrder: ["receive", "validate"],
          explanation: "The boundary should narrow unknown data before domain code depends on it.",
        },
      ],
    });

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/duplicate ordering item id/i);
  });

  it("fails when a matching question has duplicate pair IDs", async () => {
    const rootDir = await makeTempRoot();
    await writeKnowledge(rootDir, "programming/python-runtime-model");
    await writeQuestionnaire(rootDir, "programming/python-runtime-questionnaire", {
      questions: [
        {
          id: "bad-match",
          kind: "matching",
          prompt: "Match the Python concept to the JS/TS comparison.",
          pairs: [
            { id: "dict", prompt: "dict", match: "plain object or Map depending on key needs" },
            { id: "dict", prompt: "None", match: "null-like singleton" },
          ],
          explanation: "The comparisons are useful starting points, but each has runtime differences.",
        },
      ],
    });

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/duplicate matching pair id/i);
  });

  it("indexes reported public interview companies and guided coding questions", async () => {
    const rootDir = await makeTempRoot();
    await writeInterviewCompany(rootDir, "amazon");

    const index = await buildContentIndex({ rootDir });

    expect(index.schemaVersion).toBe(10);
    expect(index.interviewCollections).toEqual([
      expect.objectContaining({
        slug: "amazon",
        route: "/interviews/amazon",
        questions: [
          expect.objectContaining({
            slug: "two-sum-product-pair",
            route: "/interviews/amazon/two-sum-product-pair",
            sourceLinks: [expect.objectContaining({ url: "https://www.vervecopilot.com/blog/amazon-leetcode-interview-questions" })],
            solutionTracks: [
              expect.objectContaining({
                id: "hash-map",
                languages: expect.objectContaining({
                  python: expect.any(Object),
                  typescript: expect.any(Object),
                  java: expect.any(Object),
                }),
              }),
              expect.objectContaining({ id: "sorted-two-pointer" }),
            ],
          }),
        ],
      }),
    ]);
  });

  it("indexes anonymous real-world web interviews and reusable projects", async () => {
    const rootDir = await makeTempRoot();
    await writeRealWorldInterview(rootDir);

    const index = await buildContentIndex({ rootDir });

    expect(index.interviewCollections).toEqual([
      expect.objectContaining({
        kind: "real-world",
        slug: "real-world",
        questions: [
          expect.objectContaining({
            kind: "web",
            slug: "mondrian-composition-generator",
            sourceLinks: [],
            sourceNote: expect.stringMatching(/company is intentionally withheld/i),
            solutionTracks: expect.arrayContaining([
              expect.objectContaining({
                id: "css-grid",
                project: expect.objectContaining({
                  runtime: "react-ts",
                  activeFile: "/App.tsx",
                  visibleFiles: ["/App.tsx", "/generator.ts", "/styles.css"],
                }),
              }),
            ]),
          }),
        ],
      }),
    ]);
  });

  it("requires three solution tracks for web interviews", async () => {
    const rootDir = await makeTempRoot();
    const question = {
      kind: "web",
      slug: "mondrian-composition-generator",
      title: "Generate a Mondrian-style Composition",
      summary: "Build a bounded random composition with React, TypeScript, and browser layout primitives.",
      prompt: "Create a browser-only application that generates a new Piet Mondrian-style composition whenever the page loads.",
      difficulty: "senior",
      tags: ["react", "typescript"],
      sourceLinks: [],
      sourceNote: "Based on a privately supplied real interview brief; the originating company is intentionally withheld.",
      evaluation: {
        intent: "Evaluate practical frontend scoping and implementation choices.",
        expectedSignals: ["Separate pure generation from rendering."],
        acceptanceCriteria: [{ title: "Bounded geometry", explanation: "Every generated region stays inside the canvas." }],
        redFlags: [{ title: "Render randomness", explanation: "Changing randomness on every render creates unstable output." }],
      },
      solutionTracks: [makeWebSolutionTrack("css-grid"), makeWebSolutionTrack("svg-geometry")],
    };
    await writeRealWorldInterview(rootDir, { questions: [question] });

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/at least 3|too_small/i);
  });

  it("rejects unsafe or missing web project file paths", async () => {
    const rootDir = await makeTempRoot();
    const invalid = makeWebSolutionTrack("unsafe-path");
    invalid.project.activeFile = "/missing.tsx";
    (invalid.project.files as Record<string, { code: string }>)["../escape.ts"] = { code: "export const unsafe = true;" };
    await writeRealWorldInterview(rootDir, {
      questions: [
        {
          kind: "web",
          slug: "mondrian-composition-generator",
          title: "Generate a Mondrian-style Composition",
          summary: "Build a bounded random composition with React, TypeScript, and browser layout primitives.",
          prompt: "Create a browser-only application that generates a new Piet Mondrian-style composition whenever the page loads.",
          difficulty: "senior",
          tags: ["react", "typescript"],
          sourceLinks: [],
          sourceNote: "Based on a privately supplied real interview brief; the originating company is intentionally withheld.",
          evaluation: {
            intent: "Evaluate practical frontend scoping and implementation choices.",
            expectedSignals: ["Separate pure generation from rendering."],
            acceptanceCriteria: [{ title: "Bounded geometry", explanation: "Every generated region stays inside the canvas." }],
            redFlags: [{ title: "Render randomness", explanation: "Changing randomness on every render creates unstable output." }],
          },
          solutionTracks: [invalid, makeWebSolutionTrack("recursive"), makeWebSolutionTrack("svg")],
        },
      ],
    });

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/project file path|active file/i);
  });

  it("requires anonymous provenance for real-world interviews", async () => {
    const rootDir = await makeTempRoot();
    await writeRealWorldInterview(rootDir, {
      questions: [
        {
          kind: "web",
          slug: "mondrian-composition-generator",
          title: "Generate a Mondrian-style Composition",
          summary: "Build a bounded random composition with React, TypeScript, and browser layout primitives.",
          prompt: "Create a browser-only application that generates a new Piet Mondrian-style composition whenever the page loads.",
          difficulty: "senior",
          tags: ["react", "typescript"],
          sourceLinks: [],
          solutionTracks: [makeWebSolutionTrack("grid"), makeWebSolutionTrack("recursive"), makeWebSolutionTrack("svg")],
          evaluation: {
            intent: "Evaluate practical frontend scoping and implementation choices.",
            expectedSignals: ["Separate pure generation from rendering."],
            acceptanceCriteria: [{ title: "Bounded geometry", explanation: "Every generated region stays inside the canvas." }],
            redFlags: [{ title: "Render randomness", explanation: "Changing randomness on every render creates unstable output." }],
          },
        },
      ],
    });

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/provenance|source note/i);
  });

  it("fails when an interview question has no public source links", async () => {
    const rootDir = await makeTempRoot();
    await writeInterviewCompany(rootDir, "amazon", {
      questions: [
        {
          slug: "two-sum-product-pair",
          title: "Two Sum Product Pair",
          summary: "Find two values that add to a target while preserving their original positions.",
          prompt: "Given a list of integers and a target, return the indices of two numbers whose sum equals the target.",
          difficulty: "foundation",
          tags: ["arrays", "hash-map"],
          sourceLinks: [],
          solutionTracks: [makeSolutionTrack("hash-map", "One pass hash map"), makeSolutionTrack("sorted-two-pointer", "Sorted two pointer")],
        },
      ],
    });

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/source/i);
  });

  it("fails when an interview solution omits a required language", async () => {
    const rootDir = await makeTempRoot();
    const incompleteTrack = makeSolutionTrack("hash-map", "One pass hash map");
    delete (incompleteTrack.languages as Record<string, unknown>).java;
    await writeInterviewCompany(rootDir, "amazon", {
      questions: [
        {
          slug: "two-sum-product-pair",
          title: "Two Sum Product Pair",
          summary: "Find two values that add to a target while preserving their original positions.",
          prompt: "Given a list of integers and a target, return the indices of two numbers whose sum equals the target.",
          difficulty: "foundation",
          tags: ["arrays", "hash-map"],
          sourceLinks: [{ label: "Reported public Amazon list", url: "https://www.vervecopilot.com/blog/amazon-leetcode-interview-questions" }],
          solutionTracks: [incompleteTrack, makeSolutionTrack("sorted-two-pointer", "Sorted two pointer")],
        },
      ],
    });

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/java/i);
  });

  it("fails when an interview company has duplicate question slugs", async () => {
    const rootDir = await makeTempRoot();
    const duplicateQuestion = {
      slug: "two-sum-product-pair",
      title: "Two Sum Product Pair Copy",
      summary: "Find two values that add to a target while preserving their original positions.",
      prompt: "Given a list of integers and a target, return the indices of two numbers whose sum equals the target.",
      difficulty: "foundation",
      tags: ["arrays", "hash-map"],
      sourceLinks: [{ label: "Reported public Amazon list", url: "https://www.vervecopilot.com/blog/amazon-leetcode-interview-questions" }],
      solutionTracks: [makeSolutionTrack("hash-map-copy", "One pass hash map"), makeSolutionTrack("sorted-two-pointer-copy", "Sorted two pointer")],
    };
    await writeInterviewCompany(rootDir, "amazon", {
      questions: [duplicateQuestion, duplicateQuestion],
    });

    await expect(buildContentIndex({ rootDir })).rejects.toThrow(/duplicate interview question slug/i);
  });
});

describe("collectMermaidDiagrams", () => {
  it("indexes .mmd and .mermaid files", async () => {
    const rootDir = await makeTempRoot();
    await writeDiagram(rootDir, "system-design/cache-aside");
    const mermaidPath = path.join(rootDir, "content", "diagrams", "system-design", "write-invalidation.mermaid");
    await mkdir(path.dirname(mermaidPath), { recursive: true });
    await writeFile(mermaidPath, "flowchart LR\n  W --> C\n");

    const diagrams = await collectMermaidDiagrams(rootDir);

    expect(diagrams.map((diagram) => diagram.slug)).toEqual([
      "system-design/cache-aside",
      "system-design/write-invalidation",
    ]);
  });
});
