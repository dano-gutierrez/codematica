---
title: Scaling Decisions — Measure The Constraint First
slug: system-design/scaling-decision-worksheet
summary: Use a concrete workload, bounded capacity estimates and falsifiable experiments to choose scaling changes without following a universal architecture ladder.
track: System Design
topic: Capacity And Tradeoffs
difficulty: practitioner
tags: [scaling, capacity, bottlenecks, system-design]
prerequisites: [system-design/cache-invalidation, databases/postgres-connection-pooling]
diagramRefs: []
sourceRefs: [sre-handling-overload, postgresql-table-partitioning]
status: published
---

## An architecture diagram is a hypothesis

A small service does not need to pass through a fixed sequence of caches, queues, replicas and shards. State the product contract first: which operations must remain correct, what can become stale, how long a user can wait and what happens during overload. Then name the resource that constrains that workload.

[Google SRE's overload chapter](https://sre.google/sre-book/handling-overload/) explains why request counts alone can hide differences in request cost. Capacity decisions need resource measurements; controlled degradation, rejection and client throttling are possible responses. Adding servers does not remove a shared dependency's limit.

## Work an original review case

Assume a service receives 1,200 requests per second at a stable average response time of 0.2 seconds. It runs on two eight-core application machines. Profiling reports 8 ms of application CPU time per request. Database pool waits have risen while application CPU is below its budget. These are exercise assumptions, not production measurements.

Calculate two different estimates:

```text
Average requests in flight = 1,200 / second * 0.2 second = 240
CPU-only per-machine budget = 8 cores * 0.8 / 0.008 second = 800 requests / second
```

The first calculation uses an average in a stable system. Substituting P95 latency would not estimate average concurrency. The second assumes the CPU cost stays constant, work parallelizes and 80% utilization is acceptable; it is a budget, not a measured throughput guarantee. Neither establishes database capacity.

Predict the result of adding two more application machines without changing the database or pools. A defensible answer is conditional: application headroom grows, but the shared database may receive more concurrent work and pool wait may persist or worsen. State what evidence would falsify that prediction.

## Compare a small set of changes

| Hypothesis | Evidence to collect | Contract to protect |
| --- | --- | --- |
| A query performs avoidable work | Representative query plans, row counts and time by operation | Correct result and authorized scope |
| Excessive parallelism overloads the database | Pool wait, active connections, database CPU/I/O and queue age | Bounded waits and honest rejection |
| Repeated reads can be reused | Reuse frequency, hit rate, freshness tolerance and invalidation behavior | The explicit cache contract |
| Non-interactive work can move to a queue | Arrival/service rate, oldest age, redelivery and recovery behavior | Durable acceptance and eventual completion |

Choose one experiment, define a success threshold and a rollback condition, then rerun the same workload. Compare before and after with the same request mix. Report remaining uncertainty instead of inferring a universal architecture from one improvement.

Use the existing [pooling lesson](/docs/databases/postgres-connection-pooling) for connection budgets and [cache lesson](/docs/system-design/cache-invalidation) for freshness. They supply the detailed contracts; this worksheet connects the decisions.

## Partitioning is a separate decision

[PostgreSQL's partitioning documentation](https://www.postgresql.org/docs/current/ddl-partitioning.html) describes one logical table divided into partitions and explains partition pruning. That is not automatically a distributed sharding system. Before proposing multiple database owners, write how the shard key affects hotspots, cross-shard operations, uniqueness, movement and recovery. A partitioned table alone does not answer those questions.

For our case, neither an overloaded query nor pool wait proves a need for sharding. Compare query work and bounded concurrency first. Add a distributed-storage proposal only when measured constraints and the product contract justify its additional ownership and recovery work.

## Keep a decision receipt

Write: workload and assumptions; required behavior; measured constraint; alternatives; predicted result; success and rollback thresholds; observed result; and the condition that would change the decision. Pair the worksheet with the [Scaling Decision Checkpoint](/practice/system-design/scaling-decision-checkpoint). A useful interview answer explains this chain of evidence rather than listing component names.
