# Learning Paths And Practice

## Snapshot

- Status: `shipped`
- Last updated: `2026-06-03`
- Owner thread: `n/a`
- Current state: The home route is a path-first map with explicit shortcuts, backed by local path, exercise, passive flashcard feed, interview, and case-study flow JSON indexed with Markdown documents.
- Target outcome: Users can follow role and skill paths, open documents, diagrams, interview problems, complete flashcard, cloze, questionnaire, or code-review practice, and review passive path-scoped flashcards without auth or Supabase.
- Code touchpoints:
  - `src/lib/content/schema.ts`
  - `src/lib/content/build-index.ts`
  - `src/components/LearningPathMap.tsx`
  - `src/components/PracticeCard.tsx`
  - `src/components/QuestionnaireSession.tsx`
  - `src/components/CodeReviewSession.tsx`
  - `src/components/PassiveFlashcardFeed.tsx`
  - `src/components/InterviewQuestionSession.tsx`
  - `src/lib/practice/questionnaire.ts`
  - `src/lib/practice/code-review.ts`
  - `src/app/practice/[...slug]/page.tsx`
  - `src/app/code-reviews/page.tsx`
  - `src/app/paths/[slug]/flashcards/page.tsx`
  - `src/app/interviews/[company]/[question]/page.tsx`
- Primary tests:
  - `src/lib/content/build-index.test.ts`
  - `src/lib/content/index.test.ts`
  - `src/lib/practice/questionnaire.test.ts`
  - `src/lib/practice/code-review.test.ts`
  - `src/components/PracticeCard.test.tsx`
  - `e2e/specs/code-review-game.regression.spec.ts`
  - `e2e/specs/python-refresh.regression.spec.ts`
  - `e2e/specs/real-system-case-studies.regression.spec.ts`
  - `e2e/specs/knowledge-browser.smoke.spec.ts`

## One-Minute Brief

Codematica uses learning paths as the main study surface. Paths are inspired by career and skill paths, language-app progression maps, and older interactive programming courses, but this milestone stays local-first: documents remain Markdown, paths and exercises are structured JSON, and all content remains open.

## Outcome / Contract

- `/` shows a mobile-first path map, not the fuzzy browser.
- `/` includes an explicit `Real cases` shortcut to `/paths/system-design-fundamentals#real-production-data-platforms`.
- `/browse` preserves the content library, fuzzy search, track filter, and difficulty filter.
- `/paths/[slug]` renders one role or skill path with ordered unit nodes.
- `/paths/[slug]/flashcards` renders one passive flashcard feed when a path has a published feed.
- `/practice/[...slug]` renders one flashcard, cloze prompt, questionnaire session, or code-review session.
- `/code-reviews` renders a standalone random published code-review exercise, with `?exercise=<slug>` for deterministic links.
- Exercise content is manually authored in `content/exercises/**/*.json`; path content is authored in `content/learning-paths/*.json`; passive flashcard feeds are authored in `content/flashcard-feeds/*.json`.
- `src/generated/content-index.json` has `schemaVersion: 7` and includes `learningPaths`, `exercises`, `passiveFlashcardFeeds`, `caseStudyFlows`, and `interviewCompanies`.
- Index generation fails on duplicate path, exercise, or passive feed slugs, missing document, diagram, exercise, or interview node references, exercises pointing at missing documents, invalid passive feed path or source document references, cloze templates without exactly one `{{blank}}`, invalid questionnaire structure, or invalid code-review file/range structure.
- No node is locked, disabled, gated, paywalled, or persisted as complete in this milestone.

## Current State

The shipped content includes skill and role paths using Markdown articles, external Mermaid diagrams, flashcards, cloze prompts, questionnaires, code reviews, and passive flashcard feeds. Supabase remains optional and does not store paths, exercises, passive feed state, progress, attempts, or gating state yet.

## Scope

### In Scope

- role and skill learning paths
- path-first home route
- path detail route
- flashcard reveal interaction
- cloze answer checking
- questionnaire sessions with `choice`, `cloze`, `ordering`, and `matching` questions
- per-attempt questionnaire randomization for question order and answer banks
- code-review sessions with token/range-level clicks and authored fixes
- path-aware next link from practice pages
- passive path-scoped flashcard feed routes with per-session shuffle and infinite local scroll
- real-system case-study document units with optional interactive flow refs

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

- Home shows path cards with node previews, a prominent `/browse` content-library link, and a `Real cases` shortcut to the real production data platforms unit.
- Path nodes can be documents, diagrams, exercises, or interview problems and are always navigable.
- Document and diagram nodes opened from a path preserve `?path=` and expose a next-node link when another node follows.
- Interview nodes opened from a path preserve `?path=` and expose a next-node link after the guided solution reaches the final explanation.
- Content pages use browser-history back navigation instead of a hardcoded Browse destination.
- Flashcards reveal answer and explanation after the user taps the reveal button.
- Cloze prompts compare trimmed, case-insensitive answers against `acceptedAnswers`.
- Questionnaires render one question per screen, randomize question and answer order once per attempt, show immediate feedback, and expose no score.
- Code reviews render PR-style file panes, count attempts, explain healthy clicks, apply authored fixes for correct clicks, and expose no score.
- Ordering questions use accessible up/down controls. Matching questions use mobile-friendly select controls.
- When practice is opened from a path, completing the prompt, questionnaire, or code review exposes the next node in that path order.
- Published passive flashcard feeds appear as a path-level entry point, not as ordered path nodes.
- Passive feeds show one card per mobile viewport, shuffle card order once per page load, append more cards as the user scrolls, and expose no reveal/check/progress controls.

