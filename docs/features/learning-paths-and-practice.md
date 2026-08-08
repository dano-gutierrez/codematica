# Learning Paths And Practice

## Snapshot

- Status: `shipped`
- Last updated: `2026-08-07`
- Owner thread: `n/a`
- Current state: The complete path catalog lives at `/paths`; schema-v9 source nodes, generic career/language progression, guided labs, aggregate checkpoint scoring, passive review, and Japanese active review are local-first across web and Expo.
- Target outcome: Users can follow role and skill paths, open local companions or authoritative sources, complete all structured practice types, and inspect published/planned progression without requiring auth or Supabase.
- Code touchpoints:
  - `packages/core/src/content/schema.ts`
  - `packages/core/src/content/build-index.ts`
  - `apps/web/src/components/LearningPathMap.tsx`
  - `apps/web/src/components/PracticeCard.tsx`
  - `apps/web/src/components/PathScopedNextLink.tsx`
  - `apps/web/src/components/PathScopedPracticeCard.tsx`
  - `apps/web/src/components/QuestionnaireSession.tsx`
  - `apps/web/src/components/PassiveFlashcardFeed.tsx`
  - `packages/core/src/practice/questionnaire.ts`
  - `packages/core/src/language-writing/index.ts`
  - `packages/core/src/progress/progression.ts`
  - `packages/core/src/progress/mastery.ts`
  - `apps/web/src/components/JapaneseReview.tsx`
  - `apps/web/src/app/practice/[...slug]/page.tsx`
  - `apps/web/src/app/paths/[slug]/flashcards/page.tsx`
- Primary tests:
  - `packages/core/src/content/build-index.test.ts`
  - `packages/core/src/content/index.test.ts`
  - `packages/core/src/practice/questionnaire.test.ts`
  - `apps/web/src/components/PracticeCard.test.tsx`
  - `apps/web/e2e/specs/python-refresh.regression.spec.ts`
  - `apps/web/e2e/specs/knowledge-browser.smoke.spec.ts`
  - `apps/web/e2e/specs/japanese-language.regression.spec.ts`

## One-Minute Brief

Codematica uses learning paths as the main study surface. Paths are inspired by career and skill paths, language-app progression maps, and older interactive programming courses, but this milestone stays local-first: documents remain Markdown, paths and exercises are structured JSON, and all content remains open.

## Outcome / Contract

- `/` is the cross-section discovery home owned by `home-discovery.md`.
- `/paths` shows every published learning path grouped by category with kind/category filters.
- `/browse` preserves the content library, fuzzy search, track filter, and difficulty filter.
- `/paths/[slug]` renders one role or skill path with ordered unit nodes.
- `/paths/[slug]/flashcards` renders one passive flashcard feed when a path has a published feed.
- `/practice/[...slug]` renders one flashcard, cloze prompt, questionnaire session, or writing exercise.
- Exercise content is manually authored in `content/exercises/**/*.json`; path content is authored in `content/learning-paths/*.json`; passive flashcard feeds are authored in `content/flashcard-feeds/*.json`.
- `packages/core/src/generated/content-index.json` has `schemaVersion: 9` and includes validated primary sources, generic progression, learning/language/interview content, and home discovery.
- Path nodes may be documents, diagrams, exercises, or sources. Generic progressions declare a framework, roadmap label, stable skills/categories, stages with level/status/outcomes, required nodes, and published checkpoints/thresholds.
- Index generation additionally fails on duplicate/missing sources, unknown outcome/question skills, missing source-required references, or published source stages without a published local companion. Planned stages may omit checkpoint requirements.
- No node is locked, disabled, gated, or paywalled in this milestone. Optional saved progress is owned by `docs/features/auth-and-progress.md`.

## Current State

The shipped content includes skill and role paths using Markdown articles, external/source-backed nodes, diagrams, flashcards, cloze prompts, questionnaires, writing, guided labs, and passive feeds. Japanese Foundations and ML Systems use schema-v9 generic progression for language and career stages respectively. Supabase remains optional and does not store authored content.

## Scope

### In Scope

- role and skill learning paths
- complete path catalog route
- path detail route
- flashcard reveal interaction
- cloze answer checking
- questionnaire sessions with `choice`, `cloze`, `ordering`, and `matching` questions plus aggregate overall/per-skill scores
- guided labs with prediction, ordered work, evidence, reflection, and extension
- writing exercises with assisted tracing and free handwriting checks
- per-attempt questionnaire randomization for question order and answer banks
- path-aware next link from practice pages
- passive path-scoped flashcard feed routes with per-session shuffle and infinite local scroll
- generic career/language skills, outcomes, published/planned stages, required nodes, checkpoints, and milestone thresholds
- Japanese active review with deterministic scheduling and additive mastery persistence

