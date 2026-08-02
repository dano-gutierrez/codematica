---
title: Database Index Fundamentals For Production Engineers
slug: databases/index-fundamentals
summary: A production-focused guide to database index tradeoffs, access methods, selectivity, expression indexes, partial indexes, covering indexes, and failure modes.
track: Databases
topic: Indexes
difficulty: senior
tags:
  - database-indexes
  - query-planning
  - performance
  - postgres
prerequisites:
  - SQL query basics
  - Relational database tables
diagramRefs: []
status: published
---

## Index Mental Model

A database index is a maintained read structure. It stores enough derived information to help the planner find candidate rows without scanning every row in the table. That is the useful mental model: every index is a trade. Reads that match the index shape can become cheaper, while writes, storage, vacuuming, and planning complexity become more expensive.

An index is not a magic cache of complete query results. In PostgreSQL, normal indexes are stored separately from the table heap. A typical index scan first finds matching row references in the index, then visits the heap to read the row version visible to the current transaction. This means an index can reduce search work and still leave heap reads, row visibility checks, and sorting work behind.

The senior question is not "should this column be indexed?" It is "which workload is paying for this index, and does the query shape actually let the planner use it?"

## B-Tree First

B-tree is the default general-purpose index family in many relational databases. It works well for equality, ranges, ordering, prefixes, and uniqueness:

```sql
create index users_email_idx on users (email);
create index orders_account_created_idx on orders (account_id, created_at desc);
create unique index users_lower_email_key on users (lower(email));
```

B-tree is the right first guess for:

- exact lookup: `where email = $1`
- range lookup: `where created_at >= $1 and created_at < $2`
- ordered access: `order by created_at desc limit 50`
- compound access where the leftmost columns match the query
- uniqueness and primary-key-like constraints

The leftmost-prefix rule matters for composite B-tree indexes. An index on `(account_id, created_at)` is strong for `where account_id = $1 order by created_at`, but weak for `where created_at > $1` without `account_id` because the index is ordered first by account.

## Inverted Indexes

Some values are not single scalar keys. A document contains many words. An array contains many elements. JSON may contain many keys and values. For those shapes, an inverted index is often a better match.

GIN stands for Generalized Inverted Index. It stores entries for component keys extracted from a composite value, then maps each key to rows that contain it. For text search, the keys are lexemes in a `tsvector`. For trigram search, the keys are trigrams. For arrays, the keys are array elements.

```sql
create index articles_search_document_idx
  on articles
  using gin (search_document);

create index users_tags_idx
  on users
  using gin (tags);
```

The upside is fast candidate filtering for containment-like queries. The tradeoff is write overhead and row recheck. A GIN index often answers "which rows might contain these components?" The database may still need to visit the table row to confirm visibility, weights, or exact predicate semantics.

## GiST, BRIN, And Specialized Shapes

GiST is a generalized search tree. It can support similarity, geometric, range, and nearest-neighbor-style searches depending on the operator class. For trigram search, GiST can be useful when you want ordered distance searches such as "closest strings by distance." GIN is usually the stronger fit for filtering a large set of text rows by trigram membership.

BRIN stands for Block Range Index. It stores summaries over physical block ranges. It shines when table order correlates with the queried value, such as append-heavy event tables filtered by time. A BRIN index can be tiny compared with a B-tree, but it returns coarse block ranges and relies on table correlation.

The pattern is consistent: choose the index access method that matches the data shape and predicate shape.

## Selectivity And Cardinality

An index helps most when it discards a large fraction of the table. A filter on a rare tenant, primary key, slug, or status subset can be very selective. A filter that matches 40 percent of a table may not be worth the index lookup plus heap visits.

Low-cardinality columns are not automatically bad index candidates, but they need context:

```sql
-- Weak alone if most rows are published.
create index articles_status_idx on articles (status);

-- Stronger if the common query filters status and then sorts within an account.
create index articles_account_status_updated_idx
  on articles (account_id, status, updated_at desc);
```

The planner estimates this using statistics. If statistics are stale or the data is highly skewed, the selected plan can be surprising. Run `analyze` after major data changes and inspect real plans with `explain (analyze, buffers)` when behavior matters.

