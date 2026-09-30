---
title: "Recursive File Explorer Interview Guide"
slug: "frontend/interview-file-explorer"
summary: "Combine both supplied tree briefs into a recursive explorer with explicit expansion-state behavior."
track: "Front-End Development"
topic: "Frontend Interview Practice"
difficulty: "practitioner"
tags: ["frontend", "interview", "react", "typescript", "python", "file-explorer"]
sourceRefs: ["frontend-react-state", "frontend-react-keys"]
status: "published"
---

## What you are being asked to build

Render nested file/folder mock data using FileExplorer and a recursive FileItem. Support expanding and collapsing folders, an empty-data message, indentation, and vertical hierarchy lines for expanded children.

## Combined source contract

The two supplied file-explorer briefs describe the same core exercise. This guide combines the explicit recursive FileItem requirement with empty data, indentation, and vertical hierarchy lines. Files and folders have stable IDs and names; only folders have child arrays. An empty folder remains a folder.

## Choose state ownership deliberately

The local version puts a boolean in each folder. Closing an ancestor conditionally removes its subtree, so descendant booleans reset. The controlled version stores expanded IDs in the root and preserves them while descendants are hidden. The normalized version stores nodes by ID and recursively follows child IDs. All three are valid when you state the collapse policy.

## What to avoid

Do not key by filename: `index.ts` can exist in many folders. Do not mutate a Set and return the same state reference. Do not normalize solely to claim faster rendering; visible nodes still need to render. Preprocessing, Set cloning, recursive depth, and output construction all count.

## Data and accessibility boundary

The sample is a finite acyclic tree with globally unique IDs. If input becomes untrusted, ask about cycle detection and depth limits. Use nested lists and native buttons with `aria-expanded`. A full ARIA tree widget is a separate keyboard contract; adding a role without its interactions does not make the explorer accessible.

## Choose a solution

| Approach | When to choose it |
| --- | --- |
| Recursive local state | Let each folder component own its expanded flag for the shortest implementation. |
| Controlled expanded IDs | Keep expansion IDs in the parent while preserving recursive FileItem rendering. |
| Normalized recursive tree | Normalize nodes by ID once, then render recursively from child ID references. |

Start with the first approach. Learn the other two as tradeoff discussions; do not try to build all three in one interview. Each walkthrough includes a numbered recipe, correctness argument, pain points, full React/TypeScript project, and a Python logic companion.

## Senior-engineer rehearsal

1. Restate the contract and name the ambiguous rule before writing code.
2. Make the smallest visible example work, using the first approach.
3. Say the invariant aloud and demonstrate one counterexample.
4. Check correctness before discussing optimization. Include copying, output, and I/O costs.
5. Summarize what works, what you tested, and which extension you would build next.

Spend roughly 20–30 minutes on the baseline as a practice budget, then explain an alternative without coding it. This is an authored rehearsal schedule, not a claim about an actual interview duration.

## Worked example

**Input:** src folder contains components folder containing FileExplorer.tsx.

**Result:** Opening src reveals components; opening components reveals the file one level deeper.

Closing src hides every descendant. On reopening, descendant expansion follows the selected approach’s documented ownership policy.

## Continue studying

[Open the three guided solutions](/interviews/frontend-practice/file-explorer?path=frontend-interview-practice), then [take the checkpoint](/practice/frontend/interview-file-explorer-questionnaire?path=frontend-interview-practice). The final checkpoint leads into the combined vertical review feed.

The prompts are original adaptations of privately supplied preparation material. The sources below support technical claims; they do not establish employer endorsement or interview outcomes.
