---
title: "Workloads, Load Balancing and Caching"
slug: game/load-balancing
summary: "A practical introduction for Restore the Signal challenges."
track: System Design
topic: Capacity planning
difficulty: foundation
tags: [game, foundations, practice]
prerequisites: []
diagramRefs: []
status: published
---

## Start with the workload

Population is not request rate. Ten million registered users making occasional requests can generate less traffic than a small number of very active clients. State the active fraction, requests per second, read/write mix, latency objective, and failure requirements.

## Add capacity where it is needed

A load balancer sends work to healthy service instances. Multiple APIs add capacity only when traffic can reach them. They still share downstream bottlenecks such as a database. A balancer can be useful at low traffic for availability; the outpost level simply has no redundancy requirement and a small budget.

## Cache the right data

Cache hits reduce database reads. They do not eliminate writes or automatically fix API CPU overload. Low reuse can make caching wasteful. Freshness-sensitive targeting data needs invalidation after writes.

## Inspect a failure

Remove one API and check that remaining capacity can handle traffic. A connected diagram can still fail its workload. Game numbers are explicit teaching assumptions, not vendor benchmarks or a production sizing calculator. The model covers one shared database and cache-aside, not arbitrary distributed database designs.

See [AWS load balancing](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html) and [cache-aside](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside).
