# Database Indexes Learning Path

## Snapshot

- Status: `shipped`
- Last updated: `2026-09-30`
- Owner thread: `n/a`
- Current state: A published `database-indexes-and-search` skill path ships with six database indexing, update-performance, search, and connection-management lessons, six questionnaires, and a 48-card passive flashcard feed.
- Target outcome: Users can study database index fundamentals, PostgreSQL HOT update behavior, full text search, trigram fuzzy matching, a hybrid search query, and resilient connection pooling without Supabase or remote services.
- Code touchpoints:
  - `content/knowledge/databases/*.md`
  - `content/exercises/databases/*.json`
  - `content/learning-paths/database-indexes-and-search.json`
  - `content/flashcard-feeds/database-indexes-and-search.json`
  - `packages/core/src/content/index.test.ts`
- Primary tests:
  - `packages/core/src/content/index.test.ts`
  - `packages/core/src/content/connection-pooling.test.ts`
  - `apps/web/src/lib/content/index.test.ts`
  - `apps/web/e2e/specs/database-indexes.regression.spec.ts`
  - `apps/web/e2e/specs/connection-pooling.regression.spec.ts`

## One-Minute Brief

This path teaches index selection, PostgreSQL update mechanics, and search behavior. It starts with general index tradeoffs, explains Heap-Only Tuple (HOT) updates and their relationship to MVCC, page space, indexes, pruning, and vacuuming, then covers full text search, `pg_trgm` fuzzy matching, and a hybrid query that combines exact lexeme search with typo-tolerant trigram candidates.

The final connection-management unit explains application pools, transaction poolers, fleet budgets, queueing, shutdown, spot placement, compatibility, monitoring, and rollout evidence. It includes three rendered Mermaid diagrams, worked capacity examples, a 12-question checkpoint, and eight review cards.

This local-first content addition preserves runtime search, Supabase requirements, exercise schemas, and the path UI.

## Outcome / Contract

- The `database-indexes-and-search` path is published at `/paths/database-indexes-and-search`.
- The path contains six ordered document/questionnaire pairs.
- The searchable Markdown docs live under `content/knowledge/databases/`.
- Practice lives under `content/exercises/databases/` and uses existing questionnaire question kinds.
- The passive review route is `/paths/database-indexes-and-search/flashcards`.
- Content uses primary or official source anchors for PostgreSQL and Drizzle behavior.
- The HOT lesson treats an update as eligible only when no changed column is referenced by a non-summarizing index and the successor tuple fits on the original heap page; it does not present eligibility as a guarantee.
- HOT guidance must not imply that page pruning replaces autovacuum, visibility-map maintenance, statistics maintenance, or transaction-ID freezing.
- The pooling checkpoint uses six choices, four numerical cloze questions, one shutdown-ordering question, and one pooling-mode matching question. Feedback explains incorrect assumptions; it does not query a database.
- Titan/Saturn details are reported motivating context, not verified infrastructure facts. The 1,187 ceiling, 30-second warning, and staging-only PgDog claim must remain labeled as unverified; all sizing scenarios are illustrative.
- SQL query editor support remains future work and is not represented in exercise JSON yet.

## Current State

The shipped path includes:

- `index-fundamentals`: B-tree, GIN, GiST, BRIN, selectivity, expression, partial, covering, and write-cost tradeoffs.
- `postgres-hot-updates`: MVCC row versions, same-page HOT chains, index eligibility, the PostgreSQL 16+ BRIN exception, fillfactor, pruning, vacuuming, visibility maps, monitoring, and production tradeoffs.
- `postgres-full-text-search`: `to_tsvector`, `tsquery`, `websearch_to_tsquery`, `@@`, `setweight`, GIN, `ts_rank`, and `ts_rank_cd`.
- `trigram-fuzzy-indexes`: `pg_trgm`, `%`, `similarity`, `pg_trgm.similarity_threshold`, `gin_trgm_ops`, expression indexes, and the Drizzle trigram index form.
- `postgres-hybrid-search-query`: a line-by-line walkthrough of the FTS-plus-trigram CTE query.
- `postgres-connection-pooling`: application/backend lifetimes, PgDog/PgBouncer modes, replica/process/pool multiplication, rollout overlap, Little's Law, session compatibility, timeout budgets, uncertain commit outcomes, graceful shutdown, spot availability, and evidence-based rollout.
- `postgres-hybrid-search-query` explicitly treats raw FTS rank and trigram similarity as incomparable scales and shows reciprocal rank fusion as a safer production combination.

