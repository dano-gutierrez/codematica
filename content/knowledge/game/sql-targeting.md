---
title: "SQL Targeting: Filters and Joins"
slug: game/sql-targeting
summary: "A practical introduction for Restore the Signal challenges."
track: Databases
topic: SQL
difficulty: foundation
tags: [game, foundations, practice]
prerequisites: []
diagramRefs: []
status: published
---

## Select rows by meaning

```sql
SELECT id FROM zombies WHERE kind = 'runner';
```

A `WHERE` condition selects matching rows. The game targets the returned IDs. It accepts equivalent queries, so formatting and aliases do not need to match a solution.

## Combine conditions

`AND` binds more tightly than `OR`. Use parentheses when either kind is allowed but both need a minimum threat. Use `IS NULL` for an unknown shield: `shield = NULL` does not test absence.

```sql
SELECT id FROM zombies
WHERE (kind = 'runner' OR kind = 'armored') AND threat >= 2;
```

## Join the zone information

```sql
SELECT z.id FROM zombies AS z
JOIN zones AS a ON z.zone = a.name
WHERE a.evacuated = 1;
```

The join relates each zombie to its zone. An omitted join condition can pair unrelated rows. Inspect the fixture tables before targeting anything. This chapter executes SQLite SELECT queries on disposable demo data.

See [SQLite SELECT](https://www.sqlite.org/lang_select.html).
