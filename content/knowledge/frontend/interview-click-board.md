---
title: "Click-to-place 5×5 Game Interview Guide"
slug: "frontend/interview-click-board"
summary: "Model legal turns and detect contiguous horizontal or vertical wins without adding unstated game rules."
track: "Front-End Development"
topic: "Frontend Interview Practice"
difficulty: "practitioner"
tags: ["frontend", "interview", "react", "typescript", "python", "click-board"]
sourceRefs: ["frontend-react-arrays", "frontend-react-state"]
status: "published"
---

## Build requirements

Build a 5×5 board where clicking an empty cell places a token in that exact cell. Alternate R and Y after valid nonterminal moves. Four contiguous horizontal or vertical tokens wins; stop the game and display the result.

## Preserve this game's rules

This is a 5×5 **click-to-place** board. Clicking row r, column c changes that exact empty cell. R starts in this practice version; the brief requires alternating R and Y but does not specify the initial player. A win is four consecutive equal tokens horizontally or vertically. A gap breaks a run. Diagonals do not count.

## Model one move as one transaction

Keep cells, player, winner, draw, and successful-move count in one state object. First reject an occupied/out-of-range move or a finished game. Place the token immutably, check the new board, and advance the player only if play continues. Do not independently toggle player state in a second event update.

## Why checking the last move works

Assume the preceding legal state had no winner. A valid move changes one cell, so every new win must include that cell. Scan its horizontal and vertical neighbors or index winning windows by cell. A full-board scan is a reasonable baseline for 25 cells.

## Interview proof checklist

Show a win ending at the far edge, a gap, a diagonal, an occupied-cell click, and a click after victory. Compare optimized logic against an independent full scan. Explain both winner-detection complexity and the copying/rendering that surrounds it.

## Choose a solution

Keep each move atomic: validate, place, detect terminal state, and change turns only after a valid nonterminal move.

The three approaches are:

- Full-board scan.
- Last-move directional scan.
- Indexed winning windows.

Build the first approach and discuss the other two as alternatives; do not build all three in one interview. Each walkthrough includes numbered steps, a correctness argument, pitfalls, a full React/TypeScript project, and a Python logic companion.

## Senior-engineer rehearsal

1. Restate the contract and name the ambiguous rule before writing code.
2. Make the smallest visible example work, using the first approach.
3. Say the invariant aloud and demonstrate one counterexample.
4. Check correctness before discussing optimization. Include copying, output, and I/O costs.
5. Summarize what works, what you tested, and which extension you would build next.

Practice the baseline for roughly 20–30 minutes, then explain an alternative without coding it. This suggested rehearsal schedule does not describe an actual interview duration.

## Worked example

**Input:** R occupies (0,0), (0,1), (0,2); R plays (0,3).

**Result:** R wins; later clicks leave the state unchanged.

The new token completes four adjacent tokens on the allowed horizontal axis.

## Continue studying

[Open the three guided solutions](/interviews/frontend-practice/click-board?path=frontend-interview-practice), then [take the checkpoint](/practice/frontend/interview-click-board-questionnaire?path=frontend-interview-practice). The final checkpoint leads into the combined vertical review feed.

These original prompts adapt privately supplied preparation material. The sources support technical claims, not employer endorsement or interview outcomes.
