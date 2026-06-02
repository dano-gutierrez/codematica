# Learning Paths And Practice

## Snapshot

- Status: `shipped`
- Last updated: `2026-06-01`
- Owner thread: `n/a`
- Current state: The home route is a path-first map backed by local path, exercise, and passive flashcard feed JSON indexed with Markdown documents.
- Target outcome: Users can follow role and skill paths, open documents or diagrams, complete flashcard, cloze, or questionnaire practice, and review passive path-scoped flashcards without auth or Supabase.
- Code touchpoints:
  - `src/lib/content/schema.ts`
  - `src/lib/content/build-index.ts`
  - `src/components/LearningPathMap.tsx`
  - `src/components/PracticeCard.tsx`
  - `src/components/QuestionnaireSession.tsx`
  - `src/components/PassiveFlashcardFeed.tsx`
  - `src/lib/practice/questionnaire.ts`
  - `src/app/practice/[...slug]/page.tsx`
  - `src/app/paths/[slug]/flashcards/page.tsx`
- Primary tests:
  - `src/lib/content/build-index.test.ts`
  - `src/lib/content/index.test.ts`
  - `src/lib/practice/questionnaire.test.ts`
  - `src/components/PracticeCard.test.tsx`
  - `e2e/specs/python-refresh.regression.spec.ts`
  - `e2e/specs/knowledge-browser.smoke.spec.ts`

## One-Minute Brief

Codematica uses learning paths as the main study surface. Paths are inspired by career and skill paths, language-app progression maps, and older interactive programming courses, but this milestone stays local-first: documents remain Markdown, paths and exercises are structured JSON, and all content remains open.

## Outcome / Contract

- `/` shows a mobile-first path map, not the fuzzy browser.
- `/browse` preserves the content library, fuzzy search, track filter, and difficulty filter.
- `/paths/[slug]` renders one role or skill path with ordered unit nodes.
- `/paths/[slug]/flashcards` renders one passive flashcard feed when a path has a published feed.
- `/practice/[...slug]` renders one flashcard, cloze prompt, or questionnaire session.
- Exercise content is manually authored in `content/exercises/**/*.json`; path content is authored in `content/learning-paths/*.json`; passive flashcard feeds are authored in `content/flashcard-feeds/*.json`.
- `src/generated/content-index.json` has `schemaVersion: 4` and includes `learningPaths`, `exercises`, and `passiveFlashcardFeeds`.
- Index generation fails on duplicate path, exercise, or passive feed slugs, missing node references, exercises pointing at missing documents, invalid passive feed path or source document references, cloze templates without exactly one `{{blank}}`, or invalid questionnaire structure.
- No node is locked, disabled, gated, paywalled, or persisted as complete in this milestone.

## Current State

The shipped content includes skill and role paths using Markdown articles, external Mermaid diagrams, flashcards, cloze prompts, questionnaires, and passive flashcard feeds. Supabase remains optional and does not store paths, exercises, passive feed state, progress, or gating state yet.

## Scope

### In Scope

- role and skill learning paths
- path-first home route
- path detail route
- flashcard reveal interaction
- cloze answer checking
- questionnaire sessions with `choice`, `cloze`, `ordering`, and `matching` questions
- per-attempt questionnaire randomization for question order and answer banks
- path-aware next link from practice pages
- passive path-scoped flashcard feed routes with per-session shuffle and infinite local scroll

### Out Of Scope

- auth, profiles, and saved progress
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

- Home shows path cards with node previews and a prominent `/browse` content-library link.
- Path nodes can be documents, diagrams, or exercises and are always navigable.
- Document and diagram nodes opened from a path preserve `?path=` and expose a next-node link when another node follows.
- Content pages use browser-history back navigation instead of a hardcoded Browse destination.
- Flashcards reveal answer and explanation after the user taps the reveal button.
- Cloze prompts compare trimmed, case-insensitive answers against `acceptedAnswers`.
- Questionnaires render one question per screen, randomize question and answer order once per attempt, show immediate feedback, and expose no score.
- Ordering questions use accessible up/down controls. Matching questions use mobile-friendly select controls.
- When practice is opened from a path, completing the prompt or questionnaire exposes the next node in that path order.
- Published passive flashcard feeds appear as a path-level entry point, not as ordered path nodes.
- Passive feeds show one card per mobile viewport, shuffle card order once per page load, append more cards as the user scrolls, and expose no reveal/check/progress controls.

### Data Model And Persistence

- `content/learning-paths/*.json` stores path metadata and ordered unit nodes.
- `content/exercises/**/*.json` stores `flashcard`, `cloze`, and `questionnaire` prompts.
- `content/flashcard-feeds/*.json` stores path-scoped passive review cards.
- Generated fields include `id`, `route`, `sourcePath`, and `contentHash`.
- No user state is persisted.

### Failure And Edge Handling

- Invalid path or exercise JSON fails `npm run content:index` and `npm run content:check`.
- Invalid passive flashcard feed JSON fails `npm run content:index` and `npm run content:check`.
- Questionnaire validation fails on duplicate question IDs, invalid choice correctness, invalid cloze blanks, duplicate ordering item IDs, invalid ordering `correctOrder`, or duplicate matching pair IDs.
- Passive flashcard feed validation fails on duplicate card IDs, missing learning path references, or missing source document references.
- Missing routes use the shared not-found page.
- A practice page opened without `?path=` still works but does not show a path-scoped next node.

## Code Touchpoints

- `src/lib/content/schema.ts`: schemas and generated index types.
- `src/lib/content/build-index.ts`: path, exercise, and passive flashcard feed collection, validation, reference checks, and schema version 4 serialization.
- `src/lib/content/index.ts`: lookup helpers and path-node route helpers.
- `src/components/LearningPathMap.tsx`: home and path detail UI.
- `src/components/PracticeCard.tsx`: flashcard, cloze, and questionnaire shell.
- `src/components/QuestionnaireSession.tsx`: mobile questionnaire interactions.
- `src/components/PassiveFlashcardFeed.tsx`: mobile passive flashcard feed.
- `src/lib/flashcards/passive.ts`: passive feed shuffling and infinite-window helpers.
- `src/lib/practice/questionnaire.ts`: attempt randomization and answer checking helpers.
- `src/app/browse/page.tsx`: legacy browser route.

## Test Plan

- Unit: path, exercise, passive feed schema coverage, cloze validation, questionnaire validation, passive feed windowing, duplicate slug validation, missing reference validation.
- Integration: generated index loads starter paths, exercises, passive feeds, and path-scoped next routes.
- Component: flashcard reveal, cloze answer checking, questionnaire feedback/navigation, and passive feed rendering.
- E2E: mobile path landing, passive Python feed, document open from a path, practice flow, Python questionnaire flow, `/browse` fuzzy search, and Mermaid diagram rendering.

## Open Questions

- Which progress events become durable once auth exists?
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

## Documentation Updates

- `docs/README.md`: Adds this feature doc and new content authoring areas to the reading map.
- Nested READMEs: Updates `content/learning-paths/README.md`, `content/exercises/README.md`, and `content/flashcard-feeds/README.md`.
- `docs/engineering-overview.md`: Updates the content flow and route model.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/learning-paths-and-practice.md first. Compare the documented path, practice, and passive feed contract against src/lib/content/schema.ts, src/lib/content/build-index.ts, src/lib/flashcards/passive.ts, src/lib/practice/questionnaire.ts, src/components/LearningPathMap.tsx, src/components/PracticeCard.tsx, src/components/QuestionnaireSession.tsx, and src/components/PassiveFlashcardFeed.tsx, then update tests and docs with any behavior changes.`
