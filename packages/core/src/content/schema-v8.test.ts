import { describe, expect, it } from "vitest";
import {
  contentSourceCatalogFileSchema,
  languageAudioCatalogFileSchema,
  languageExternalResourceCatalogFileSchema,
  languageGrammarCatalogFileSchema,
  languageVocabularyCatalogFileSchema,
  learningPathFileSchema,
  questionnaireExerciseFileSchema,
  webExerciseProjectSchema,
} from "./schema";

const outcomes = [
  { id: "hear-detail", statement: "I can hear one familiar detail in a short exchange.", skillId: "a1-listening" },
  { id: "read-detail", statement: "I can read one familiar detail in a short exchange.", skillId: "a1-reading" },
  { id: "write-detail", statement: "I can write one familiar detail in a short message.", skillId: "a1-writing" },
  { id: "share-detail", statement: "I can share one familiar detail in a short exchange.", skillId: "a1-interaction" },
] as const;

function pathWithOutcomes(stageOutcomes: unknown[]) {
  return {
    slug: "japanese-test",
    title: "Japanese Test",
    summary: "A sufficiently detailed Japanese test learning path summary.",
    kind: "skill",
    category: "Languages",
    audience: "English-speaking beginner learners.",
    status: "published",
    sourcePolicy: "optional",
    units: [{ slug: "first-unit", title: "First Unit", summary: "A sufficiently detailed first test unit summary.", nodes: [{ kind: "document", slug: "languages/test" }] }],
    progression: {
      framework: "jf-standard",
      roadmapLabel: "Pre-A1 to A1 roadmap",
      reviewRoute: "/languages/japanese/review",
      skills: [
        { id: "a1-listening", label: "A1 listening", category: "listening", description: "Hear short familiar concrete messages." },
        { id: "a1-reading", label: "A1 reading", category: "reading", description: "Read short familiar concrete messages." },
        { id: "a1-writing", label: "A1 writing", category: "writing", description: "Write short familiar concrete messages." },
        { id: "a1-interaction", label: "A1 interaction", category: "interaction", description: "Complete a short familiar exchange." },
      ],
      stages: [{ id: "first-stage", label: "First Stage", level: "A1", status: "published", summary: "A sufficiently detailed first stage summary.", unitSlugs: ["first-unit"], outcomes: stageOutcomes, requiredNodeSlugs: ["languages/test"], checkpointExerciseSlug: "languages/test-checkpoint", passThreshold: 0.8, estimatedMinutes: 60 }],
    },
  };
}

