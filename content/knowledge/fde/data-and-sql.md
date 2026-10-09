---
title: "Data Investigation And SQL For FDEs"
slug: "fde/data-and-sql"
summary: "Profile unfamiliar customer data, preserve row meaning, join safely and explain missing or stale evidence."
track: "Forward Deployed Engineering"
topic: "Data Investigation And SQL For FDEs"
difficulty: "practitioner"
tags: ["fde", "career-transition", "customer-engineering"]
prerequisites: ["Basic programming, Git and HTTP"]
sourceRefs: ["fde-postgres-joins", "fde-palantir-role"]
status: "published"
---

Before choosing a model or interface, understand what one row means. This is its grain: one ticket, one order, one shipment event or one item. Joining different grains can multiply rows and quietly corrupt a business metric.

## Build a data contract

Record the owner, source system, tenant boundary, primary key, row grain, field meanings, allowed states, units, timezone, freshness target, update/deletion behavior and access restrictions. Ask whether an identifier is globally unique or unique only within a tenant. Establish which source wins when systems disagree; a newer timestamp is not automatically more authoritative.

Profile a synthetic or approved sample: total rows, unique keys, nulls by field, unknown states, impossible timestamps, duplicates and unmatched joins. Quarantine invalid records with a reason and source location. Silently dropping them changes the population and makes completeness hard to audit. Preserve immutable raw input and a versioned transform for reproducibility.

## Work a small SQL fixture

Use a disposable local SQL environment. This original fixture is compatible with SQLite and PostgreSQL; it creates no persistent business tables. PostgreSQL's join tutorial explains the semantics, while these ticket identities and expected results are curriculum examples.

```sql
WITH tickets(tenant_id, ticket_id, order_id) AS (
  VALUES ('a', 't1', 'o1'), ('a', 't2', 'missing'), ('b', 't3', 'o1')
), orders(tenant_id, order_id, status) AS (
  VALUES ('a', 'o1', 'shipped'), ('b', 'o1', 'processing')
)
SELECT t.tenant_id, t.ticket_id, o.status
FROM tickets t
LEFT JOIN orders o
  ON o.tenant_id = t.tenant_id AND o.order_id = t.order_id
ORDER BY t.tenant_id, t.ticket_id;
```

Expected rows are `(a,t1,shipped)`, `(a,t2,NULL)`, `(b,t3,processing)`. Joining only on `order_id` produces five rows and mixes tenants. An inner join loses the unresolved ticket. A left join preserves unresolved rows, but does not itself enforce access control: the caller's authorized tenant must constrain the query independently. If orders contains duplicate composite keys, even the correct join can multiply rows; add a uniqueness constraint or resolve duplicates deliberately.

Distinguish event time, ingestion time and query time. A source can be reachable while its latest export is stale. A missing row can mean no matching entity, delayed synchronization, deletion or insufficient access. The interface should distinguish what is known from what is inferred.

## Practice

Run the query, then intentionally remove the tenant predicate and replace the left join with an inner join. Compare row identities, not just counts. Add a duplicate order, a null order ID and a stale source timestamp. Write assertions for the three original rows and a separate quality report for the added invalid cases.

Extend the sample to compute eligible ticket counts by tenant. Decide whether a ticket with an unknown order belongs in the denominator. Document the choice before calculating success. For deeper practice, use the existing [Database Indexes And Search path](/paths/database-indexes-and-search) to study query plans once correctness is established.

## Review your work

Can you explain every extra or missing row? Does your pipeline preserve provenance and disclose freshness? Can another engineer rebuild the same output from the same input? Never paste confidential customer records into a personal portfolio, public bug report or unapproved model service.

## Sources and further study

- [PostgreSQL 17: Joins Between Tables](https://www.postgresql.org/docs/17/tutorial-join.html): PostgreSQL 17 tutorial, selected inner and left outer join semantics. Original fixtures are authored separately.
- [Forward Deployed Software Engineer](https://jobs.lever.co/palantir/dab396d4-2f14-4796-aac0-0d82883dccf0): Employer role description: customer collaboration, data and hands-on software delivery; not an interview specification.
