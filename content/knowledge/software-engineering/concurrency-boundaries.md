---
title: Concurrency — Protect Transitions And Own Waiting
slug: software-engineering/concurrency-boundaries
summary: Review lost updates, predicate waiting, permit ownership and coordination scope through original bounded traces.
track: Software Engineering
topic: Concurrency
difficulty: practitioner
tags: [concurrency, threads, synchronization, ownership]
prerequisites: [programming/python-runtime-model]
diagramRefs: []
sourceRefs: [backend-python313-threading, backend-java17-thread-states, backend-java17-memory-model]
status: published
---

## Separate progress from simultaneous execution

Concurrency lets multiple activities make progress; parallel execution requires simultaneous work. Neither promises a speedup for a particular workload. [Python 3.13 threading](https://docs.python.org/3.13/library/threading.html) shares process memory. Its usual CPython build has a GIL; experimental free-threaded builds differ. Record the interpreter/build and blocking/native workload before making a CPU-throughput claim.

The [Java SE 17 Thread.State reference](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Thread.State.html) has six JVM states: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING and TERMINATED. RUNNABLE is not proof of current CPU execution. A generic lifecycle diagram must not invent a separate RUNNING enum or equate JVM state with OS scheduling.

## Protect the whole transition

Original counter trace: A reads 0; B reads 0; A writes 1; B writes 1. Both increments attempted, but both workers write 1. Locking each individual read or write still permits this trace. Protect the entire read-modify-write transition using a mechanism valid for the declared sharing scope.

[Java SE 17 memory-model sections 17.4.3–17.4.5](https://docs.oracle.com/javase/specs/jls/se17/html/jls-17.html) distinguish visibility/order from groups of operations requiring atomicity. In particular, a volatile counter increment is not one atomic transition. A successful compare-and-swap can guard one transition; it does not make arbitrary surrounding effects atomic. Define retries and side effects separately.

## Wait for state, not a notification

Python's Condition releases its associated lock during wait and reacquires it before returning. Its notify does not release the condition lock. Notifications are not durable reservations: recheck the predicate while holding its lock after waking, including timeout handling.

Original trace: a producer adds one item and notifies A; before A regains the lock, B consumes the item. A must observe an empty buffer and keep waiting or take the declared timeout path. A single earlier notification cannot authorize removal from an empty buffer. Define shutdown and cancellation predicates alongside availability.

## Account for permit ownership

Python's semaphore acquisition can fail when a timeout expires. Track the result and release only a permit actually acquired. BoundedSemaphore detects releases beyond its initial bound; it cannot repair mistaken ownership or prove fairness.

Original case: capacity is 2, two workers hold permits, and a third times out. The third worker has no permit to return. An unconditional cleanup release would invent capacity while the other two still work. Keep acquisition, resource cleanup and permit release within their declared lifetime.

## Name the lifetime and coordination scope

Use a consistent lock order where operations need multiple locks; a bounded wait needs a failure path and is not a deadlock-freedom proof. Separate active workers, queued work and request rate with the [traffic contract](/docs/system-design/traffic-rate-contracts).

Remember that a process-local lock does not fence another process. If an old worker resumes after shared ownership has changed, use authoritative ownership and stale-worker rejection from the [durable transition review](/docs/software-engineering/product-interview-durable-generation-architecture). Locks, application authorization and durable effect receipts answer different questions.

These are original paper traces and source-linked reviews: no threaded benchmark or live scheduler was run. They do not implement every concurrency primitive or certify arbitrary runtimes. Complete the [Concurrency Boundary Checkpoint](/practice/software-engineering/concurrency-boundary-checkpoint).
