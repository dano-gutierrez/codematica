import { describe, expect, it } from "vitest";
import { applyCodeReviewReplacement, findCodeReviewFindingAtPosition, findCodeReviewHealthyNoteAtPosition, isCodeReviewPositionInRange } from "./code-review";
import type { CodeReviewExerciseFile } from "@/lib/content/schema";

const reviewExercise = {
  slug: "programming/user-profile-review",
  title: "User Profile Boundary Review",
  type: "code-review",
  documentSlug: "programming/typescript-boundaries",
  concept: "Runtime validation",
  difficulty: "senior",
  tags: ["typescript", "code-review"],
  status: "published",
  prompt: "Find the unsafe boundary assumption.",
  files: [
    {
      path: "src/api/userProfile.ts",
      language: "typescript",
      healthyExplanation: "The import and schema definition are appropriate because runtime data should be parsed near the network boundary.",
      lines: [
        'import { z } from "zod";',
        "",
        "const userSchema = z.object({",
        "  id: z.string(),",
        "});",
        "",
        "export async function loadUserProfile(userId: string) {",
        "  const response = await fetch(`/api/users/${userId}`);",
        "  const data = await response.json();",
        "  return data as UserProfile;",
        "}",
      ],
    },
  ],
  findings: [
    {
      id: "unchecked-network-json",
      kind: "bug",
      range: {
        filePath: "src/api/userProfile.ts",
        startLine: 10,
        startColumn: 10,
        endLine: 10,
        endColumn: 30,
      },
      explanation: "Casting the network payload bypasses the runtime schema, so invalid data can enter the domain model.",
      replacementLines: ["  return userSchema.parse(data);"],
    },
  ],
  healthyNotes: [
    {
      id: "schema-import",
      range: {
        filePath: "src/api/userProfile.ts",
        startLine: 1,
        startColumn: 10,
        endLine: 1,
        endColumn: 11,
      },
      explanation: "Using Zod here is healthy because the code needs runtime validation, not only TypeScript types.",
    },
  ],
} satisfies CodeReviewExerciseFile;

describe("code review practice helpers", () => {
  it("detects positions inside an exclusive-end code range", () => {
    const range = reviewExercise.findings[0].range;

    expect(isCodeReviewPositionInRange({ line: 10, column: 10 }, range)).toBe(true);
    expect(isCodeReviewPositionInRange({ line: 10, column: 29 }, range)).toBe(true);
    expect(isCodeReviewPositionInRange({ line: 10, column: 30 }, range)).toBe(false);
    expect(isCodeReviewPositionInRange({ line: 9, column: 20 }, range)).toBe(false);
  });

  it("finds findings and healthy notes by exact click position", () => {
    expect(findCodeReviewFindingAtPosition(reviewExercise, { filePath: "src/api/userProfile.ts", line: 10, column: 17 })?.id).toBe(
      "unchecked-network-json",
    );
    expect(findCodeReviewHealthyNoteAtPosition(reviewExercise, { filePath: "src/api/userProfile.ts", line: 1, column: 10 })?.id).toBe("schema-import");
    expect(findCodeReviewFindingAtPosition(reviewExercise, { filePath: "src/api/userProfile.ts", line: 1, column: 10 })).toBeUndefined();
  });

  it("applies a finding replacement as full replacement lines", () => {
    const updatedFiles = applyCodeReviewReplacement(reviewExercise.files, reviewExercise.findings[0]);

    expect(updatedFiles[0].lines).toEqual([
      'import { z } from "zod";',
      "",
      "const userSchema = z.object({",
      "  id: z.string(),",
      "});",
      "",
      "export async function loadUserProfile(userId: string) {",
      "  const response = await fetch(`/api/users/${userId}`);",
      "  const data = await response.json();",
      "  return userSchema.parse(data);",
      "}",
    ]);
  });
});
