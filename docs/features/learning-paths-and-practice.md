# Learning Paths And Practice

## Snapshot

- Status: `shipped`
- Last updated: `2026-10-04`
- Owner thread: `n/a`
- Current state: The complete path catalog lives at `/paths`; schema-v12 source nodes, generic career/language progression, guided labs, aggregate checkpoint scoring, passive review, Japanese open answers/listening choices, and active review are local-first across web and Expo.
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

Learning paths organize study using ideas from career and skill paths, language-app progression maps, and older interactive programming courses. This milestone stays local-first and open: documents use Markdown; paths and exercises use structured JSON.

## Outcome / Contract

- `/learn` is the cross-section discovery hub owned by `home-discovery.md`.
- `/paths` shows every published learning path grouped by category with kind/category filters.
- `/browse` preserves the content library, fuzzy search, track filter, and difficulty filter.
- `/paths/[slug]` renders one role or skill path with ordered unit nodes.
- `/paths/[slug]/flashcards` renders one passive flashcard feed when a path has a published feed.
- `/practice/[...slug]` renders one flashcard, cloze prompt, questionnaire session, or writing exercise.
- Exercise content is manually authored in `content/exercises/**/*.json`; path content is authored in `content/learning-paths/*.json`; passive flashcard feeds are authored in `content/flashcard-feeds/*.json`.
- `packages/core/src/generated/content-index.json` has `schemaVersion: 12` and includes validated primary sources, generic progression, structured Japanese grammar, approval-gated audio, learning/language/interview content, and home discovery.
- Path nodes may be documents, diagrams, exercises, interviews, or sources. Generic progressions declare a framework, roadmap label, stable skills/categories, stages with level/status/outcomes, required nodes, and published checkpoints/thresholds.
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

- persisted questionnaire answers, raw reflection text, evidence artifacts, or answer history
- locked levels, hearts, streaks, achievements, leaderboards, generic adaptive review scheduling and cross-path queues, and paywalls; Japanese skill mastery is the bounded review exception
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
- Guided labs require a chosen prediction and completed evidence checklist; reflections remain unsaved local component state.
- Ordering questions use accessible up/down controls. Matching questions use mobile-friendly select controls.
- When practice opens from a path, completing the prompt or questionnaire shows **Next activity** for the next node in path order.
- Published passive flashcard feeds appear as a path-level entry point, not as ordered path nodes.
- Passive feeds show one card per mobile viewport, shuffle card order once per page load, append more cards as the user scrolls, and expose no reveal/check/progress controls.
- Practice and passive feed components emit minimal progress events for the optional auth/progress layer, but they do not store answers or scores.
- Learning paths intended to replace passive social scrolling with one-minute vertical review should include a path-scoped passive feed unless the owning feature doc explicitly scopes that surface out.
- Progression-enabled paths show stage level/status, friendly names, outcomes, expected time, and directly accessible published checkpoints. Stage metadata never locks a node.

Coding Interview Pattern Practice reuses 18 existing algorithm walkthroughs and four BFS/DFS lesson/checkpoint nodes across six units. Questions retain their existing IDs, languages, solutions, sources and difficulty. Learners compare invariants and alternatives rather than treating a fixed question count as readiness. Backtracking and comprehensive dynamic programming remain outside this path. There is no progression object, new score or completion certificate. The existing BFS/DFS path remains unchanged.

Algorithm interviews opened with a valid path query expose **Next activity** after the full web explanation; restarting hides it until the explanation is revealed again. Unknown or absent path queries do not choose another path. Native algorithm readers show the authored destination alongside their read-only explanation and do not record a completed result merely by navigating. Native routes retain existing unambiguous path inference for direct links.

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
- `apps/web/src/components/PathScopedNextLink.tsx`: client-side path query reader for document, diagram and algorithm next-node links; only authored own path keys can select a destination.
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

- Coding-pattern path: exact unit/question order, existing question count/identity, explicit graph membership and preserved traversal-path membership.
- Algorithm continuation: web selected/unknown/inherited-key/blank/absent path and restart gates; native authored/inferred/unknown/inherited path selection, exact destination, single navigation and no automatic completion. `coding-patterns.regression.spec.ts` verifies path → explanation → next question and standalone behavior.

- Unit: path, progression, exercise, passive feed, language schema coverage, cloze validation, questionnaire validation, handwriting scoring, review scheduling/merge, passive feed windowing, duplicate ID validation, and missing reference validation.
- Integration: generated index loads starter paths, exercises, passive feeds, and path-scoped next routes.
- Editorial checks: compare authored JSON structure, IDs, answer keys, technical literals, code, links, and Japanese text against the source. Review each changed explanation for lost conditions or meaning, then regenerate the index and run content and rendering checks. Keep already concise text unchanged.
- Component: flashcard reveal, cloze answer checking, questionnaire feedback/navigation, and passive feed rendering. Verify the learner-facing labels **Next activity**, **Practice complete**, **Quick review**, and **Choose your prediction**.
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