## Scope

### In Scope

- Local Markdown lessons.
- Local questionnaire exercises.
- Path-scoped passive flashcards.
- Generated content index validation and path-level E2E coverage.

### Out Of Scope

- Executable SQL editor or database sandbox.
- Runtime PostgreSQL search in the app UI.
- Supabase schema or search RPC changes.
- Persisted scores, progress, or mastery state.

### Assumptions

- PostgreSQL and Drizzle official docs anchor database, storage, and search behavior. Pooling uses PostgreSQL 18, PgDog, PgBouncer, node-postgres, NestJS, Kubernetes, Google Cloud, AWS, and MIT primary references consulted on 2026-09-30. Match operational guidance to deployed versions and providers.
- HOT content targets supported PostgreSQL releases, uses PostgreSQL 16-18 behavior as its main contract, and explicitly labels the PostgreSQL 16 BRIN eligibility change.
- Query examples are educational and should not imply that runtime browsing depends on PostgreSQL.
- `CREATE EXTENSION` belongs in setup or migrations; per-request trigram threshold tuning should be transaction-local.
- Search thresholds, candidate limits, RRF constants, and business boosts are illustrative until evaluated against labeled product queries.

## Detailed Behavior

### UI / UX

- The path appears on the path home with the existing `LearningPathMap` UI.
- Each article is available through `/docs/[...slug]` and `/browse` search.
- Each questionnaire uses the existing one-question-at-a-time mobile flow.
- The passive feed uses existing scroll-only flashcard behavior and stores no read state.

### Data Model And Persistence

- No schema changes are introduced.
- `packages/core/src/generated/content-index.json` includes the new documents, exercises, path, and passive feed after `npm run content:index`.
- The path, exercises, and feed remain local JSON artifacts.

### Business Logic

- The path alternates document then questionnaire for each of its six units.
- The HOT lesson compares regular index keys, unique indexes, `INCLUDE` payloads, expressions, partial predicates, and the PostgreSQL 16+ BRIN summarizing-index exception.
- HOT monitoring examples use `n_tup_upd`, `n_tup_hot_upd`, `n_tup_newpage_upd`, guarded percentage division, and interval-based interpretation of cumulative statistics.
- The passive feed is path-scoped and is not included as an ordered path node.
- Hybrid ranking combines calibrated signals or branch positions; it must not compare raw `ts_rank_cd` and trigram `similarity` values as if they share a scale.
- The passive feed contains 48 cards, balanced across `concept`, `practical`, `snippet`, and `interview`; eight cards source the HOT lesson and eight source the connection-pooling lesson.
- Pooling examples are displayed teaching material. No new database dependency, runtime import, executable SQL environment, or infrastructure configuration is introduced.
- The future SQL editor is documented only in the roadmap until a dedicated feature contract exists.

### Failure And Edge Handling

- Missing document, exercise, path, or source document references fail content indexing.
- Invalid questionnaire structure fails content indexing through existing validation.
- Practice works without `?path=`; navigation to the next activity appears only in path-scoped sessions.

## Code Touchpoints

