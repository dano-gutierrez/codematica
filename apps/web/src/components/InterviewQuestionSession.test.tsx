import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InterviewQuestionSession } from "./InterviewQuestionSession";

const question = {
  id: "question-1",
  slug: "two-sum-product-pair",
  title: "Two Sum Product Pair",
  summary: "Find two values that add to a target.",
  prompt: "Given a list of integers and a target, return the indices of two numbers whose sum equals the target.",
  difficulty: "foundation" as const,
  tags: ["arrays", "hash-map"],
  route: "/interviews/amazon/two-sum-product-pair",
  companySlug: "amazon",
  companyName: "Amazon",
  sourceLinks: [{ label: "Reported public Amazon list", url: "https://www.vervecopilot.com/blog/amazon-leetcode-interview-questions" }],
  resources: [],
  constraints: ["Return any one valid pair."],
  examples: [{ input: "[2, 7, 11, 15], 9", output: "[0, 1]", explanation: "2 + 7 = 9." }],
  diagrams: [],
  solutionTracks: [
    {
      id: "hash-map",
      title: "One pass hash map",
      summary: "Store complements as you scan.",
      steps: [
        { title: "Track seen values", explanation: "Keep earlier values in a map by value." },
        { title: "Close the pair", explanation: "Return when the complement is already present." },
      ],
      explanation: "Every earlier value is available when the later partner appears.",
      complexity: { time: "O(n)", space: "O(n)" },
      languages: {
        python: { label: "Python", code: "def two_sum(nums, target):\n    return []" },
        typescript: { label: "TypeScript", code: "export function twoSum(): number[] {\n  return [];\n}" },
        java: { label: "Java", code: "int[] twoSum(int[] nums, int target) {\n  return new int[0];\n}" },
      },
    },
    {
      id: "sorted-two-pointer",
      title: "Sorted two pointer",
      summary: "Sort value/index pairs and walk inward.",
      steps: [
        { title: "Sort pairs", explanation: "Keep original indexes while sorting values." },
        { title: "Move pointers", explanation: "Move left or right depending on the sum." },
      ],
      explanation: "Sorted order tells which direction can still reach the target.",
      complexity: { time: "O(n log n)", space: "O(n)" },
      languages: {
        python: { label: "Python", code: "def two_sum_sorted(nums, target):\n    return []" },
        typescript: { label: "TypeScript", code: "export function twoSumSorted(): number[] {\n  return [];\n}" },
        java: { label: "Java", code: "int[] twoSumSorted(int[] nums, int target) {\n  return new int[0];\n}" },
      },
    },
  ],
};

describe("InterviewQuestionSession", () => {
  it("reveals guided steps, switches languages, and restarts with another solution track", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0);
    const onProgressEvent = vi.fn();

    render(<InterviewQuestionSession question={question} onProgressEvent={onProgressEvent} />);

    await waitFor(() => expect(randomSpy).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("interview-solution-track")).toHaveTextContent("One pass hash map");
    expect(screen.getByTestId("interview-step-position")).toHaveTextContent("Step 1 of 2");
    expect(screen.getByText("Track seen values")).toBeVisible();
    expect(screen.queryByText("Close the pair")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByTestId("interview-step-position")).toHaveTextContent("Step 2 of 2");
    expect(screen.getByText("Close the pair")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Solution language"), { target: { value: "java" } });
    fireEvent.click(screen.getByRole("button", { name: /show full explanation/i }));

    expect(screen.getByTestId("interview-final-explanation")).toHaveTextContent("Every earlier value is available");
    expect(screen.getByTestId("interview-code")).toHaveTextContent("int[] twoSum");
    expect(onProgressEvent).toHaveBeenCalledWith("completed", expect.objectContaining({ stepIndex: 2, language: "java", trackId: "hash-map" }));

    fireEvent.click(screen.getByRole("button", { name: /restart/i }));

    expect(screen.getByTestId("interview-solution-track")).toHaveTextContent("Sorted two pointer");
    randomSpy.mockRestore();
  });
});
