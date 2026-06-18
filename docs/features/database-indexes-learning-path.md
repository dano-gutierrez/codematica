# Database Indexes Learning Path

## Snapshot

- Status: `shipped`
- Last updated: `2026-06-18`
- Owner thread: `n/a`
- Current state: A published `database-indexes-and-search` skill path ships with four database indexing/search lessons, four questionnaires, and a passive flashcard feed.
- Target outcome: Users can study database index fundamentals, PostgreSQL full text search, trigram fuzzy matching, and a hybrid search query without Supabase or remote services.
- Code touchpoints:
  - `content/knowledge/databases/*.md`
  - `content/exercises/databases/*.json`
  - `content/learning-paths/database-indexes-and-search.json`
  - `content/flashcard-feeds/database-indexes-and-search.json`
  - `src/lib/content/index.test.ts`
- Primary tests:
  - `src/lib/content/index.test.ts`
  - `e2e/specs/database-indexes.regression.spec.ts`

## One-Minute Brief

The database indexes path teaches production index judgment and PostgreSQL search behavior. It starts with general index tradeoffs, then explains PostgreSQL full text search, `pg_trgm` fuzzy matching, and a hybrid query that combines exact lexeme search with typo-tolerant trigram candidates.

The feature is content-only and local-first. It does not change runtime search, Supabase requirements, exercise schemas, or the path UI.

## Outcome / Contract

- The `database-indexes-and-search` path is published at `/paths/database-indexes-and-search`.
- The path contains four ordered document/questionnaire pairs.
- The searchable Markdown docs live under `content/knowledge/databases/`.
- Practice lives under `content/exercises/databases/` and uses existing questionnaire question kinds.
- The passive review route is `/paths/database-indexes-and-search/flashcards`.
- Content uses primary or official source anchors for PostgreSQL and Drizzle behavior.
- SQL query editor support remains future work and is not represented in exercise JSON yet.

## Current State

The shipped path includes:

- `index-fundamentals`: B-tree, GIN, GiST, BRIN, selectivity, expression, partial, covering, and write-cost tradeoffs.
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

- PostgreSQL and Drizzle official docs are the source anchors for factual database/search behavior.
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
- `src/generated/content-index.json` includes the new documents, exercises, path, and passive feed after `npm run content:index`.
- The path, exercises, and feed remain local JSON artifacts.

### Business Logic

- The path alternates document then questionnaire for each unit.
- The passive feed is path-scoped and is not included as an ordered path node.
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
- `src/generated/content-index.json`: generated artifact; regenerate, do not hand-edit.
- `e2e/specs/database-indexes.regression.spec.ts`: mobile path, search, questionnaire, and passive-feed coverage.

## Test Plan

- Unit/integration: generated index loads the path, documents, questionnaires, passive feed, and next-node routes.
- E2E: mobile user opens the path, reads the trigram lesson, searches `/browse` for `gin_trgm_ops`, completes the trigram questionnaire, and opens the passive feed.
- Content check: `npm run content:check` must pass after content/index/schema-sensitive changes.

## Open Questions

- What demo schema and data set should power the future SQL query editor?
- Which SQL dialect subset should the first executable query lessons allow?

## Decision Log

- `2026-06-18`: Ship database indexes as a standalone skill path instead of adding it to Backend Engineer Readiness.
- `2026-06-18`: Keep SQL query editor support in the roadmap only; no executable SQL schema or UI in this slice.

## Documentation Updates

- `docs/README.md`: Adds this feature doc to the docs hub.
- Nested READMEs: Updates path, exercise, and passive feed README guidance for database-index content.
- `docs/engineering-overview.md`: Adds the shipped database indexes path to the content model and testing summary.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/database-indexes-learning-path.md first. Compare the documented database indexes path contract against content/knowledge/databases, content/exercises/databases, content/learning-paths/database-indexes-and-search.json, content/flashcard-feeds/database-indexes-and-search.json, src/lib/content/index.test.ts, and e2e/specs/database-indexes.regression.spec.ts, then update tests and docs with any behavior changes.`
