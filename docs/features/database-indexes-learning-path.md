# Database Indexes Learning Path

## Snapshot

- Status: `shipped`
- Last updated: `2026-08-01`
- Owner thread: `n/a`
- Current state: A published `database-indexes-and-search` skill path ships with five database indexing, update-performance, and search lessons, five questionnaires, and a 40-card passive flashcard feed.
- Target outcome: Users can study database index fundamentals, PostgreSQL HOT update behavior, full text search, trigram fuzzy matching, and a hybrid search query without Supabase or remote services.
- Code touchpoints:
  - `content/knowledge/databases/*.md`
  - `content/exercises/databases/*.json`
  - `content/learning-paths/database-indexes-and-search.json`
  - `content/flashcard-feeds/database-indexes-and-search.json`
  - `packages/core/src/content/index.test.ts`
- Primary tests:
  - `packages/core/src/content/index.test.ts`
  - `apps/web/e2e/specs/database-indexes.regression.spec.ts`

## One-Minute Brief

The database indexes path teaches production index judgment, PostgreSQL update mechanics, and PostgreSQL search behavior. It starts with general index tradeoffs, explains Heap-Only Tuple (HOT) updates and their relationship to MVCC, page space, indexes, pruning, and vacuuming, then covers full text search, `pg_trgm` fuzzy matching, and a hybrid query that combines exact lexeme search with typo-tolerant trigram candidates.

The feature is content-only and local-first. It does not change runtime search, Supabase requirements, exercise schemas, or the path UI.

## Outcome / Contract

- The `database-indexes-and-search` path is published at `/paths/database-indexes-and-search`.
- The path contains five ordered document/questionnaire pairs.
- The searchable Markdown docs live under `content/knowledge/databases/`.
- Practice lives under `content/exercises/databases/` and uses existing questionnaire question kinds.
- The passive review route is `/paths/database-indexes-and-search/flashcards`.
- Content uses primary or official source anchors for PostgreSQL and Drizzle behavior.
- The HOT lesson treats an update as eligible only when no changed column is referenced by a non-summarizing index and the successor tuple fits on the original heap page; it does not present eligibility as a guarantee.
- HOT guidance must not imply that page pruning replaces autovacuum, visibility-map maintenance, statistics maintenance, or transaction-ID freezing.
- SQL query editor support remains future work and is not represented in exercise JSON yet.

## Current State

The shipped path includes:

- `index-fundamentals`: B-tree, GIN, GiST, BRIN, selectivity, expression, partial, covering, and write-cost tradeoffs.
- `postgres-hot-updates`: MVCC row versions, same-page HOT chains, index eligibility, the PostgreSQL 16+ BRIN exception, fillfactor, pruning, vacuuming, visibility maps, monitoring, and production tradeoffs.
- `postgres-full-text-search`: `to_tsvector`, `tsquery`, `websearch_to_tsquery`, `@@`, `setweight`, GIN, `ts_rank`, and `ts_rank_cd`.
- `trigram-fuzzy-indexes`: `pg_trgm`, `%`, `similarity`, `pg_trgm.similarity_threshold`, `gin_trgm_ops`, expression indexes, and the Drizzle trigram index form.
- `postgres-hybrid-search-query`: a line-by-line walkthrough of the FTS-plus-trigram CTE query.

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

- PostgreSQL and Drizzle official docs are the source anchors for factual database, storage, and search behavior.
- HOT content targets supported PostgreSQL releases, uses PostgreSQL 16-18 behavior as its main contract, and explicitly labels the PostgreSQL 16 BRIN eligibility change.
- Query examples are educational and should not imply that runtime browsing depends on PostgreSQL.
- `CREATE EXTENSION` belongs in setup or migrations; per-request trigram threshold tuning should be transaction-local.

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

- The path alternates document then questionnaire for each of its five units.
- The HOT lesson compares regular index keys, unique indexes, `INCLUDE` payloads, expressions, partial predicates, and the PostgreSQL 16+ BRIN summarizing-index exception.
- HOT monitoring examples use `n_tup_upd`, `n_tup_hot_upd`, `n_tup_newpage_upd`, guarded percentage division, and interval-based interpretation of cumulative statistics.
- The passive feed is path-scoped and is not included as an ordered path node.
- The passive feed contains 40 cards, balanced across `concept`, `practical`, `snippet`, and `interview`; eight cards source the HOT lesson.
- The future SQL editor is documented only in the roadmap until a dedicated feature contract exists.

### Failure And Edge Handling

- Missing document, exercise, path, or source document references fail content indexing.
- Invalid questionnaire structure fails content indexing through existing validation.
- A user can open practice without `?path=`, but next-node navigation only appears for path-scoped sessions.

## Code Touchpoints

- `content/knowledge/databases/*.md`: canonical lessons and source anchors.
- `content/exercises/databases/*.json`: questionnaire practice for each lesson.
- `content/learning-paths/database-indexes-and-search.json`: ordered path units and nodes.
- `content/flashcard-feeds/database-indexes-and-search.json`: passive mobile review cards.
- `packages/core/src/generated/content-index.json`: generated artifact; regenerate, do not hand-edit.
- `apps/web/e2e/specs/database-indexes.regression.spec.ts`: mobile path, search, questionnaire, and passive-feed coverage.

## Test Plan

- Unit/integration: generated index loads all five path units, documents, questionnaires, the 40-card passive feed, and the Fundamentals-to-HOT-to-FTS next-node sequence.
- E2E: one mobile journey reads and practices trigram indexes; another reads the HOT lesson, searches `/browse` for Heap-Only Tuple content, completes the HOT questionnaire, and verifies HOT passive review content.
- Content check: `npm run content:check` must pass after content/index/schema-sensitive changes.

## Open Questions

- What demo schema and data set should power the future SQL query editor?
- Which SQL dialect subset should the first executable query lessons allow?

## Decision Log

- `2026-06-18`: Ship database indexes as a standalone skill path instead of adding it to Backend Engineer Readiness.
- `2026-06-18`: Keep SQL query editor support in the roadmap only; no executable SQL schema or UI in this slice.
- `2026-08-01`: Add HOT updates as the second unit so physical update and index-maintenance tradeoffs follow index fundamentals before search-specific material.
- `2026-08-01`: Target supported PostgreSQL behavior and document PostgreSQL 16 as the version boundary where BRIN-only column updates can remain HOT-eligible.

## Documentation Updates

- `docs/README.md`: Updates the database path catalog entry to include HOT updates.
- Nested READMEs: No change; existing lesson, questionnaire, path, and passive-feed authoring contracts still apply.
- `docs/engineering-overview.md`: Adds HOT storage and update behavior to the shipped database path summary.
- `docs/codex-context.md`: Adds HOT updates to the feature-doc reading map.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/database-indexes-learning-path.md first. Compare the documented database indexes path contract against content/knowledge/databases, content/exercises/databases, content/learning-paths/database-indexes-and-search.json, content/flashcard-feeds/database-indexes-and-search.json, packages/core/src/content/index.test.ts, and apps/web/e2e/specs/database-indexes.regression.spec.ts, then update tests and docs with any behavior changes.`