### Out Of Scope

- streaks, leaderboards, or generic adaptive review scheduling; Japanese skill mastery remains the bounded review exception
- persisted questionnaire answers, raw reflection text, evidence artifacts, or answer history
- locked levels, hearts, streaks, achievements, leaderboards, generic cross-path adaptive review queues, and paywalls
- generated exercises or AI feedback
- Supabase migrations for paths or exercises
- coding sandboxes or compiled challenges

### Assumptions

- Paths and exercises are validated local content artifacts, not remote runtime data.
- Current tracks remain document-level filters and do not become the only path taxonomy.
- Role and skill paths use the same schema.
- Questionnaire state is transient in React component state and is not persisted.
- Passive flashcard order is transient in React component state; only the coarse latest-card resume position is eligible for the optional progress layer.

## Detailed Behavior

### UI / UX

- `/paths` shows compact path cards with category, kind, unit count, and content mix. Ordered node previews remain on path detail routes.
- Path nodes can be documents, diagrams, exercises, or source-backed companions and are always navigable.
- Document and diagram nodes opened from a path preserve `?path=` and expose a next-node link when another node follows.
- Path-scoped next-node links are selected client-side from build-time route maps so document, diagram, and practice pages can stay static-first.
- Content pages use browser-history back navigation instead of a hardcoded Browse destination.
- Flashcards reveal answer and explanation after the user taps the reveal button.
- Cloze prompts compare trimmed, case-insensitive answers against `acceptedAnswers`.
- Questionnaires render one question per screen, randomize question and answer order once per attempt, show immediate feedback, and report overall/per-skill aggregate scores.
- Guided labs require a prediction commitment and evidence checklist before completion; reflection inputs remain local component state and are not saved.
- Ordering questions use accessible up/down controls. Matching questions use mobile-friendly select controls.
- When practice is opened from a path, completing the prompt or questionnaire exposes the next node in that path order.
- Published passive flashcard feeds appear as a path-level entry point, not as ordered path nodes.
- Passive feeds show one card per mobile viewport, shuffle card order once per page load, append more cards as the user scrolls, and expose no reveal/check/progress controls.
- Practice and passive feed components emit minimal progress events for the optional auth/progress layer, but they do not store answers or scores.
- Learning paths intended to replace passive social scrolling with one-minute vertical review should include a path-scoped passive feed unless the owning feature doc explicitly scopes that surface out.
- Progression-enabled paths show stage level/status, friendly names, outcomes, expected time, and directly accessible published checkpoints. Stage metadata never locks a node.

### Data Model And Persistence

- `content/learning-paths/*.json` stores path metadata and ordered unit nodes; `content/sources/*.json` stores authoritative external source metadata.
- Schema-v9 source nodes declare `sourceRef`, activity, companion kind, and a stable slug. Generic progression defines skills and career/language stages separately from node order.
- `content/exercises/**/*.json` stores `flashcard`, `cloze`, `questionnaire`, `writing`, and `guided-lab` prompts.
- `content/flashcard-feeds/*.json` stores path-scoped passive review cards.
- Generated fields include `id`, `route`, `sourcePath`, and `contentHash`.
- Writing exercises reference language character slugs from `content/languages/` and do not persist raw learner strokes.
- Auth/progress may persist resume/completion milestones. Japanese review may additionally persist its narrow skill-mastery record; it does not persist questionnaire answers, raw handwriting, recordings, or full attempt histories.

### Failure And Edge Handling

- Invalid path or exercise JSON fails `npm run content:index` and `npm run content:check`.
- Invalid passive flashcard feed JSON fails `npm run content:index` and `npm run content:check`.
- Questionnaire validation fails on duplicate question IDs, invalid choice correctness, invalid cloze blanks, duplicate ordering item IDs, invalid ordering `correctOrder`, or duplicate matching pair IDs.
- Writing exercise validation fails on missing or duplicate language character references.
- Passive flashcard feed validation fails on duplicate card IDs, missing learning path references, or missing source document references.
- Progression validation fails on duplicate skills/outcomes, unknown skill references, missing stage units/nodes, invalid published checkpoints, or a published source node without a local published companion.
- Missing routes use the shared not-found page.
- A practice page opened without `?path=` still works but does not show a path-scoped next node.

## Code Touchpoints

