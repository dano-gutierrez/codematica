---
title: PostgreSQL Full Text Search And Ranking
slug: databases/postgres-full-text-search
summary: How PostgreSQL full text search turns documents into lexemes, parses user queries, ranks results, and uses GIN indexes for scalable matching.
track: Databases
topic: Full Text Search
difficulty: senior
tags:
  - postgres
  - full-text-search
  - gin-index
  - ranking
prerequisites:
  - Database index fundamentals
  - SQL query basics
diagramRefs: []
status: published
---

## Search Is Not String Contains

Full text search is for matching documents by normalized terms, not for checking whether one raw string appears inside another raw string. PostgreSQL models this with two important types:

- `tsvector`: the searchable document representation.
- `tsquery`: the parsed query representation.

The search operator is `@@`:

```sql
select id, title
from articles
where to_tsvector('english', title || ' ' || body)
      @@ websearch_to_tsquery('english', 'cache invalidation');
```

This query does not compare literal characters. It tokenizes text, normalizes tokens into lexemes, ignores some punctuation, applies dictionary behavior, and then asks whether the document vector satisfies the parsed query.

## `to_tsvector`

`to_tsvector` parses text into lexemes with positions:

```sql
select to_tsvector('english', 'The Fat Rats');
-- 'fat':2 'rat':3
```

The `english` configuration stems plural forms and drops stop words. The `simple` configuration is more literal: it lowercases tokens but does not apply English stemming. That distinction matters for product search. English stemming helps prose search; `simple` can be better for names, tags, codes, or titles where changing a word shape might be surprising.

Use `coalesce` when building vectors from nullable fields:

```sql
setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
setweight(to_tsvector('english', coalesce(body, '')), 'C')
```

Without `coalesce`, a null input can produce null and poison the concatenation.

## Query Parsers

PostgreSQL has several ways to turn user input into `tsquery`:

```sql
select plainto_tsquery('english', 'fat rats');
-- 'fat' & 'rat'

select phraseto_tsquery('english', 'fat rats');
-- 'fat' <-> 'rat'

select websearch_to_tsquery('english', '"fat rats" or cat -dog');
-- phrase, OR, and NOT behavior similar to web search syntax
```

`to_tsquery` exposes the most explicit syntax, but it is less forgiving. `websearch_to_tsquery` is often a better fit for raw user search boxes because it accepts familiar web-style input and handles punctuation more safely.

## Weighted Documents

`setweight` labels lexemes with weights `A`, `B`, `C`, or `D`. A common pattern is to put title terms above body terms:

```sql
create index articles_search_document_idx
  on articles
  using gin (
    (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(tags_text, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(body, '')), 'C')
    )
  );
```

The index can find candidate rows. Ranking then uses the vector and the query to decide order.

For frequently searched content, store the vector in a generated column or a maintained column instead of rebuilding it in every query:

```sql
alter table articles
add column search_document tsvector
generated always as (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(body, '')), 'C')
) stored;

create index articles_search_document_idx
  on articles
  using gin (search_document);
```

## `ts_rank` And `ts_rank_cd`

`ts_rank` scores how well a `tsvector` matches a `tsquery`. `ts_rank_cd` uses a cover-density algorithm, which rewards matches that are closer together. That makes it useful when proximity is a relevance signal.

```sql
with q as (
  select websearch_to_tsquery('english', 'cache invalidation') as query
)
select
  id,
  title,
  ts_rank_cd(search_document, q.query) as rank
from articles, q
where search_document @@ q.query
order by rank desc;
```

The score is not a universal percentage. PostgreSQL ranking does not use global corpus statistics like a dedicated search engine might. Normalization options can scale or length-normalize scores, but they do not turn rank into an absolute quality measure.

Treat rank as an ordering signal inside one query, not as a durable product score.

## GIN Indexes For Full Text Search

GIN is the preferred PostgreSQL index type for `tsvector` full text search. It stores lexemes as keys with posting lists of rows that contain those lexemes. Multi-term queries can use those posting lists to narrow candidates.

```sql
create index articles_search_document_idx
  on articles
  using gin (search_document);
```

GIN indexes store lexemes, not the original document and not all ranking weight information. PostgreSQL may need to recheck table rows for visibility and ranking. This is normal.

## Highlighting

`ts_headline` can produce snippets with matched terms highlighted:

```sql
select ts_headline('english', body, q.query)
from articles, websearch_to_tsquery('english', 'cache invalidation') q(query)
where search_document @@ q.query;
```

It works from the original document text, not from the `tsvector`. That can be expensive, so use it deliberately on a limited result set rather than every row in a broad candidate pool.

## FTS Failure Modes

Full text search is strong for token and lexeme search. It is weak for typos, arbitrary substrings, and very short malformed queries. Searching for `private` can match a document containing `private`; searching for `prvte` will usually not match because `prvte` is a different lexeme.

That is why production search often combines:

- FTS for exact lexeme and phrase behavior.
- Trigram search for typo tolerance.
- Business boosts for title, popularity, freshness, or permissions.
- Deterministic tie-breakers for stable pagination.

## Review Standard

When reviewing FTS SQL, ask:

- Which text search configuration is being used, and why?
- Is the document vector stored or recomputed?
- Does the query parser match raw user input?
- Is the GIN index on the same expression or column used by the query?
- Is ranking applied after filtering instead of across the entire table?
- Are short typos handled somewhere else, such as `pg_trgm`?

## Reference Anchors

- [PostgreSQL controlling text search](https://www.postgresql.org/docs/current/textsearch-controls.html)
- [PostgreSQL text search functions and operators](https://www.postgresql.org/docs/current/functions-textsearch.html)
- [PostgreSQL preferred index types for text search](https://www.postgresql.org/docs/current/textsearch-indexes.html)
- [Drizzle PostgreSQL full-text search guide](https://orm.drizzle.team/docs/guides/postgresql-full-text-search)
