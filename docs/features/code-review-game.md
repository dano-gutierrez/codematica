# Code Review Game

## Snapshot

- Status: `shipped`
- Last updated: `2026-06-02`
- Owner thread: `n/a`
- Current state: Code-review exercises are local JSON, render in `/practice/[...slug]`, and are also playable from `/code-reviews`.
- Target outcome: Users can inspect small TypeScript, JavaScript, or Python snippets, click precise buggy or healthy ranges, receive feedback, and apply authored fixes without auth or Supabase.
- Code touchpoints:
  - `content/exercises/**/*.json`
  - `src/lib/content/schema.ts`
  - `src/lib/content/build-index.ts`
  - `src/lib/practice/code-review.ts`
  - `src/components/CodeReviewSession.tsx`
  - `src/app/code-reviews/page.tsx`
- Primary tests:
  - `src/lib/practice/code-review.test.ts`
  - `src/lib/content/build-index.test.ts`
  - `src/components/PracticeCard.test.tsx`
  - `e2e/specs/code-review-game.regression.spec.ts`

## One-Minute Brief

The code review game turns authored review scenarios into a lightweight bug-hunt loop. The MVP shows PR-style file panes with line numbers and token/range-level click targets. Healthy clicks explain why the selected code is sound; finding clicks explain the issue, apply the authored replacement, and mark the review complete when every finding is fixed.

## Outcome / Contract

- `type: "code-review"` exercises support `typescript`, `javascript`, and `python`.
- A review contains one or two files, at least one finding, optional healthy notes, and at most one finding per file for the MVP.
- Ranges use 1-based `startLine`, `startColumn`, `endLine`, and exclusive `endColumn`.
- `/practice/[...slug]` renders code reviews as path-linked practice and shows the next-node link only after completion.
- `/code-reviews` chooses a random published review when no query is provided.
- `/code-reviews?exercise=<slug>` opens a deterministic review for tests and deep links.
- Correct clicks apply `replacementLines` immediately; no code is executed.
- Attempts are session-only and are not persisted.

## Current State

The shipped starter set includes a TypeScript runtime-boundary review and a Python observability review. Both are local-first exercise JSON and are included in the backend readiness path. Supabase, durable attempts, scoring, timers, generated reviews, and live code execution are not part of this milestone.

## Scope

### In Scope

- local code-review exercise schema and validation
- token/range-level click handling
- healthy-code feedback alerts
- finding explanation dialogs
- immediate authored replacement
- standalone random review route
- path-linked review exercises

### Out Of Scope

- executing snippets or validating code dynamically
- timers, score formulas, streaks, and persisted progress
- multiple findings per file after replacements shift coordinates
- user-selected fix options
- AI-generated review content

### Assumptions

- Authored review metadata is the source of truth for correctness.
- Replacement lines replace the full lines touched by a finding range.
- Existing local exercise JSON remains canonical until hosted authoring or durable progress exists.

## Detailed Behavior

### UI / UX

- File panes look like compact pull-request snippets with file headers, line numbers, shared syntax highlighting, vertical scrolling, and horizontal code scrolling.
- On mobile, code lines must not wrap; long lines overflow horizontally inside the snippet pane, matching GitHub-style mobile code review behavior.
- Every visible code segment can be clicked.
- Healthy clicks increment attempts and show a `role="alert"` explanation from the matching healthy note or file-level healthy explanation.
- Finding clicks increment attempts, open a `role="dialog"` explanation, apply the fix, and update the snippet.
- Completing all findings shows a completion panel with attempt count.
- Standalone sessions show `Review another`; path sessions show `Next node` when a next node exists.

### Data Model And Persistence

- `files[]` contains `path`, `language`, `healthyExplanation`, and `lines`.
- `findings[]` contains `id`, `kind`, `range`, `explanation`, and `replacementLines`.
- `healthyNotes[]` contains optional range-specific healthy explanations.
- The generated content index is `schemaVersion: 7`.
- No review attempts, time, score, or completion state are persisted.

### Failure And Edge Handling

- Indexing fails on unsupported languages, more than two files, missing findings, duplicate finding IDs, more than one finding per file, missing file references, and ranges outside file line/column bounds.
- A direct `/code-reviews?exercise=` request for a missing or unpublished review uses the shared not-found route.
- Clicking fixed replacement code is treated as healthy code.

## Code Touchpoints

- `src/lib/content/schema.ts`: code-review schemas and generated index version.
- `src/lib/content/build-index.ts`: cross-field validation for ranges, files, and MVP finding limits.
- `src/lib/practice/code-review.ts`: pure hit detection, segmentation, and replacement helpers.
- `src/components/CodeReviewSession.tsx`: interactive review UI.
- `src/app/code-reviews/page.tsx`: standalone random/deep-linked review surface.

## Test Plan

- Unit: range hit detection, healthy/finding lookup, and replacement application.
- Integration: index valid code-review exercises and reject invalid authored JSON.
- Component: healthy click alert, correct finding dialog, replacement, completion, and path next link.
- E2E: standalone deterministic review, healthy click, correct fix, review another control, and path-linked review route.

## Future Work

- Timer and score formula using attempts and elapsed time.
- Persisted attempts, mastery, streaks, and review queues after auth/profile state exists.
- Multiple findings per file with coordinate remapping after applied replacements.
- Fix-option choices with better and worse alternatives.
- More languages and difficulty scaling.
- AI-assisted scenario generation with validation against the schema.
- Richer PR diff views, comments, and multi-file review history.

## Decision Log

- `2026-06-02`: Add code review as an exercise type and standalone route while keeping exercise JSON local-first.
- `2026-06-02`: Use token/range-level targets with exclusive end columns.
- `2026-06-02`: Limit MVP reviews to at most one finding per file to avoid replacement-coordinate remapping.

## Documentation Updates

- `docs/README.md`: Adds this feature doc to the feature index.
- Nested READMEs: Updates `content/exercises/README.md` for `code-review`.
- `docs/engineering-overview.md`: Updates content flow, content model, routes, and testing model.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/code-review-game.md first. Compare the documented contract against content/exercises/**/*.json, src/lib/content/schema.ts, src/lib/content/build-index.ts, src/lib/practice/code-review.ts, src/components/CodeReviewSession.tsx, and src/app/code-reviews/page.tsx, then update tests and docs with any behavior changes.`