describe("content schema v10", () => {
  it("parses generic progression metadata and node defaults remain optional", () => {
    const parsed = learningPathFileSchema.parse(pathWithOutcomes([...outcomes]));
    expect(parsed.progression?.stages[0]?.level).toBe("A1");
    expect(parsed.units[0]?.nodes[0]).toEqual({ kind: "document", slug: "languages/test" });
  });

  it("rejects duplicate outcome identifiers", () => {
    expect(() => learningPathFileSchema.parse(pathWithOutcomes([...outcomes, { ...outcomes[0] }]))).toThrow(/Duplicate outcome id/);
  });

  it("accepts source nodes and a versioned source catalog", () => {
    const parsed = learningPathFileSchema.parse({
      ...pathWithOutcomes([...outcomes]),
      units: [{ slug: "first-unit", title: "First Unit", summary: "A sufficiently detailed first test unit summary.", nodes: [{ kind: "source", slug: "ml-systems/introduction", sourceRef: "harvard-vol1-introduction", activity: "read", companionKind: "document" }] }],
      progression: undefined,
    });
    expect(parsed.units[0]?.nodes[0]?.kind).toBe("source");

    expect(contentSourceCatalogFileSchema.parse({
      sources: [{ id: "harvard-vol1-introduction", title: "Introduction", provider: "Harvard University", url: "https://mlsysbook.ai/vol1/introduction/introduction.html", attribution: "Vijay Janapa Reddi, Harvard University", license: { name: "CC BY-NC-SA 4.0", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/" }, lastVerifiedAt: "2026-08-06", upstream: { repository: "harvard-edge/cs249r_book", ref: "dev", commit: "5964e31a24f5823fdfcce4e60cf896c26a7aca9f", maturity: "published" } }],
    }).sources).toHaveLength(1);
  });

  it("requires access, publisher, attribution, and reuse policy for resources", () => {
    expect(() => languageExternalResourceCatalogFileSchema.parse({ kind: "resources", language: "ja", items: [{ id: "resource", title: "Resource", description: "A sufficiently detailed resource summary.", publisher: "Publisher", url: "https://example.com", proficiencyLevels: ["a1"], skills: ["reading"], access: "free", availability: "online", attribution: "Publisher" }] })).toThrow();
  });

  it("parses N5 vocabulary study metadata and structured grammar", () => {
    const vocabulary = languageVocabularyCatalogFileSchema.parse({
      kind: "vocabulary",
      language: "ja",
      items: [{
        slug: "japanese/vocabulary/gakusei",
        expression: "学生",
        reading: "がくせい",
        romaji: "gakusei",
        ipa: "gakɯseː",
        meanings: ["student"],
        wordClass: ["noun"],
        studyOrder: 1,
        unitSlugs: ["identity-and-demonstratives"],
        jlptAlignment: "n5",
        tags: ["people", "school"],
        status: "published",
      }],
    });
    expect(vocabulary.items[0]).toMatchObject({ studyOrder: 1, jlptAlignment: "n5", wordClass: ["noun"] });

    const grammar = languageGrammarCatalogFileSchema.parse({
      kind: "grammar",
      language: "ja",
      items: [{
        id: "copula-desu",
        title: "Polite copula です",
        pattern: "Noun + です",
        meaning: "States that something is or identifies as a noun.",
        formation: ["学生です"],
        notes: ["Use です for a polite neutral statement."],
        studyOrder: 1,
        unitSlug: "identity-and-demonstratives",
        proficiencyLevel: "a1",
        jlptAlignment: "n5",
        examples: [{ japanese: "私は学生です。", reading: "わたしはがくせいです。", romaji: "watashi wa gakusei desu.", translation: "I am a student." }],
        status: "published",
      }],
    });
    expect(grammar.items[0]?.id).toBe("copula-desu");
  });

  it("parses Japanese open-answer and approval-gated listening questions", () => {
    const parsed = questionnaireExerciseFileSchema.parse({
      slug: "languages/n5-open-answer",
      title: "N5 Open Answer",
      documentSlug: "languages/japanese-first-connections",
      concept: "N5 sentence production",
      difficulty: "foundation",
      tags: ["japanese", "n5"],
      status: "published",
      type: "questionnaire",
      questions: [
        { id: "introduce", kind: "open-answer", prompt: "Write: I am a student.", template: "{{blank}}", acceptedAnswers: ["私は学生です。", "わたしはがくせいです。"], inputMode: "japanese-ime", explanation: "Use は to mark the topic and です for a polite statement." },
        { id: "hear-student", kind: "listening-choice", prompt: "What did the speaker say?", audioId: "n5-hear-student", options: [{ id: "student", label: "I am a student.", isCorrect: true }, { id: "teacher", label: "I am a teacher.", isCorrect: false }], explanation: "Listen for 学生です." },
      ],
    });
    expect(parsed.questions.map((question) => question.kind)).toEqual(["open-answer", "listening-choice"]);
  });

  it("keeps generated TTS draft metadata separate from publish approval", () => {
    const parsed = languageAudioCatalogFileSchema.parse({
      kind: "audio",
      language: "ja",
      items: [{
        id: "n5-hear-student",
        transcript: "私は学生です。",
        reading: "わたしはがくせいです。",
        speaker: "OpenAI marin",
        license: "OpenAI generated output",
        attribution: "Generated for Codematica",
        assetPath: "audio/n5-hear-student.mp3",
        qaStatus: "draft",
        disclosure: "AI-generated voice",
        provenance: { kind: "openai-tts", model: "gpt-4o-mini-tts", voice: "marin", instructions: "Speak clear standard Tokyo Japanese.", generatedAt: "2026-08-09T00:00:00.000Z", checksum: "a".repeat(64) },
      }],
    });
    expect(parsed.items[0]?.qaStatus).toBe("draft");
  });

  it("rejects active, entry, and visible project files absent from the file map", () => {
    const result = webExerciseProjectSchema.safeParse({
      runtime: "react-ts",
      files: { "/App.tsx": { code: "export default function App() {}" } },
      activeFile: "/missing.tsx",
      entry: "/entry.tsx",
      visibleFiles: ["/visible.tsx"],
      dependencies: {},
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.path[0])).toEqual(["activeFile", "entry", "visibleFiles"]);
  });
});
