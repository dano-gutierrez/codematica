import { describe, expect, it } from "vitest";
import { selectInterviewSolutionTrack } from "./interviews";

const question = {
  slug: "two-sum-product-pair",
  title: "Two Sum Product Pair",
  solutionTracks: [
    {
      id: "hash-map",
      title: "One pass hash map",
      steps: [],
      languages: {},
    },
    {
      id: "sorted-two-pointer",
      title: "Sorted two pointer",
      steps: [],
      languages: {},
    },
  ],
};

describe("selectInterviewSolutionTrack", () => {
  it("uses the random value to pick a solution track", () => {
    expect(selectInterviewSolutionTrack(question, undefined, () => 0).id).toBe("hash-map");
    expect(selectInterviewSolutionTrack(question, undefined, () => 0.99).id).toBe("sorted-two-pointer");
  });

  it("avoids immediately repeating the previous track when another track exists", () => {
    expect(selectInterviewSolutionTrack(question, "hash-map", () => 0).id).toBe("sorted-two-pointer");
  });

  it("keeps the only track and clamps out-of-range random values", () => {
    expect(selectInterviewSolutionTrack({ solutionTracks: [question.solutionTracks[0]] }, "hash-map", () => 5).id).toBe("hash-map");
    expect(selectInterviewSolutionTrack(question, undefined, () => 5).id).toBe("sorted-two-pointer");
  });

  it("rejects malformed questions without solution tracks", () => {
    expect(() => selectInterviewSolutionTrack({ solutionTracks: [] })).toThrow(/no solution tracks/i);
  });
});
