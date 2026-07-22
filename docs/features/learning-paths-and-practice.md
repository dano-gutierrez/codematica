# Learning Paths And Practice

## Snapshot

- Status: `shipped`
- Last updated: `2026-07-22`
- Owner thread: `n/a`
- Current state: The complete path catalog lives at `/paths`; path detail, exercise, and passive flashcard routes remain backed by local structured content.
- Target outcome: Users can follow role and skill paths, open documents or diagrams, complete flashcard, cloze, questionnaire, or writing practice, and review passive path-scoped flashcards without requiring auth or Supabase.
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
  - `apps/web/src/app/practice/[...slug]/page.tsx`
  - `apps/web/src/app/paths/[slug]/flashcards/page.tsx`
- Primary tests:
  - `packages/core/src/content/build-index.test.ts`
  - `packages/core/src/content/index.test.ts`
  - `packages/core/src/practice/questionnaire.test.ts`
  - `apps/web/src/components/PracticeCard.test.tsx`
  - `apps/web/e2e/specs/python-refresh.regression.spec.ts`
  - `apps/web/e2e/specs/knowledge-browser.smoke.spec.ts`

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
- `packages/core/src/generated/content-index.json` has `schemaVersion: 6` and includes learning content plus validated home discovery curation.
- Index generation fails on duplicate path, exercise, passive feed, language character, or language vocabulary slugs; missing node references; exercises pointing at missing documents; writing exercises pointing at missing language characters; invalid passive feed path or source document references; cloze templates without exactly one `{{blank}}`; or invalid questionnaire structure.
- No node is locked, disabled, gated, or paywalled in this milestone. Optional saved progress is owned by `docs/features/auth-and-progress.md`.

## Current State

The shipped content includes skill and role paths using Markdown articles, external and embedded Mermaid diagrams, flashcards, cloze prompts, questionnaires, and passive flashcard feeds. The BFS/DFS Programming path reuses these surfaces for graph traversal, while the Mermaid authoring path uses them for three source-first lessons, choice-only questionnaires, and scrolling review. Supabase remains optional for browsing and does not store authored paths, exercises, or passive feeds. Saved resume/completion state is owned by the auth/progress feature.

## Scope

### In Scope

- role and skill learning paths
- complete path catalog route
- path detail route
- flashcard reveal interaction
- cloze answer checking
- questionnaire sessions with `choice`, `cloze`, `ordering`, and `matching` questions
- writing exercises with assisted tracing and free handwriting checks
- per-attempt questionnaire randomization for question order and answer banks
- path-aware next link from practice pages
- passive path-scoped flashcard feed routes with per-session shuffle and infinite local scroll

### Out Of Scope

- scoring, mastery, review queues, and answer history
- locked levels, hearts, streaks, achievements, leaderboards, review queues, and paywalls
- generated exercises or AI feedback
- Supabase migrations for paths or exercises
- coding sandboxes or compiled challenges

### Assumptions

- Paths and exercises are validated local content artifacts, not remote runtime data.
- Current tracks remain document-level filters and do not become the only path taxonomy.
- Role and skill paths use the same schema.
- Questionnaire state is transient in React component state and is not persisted.
- Passive flashcard feed state is transient in React component state and is not persisted.

## Detailed Behavior

### UI / UX

