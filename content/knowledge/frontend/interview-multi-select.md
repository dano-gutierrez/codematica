---
title: "Multi-select with Removable Chips Interview Guide"
slug: "frontend/interview-multi-select"
summary: "Model selection and derived filtering while preserving disabled options, keyboard access, and dismissal behavior."
track: "Front-End Development"
topic: "Frontend Interview Practice"
difficulty: "practitioner"
tags: ["frontend", "interview", "react", "typescript", "python", "multi-select"]
sourceRefs: ["frontend-react-state", "frontend-react-arrays", "frontend-accessible-buttons"]
status: "published"
---

## Build requirements

Build a filterable multi-select. Selecting an enabled option adds a removable chip, clears the input, and removes that option from the dropdown. Show matching disabled options as unavailable. Close the list when interaction moves outside the component. Show No results when nothing matches.

## Keep the state small

The essential state is selected IDs, filter text, and whether the dropdown is open. Derive the options from the original catalog each time. Selected choices are excluded; matching disabled choices remain visible. Reject unknown, disabled, and duplicate selections.

## Follow one interaction

Type “script” → TypeScript appears → select it → a chip appears and the query clears → TypeScript disappears from options → remove its chip → TypeScript is available again. A query such as “zzzz” shows No results. Clicking elsewhere, moving focus outside, or pressing Escape closes the list.

## Three state designs, one filtering rule

Local state is suitable for the initial implementation. A reducer gives names to events and makes growing rules easy to test. A controlled component with a hook moves ownership to a parent. These are architecture alternatives with the same filter algorithm; none turns a label scan into constant-time search.

## Keyboard and focus

The solutions use a labeled text input and native buttons. Tab moves to controls, Enter/Space activates buttons, and Escape dismisses. Chips have labels such as “Remove TypeScript.” Disabled controls stay visible but cannot activate. A true combobox role would require its full composite keyboard behavior, not just these attributes.

## Python transfer

The Python versions model events and derived options. They cannot exercise browser focus, outside clicks, or React cleanup; those behaviors are verified in the actual React implementations.

## Choose a solution

| Approach | When to choose it |
| --- | --- |
| Local state and derived options | Keep selection, query, and open state together; derive visible options on every render. |
| Reducer transitions | Name every event and use a pure reducer to make state transitions explicit. |
| Controlled selection model | Separate a parent-owned controller from the controlled presentation component. |

Build the first approach and discuss the other two as alternatives; do not build all three in one interview. Each walkthrough includes numbered steps, a correctness argument, pitfalls, a full React/TypeScript project, and a Python logic companion.

## Senior-engineer rehearsal

1. Restate the contract and name the ambiguous rule before writing code.
2. Make the smallest visible example work, using the first approach.
3. Say the invariant aloud and demonstrate one counterexample.
4. Check correctness before discussing optimization. Include copying, output, and I/O costs.
5. Summarize what works, what you tested, and which extension you would build next.

Practice the baseline for roughly 20–30 minutes, then explain an alternative without coding it. This suggested rehearsal schedule does not describe an actual interview duration.

## Worked example

**Input:** Type "script", choose TypeScript, then remove its chip.

**Result:** TypeScript becomes selected, input clears, and it disappears from results; removal restores it.

The dropdown is derived from current selection and query, so the two views cannot drift.

## Continue studying

[Open the three guided solutions](/interviews/frontend-practice/multi-select?path=frontend-interview-practice), then [take the checkpoint](/practice/frontend/interview-multi-select-questionnaire?path=frontend-interview-practice). The final checkpoint leads into the combined vertical review feed.

These original prompts adapt privately supplied preparation material. The sources support technical claims, not employer endorsement or interview outcomes.
