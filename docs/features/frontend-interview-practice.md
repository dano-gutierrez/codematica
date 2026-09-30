# Frontend Interview Practice

## Snapshot

- Status: `shipped` (local implementation; installed-device verification remains open)
- Last updated: `2026-09-28`
- Owner thread: `n/a`
- Current state: Seven anonymous frontend challenges connect concepts, guided solutions, checkpoints, and continuous review.
- Target outcome: Explain requirements, build and test a baseline, then compare alternatives under interview time pressure.
- Code touchpoints: `content/interviews/frontend-practice.json`, `packages/core/src/content/{schema,build-index,index}.ts`, `WebInterviewQuestionSession.tsx`, `packages/ui/src/screens.tsx`.
- Primary tests: `frontend-interview.test.ts`, `FrontendInterviewExamples.test.tsx`, `frontend-interview.regression.spec.ts`, `verify-frontend-python.py`.

## One-Minute Brief

Eight privately supplied PDFs (17 pages, including two overlapping file-explorer briefs) informed seven original lessons. Interview logistics and setup instructions are source context, not application requirements. Public content omits employer identity and recruiting details. Each topic has three complete React/TypeScript projects and three Python logic companions, eight checkpoint questions, and six review cards.

## Outcome / Contract

- `/paths/frontend-interview-practice` connects **brief → interview recipe → checkpoint → next brief** across seven units.
- The simplest approach is selected first. Previous/Next reveals recipe steps; the last step reveals explanation and code. Show full solution supports review. Changing approaches resets the recipe.
- All three approaches support TypeScript/Python switching. TS runs in the existing Sandpack playground; Python is displayed with `python3 -i solution.py` instructions. Python teaches models and algorithms rather than claiming to implement React behavior.
- The final quiz offers **Start review feed**. The path's feed link is available throughout; review cards link back to their lesson with path context.
- Web/native use the same generated curriculum. Anonymous reading and quizzes remain local. Native code is read-only; the hosted web sandbox requires network access.
- Answers, recipe position, and playground edits are transient. Existing optional progress records coarse milestones. Explicit path queries survive navigation/reload; direct interview links infer a path only when membership is unambiguous.

## Current State

The curriculum, rendering, path validation, and verification commands are implemented. See the validation notes below for environment gaps; local tests do not establish installed Android/iOS behavior or deployment.

## Supplementary React State Lesson

`/docs/frontend/react-state-async-callbacks` teaches the user-reported append → delayed async success/failure scenario. A render snapshot and queued updates explain the lost item. The default fix uses functional setters for both append and completion, stable item IDs, pure updaters, and generation checks plus timer cleanup. It distinguishes independent items from concurrent requests for the same item, local cancellation from server effects, and a custom `useSetTimeout` hook from React hooks.

The canonical Markdown contains a complete intentionally broken component and a complete working component, both executed directly by `ReactAsyncStateLesson.test.tsx`. It also compares reducers, refs, effects, common failed fixes, costs, and an interview recipe. The working example uses mocked I/O and can be pasted into the existing board playground. These standalone lesson examples are authoritative in Markdown; the original seven challenges retain their code in interview JSON.

The lesson is searchable in Lessons and linked from the board and async-matrix guides. Its six-question checkpoint uses the existing questionnaire and has feedback for every distractor. This is supplementary content, so the seven required units and 42-card review feed keep their existing routes and completion behavior. The shared index makes the reader and quiz available anonymously on web and native without schema, UI, or persistence changes.

## Scope

### In Scope

