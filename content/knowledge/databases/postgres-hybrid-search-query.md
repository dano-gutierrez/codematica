---
title: PostgreSQL Hybrid Full Text And Trigram Search Query
slug: databases/postgres-hybrid-search-query
summary: A line-by-line explanation of a PostgreSQL query that combines full text search with trigram fuzzy matching, ranking, and stable pagination.
track: Databases
topic: Search Queries
difficulty: senior
tags:
  - postgres
  - pg-trgm
  - full-text-search
  - query-analysis
prerequisites:
  - PostgreSQL full text search
  - Trigram fuzzy indexes
diagramRefs: []
status: published
---

## The Query Shape

This query combines two search strategies:

1. Full text search for exact lexeme matches.
2. Trigram search for typo-tolerant fuzzy matches.

```sql
create extension if not exists pg_trgm;
create extension if not exists unaccent;
set pg_trgm.similarity_threshold = 0.11;

with q as (
  select websearch_to_tsquery('simple', 'prvte') as query,
         lower('prvte') as qraw
),
candidates as (
  -- 1) FTS pass (exact lexeme match; fast when it hits)
  select s.id as series_id,
         ts_rank_cd(
           setweight(to_tsvector('simple', s.title), 'A'),
           q.query
         ) as rank,
         1 as src
  from galateatv.series s, q
  where to_tsvector('simple', s.title) @@ q.query

  union all

  -- 2) Trigram fuzzy pass (handles typos)
  select s.id as series_id,
         greatest(similarity(lower(s.title), q.qraw), 0) * 0.8 as rank,
         2 as src
  from galateatv.series s, q
  where lower(s.title) % q.qraw
),
scored as (
  select series_id, max(rank) as rank
  from candidates
  group by series_id
)
select s.*, scored.rank
from scored
join galateatv.series s on s.id = scored.series_id
order by scored.rank desc nulls last, s.id
limit 10 offset 0;
```

The product idea is reasonable: exact term matches should win when they exist, but misspelled input should still return plausible results. The raw scoring formula is only a teaching example. `ts_rank_cd` and trigram `similarity` are different signals with different distributions; multiplying one branch by `0.8` does not calibrate them onto a common relevance scale.

## Setup Versus Request Work

These lines are setup or session configuration:

```sql
set pg_trgm.similarity_threshold = 0.11;
create extension if not exists pg_trgm;
create extension if not exists unaccent;
```

`create extension` belongs in migrations or database provisioning. Do not run extension creation inside the normal request query.

`set pg_trgm.similarity_threshold` changes how the `%` trigram operator decides whether two strings are similar enough. In a pooled application connection, prefer `set local` inside a transaction if the threshold is request-specific:

```sql
begin;
set local pg_trgm.similarity_threshold = 0.11;
-- search query here
commit;
```

That avoids leaking the threshold into later requests on the same connection.

`unaccent` is installed here but not used in the query. If accent-insensitive search is required, the query and indexes should use a consistent normalized expression such as a stored `title_search` column.

## The Query CTE

```sql
with q as (
  select websearch_to_tsquery('simple', 'prvte') as query,
         lower('prvte') as qraw
)
```

This creates one row containing two versions of the user query:

- `query`: a full text `tsquery`.
- `qraw`: a lowercase raw string for trigram similarity.

Using `simple` means PostgreSQL avoids English stemming. For titles, names, and short labels, that can be appropriate because users often expect literal matching. For prose, `english` may be better.

`websearch_to_tsquery` accepts familiar web-style input. It is safer for raw search boxes than asking users to write `to_tsquery` syntax.

## FTS Candidate Pass

```sql
select s.id as series_id,
       ts_rank_cd(
         setweight(to_tsvector('simple', s.title), 'A'),
         q.query
       ) as rank,
       1 as src
from galateatv.series s, q
where to_tsvector('simple', s.title) @@ q.query
```

The `where` clause asks whether the title vector matches the parsed query. The rank uses `ts_rank_cd`, which rewards dense coverage. Because the title is short, dense matches can be a useful signal.

`setweight(..., 'A')` labels title lexemes as high-value. In this exact query, the vector only contains title text, so the weight does not distinguish title from body. The pattern becomes more useful when title is concatenated with summary, tags, or body.

The important performance issue: the query builds `to_tsvector('simple', s.title)` inline. For PostgreSQL to use an expression index, the index must match that expression:

```sql
create index series_title_fts_idx
  on galateatv.series
  using gin (to_tsvector('simple', title));
```

If the production query uses `setweight(to_tsvector(...), 'A')` in the indexed expression, match that too. A stored `search_document` column is often clearer:

```sql
alter table galateatv.series
add column title_search_document tsvector
generated always as (to_tsvector('simple', coalesce(title, ''))) stored;

create index series_title_search_document_idx
  on galateatv.series
  using gin (title_search_document);
```

Then the query can use `title_search_document @@ q.query`.

## Trigram Candidate Pass

```sql
select s.id as series_id,
       greatest(similarity(lower(s.title), q.qraw), 0) * 0.8 as rank,
       2 as src
from galateatv.series s, q
where lower(s.title) % q.qraw
```

This pass handles typos. The `%` operator uses the current `pg_trgm.similarity_threshold`; `similarity` computes the score used for ranking.