## Expression Indexes

An expression index stores the result of an expression, not only a raw column. This is how case-insensitive lookup often becomes fast:

```sql
create index users_lower_email_idx
  on users (lower(email));

select *
from users
where lower(email) = lower($1);
```

The query expression must match the index expression closely enough for the planner to recognize it. If the index stores `lower(email)` but the query uses `email = lower($1)`, the index does not represent the predicate. If the index stores `lower(name)` but the query uses `unaccent(lower(name))`, that is a different expression.

Expression indexes also cost more on writes because the database computes the expression when rows are inserted or updated. Use them when the read path matters enough to pay that cost.

## Partial Indexes

A partial index stores only rows that satisfy a predicate:

```sql
create index orders_unfulfilled_recent_idx
  on orders (created_at desc)
  where fulfilled_at is null;
```

This is strong when the hot query always includes the same predicate and the indexed subset is much smaller than the table. It is weak when the predicate changes, when prepared query parameters hide the implication, or when authors create many partial indexes as a substitute for partitioning.

The index predicate must be implied by the query. A query with `where fulfilled_at is null` can use the example. A query with only `where created_at > now() - interval '1 day'` cannot assume rows are unfulfilled.

## Covering And Index-Only Scans

A covering index includes extra payload columns so a query may be answered from the index:

```sql
create index orders_account_created_cover_idx
  on orders (account_id, created_at desc)
  include (total_cents, status);
```

In PostgreSQL, index-only scans still depend on MVCC visibility. If the heap page is not marked all-visible, the database must visit the heap anyway. Covering indexes are valuable for read-heavy, relatively stable tables and narrow list views. They are less useful on constantly updated rows.

GIN indexes are not a normal answer for index-only scans because each index entry stores component keys rather than reconstructing the original row value.

## Write Amplification

Every additional index adds work to inserts, updates, deletes, bulk loads, and vacuum. Updating a column that appears in several indexes may update several index structures. An index that looks harmless on a read benchmark can become expensive on a write-heavy table.

Production review should account for:

- index storage size
- insert and update latency
- bulk backfill time
- migration locking behavior
- planner confusion from overlapping indexes
- vacuum and maintenance overhead

On large PostgreSQL tables, use `create index concurrently` for many production migrations so writes are not blocked for the whole index build. It has operational restrictions, including that it cannot run inside a normal transaction block.

Concurrent creation still takes locks briefly, performs more work, and can wait on old transactions. If it fails, PostgreSQL can leave an `INVALID` index that consumes write maintenance and must be inspected before retrying or dropping. A concurrent unique-index build can also begin enforcing uniqueness before a later failure is reported. Production runbooks need time, disk, lock, cancellation, and cleanup plans—not only the `CONCURRENTLY` keyword.

## When An Index Does Not Help

An index can be correct and still unused:

- The predicate matches too many rows.
- The query expression does not match the indexed expression.
- The query needs a sort that the index order cannot provide.
- The query uses a leading wildcard with a B-tree pattern.
- The table is small enough that a sequential scan is cheaper.
- Statistics are stale or too coarse for skewed data.
- The planner estimates random heap visits as more expensive than scanning.
- The index is partial and the query does not imply the predicate.

This is why an index change should be validated against the query and data distribution that motivated it, not just against the schema.

## Review Standard

For every proposed index, write down:

1. The exact query shape it supports.
2. The expected selectivity.
3. The columns returned and sorted.
4. The write path that now pays maintenance cost.
5. The operational plan for creating, monitoring, and dropping it.

If the index cannot be tied to a real query and a real bottleneck, it is probably schema clutter.

## Reference Anchors

- [PostgreSQL index types](https://www.postgresql.org/docs/current/indexes-types.html)
- [PostgreSQL expression indexes](https://www.postgresql.org/docs/current/indexes-expressional.html)
- [PostgreSQL partial indexes](https://www.postgresql.org/docs/current/indexes-partial.html)
- [PostgreSQL index-only scans](https://www.postgresql.org/docs/current/indexes-index-only-scans.html)
- [PostgreSQL CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html)