- `content/knowledge/databases/*.md`: canonical lessons and source anchors.
- `content/exercises/databases/*.json`: questionnaire practice for each lesson.
- `content/learning-paths/database-indexes-and-search.json`: ordered path units and nodes.
- `content/flashcard-feeds/database-indexes-and-search.json`: passive mobile review cards.
- `packages/core/src/content/connection-pooling.test.ts`: path references, capacity-answer calculations, and rejection of unsafe scenario choices.
- `apps/web/e2e/specs/connection-pooling.regression.spec.ts`: mobile search, path navigation, three rendered diagrams, all questionnaire interactions, wrong-answer feedback, and added review cards.
- `packages/core/src/generated/content-index.json`: generated artifact; regenerate, do not hand-edit.
- `apps/web/e2e/specs/database-indexes.regression.spec.ts`: mobile path, search, questionnaire, and passive-feed coverage.

## Test Plan

- Unit/integration: generated index loads all six path units, documents, questionnaires, the 48-card passive feed, and the Fundamentals-to-HOT-to-FTS and Hybrid-to-Pooling next-node sequences. The dedicated pooling suite independently calculates quiz answers and rejects tempting shortcuts and unsafe decisions.
- E2E: one mobile journey reads and practices trigram indexes; another reads the HOT lesson, searches `/browse` for Heap-Only Tuple content, completes the HOT questionnaire, and verifies HOT passive review content.
- Pooling E2E: render all three Mermaid blocks without errors; complete twelve questions including a deliberately wrong budget answer, ordering controls, and mode matching; verify the resulting score and appended review cards.
- Commands: `npm run content:index`, `npm run content:check`, `npx vitest run packages/core/src/content/index.test.ts packages/core/src/content/connection-pooling.test.ts`, `npm run test:coverage`, `npm run lint`, `npm run typecheck`, and `npx playwright test --config=apps/web/e2e/playwright.config.ts --project=mobile-chromium apps/web/e2e/specs/database-indexes.regression.spec.ts apps/web/e2e/specs/connection-pooling.regression.spec.ts`. Playwright builds and serves the production web app.
- No native code, database schema, dependencies, or packaging changes are part of this unit; native runtime and infrastructure failure tests are outside this content-only validation. SQL/Node/TOML examples are educational and have not been run against Titan. Production load, compatibility, final pruned application startup, and failure testing remain prerequisites for a separate infrastructure rollout.

## Open Questions

- What demo schema and data set should power the future SQL query editor?
- Which SQL dialect subset should the first executable query lessons allow?

## Decision Log

- `2026-06-18`: Ship database indexes as a standalone skill path instead of adding it to Backend Engineer Readiness.
- `2026-06-18`: Keep SQL query editor support in the roadmap only; no executable SQL schema or UI in this slice.
- `2026-08-01`: Add HOT updates as the second unit so physical update and index-maintenance tradeoffs follow index fundamentals before search-specific material.
- `2026-08-01`: Target supported PostgreSQL behavior and document PostgreSQL 16 as the version boundary where BRIN-only column updates can remain HOT-eligible.

- `2026-09-30`: Append connection pooling and resilience to the existing database skill path; preserve its URL/title and previous node order. Reuse the Markdown/Mermaid, questionnaire, and passive-feed UI. Apply technical-edit to the drafted lesson while preserving code, literals, source links, and operational conditions.

## Documentation Updates

- `docs/README.md`: Includes connection management in the database path catalog entry.
- Nested READMEs: Describe the connection-pooling unit, numerical/scenario exercises, and eight review cards in the path, exercise, and feed authoring guides.
- `docs/engineering-overview.md`: Includes connection pooling in the shipped database path summary; architecture and Mermaid flows remain unchanged.
- `docs/codex-context.md`: Includes connection management in the feature-doc reading map.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/database-indexes-learning-path.md first. Compare the documented database indexes path contract against content/knowledge/databases, content/exercises/databases, content/learning-paths/database-indexes-and-search.json, content/flashcard-feeds/database-indexes-and-search.json, packages/core/src/content/index.test.ts, and apps/web/e2e/specs/database-indexes.regression.spec.ts, then update tests and docs with any behavior changes.`
