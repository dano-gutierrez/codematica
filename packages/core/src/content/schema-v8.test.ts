import { describe, expect, it } from "vitest";
import { languageExternalResourceCatalogFileSchema, learningPathFileSchema, webExerciseProjectSchema } from "./schema";

const canDos = [
  { id: "hear-detail", statement: "I can hear one familiar detail in a short exchange.", skill: "listening" },
  { id: "read-detail", statement: "I can read one familiar detail in a short exchange.", skill: "reading" },
  { id: "write-detail", statement: "I can write one familiar detail in a short message.", skill: "writing" },
  { id: "share-detail", statement: "I can share one familiar detail in a short exchange.", skill: "interaction" },
] as const;

function pathWithCanDos(stageCanDos: unknown[]) {
  return {
    slug: "japanese-test",
    title: "Japanese Test",
    summary: "A sufficiently detailed Japanese test learning path summary.",
    kind: "skill",
    category: "Languages",
    audience: "English-speaking beginner learners.",
    status: "published",
    units: [{ slug: "first-unit", title: "First Unit", summary: "A sufficiently detailed first test unit summary.", nodes: [{ kind: "document", slug: "languages/test" }] }],
    progression: {
      framework: "jf-standard",
      skills: [{ id: "a1-reading", label: "A1 reading", skill: "reading", description: "Read short familiar concrete messages." }],
      stages: [{ id: "first-stage", label: "First Stage", proficiencyLevel: "a1", summary: "A sufficiently detailed first stage summary.", unitSlugs: ["first-unit"], canDos: stageCanDos, requiredNodeSlugs: ["languages/test"], checkpointExerciseSlug: "languages/test-checkpoint", passThreshold: 0.8, estimatedMinutes: 60 }],
    },
  };
}

describe("content schema v8", () => {
  it("parses JF progression metadata and node defaults remain optional", () => {
    const parsed = learningPathFileSchema.parse(pathWithCanDos([...canDos]));
    expect(parsed.progression?.stages[0]?.proficiencyLevel).toBe("a1");
    expect(parsed.units[0]?.nodes[0]).toEqual({ kind: "document", slug: "languages/test" });
  });

  it("rejects duplicate Can-do identifiers", () => {
    expect(() => learningPathFileSchema.parse(pathWithCanDos([...canDos, { ...canDos[0] }]))).toThrow(/Duplicate Can-do id/);
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
