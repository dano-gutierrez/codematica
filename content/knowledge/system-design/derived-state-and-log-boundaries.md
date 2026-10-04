---
title: Derived State And Log Boundaries — Reconcile The Effect
slug: system-design/derived-state-and-log-boundaries
summary: Trace incremental replacements, duplicate events, Kafka partition and replica scopes, external effects and metadata quorum ownership.
track: System Design
topic: Derived State
difficulty: practitioner
tags: [incremental-state, kafka, replay, consistency]
prerequisites: [system-design/cache-invalidation, software-engineering/product-interview-durable-generation-architecture]
diagramRefs: []
sourceRefs: [boundary-pg-materialized, boundary-kafka-design, boundary-kafka-introduction, boundary-kafka-kraft]
status: published
---

## Separate stored results from their maintenance policy

A derived view stores a result computed from base records. [PostgreSQL 17 materialized-view documentation](https://www.postgresql.org/docs/17/rules-materializedviews.html) distinguishes reading stored data from refreshing it and warns that it may not be current. That interface is not evidence that arbitrary views are incrementally maintained.

In this original fixture, base records are `a → (east, 5)` and `b → (west, 4)`; group totals are east 5 and west 4. Replacing a's value with 8 changes east by `-5 + 8 = +3`. Moving a to west with value 6 instead requires east `-5` and west `+6`. Deleting b contributes west `-4`. Updating only a new value loses the old group's removal. A faster query can trade for more storage, write work and maintenance lag; measure the whole workload before accepting a vendor speed claim.

## Require identity and a predecessor for each delta

Attach a stable record ID, expected previous version and new version to each replacement. Starting with a at version 1/value 5, apply version 1→2/value 8 once: east becomes 8. A replay of the same transition must leave east 8. A version 2→3 transition arriving before version 1→2 has no verified predecessor; hold or rebuild rather than applying a guessed delta.

For the paper exercise, define these rules explicitly: duplicate accepted transition is a no-op; missing predecessor requests repair; rejected transitions change neither base record nor total; accepted base/total/checkpoint become visible together. After every accepted change, independently recompute totals from base records and compare. This fixture is not a general incremental SQL engine, and its version policy is not a claim about every event stream.

## Distinguish partitions, replicas and consumer groups

[Kafka 4.1's introduction](https://kafka.apache.org/41/getting-started/introduction/) describes partitioned topics, replication and consumer groups. A topic with four partitions and replication factor one has four ordering/assignment units but no extra replica of each partition. In traditional consumer groups, one consumer can own multiple partitions, and each partition has one assigned consumer per group. Adding consumers beyond the partition count does not create more partition owners in that traditional group. Kafka 4.1 also describes preview share groups with a different assignment contract in its [design discussion](https://kafka.apache.org/41/design/design/); do not apply the traditional rule to every group type.

In an original trace, events for a stable key enter one partition. Their partition order is useful; a timestamp comparison across two partitions does not establish one total processing order. Increasing partition count may change key placement. Record partitioning, deployed version, group assignment and retention assumptions before calling all future events globally ordered or durable under every failure.

## Coordinate the offset with the destination effect

[Kafka 4.1's design discussion](https://kafka.apache.org/41/design/design/) limits exactly-once claims by the cooperating destination. A consumer writes an external total, crashes before recording its progress, and reads the event again. The repeated read can repeat the external effect. Reversing the sequence can skip an effect after a crash instead.

Choose a destination transaction that records effect and checkpoint together where supported, or a stable effect identity with demonstrated duplicate reconciliation. Kafka-to-Kafka transactional processing does not automatically extend a transaction to an unrelated database, email or payment provider. Distinguish offset visibility, destination durability and end-user acknowledgement in the failure receipt; reuse the durable-operation lesson for unknown outcomes.

## Keep metadata consensus separate from data replication

[Kafka 4.1 KRaft operations](https://kafka.apache.org/41/operations/kraft/) describes controller metadata quorum, broker/controller roles and majority availability. Three configured controllers can retain a majority with one unavailable; two unavailable leave no majority. That arithmetic does not choose the replication factor or in-sync replicas of a topic partition. Combined roles also change operational isolation; they are not a free high-availability shortcut.

Complete the [Derived State Checkpoint](/practice/system-design/derived-state-and-log-boundaries-checkpoint). Keep the fixture's before/after base records, totals, versions, duplicate/gap dispositions and crash points. This review installs no broker or database and certifies neither Epsio benchmarks, a real Kafka cluster nor a complete incremental-view implementation.