Seven challenges: rectangular board; randomized 10×10 matrix; click-to-place 5×5 game; column-drop 6×7 game; recursive explorer; multi-select chips; asynchronous user matrix. The [interview audit](interview-coding-catalog.md#2026-09-27-correctness-audit) covers existing material.

### Out Of Scope

Live GitHub credentials, code grading, Python execution in the browser, native playground execution, deployment, or hiring-outcome guarantees.

### Assumptions

- Random matrix selects exactly configurable `k` zeros, default 10. The source did not specify k.
- Games require four contiguous horizontal/vertical tokens. Diagonals are an optional extension. Invalid moves preserve the turn; terminal states reject further moves. The drop game fills from the bottom.
- Explorer rendering remains recursive in all variants. Local state intentionally resets nested expansion after unmount; controlled ID state preserves it.
- User matrix uses mocks by default. Public owned repository counts use `/users/{username}/repos?type=owner&per_page=100&page=…` and all pages. Stable fixtures are required for deterministic totals; a live listing can change during pagination.

## Detailed Behavior

### UI / UX

Each lesson states requirements versus practice defaults, clarification questions, and a worked example. Each track supplies an implementation recipe, full code, correctness reasoning, complexity, pain points, and a time-pressure recommendation. State organization is not presented as an asymptotic improvement. Native buttons and inputs in the projects provide keyboard operation, names, focus, and disabled enforcement. The walkthrough's grid uses a bounded column so long code lines scroll inside the editor rather than widening the mobile page.

### Data Model And Persistence

Index version **11** adds:

- Optional `python: { code, explanation, complexity: { time, space } }` on web tracks.
- Path `interview` nodes with `slug: collection/question`.
- Optional `completionDestination: "flashcard-feed"`; a published matching feed is required.
- Interview `sourceRefs`, checked for existence and required on interview nodes in source-required paths.
- Explicit review-card `codeLanguage`; source lesson links use existing `sourceDocSlug`.

Concepts live in Markdown; complete authoritative code lives only in interview JSON. Review snippets are intentionally small illustrations. Never hand-edit the generated index. No database migration or runtime dependency was added.

### Business Logic

Sampling uses full/partial Fisher–Yates and reservoir sampling. Games compare full scans, last-move scans, and indexed winning windows. Tree and selection tracks vary state ownership while preserving the same UI contract. Async tracks compare sequential, parallel independent outcomes, and bounded workers; assignment precedes per-user requests, failures stay local, and cancellation/stale guards run after awaits.

### Failure And Edge Handling

Tests cover rectangular/independent rows, exact zero counts, game boundaries/draws/illegal moves, tree collapse/reopen, empty results, disabled options, pagination, partial failures, cancellation, stale responses, and stable cells. Mock I/O is the default. No test contacts GitHub or executes a live paid job.

## Code Touchpoints

- `content/knowledge/frontend/interview-*.md`: canonical concepts and source assumptions.
- `content/interviews/frontend-practice.json`: 21 projects and 21 Python companions.
- `content/exercises/frontend/interview-*-questionnaire.json`: 56 questions with misconception feedback.
- `content/flashcard-feeds/frontend-interview-practice.json`: 42 review cards.
- `scripts/content/verify-frontend-python.py`: executes exact companion strings with deterministic fixtures.
- `scripts/content/verify-interview-audit.py`: Python regressions for repaired earlier examples.
- Existing reader, session, playground, questionnaire, and passive-feed components own presentation; no parallel practice framework was added.

## Test Plan

- The state lesson starts with failing content/example tests. `ReactAsyncStateLesson.test.tsx` strictly typechecks and executes the exact fenced components: stale-timer reproduction, same-render additions in Strict Mode, failure-before-success ordering, ignored late success/failure after Clear, and cancelled timers before Clear/unmount. A Profiler asserts ignored responses do not commit another render. All six quiz answer sets are checked. The frontend browser regression searches for the lesson, reloads it, reads its sources/code, and completes its quiz with wrong-answer feedback.
- Regression-first core tests initially rejected interview nodes and missing curriculum. `frontend-interview.test.ts` verifies every path transition, each quiz option, ordering answers, all references, and anonymity. Build-index tests reject missing/draft interview targets, missing attribution, and absent completion feeds.
- `FrontendInterviewExamples.test.tsx` strictly typechecks and executes all 21 exact authored TS projects, mounts each React example, and compares model output to 21 Python snapshots. Optimized games use an independent full-window oracle; mocks control failures and stale completions.
- `npm run test:interview:python` is mandatory in CI/release and fails if Python is absent. Python 3.13 is set up in GitHub workflows. The runner reads canonical code directly; it does not test a second copied implementation.
- Component tests cover step reveal, approach/language switches, checkpoint links, snippet languages/source links, and growing feeds. Native Jest covers the guide and language/next-node flow.
- Playwright `frontend-interview.regression.spec.ts` covers reload/path context, actual sandbox execution, wrong-answer feedback, final review navigation, and cards beyond the initial window. Existing Mondrian regression now explicitly reveals each solution.
- Maestro `frontend-interview.yaml` covers installed-app recipe/Python/checkpoint/review navigation. It is included by the existing `.maestro` release-directory lane; local Jest is not a substitute for running it on Android/iOS.
- Required commands: content:index/check, test:interview:python, lint, typecheck, test:coverage, test:mobile:coverage, build, relevant Playwright regressions, e2e:smoke, mobile:doctor. Coverage floors and exclusions are unchanged.

### Validation Notes

The supplementary state lesson was verified on 2026-09-28: 357 Vitest tests passed with both coverage gates, 46 native Jest tests passed with coverage, and content check, lint, workspace typecheck, and production builds passed. Both frontend browser journeys (existing path plus new lesson/quiz) passed, as did all nine smoke cases. The first new browser attempt exposed an ambiguous search-result locator because another lesson's snippet mentioned the title; the selector now matches the result's exact heading, and failure evidence is retained. No installed-device or deployment verification was performed for this content addition.

Local validation passed: 346 Vitest tests with aggregate/per-file coverage, 46 native Jest tests with coverage, all 21 authored TS projects and Python companions, content check, lint, typechecks, and production build. The eight relevant browser regressions and nine smoke journeys passed across the final targeted runs. The browser tests run against the production server. Failed-attempt traces and screenshots were preserved under ignored test-results directories. Mobile Doctor reports 19/20 checks passing and ten pre-existing Expo SDK patch mismatches (including Expo 57.0.11 versus 57.0.25 and React Native 0.86.2 versus 0.86.3). Maestro is not installed and no simulator was booted, so installed-device verification is still required before a native release. Dependency upgrades were kept out of this content/workflow change.

## Open Questions

- Run the new Maestro journey against built Android and iOS apps after resolving the existing SDK patch mismatches.

## Decision Log

- 2026-09-27: Merge overlapping explorer briefs; publish anonymous rewritten requirements, keeping source instructions separate from this implementation request.
- 2026-09-27: Preserve one canonical copy of each complete solution in JSON. Use exact-source execution and cross-language fixtures rather than structural code-presence checks alone.
- 2026-09-27: Opt in to final-feed navigation per path, preserving existing path endings.

## Documentation Updates

Updated the documentation hub, engineering flow, content READMEs, interview/learning/native/playground/testing contracts, and changelog. The existing-content audit is recorded in its owning feature docs.

## Thread Handoff Prompt

Read `docs/codex-context.md` and this file, inspect the exact authored-code tests, and preserve anonymous provenance and path context when extending the curriculum. Keep concepts in Markdown and solution code in interview JSON; regenerate the index.
