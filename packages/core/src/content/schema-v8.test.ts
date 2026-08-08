import { describe, expect, it } from "vitest";
import { contentSourceCatalogFileSchema, languageExternalResourceCatalogFileSchema, learningPathFileSchema, webExerciseProjectSchema } from "./schema";

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

describe("content schema v9", () => {
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
