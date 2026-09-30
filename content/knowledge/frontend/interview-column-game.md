---
title: "Column-drop 6×7 Game Interview Guide"
slug: "frontend/interview-column-game"
summary: "Model legal turns and detect contiguous horizontal or vertical wins without adding unstated game rules."
track: "Front-End Development"
topic: "Frontend Interview Practice"
difficulty: "practitioner"
tags: ["frontend", "interview", "react", "typescript", "python", "column-game"]
sourceRefs: ["frontend-react-arrays", "frontend-react-state"]
status: "published"
---

## What you are being asked to build

Build a 6×7 board where clicking any cell drops a token into the lowest empty cell in its column. Alternate R and Y after valid nonterminal moves. Four contiguous horizontal or vertical tokens wins; stop the game and display the result.

## Identify the difference before coding

This 6×7 brief uses **column insertion**. The pointer chooses a column; the token goes into its lowest empty cell, matching the supplied illustration. Four contiguous horizontal or vertical tokens wins. The familiar diagonal rule is not in this contract.

## Build the baseline first

Render a bordered rectangle with R/Y labels, then support one legal drop and alternating turns. Scan the selected column from the bottom. If there is no space, return the old state and keep the player. Winner detection happens after insertion. Stop transitions after a winner or draw.

## Explain the representations

A row-major matrix makes rendering simple. A column stack makes gravity natural: append a token and map bottom-up stack indexes into top-down display rows. The stack solution still projects a matrix for this renderer, so its full move is not constant time just because it checks few winning windows.

## Think aloud under pressure

Say: “I will make the board interactive first, then prove the horizontal and vertical checks. I can optimize around the last move because it is the only changed cell.” Count the center once when scanning two directions. Test a full column, a fourth token on an edge, a diagonal-only pattern, and terminal clicks.

## Choose a solution

| Approach | When to choose it |
| --- | --- |
| Full-board scan | Keep each move atomic: validate, place, detect terminal state, and change turns only after a valid nonterminal move. |
| Last-move directional scan | Keep each move atomic: validate, place, detect terminal state, and change turns only after a valid nonterminal move. |
| Column stacks and winning windows | Keep each move atomic: validate, place, detect terminal state, and change turns only after a valid nonterminal move. |

Start with the first approach. Learn the other two as tradeoff discussions; do not try to build all three in one interview. Each walkthrough includes a numbered recipe, correctness argument, pain points, full React/TypeScript project, and a Python logic companion.

## Senior-engineer rehearsal

1. Restate the contract and name the ambiguous rule before writing code.
2. Make the smallest visible example work, using the first approach.
3. Say the invariant aloud and demonstrate one counterexample.
4. Check correctness before discussing optimization. Include copying, output, and I/O costs.
5. Summarize what works, what you tested, and which extension you would build next.

Spend roughly 20–30 minutes on the baseline as a practice budget, then explain an alternative without coding it. This is an authored rehearsal schedule, not a claim about an actual interview duration.

## Worked example

**Input:** R occupies bottom-row columns 0, 1, 2; R drops into column 3.

**Result:** R wins; later clicks leave the state unchanged.

The new token completes four adjacent tokens on the allowed horizontal axis.

## Continue studying

[Open the three guided solutions](/interviews/frontend-practice/column-game?path=frontend-interview-practice), then [take the checkpoint](/practice/frontend/interview-column-game-questionnaire?path=frontend-interview-practice). The final checkpoint leads into the combined vertical review feed.

The prompts are original adaptations of privately supplied preparation material. The sources below support technical claims; they do not establish employer endorsement or interview outcomes.