- `packages/core/src/content/schema.ts`: schemas and generated index types.
- `packages/core/src/content/build-index.ts`: source, path, stage, exercise, passive feed, language, interview, and discovery validation plus schema version 9 serialization.
- `packages/core/src/content/index.ts`: lookup helpers and path-node route helpers.
- `apps/web/src/components/LearningPathMap.tsx`: home and path detail UI.
- `apps/web/src/components/PracticeCard.tsx`: flashcard, cloze, questionnaire, and writing shell.
- `apps/web/src/components/PathScopedNextLink.tsx`: client-side path query reader for static document and diagram next-node links.
- `apps/web/src/components/PathScopedPracticeCard.tsx`: client-side path query adapter for static practice pages.
- `apps/web/src/components/QuestionnaireSession.tsx`: mobile questionnaire interactions.
- `apps/web/src/components/PassiveFlashcardFeed.tsx`: mobile passive flashcard feed.
- `packages/core/src/flashcards/passive.ts`: passive feed shuffling and infinite-window helpers.
- `packages/core/src/practice/questionnaire.ts`: attempt randomization and answer checking helpers.
- `packages/core/src/language-writing/index.ts`: handwriting normalization, assisted completion, and correctness checks.
- `packages/core/src/progress/progression.ts`: stage completion percentage and stamp eligibility.
- `packages/core/src/progress/mastery.ts`: Japanese six-box review transitions, due ordering, and local/remote state merge.
- `apps/web/src/app/browse/page.tsx`: complete lesson and diagram browser route.

## Test Plan

- Unit: path, progression, exercise, passive feed, language schema coverage, cloze validation, questionnaire validation, handwriting scoring, review scheduling/merge, passive feed windowing, duplicate ID validation, and missing reference validation.
- Integration: generated index loads starter paths, exercises, passive feeds, and path-scoped next routes.
- Component: flashcard reveal, cloze answer checking, questionnaire feedback/navigation, and passive feed rendering.
- E2E: mobile path landing, passive Python feed, document open from a path, practice flow, Python questionnaire flow, `/browse` fuzzy search, Mermaid diagram rendering, and the Japanese open-roadmap/review/dictionary workflow.

## Open Questions

- Which career paths should adopt schema-v9 progression after ML Systems?
- Which path nodes become gated, and what user state unlocks them?
- Which future quiz types should be introduced before coding challenges beyond choice, cloze, ordering, and matching?

## Decision Log

- `2026-05-30`: Make `/` path-first and move the fuzzy browser to `/browse`.
- `2026-05-30`: Keep every node open; defer locks, paywalls, and persisted progress.
- `2026-05-30`: Author exercises as structured JSON instead of parsing them out of Markdown.
- `2026-05-30`: Ship only flashcard and cloze practice while documenting broader quiz types as future work.
- `2026-06-01`: Add questionnaire exercises with choice, cloze, ordering, and matching question kinds.
- `2026-06-01`: Keep questionnaire progress transient and defer scoring, persisted progress, and review queues.
- `2026-06-01`: Add path-scoped passive flashcard feeds as local JSON distinct from interactive flashcard exercises.
- `2026-06-18`: Treat passive flashcard feeds as the default one-minute vertical brief surface for addictive but meaningful scroll review.
- `2026-06-21`: Move path-scoped next-node selection into client wrappers so content and practice pages remain static-first for hosting.
- `2026-07-11`: Add `writing` exercises for Japanese handwriting while keeping raw strokes transient and validated against local language catalogs.
- `2026-07-21`: Add the BFS/DFS Programming path with lessons, questionnaires, and a passive scrolling review feed using existing components.
- `2026-07-21`: Add the Mermaid authoring path with progressive rendered examples, three choice-only questionnaires, and passive review using existing components.
- `2026-07-22`: Move the complete path catalog from `/` to `/paths`; the root is now the discovery hub owned by `home-discovery.md`.
- `2026-08-03`: Add the alphabet-first Japanese path sequence and its always-available kana flashcard feed using existing path/practice/feed contracts.
- `2026-08-04`: Advance to schema version 8 with open proficiency stages, Can-dos, stable skills, required-node/checkpoint metadata, and a Japanese-specific deterministic review queue.
- `2026-08-07`: Advance to schema version 9 with a validated primary-source catalog, source-backed nodes, generic career/language stages, guided labs, and aggregate checkpoint skill scores.

## Documentation Updates

- `docs/README.md`: Adds this feature doc and new content authoring areas to the reading map.
- Nested READMEs: Updates `content/learning-paths/README.md`, `content/exercises/README.md`, and `content/flashcard-feeds/README.md`.
- `docs/engineering-overview.md`: Updates the content flow and route model.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/learning-paths-and-practice.md first. Compare the documented path, practice, and passive feed contract against packages/core/src/content/schema.ts, packages/core/src/content/build-index.ts, packages/core/src/flashcards/passive.ts, packages/core/src/practice/questionnaire.ts, apps/web/src/components/LearningPathMap.tsx, apps/web/src/components/PracticeCard.tsx, apps/web/src/components/QuestionnaireSession.tsx, and apps/web/src/components/PassiveFlashcardFeed.tsx, then update tests and docs with any behavior changes.`