- `/paths` shows compact path cards with category, kind, unit count, and content mix. Ordered node previews remain on path detail routes.
- Path nodes can be documents, diagrams, or exercises and are always navigable.
- Document and diagram nodes opened from a path preserve `?path=` and expose a next-node link when another node follows.
- Path-scoped next-node links are selected client-side from build-time route maps so document, diagram, and practice pages can stay static-first.
- Content pages use browser-history back navigation instead of a hardcoded Browse destination.
- Flashcards reveal answer and explanation after the user taps the reveal button.
- Cloze prompts compare trimmed, case-insensitive answers against `acceptedAnswers`.
- Questionnaires render one question per screen, randomize question and answer order once per attempt, show immediate feedback, and expose no score.
- Ordering questions use accessible up/down controls. Matching questions use mobile-friendly select controls.
- When practice is opened from a path, completing the prompt or questionnaire exposes the next node in that path order.
- Published passive flashcard feeds appear as a path-level entry point, not as ordered path nodes.
- Passive feeds show one card per mobile viewport, shuffle card order once per page load, append more cards as the user scrolls, and expose no reveal/check/progress controls.
- Practice and passive feed components emit minimal progress events for the optional auth/progress layer, but they do not store answers or scores.
- Learning paths intended to replace passive social scrolling with one-minute vertical review should include a path-scoped passive feed unless the owning feature doc explicitly scopes that surface out.

### Data Model And Persistence

- `content/learning-paths/*.json` stores path metadata and ordered unit nodes.
- `content/exercises/**/*.json` stores `flashcard`, `cloze`, `questionnaire`, and `writing` prompts.
- `content/flashcard-feeds/*.json` stores path-scoped passive review cards.
- Generated fields include `id`, `route`, `sourcePath`, and `contentHash`.
- Writing exercises reference language character slugs from `content/languages/` and do not persist raw learner strokes.
- Auth/progress may persist resume/completion milestones. It does not persist practice answers, scores, or mastery state.

### Failure And Edge Handling

- Invalid path or exercise JSON fails `npm run content:index` and `npm run content:check`.
- Invalid passive flashcard feed JSON fails `npm run content:index` and `npm run content:check`.
- Questionnaire validation fails on duplicate question IDs, invalid choice correctness, invalid cloze blanks, duplicate ordering item IDs, invalid ordering `correctOrder`, or duplicate matching pair IDs.
- Writing exercise validation fails on missing or duplicate language character references.
- Passive flashcard feed validation fails on duplicate card IDs, missing learning path references, or missing source document references.
- Missing routes use the shared not-found page.
- A practice page opened without `?path=` still works but does not show a path-scoped next node.

## Code Touchpoints

- `packages/core/src/content/schema.ts`: schemas and generated index types.
- `packages/core/src/content/build-index.ts`: path, exercise, passive flashcard feed, and language collection, validation, reference checks, and schema version 5 serialization.
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
- `apps/web/src/app/browse/page.tsx`: legacy browser route.

## Test Plan

- Unit: path, exercise, passive feed, language schema coverage, cloze validation, questionnaire validation, handwriting scoring, passive feed windowing, duplicate slug validation, missing reference validation.
- Integration: generated index loads starter paths, exercises, passive feeds, and path-scoped next routes.
- Component: flashcard reveal, cloze answer checking, questionnaire feedback/navigation, and passive feed rendering.
- E2E: mobile path landing, passive Python feed, document open from a path, practice flow, Python questionnaire flow, `/browse` fuzzy search, and Mermaid diagram rendering.

## Open Questions

- Which scoring, mastery, and review-queue events become durable after basic progress?
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

## Documentation Updates

- `docs/README.md`: Adds this feature doc and new content authoring areas to the reading map.
- Nested READMEs: Updates `content/learning-paths/README.md`, `content/exercises/README.md`, and `content/flashcard-feeds/README.md`.
- `docs/engineering-overview.md`: Updates the content flow and route model.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/learning-paths-and-practice.md first. Compare the documented path, practice, and passive feed contract against packages/core/src/content/schema.ts, packages/core/src/content/build-index.ts, packages/core/src/flashcards/passive.ts, packages/core/src/practice/questionnaire.ts, apps/web/src/components/LearningPathMap.tsx, apps/web/src/components/PracticeCard.tsx, apps/web/src/components/QuestionnaireSession.tsx, and apps/web/src/components/PassiveFlashcardFeed.tsx, then update tests and docs with any behavior changes.`