The `* 0.8` is a business weight. It says a fuzzy trigram match should usually rank below an FTS match with the same raw score. The exact value is product tuning. It should be tested with representative search logs.

`greatest(..., 0)` is defensive but usually redundant because `similarity` returns values from 0 to 1.

The matching index is:

```sql
create index series_title_trgm_idx
  on galateatv.series
  using gin ((lower(title)) gin_trgm_ops);
```

The extra parentheses around `lower(title)` make it an expression index. The query must use `lower(s.title)` for the planner to match the index.

## `UNION ALL`

The query uses `union all`, not `union`:

```sql
-- FTS pass
...
union all
-- trigram pass
...
```

That is usually right here. A row can be a candidate from both sources. Keeping both rows lets the next CTE choose the best rank. Plain `union` would add de-duplication work and might collapse rows in ways that hide useful source-specific scores.

The `src` column is currently not used after `candidates`. It is useful while debugging or if later ranking needs source-specific tie-breaks. If it remains unused, it can be removed.

## `MAX(rank)` In `scored`

```sql
scored as (
  select series_id, max(rank) as rank
  from candidates
  group by series_id
)
```

This collapses duplicate candidates into one result per series. `max(rank)` means the numerically larger source wins, but that is not necessarily the better match because the branch scores are not calibrated. Keep this form for exploring candidate generation, not for claiming production relevance quality.

Alternative policies are possible:

- `max(rank)` rewards the best independent signal.
- `sum(rank)` rewards rows that match multiple signals.
- `max(rank) + bonus` rewards combined evidence without letting broad fuzzy matches dominate.

For production, either calibrate both scores against judged query-result pairs or combine branch positions with a scale-independent method such as reciprocal rank fusion. Exact and prefix boosts can then be added as separate, explainable features.

## Final Join And Sort

```sql
select s.*, scored.rank
from scored
join galateatv.series s on s.id = scored.series_id
order by scored.rank desc nulls last, s.id
limit 10 offset 0;
```

The CTE keeps candidates narrow, then joins back to fetch full rows. That is a good pattern when candidate generation is selective.

The `order by` uses rank first and `s.id` as a deterministic tie-breaker. Stable tie-breaks matter for pagination and repeatable tests.

`offset` is fine for small pages. For deep pagination, keyset pagination is usually better because large offsets require the database to walk past many sorted rows.

## Better Production Version

A production version should avoid setup statements in the query path, use stored/indexed normalized fields, and avoid comparing raw score scales. This example uses reciprocal rank fusion (RRF): each branch ranks its own results, and the final score combines positions rather than raw values. The branch limits are workload controls and must be tuned with representative data.

```sql
begin;
set local pg_trgm.similarity_threshold = 0.11;

with q as (
  select
    websearch_to_tsquery('simple', $1) as query,
    lower($1) as qraw
),
fts as (
  select s.id as series_id,
         row_number() over (
           order by ts_rank_cd(s.title_search_document, q.query) desc, s.id
         ) as position
  from galateatv.series s
  cross join q
  where s.title_search_document @@ q.query
  order by position
  limit 200
),
fuzzy as (
  select s.id as series_id,
         row_number() over (
           order by similarity(s.title_search_text, q.qraw) desc, s.id
         ) as position
  from galateatv.series s
  cross join q
  where s.title_search_text % q.qraw
  order by position
  limit 200
),
candidates as (
  select series_id, 1.0 / (60 + position) as rrf_score
  from fts

  union all

  select series_id, 1.0 / (60 + position) as rrf_score
  from fuzzy
),
scored as (
  select series_id, sum(rrf_score) as rank
  from candidates
  group by series_id
)
select s.*, scored.rank
from scored
join galateatv.series s on s.id = scored.series_id
order by scored.rank desc, s.id
limit $2;

commit;
```

The conventional RRF constant `60` dampens the effect of small position changes; it is not universal product truth. Validate it, candidate limits, threshold, and any business boosts against labeled searches. Empty or stop-word-only input can produce an empty `tsquery`, so reject or route such queries before this SQL.

Example supporting indexes:

```sql
create index series_title_search_document_idx
  on galateatv.series
  using gin (title_search_document);

create index series_title_search_text_trgm_idx
  on galateatv.series
  using gin (title_search_text gin_trgm_ops);
```

## Review Standard

When reviewing this query, verify:

- Extensions are managed by migrations.
- The trigram threshold cannot leak across pooled requests.
- FTS and trigram expressions match real indexes.
- The selected text search config matches the product domain.
- Short queries have product guardrails.
- Ranking weights are tested against representative examples.
- Raw FTS and trigram scores are calibrated or combined by rank rather than compared as if they share a scale.
- Pagination has a deterministic tie-break.
- Unused `src` fields are either used for observability or removed.

## Reference Anchors

- [PostgreSQL pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)
- [PostgreSQL controlling text search](https://www.postgresql.org/docs/current/textsearch-controls.html)
- [PostgreSQL text search functions and operators](https://www.postgresql.org/docs/current/functions-textsearch.html)
- [PostgreSQL preferred index types for text search](https://www.postgresql.org/docs/current/textsearch-indexes.html)
- [PostgreSQL expression indexes](https://www.postgresql.org/docs/current/indexes-expressional.html)
- [Cormack, Clarke, and Buettcher: Reciprocal Rank Fusion](https://doi.org/10.1145/1571941.1572114)
