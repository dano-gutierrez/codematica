---
title: "Dynamic Rectangular Board Interview Guide"
slug: "frontend/interview-dynamic-board"
summary: "Render independently sized rows and columns and explain React identity, state, refs, and memoization."
track: "Front-End Development"
topic: "Frontend Interview Practice"
difficulty: "practitioner"
tags: ["frontend", "interview", "react", "typescript", "python", "dynamic-board"]
sourceRefs: ["frontend-react-arrays", "frontend-react-hooks"]
status: "published"
---

## Build requirements

Build a React board with independently configurable rows and columns. Render zero-based coordinates in each cell and keep the layout readable. This exercise focuses on rendering, not game rules.

## Reason about React before adding hooks

`useState` owns rows and columns because changing them changes the screen. `useRef` retains a mutable value, such as a DOM reference, without scheduling rendering when `.current` changes. `useMemo` caches a calculated value; `useCallback` caches a function definition. These caches are performance tools, so correctness must survive recalculation. For this small grid, start without either memo hook.

React keys identify siblings across renders. Keys do not prevent rerenders. A coordinate key is appropriate for a stateless position, while a user or file that can move needs its own ID. Rendering a component and committing DOM changes are different phases; a render does not imply replacing every DOM node.

## Work the rectangle by hand

For two rows and three columns, flat indexes are 0 through 5. Divide by **columns** to get the row and take the remainder to get the column. Index 5 maps to row 1, column 2. Test 0 rows in the model, one column, and a non-square rectangle. The UI deliberately limits dimensions to 1–50 to keep this exercise usable.

## Python transfer

`[[0] * columns] * rows` aliases the same row. A comprehension that creates a new inner list on each iteration avoids that mistake. A generator can postpone creating rows, but converting it to a list and displaying every cell still materializes the full result.

## Choose a solution

| Approach | When to choose it |
| --- | --- |
| Nested rows | Build the rectangular structure explicitly, then render one row at a time. |
| Flat indexes | Use a flat position to derive row and column, with CSS Grid owning the layout. |
| Generated rows | Generate independent rows and render them through a reusable row component. |

Build the first approach and discuss the other two as alternatives; do not build all three in one interview. Each walkthrough includes numbered steps, a correctness argument, pitfalls, a full React/TypeScript project, and a Python logic companion.

## Senior-engineer rehearsal

1. Restate the contract and name the ambiguous rule before writing code.
2. Make the smallest visible example work, using the first approach.
3. Say the invariant aloud and demonstrate one counterexample.
4. Check correctness before discussing optimization. Include copying, output, and I/O costs.
5. Summarize what works, what you tested, and which extension you would build next.

Practice the baseline for roughly 20–30 minutes, then explain an alternative without coding it. This suggested rehearsal schedule does not describe an actual interview duration.

## Worked example

**Input:** rows = 2, columns = 3

**Result:** (0,0) (0,1) (0,2); (1,0) (1,1) (1,2)

Six cells cover the Cartesian product of the two row indexes and three column indexes.

## Continue studying

[Review React state snapshots and async callbacks](/docs/frontend/react-state-async-callbacks) if a delayed callback reads old state after a setter. The supplementary lesson includes a reproducible bug, a complete fix, and a checkpoint.

[Open the three guided solutions](/interviews/frontend-practice/dynamic-board?path=frontend-interview-practice), then [take the checkpoint](/practice/frontend/interview-dynamic-board-questionnaire?path=frontend-interview-practice). The final checkpoint leads into the combined vertical review feed.

These original prompts adapt privately supplied preparation material. The sources support technical claims, not employer endorsement or interview outcomes.
