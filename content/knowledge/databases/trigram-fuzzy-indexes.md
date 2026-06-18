---
title: Trigram Fuzzy Indexes In PostgreSQL
slug: databases/trigram-fuzzy-indexes
summary: A detailed explanation of pg_trgm, trigram similarity, similarity thresholds, gin_trgm_ops, expression indexes, and fuzzy search on text columns.
track: Databases
topic: Fuzzy Search
difficulty: senior
tags:
  - postgres
  - pg-trgm
  - fuzzy-search
  - gin-index
prerequisites:
  - Database index fundamentals
  - PostgreSQL full text search
diagramRefs: []
status: published
---

## Why Trigram Search Exists

Full text search is lexeme search. It is good at matching normalized words. It is not designed to decide that `prvte` is close to `private`.

`pg_trgm` fills that gap. It breaks strings into trigrams, which are three-character fragments, and compares how many fragments two strings share. Similar strings usually share many trigrams even when a user inserts, deletes, or swaps a character.

For example, the word `private` produces overlapping fragments such as `pri`, `riv`, `iva`, `vat`, and `ate`, plus boundary-sensitive fragments. A misspelling like `prvte` loses some fragments but still shares enough shape to be useful.

## Installing `pg_trgm`

The extension must be installed in the database before its functions, operators, and operator classes exist:

```sql
create extension if not exists pg_trgm;
```

In application code, this belongs in migrations or database setup, not inside every search request. Running it inside a hot query path is unnecessary operational noise.

PostgreSQL documents `pg_trgm` as a trusted extension, which means users with `CREATE` privilege on the database can install it. Hosted providers may still impose their own extension policies.

## Similarity Functions And Operators

The core function is `similarity(left, right)`, which returns a real number from 0 to 1:

```sql
select similarity('private', 'prvte');
```

The `%` operator asks whether two strings are similar enough according to the current `pg_trgm.similarity_threshold`:

```sql
set pg_trgm.similarity_threshold = 0.11;

select title
from series
where lower(title) % lower('prvte')
order by similarity(lower(title), lower('prvte')) desc;
```

The threshold is a session setting. If you change it per request, prefer transaction-local configuration:

```sql
begin;
set local pg_trgm.similarity_threshold = 0.11;
select ...
commit;
```

`SET LOCAL` avoids leaking a relaxed threshold into later work on the same pooled connection.

## What The Threshold Means

The threshold controls candidate admission for `%`. Lower values admit weaker matches. Higher values require stronger trigram overlap.

A low threshold such as `0.11` can be useful for short typo-heavy search terms, but it increases candidate volume. More candidates means more rechecks, more ranking work, and a higher chance that irrelevant strings enter the top results unless another signal pushes them down.

Threshold tuning is product tuning, not only database tuning:

- Short queries need care because they produce fewer trigrams.
- Names and titles often need lower thresholds than long prose.
- Large tables need conservative thresholds or additional filters.
- The UI should usually debounce search and require a minimum query length.

## `gin_trgm_ops`

`pg_trgm` provides GiST and GIN operator classes. An operator class tells PostgreSQL how an index supports a data type and a family of operators.

For fuzzy filtering over many text rows, a GIN trigram index is common:

```sql
create index tag_localization_name_trgm_idx
  on tag_localization
  using gin ((lower(name)) gin_trgm_ops);
```

The Drizzle schema form maps to the same idea:

```ts
nameTrigramIdx: index("tag_localization_name_trgm_idx").using(
  "gin",
  sql`(lower(${table.name}) gin_trgm_ops)`,
),
```

This is an expression index. It does not index the raw `name`; it indexes `lower(name)` using the trigram operator class. The matching query must use the same normalized expression:

```sql
where lower(name) % lower($1)
order by similarity(lower(name), lower($1)) desc
```

If the query uses `name % $1`, the expression does not match the index. If the query uses `unaccent(lower(name)) % unaccent(lower($1))`, the expression is different again.

## Case And Accent Normalization

`lower(name)` handles case normalization. `unaccent` handles diacritics:

```sql
create extension if not exists unaccent;

select unaccent('Hôtel');
-- Hotel
```

Be careful with indexing `unaccent(name)` directly. PostgreSQL expression indexes require immutable expressions. The built-in `unaccent` function depends on dictionary rules, so teams often use a stored normalized column or a carefully reviewed immutable wrapper when they need accent-insensitive indexed search.

The safest production model is explicit:

```sql
alter table tag_localization
add column name_search text generated always as (lower(name)) stored;

create index tag_localization_name_search_trgm_idx
  on tag_localization
  using gin (name_search gin_trgm_ops);
```

If accent-insensitive behavior is required, make the normalization strategy part of the schema contract instead of hiding it in scattered queries.

## GIN Versus GiST For Trigrams

Both GIN and GiST can support trigram similarity operators. The usual distinction:

- GIN is strong for filtering rows that may match a trigram predicate.
- GiST can support ordered distance queries more naturally.

For example, PostgreSQL notes that nearest-neighbor-style distance ordering can be efficient with GiST trigram indexes but not GIN trigram indexes:

```sql
select name, name <-> 'private' as distance
from tags
order by distance
limit 10;
```

For most application search boxes, you first filter with `%`, then rank candidates with `similarity`. That is often a GIN-friendly shape.

## Short Query Behavior

Trigram indexes are less effective when a pattern has few extractable trigrams. A two-character query has little information. A one-character query has almost none.

Good product guardrails:

- Require at least 3 visible characters for broad fuzzy search.
- Use prefix search or exact lookup for shorter inputs.
- Add tenant, language, or status filters before fuzzy matching.
- Use a conservative limit.
- Log query length, candidate count, latency, and top-result quality.

Do not solve short-query relevance only by lowering the threshold. That may turn a precise index into an expensive candidate generator.

## Read The Drizzle Index Literally

This index:

```ts
nameTrigramIdx: index("tag_localization_name_trgm_idx").using(
  "gin",
  sql`(lower(${table.name}) gin_trgm_ops)`,
),
```

means:

1. Build an index named `tag_localization_name_trgm_idx`.
2. Use the GIN access method.
3. Store keys extracted from `lower(name)`.
4. Use trigram operator behavior from `gin_trgm_ops`.
5. Accelerate queries whose predicates use compatible trigram operators on the same expression.

It is not a normal B-tree index. It is not an exact unique constraint. It does not make every `order by similarity(...)` free. It gives PostgreSQL a fast way to find rows whose normalized text shares enough trigrams with the query.

## Reference Anchors

- [PostgreSQL pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)
- [PostgreSQL GIN indexes](https://www.postgresql.org/docs/current/gin.html)
- [PostgreSQL expression indexes](https://www.postgresql.org/docs/current/indexes-expressional.html)
- [PostgreSQL unaccent](https://www.postgresql.org/docs/current/unaccent.html)
- [Drizzle indexes and constraints](https://orm.drizzle.team/docs/indexes-constraints)
