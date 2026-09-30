---
title: "Randomized Zero Matrix Interview Guide"
slug: "frontend/interview-random-matrix"
summary: "Select exactly k distinct zero positions while keeping generated React state stable and testable."
track: "Front-End Development"
topic: "Frontend Interview Practice"
difficulty: "practitioner"
tags: ["frontend", "interview", "react", "typescript", "python", "random-matrix"]
sourceRefs: ["frontend-react-arrays", "frontend-python-random"]
status: "published"
---

## What you are being asked to build

Create a 10×10 matrix filled with ones except for exactly k randomly chosen distinct positions containing zeros. Store the result in React state and regenerate on an explicit button press.

## Clarify randomness first

The supplied preparation brief describes randomly positioned zeros but does not give their count. This pack chooses **exactly k zeros**, with `k = 10` by default. Ask the interviewer whether they mean an exact count or independent probability. These contracts are different: a 10% chance for each of 100 cells has an expected count of 10, not a guarantee.

## Compare the three algorithms

Full Fisher–Yates shuffles all n positions and takes k. Partial Fisher–Yates fixes only the first k positions but still allocates its n-item pool. Reservoir sampling scans n items while retaining k positions. Every version returns an n-cell matrix, so total space cannot be O(k) when the full output is included.

Uniformity assumes independent uniform draws. The seeded generator in the playground is a reproducibility aid, not a security primitive or proof of statistical quality. Avoid random sort comparators and retry-until-distinct loops whose running time can grow badly near a full selection.

## Rehearse the explanation

Say: “I will sample indexes without replacement, then project them into fresh rows. I will test zero selections, all selections, and a fixed seed. I will store the generated board in state so an unrelated render cannot regenerate it.” Python’s `random.sample` is a useful standard-library counterpart; the companions spell out the algorithms for comparison.

## Choose a solution

| Approach | When to choose it |
| --- | --- |
| Full Fisher–Yates shuffle | Select exactly k unique cells before projecting indexes into independent matrix rows. |
| Partial Fisher–Yates shuffle | Select exactly k unique cells before projecting indexes into independent matrix rows. |
| Reservoir sampling | Select exactly k unique cells before projecting indexes into independent matrix rows. |

Start with the first approach. Learn the other two as tradeoff discussions; do not try to build all three in one interview. Each walkthrough includes a numbered recipe, correctness argument, pain points, full React/TypeScript project, and a Python logic companion.

## Senior-engineer rehearsal

1. Restate the contract and name the ambiguous rule before writing code.
2. Make the smallest visible example work, using the first approach.
3. Say the invariant aloud and demonstrate one counterexample.
4. Check correctness before discussing optimization. Include copying, output, and I/O costs.
5. Summarize what works, what you tested, and which extension you would build next.

Spend roughly 20–30 minutes on the baseline as a practice budget, then explain an alternative without coding it. This is an authored rehearsal schedule, not a claim about an actual interview duration.

## Worked example

**Input:** rows = 2, columns = 3, k = 2

**Result:** One possible board: [[1,0,1],[0,1,1]]

Exactly two distinct positions are zero; the specific positions depend on the random draws.

## Continue studying

[Open the three guided solutions](/interviews/frontend-practice/random-matrix?path=frontend-interview-practice), then [take the checkpoint](/practice/frontend/interview-random-matrix-questionnaire?path=frontend-interview-practice). The final checkpoint leads into the combined vertical review feed.

The prompts are original adaptations of privately supplied preparation material. The sources below support technical claims; they do not establish employer endorsement or interview outcomes.
