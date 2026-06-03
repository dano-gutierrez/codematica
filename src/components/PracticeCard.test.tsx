import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LearningExercise } from "@/lib/content/schema";
import { PracticeCard } from "./PracticeCard";

const baseExercise = {
  id: "practice-1",
  slug: "system-design/cache-practice",
  title: "Cache Practice",
  documentSlug: "system-design/cache-invalidation",
  concept: "Cache invalidation",
  difficulty: "senior" as const,
  tags: ["caching"],
  status: "published" as const,
  route: "/practice/system-design/cache-practice",
  sourcePath: "content/exercises/system-design/cache-practice.json",
  contentHash: "hash",
};

const codeReviewExercise = {
  ...baseExercise,
  slug: "programming/user-profile-review",
  title: "User Profile Boundary Review",
  type: "code-review",
  documentSlug: "programming/typescript-boundaries",
  concept: "Runtime validation",
  tags: ["typescript", "code-review"],
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
      kind: "bug" as const,
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
} satisfies LearningExercise;

describe("PracticeCard", () => {
  it("reveals flashcard answers on demand", () => {
    render(
      <PracticeCard
        exercise={{
          ...baseExercise,
          type: "flashcard",
          prompt: "What makes cache invalidation a product contract?",
          answer: "The acceptable stale state is a user-facing tradeoff.",
          explanation: "Freshness, latency, cost, and ownership define the product behavior.",
        }}
      />,
    );

    expect(screen.queryByText("The acceptable stale state is a user-facing tradeoff.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));

    expect(screen.getByText("The acceptable stale state is a user-facing tradeoff.")).toBeVisible();
    expect(screen.getByText("Freshness, latency, cost, and ownership define the product behavior.")).toBeVisible();
  });

  it("checks cloze answers case-insensitively after trimming", () => {
    render(
      <PracticeCard
        exercise={{
          ...baseExercise,
          type: "cloze",
          prompt: "Fill the gap.",
          template: "Use {{blank}} when derived cache deletion is unreliable.",
          acceptedAnswers: ["versioned keys"],
          explanation: "Versioned keys avoid needing to delete every derived key.",
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Answer"), { target: { value: "  VERSIONED KEYS  " } });
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByText("Correct")).toBeVisible();
    expect(screen.getByText("Versioned keys avoid needing to delete every derived key.")).toBeVisible();
  });

  it("runs questionnaire questions one screen at a time with immediate feedback", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.99);

    render(
      <PracticeCard
        exercise={{
          ...baseExercise,
          type: "questionnaire",
          title: "Python Runtime Questionnaire",
          concept: "Python runtime model",
          documentSlug: "programming/python-runtime-model",
          questions: [
            {
              id: "choice-runtime",
              kind: "choice",
              prompt: "Which review note best describes Python annotations at runtime?",
              options: [
                { id: "compile", label: "They block execution like TypeScript compile errors.", isCorrect: false },
                { id: "metadata", label: "They are metadata for tools unless code explicitly inspects them.", isCorrect: true },
              ],
              explanation: "Python keeps annotations available to tools, but they do not enforce values by themselves.",
            },
            {
              id: "cloze-runtime",
              kind: "cloze",
              prompt: "Fill the gap for Python boundary safety.",
              template: "Use {{blank}} at the trust boundary.",
              acceptedAnswers: ["runtime validation"],
              explanation: "Python annotations are not a substitute for runtime parsing of untrusted data.",
            },
          ],
        }}
      />,
    );

    await waitFor(() => expect(screen.getByTestId("questionnaire-session")).toHaveAttribute("data-ready", "true"));
    expect(screen.getByTestId("questionnaire-position")).toHaveTextContent("Question 1 of 2");
    expect(screen.getByText("Which review note best describes Python annotations at runtime?")).toBeVisible();
    expect(screen.queryByText("Fill the gap for Python boundary safety.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("They are metadata for tools unless code explicitly inspects them."));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));

    expect(screen.getByTestId("questionnaire-feedback")).toHaveTextContent("Correct");
    expect(screen.getByText("Python keeps annotations available to tools, but they do not enforce values by themselves.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByTestId("questionnaire-position")).toHaveTextContent("Question 2 of 2");
    expect(screen.getByText("Fill the gap for Python boundary safety.")).toBeVisible();

    randomSpy.mockRestore();
  });

  it("explains healthy code review clicks and increments attempts", () => {
    render(<PracticeCard exercise={codeReviewExercise} />);

    expect(screen.getByTestId("code-review-token-src-api-userprofile-ts-7-0").querySelector(".hljs-keyword")).not.toBeNull();

    fireEvent.click(screen.getByTestId("code-review-healthy-schema-import"));

    expect(screen.getByTestId("code-review-attempts")).toHaveTextContent("Attempts 1");
    expect(screen.getByRole("alert")).toHaveTextContent("Healthy code");
    expect(screen.getByRole("alert")).toHaveTextContent("Using Zod here is healthy");
  });

  it("fixes a code review finding and reveals the path next link after completion", () => {
    render(<PracticeCard exercise={codeReviewExercise} nextHref="/practice/programming/runtime-boundary-cloze" />);

    fireEvent.click(screen.getByTestId("code-review-finding-unchecked-network-json"));

    expect(screen.getByTestId("code-review-attempts")).toHaveTextContent("Attempts 1");
    expect(screen.getByRole("dialog")).toHaveTextContent("Casting the network payload bypasses the runtime schema");
    expect(screen.getByTestId("code-review-token-src-api-userprofile-ts-10-0")).toHaveTextContent("return userSchema.parse(data);");
    expect(screen.getByTestId("code-review-complete")).toHaveTextContent("Review complete");
    expect(screen.getByRole("link", { name: /next node/i })).toHaveAttribute("href", "/practice/programming/runtime-boundary-cloze");
  });
});
