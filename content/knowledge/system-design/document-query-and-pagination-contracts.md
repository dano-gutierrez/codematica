---
title: Document Queries And Pagination — Keep The Predicate
slug: system-design/document-query-and-pagination-contracts
summary: Review document predicates, stable cursor ordering, query work and concurrent changes using a fictional MongoDB-shaped reading list.
track: System Design
topic: Document Queries
difficulty: practitioner
tags: [mongodb, pagination, authorization, indexes]
prerequisites: [databases/index-fundamentals, system-design/api-interactions-and-intermediaries]
diagramRefs: []
sourceRefs: [boundary-mongo-query, boundary-mongo-skip, boundary-mongo-explain]
status: published
---

## Treat the filter as a complete contract

Use four fictional documents: a/east/score2, b/east/score2, c/east/score3 and d/west/score1. The signed-in reader may view east's active documents only. The [MongoDB query guide](https://www.mongodb.com/docs/manual/tutorial/query-documents/) describes reading documents with predicates; the application's permission rule still has to be established independently.

For every page, keep the same tenant, active-state and other required predicates. A cursor is untrusted continuation input; it cannot replace the permission check or choose an arbitrary collection. Decide how absent fields, nulls, arrays and nested fields belong to this schema before writing a broad query. This exercise uses flat, present scalar fields and unique identities; it does not certify all command combinations in an external reference sheet.

## Resume after the full ordering tuple

Choose ascending `(score, id)` order and page size two. The first authorized page is a then b; after cursor `(2, b)`, the next is c. The next-page predicate is `score > 2 OR (score == 2 AND id > b)`, combined with the original authorization and active predicates. Using `score > 2` alone would drop other score-2 documents after b; using only `score >= 2` can repeat earlier results.

The [MongoDB skip reference](https://www.mongodb.com/docs/manual/reference/method/cursor.skip/) recommends a unique sort field for consistent ordering and describes range-query pagination. An index must support the actual predicate/order and the deployed collation/type behavior. A unique tie-breaker establishes this fixture's deterministic order; it does not freeze the underlying collection across requests.

## Count the work behind a page number

Growing `skip` offsets require passing earlier results before returning a later page. Compare an indexed range query using the last-seen tuple, as described in the same reference. Neither technique automatically supplies random access, a trustworthy total count or snapshot isolation.

Make an original workload sheet: filter selectivity, sort keys, page size, requested offset, expected changes, candidate index and required user-visible behavior. If a dashboard needs an exact count consistent with a page, define the consistency boundary explicitly. Do not combine a count taken yesterday and a page taken now and label them one snapshot.

## Inspect the plan rather than the index name

The [MongoDB explain guide](https://www.mongodb.com/docs/manual/tutorial/analyze-query-plan/) compares scans, fetched documents, keys examined and returned rows. A named index or `IXSCAN` is only part of the evidence. In this fictional receipt, two plans both return two records, but one examines 20,000 documents and the other examines four. Record the data distribution, plan, work counts, timing method and concurrent load before claiming a deadline or scaling improvement.

Indexes add maintenance/storage costs and can fail to support the desired sort or selective predicate. An explain run on tiny uniform data does not certify a skewed production tenant. Use representative data in a separate authorized test environment; this lesson performs no database command or live mutation.

## Preserve the meaning when the collection changes

After page one, insert x/east/score1. A cursor strictly after `(2, b)` does not show x on the next page. Change a previously returned record's score to 4 and it may qualify again. Decide whether the product wants a changing feed, stable snapshot or explicit refresh. The cursor alone cannot choose that policy.

Complete the [Document Query Checkpoint](/practice/system-design/document-query-and-pagination-contracts-checkpoint). Keep the predicate, complete ordering tuple, cursor validation, consistency policy and query evidence together. This is selected original review practice, not a MongoDB command course, an installed database benchmark or certification of an external attachment.