### Data Model And Persistence

- `content/learning-paths/*.json` stores path metadata and ordered unit nodes. Node `kind` values are `document`, `diagram`, `exercise`, and `interview`.
- `content/exercises/**/*.json` stores `flashcard`, `cloze`, `questionnaire`, and `code-review` prompts.
- `content/flashcard-feeds/*.json` stores path-scoped passive review cards.
- `content/case-studies/**/*.json` stores optional interactive walkthroughs for selected Markdown document nodes.
- Generated fields include `id`, `route`, `sourcePath`, and `contentHash`.
- No user state is persisted.

### Failure And Edge Handling

- Invalid path or exercise JSON fails `npm run content:index` and `npm run content:check`.
- Invalid passive flashcard feed JSON fails `npm run content:index` and `npm run content:check`.
- Questionnaire validation fails on duplicate question IDs, invalid choice correctness, invalid cloze blanks, duplicate ordering item IDs, invalid ordering `correctOrder`, or duplicate matching pair IDs.
- Code-review validation fails on unsupported languages, too many files, missing findings, duplicate finding IDs, more than one finding per file, missing file references, or invalid line/column ranges.
- Passive flashcard feed validation fails on duplicate card IDs, missing learning path references, or missing source document references.
- Interview path-node validation fails when the `company/question` slug does not resolve to an existing interview question in `content/interviews/`.
- Missing routes use the shared not-found page.
- A practice page opened without `?path=` still works but does not show a path-scoped next node.

## Code Touchpoints

- `src/lib/content/schema.ts`: schemas and generated index types.
- `src/lib/content/build-index.ts`: path, exercise, passive flashcard feed, case-study flow, and interview collection, validation, reference checks, and schema version 7 serialization.
- `src/lib/content/index.ts`: lookup helpers and path-node route helpers.
- `src/components/LearningPathMap.tsx`: home and path detail UI.
- `src/components/PracticeCard.tsx`: flashcard, cloze, questionnaire, and code-review shell.
- `src/components/QuestionnaireSession.tsx`: mobile questionnaire interactions.
- `src/components/CodeReviewSession.tsx`: code-review interactions and replacement UI.
- `src/components/PassiveFlashcardFeed.tsx`: mobile passive flashcard feed.
- `src/lib/flashcards/passive.ts`: passive feed shuffling and infinite-window helpers.
- `src/lib/practice/questionnaire.ts`: attempt randomization and answer checking helpers.
- `src/lib/practice/code-review.ts`: code-review hit detection and replacement helpers.
- `src/app/browse/page.tsx`: legacy browser route.

## Test Plan

- Unit: path, exercise, passive feed schema coverage, cloze validation, questionnaire validation, code-review range/replacement helpers, passive feed windowing, duplicate slug validation, missing reference validation.
- Integration: generated index loads starter paths, exercises, passive feeds, and path-scoped next routes.
- Component: flashcard reveal, cloze answer checking, questionnaire feedback/navigation, code-review feedback/fixes, and passive feed rendering.
- E2E: mobile path landing, passive Python feed, document open from a path, practice flow, Python questionnaire flow, code-review flow, `/browse` fuzzy search, and Mermaid diagram rendering.

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
- `2026-06-02`: Add code-review exercises and a standalone `/code-reviews` route while keeping attempts transient.
- `2026-06-02`: Add interview learning-path nodes so paths can link existing interview questions without creating a separate catalog or persistence model.
- `2026-06-03`: Add a real production data platforms unit to System Design Fundamentals with Netflix, Uber, and Spotify case-study documents.

## Documentation Updates

- `docs/README.md`: Adds this feature doc and new content authoring areas to the reading map.
- Nested READMEs: Updates `content/learning-paths/README.md`, `content/exercises/README.md`, `content/flashcard-feeds/README.md`, and `content/case-studies/README.md`.
- `docs/engineering-overview.md`: Updates the content flow and route model.

## Thread Handoff Prompt

`Read docs/codex-context.md, docs/features/learning-paths-and-practice.md, and docs/features/code-review-game.md first. Compare the documented path, practice, passive feed, and code-review contract against src/lib/content/schema.ts, src/lib/content/build-index.ts, src/lib/flashcards/passive.ts, src/lib/practice/questionnaire.ts, src/lib/practice/code-review.ts, src/components/LearningPathMap.tsx, src/components/PracticeCard.tsx, src/components/QuestionnaireSession.tsx, src/components/CodeReviewSession.tsx, and src/components/PassiveFlashcardFeed.tsx, then update tests and docs with any behavior changes.`