## Frontend Interview Path Extension (2026-09-27)

Index v11 accepts published interview nodes (`collection/question`) and optional `completionDestination: "flashcard-feed"`. The final destination requires a published feed. Interview sources are checked under required source policy. Review snippets now declare `codeLanguage` and offer lesson links with path context. See [Frontend Interview Practice](frontend-interview-practice.md) for flow and test commands. Regression coverage lives in `frontend-interview.test.ts`, build-index tests, component tests, and `frontend-interview.regression.spec.ts`.

## System Design decision practice

The existing System Design Fundamentals path retains its cache unit and appends Capacity Decisions and API Security Boundaries. The new sourced lessons use an original scaling worksheet and request timeline, with four-question checkpoints for each. Capacity estimates distinguish means from percentiles, application capacity from a shared dependency, and table partitioning from distributed sharding. API practice distinguishes CORS response sharing, anti-forgery checks and object authorization. Examples are exercises, not measured company architectures or executable production operations.

Validate content-index freshness, parser/source relationships and questionnaire scoring. `system-design-practice.regression.spec.ts` covers path → lesson → scored checkpoint journeys and continuation from capacity through routing to security. The private saved-post review ledger and raw social text stay outside curriculum and Git. Public sources support the original lessons; source metadata does not claim that an entire linked book or collection was read.

### Durable retries and reservations

Backend Engineer Readiness adds Durable Retries and Reservation Boundaries after Production Judgment. The former reuses the existing product architecture lesson and its optional temporary-SQLite lab with four scored questions. Reservation practice shares a lesson and six-question checkpoint with System Design Fundamentals, including room-date overlap and explicit expiry. The original Product Engineering path retains 18 questions. SQL/Python are readable authored examples, with no new app execution surface.

The room-date extension uses three original PostgreSQL 17 fences: partial GiST exclusion with bounded finite nonempty dates, a hold insertion, and a guarded expiry transition. Adjacent checkout-exclusive stays and different rooms may coexist; overlapping held/confirmed rows conflict. Stored state controls exclusion, so elapsed time alone does not release capacity. The constraint does not establish payment atomicity, fairness, timestamp/time-zone behavior or service authorization.

Generated-content and graph tests preserve existing resource identity, both path memberships, exercise linkage and four new primary-source references. The browser regression scores all six questions. `npm run test:reservation:sql` verifies the canonical SQL in a pinned, disposable container, including concurrent commit/rollback, invalid fields and expiry guards. CI and release database lanes run it independently of the application database. Operating instructions are in `scripts/content/README.md`.

### Evidence-first agent handoffs

AI Engineering inserts an original handoff lesson and four-question checkpoint after Agents And Operations and before Risk And Governance. The Markdown Python lab chooses the next review step from a durable receipt, preserving exact candidate/source/configuration identity, pending-job reuse, visible failures and incomplete coverage. It never applies content or approves a report. Hashes assume a trusted receipt store and do not prove execution, truth or authorization.

The lesson cites two official Anthropic experiments and links a pinned author-maintained course for optional further practice. Those upstream projects were not independently executed; their product breakdowns are not certified. The existing seven units, source identities and passive feed stay intact. Canonical lab assertions and generated route/source checks validate the content; `agent-handoff.regression.spec.ts` covers path → lesson → checkpoint → governance. No new runtime, model call, content execution surface or persistence schema is added.

### Production case readings

The existing cache and reservation lessons add source-linked Discord/Shopify case readings and original review prompts. No path, unit or exercise is added. The readings distinguish in-flight coalescing from result caching, tenant-sensitive work identity, bounded reservation pools, authoritative ledgers and shared connection pressure. Upstream outcomes are attributed reports; the PostgreSQL fixture does not certify MySQL behavior. Generated-index tests pin the source IDs and section headings, and existing reader/path journeys cover the routes.

### Routing and delivery boundaries

System Design inserts Routing Decisions after Capacity Decisions and before API Security Boundaries. Its original Python lab selects eligible static backends by a stated capacity-normalized signal and tie rule; it does not reproduce NGINX scheduling, live health, concurrent admission or production throughput. Four scored questions distinguish workload signals, affinity, eligibility and the experiment's limits. Official source metadata preserves proxy version/edition scope.

Kafka offset and Redis acknowledgement/reclaim review extend the existing durable architecture lesson in its existing paths. Original crash traces separate broker progress from an atomic local effect/receipt and an uncertain external provider outcome. No new broker implementation, publication, persistence schema or learner-code execution surface is added.

Generated-content tests pin source IDs, sections, checkpoint answers and all three path continuations. The allowlisted Python verifier runs the exact canonical routing fence with an empty environment and the existing exit/timeout/stderr checks. Routing mutations challenge eligibility, normalization, ties, empty pools and numeric validation. `system-design-practice.regression.spec.ts` adds the routing journey; durable practice checks both new evidence sections and source panels. Run content freshness, both unchanged coverage gates, native checks, lint/types, canonical Python labs, production build/pruned readiness and the remote browser lane before review readiness.
