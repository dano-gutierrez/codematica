---
title: Partitioned Event Logs, Global Offsets, and Consumer Cursors
slug: system-design/partitioned-event-log
summary: Review a candidate's Map-and-counter attempt, seek by global ID without copying a huge suffix, and compare arrays, linked chains, and segmented logs in TypeScript and Python.
track: System Design
topic: Event Logs
difficulty: senior
tags: [interview, event-log, kafka, typescript, python, binary-search, cursors, partitioning]
prerequisites: [Arrays and maps, Binary search, Basic concurrency]
sourceRefs: [event-log-js-agent, event-log-python-bisect, event-log-python-lock, event-log-kafka-offsets]
status: published
---

## What the interviewer was probably probing

Your `Map` grouped events by key, and your global counter preserved IDs across users. Those were useful starting decisions. The missing distinction was between **the ID used to locate an event** and **the position used to continue reading**.

An interviewer asking about filtering and `currentIndex` may be looking for an indexed seek followed by a sequential cursor. We cannot know their intended answer from the question alone. Clarify whether they want arbitrary seeks, repeated forward pages, streaming without result arrays, or all three.

A good first answer is:

> I will keep each key's events ordered by global ID. For an arbitrary offset, I will binary-search the first qualifying event, then read forward up to the requested limit. A continuing consumer gets its own cursor, so it does not search the old prefix again. The writer's next ID is separate from every reader's position.

[Open the three guided TypeScript/Python solutions](/interviews/real-world/partitioned-event-log?path=partitioned-event-log). The TypeScript projects run in the existing playground. Each Python companion is a complete program you can copy to `solution.py` and run with `python3 solution.py`.

## Agree on the contract before coding

The supplied prompt requests many concurrent callers, multiple in-memory nodes, same-key co-location, global IDs, offset reads, and adding nodes. Automatic growth is desirable. The clarification below is an authored practice contract:

- One coordinator owns the simulated nodes in one process. This is not a multi-machine Kafka implementation.
- IDs start at zero and increase globally. Every successful append publishes one event and returns its ID.
- `fromOffset` / `from_offset` is an **inclusive global ID**, including for a per-key read.
- Missing keys and offsets beyond the tail return empty pages. Negative offsets and invalid page limits fail.
- Pages default to 100 events and allow 0–10,000. The page bound prevents a request from materializing millions of references or holding the Python lock indefinitely.
- Storage is append-only. Deletion, retention, persistence, retry deduplication and network failures are discussion extensions.
- Payloads are caller-owned references. Frozen event metadata does not freeze a nested payload. A service that promises immutable messages needs copying or serialization, with its cost included.
- An optional count threshold triggers automatic node growth, subject to a cooldown and cap. Counts are a teaching approximation for load, not measured byte capacity.

Ask about inclusive versus exclusive offsets; global ordering versus partition ordering; snapshot pages versus live streaming; retry semantics; retention; payload size; and the number of processes. A few million events is a volume, not a requests-per-second target.

Real Kafka identifies offsets within a partition and distinguishes the consumer's fetched position from its committed position. A single total order across all keys is an additional coordination requirement in this exercise. [KafkaConsumer documentation](https://kafka.apache.org/41/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html).

## Trace the smallest counterexample

| Global ID | Key | Position within that key |
| --- | --- | --- |
| 0 | user-1 | 0 |
| 1 | user-2 | 0 |
| 2 | user-1 | 1 |

`read(0, 10)` returns IDs `[0, 1, 2]`. `readKey("user-1", 0, 10)` returns `[0, 2]`. Reading that key from offset `1` returns `[2]`.

The callback index in `values.filter((_, index) => ...)` is a **local array position**. Comparing it with a global ID changes the meaning of the request. Even filtering correctly by `event.id >= offset` still scans the whole key history.

## Review of your attempt

The pasted snippet is unfinished and contains formatting artifacts. This review treats it as work in progress, not as a finished submission.

### What was right

- `Map<string, ...>` is a suitable key directory: an existing key can be found without scanning all users.
- Appending into a per-key array preserves arrival order and avoids rebuilding history for every write.
- Storing the global ID alongside the value retains the information needed for per-key reads.
- One global counter matches the supplied examples. Incrementing one counter per user would not.
- Considering `BigInt` shows awareness of long-lived counters. Millions are still safely representable as JS numbers; the type choice matters for a longer-lived service.

### What was wrong or incomplete

| Snippet detail | Why it matters | Repair |
| --- | --- | --- |
| `index` from the filter callback | Local positions differ from global IDs. | Compare the stored `event.id`, then seek to its local position. |
| `> offset` | Excludes an event exactly at the offset under the chosen inclusive contract. | Use `>=` or negotiate an exclusive contract explicitly. |
| `currentIndex: }` in the map type | The declaration is incomplete and does not compile. | Decide whether the map stores a bucket or a wrapper; give it one consistent type. |
| Map typed as `{ eventType; currentIndex }`, but storing an `EventType` | The declared and actual value shapes disagree; `.addValue` is on the bucket, not that wrapper. | Start with `Map<string, EventBucket>` and put consumer state elsewhere. |
| Constructor parameter `key` is unused; `init()` reads `key` outside its scope | A normal parameter is not an instance field. `init()` is also never called. | Initialize the key in the constructor, or use `constructor(private readonly key: string) {}`. |
| `BigInt` as a TypeScript type | `BigInt(...)` is a conversion function; the primitive type is lowercase `bigint`. | Use `id: bigint` and `let nextId = 0n`. |
| Module-level writer counter | Independent log instances share it; it also does not synchronize separate processes. | Store it on the log coordinator and define its concurrency boundary. |
| `getValues` calculates length but returns nothing | No read operation exists yet. | Seek, walk up to the limit, and return the bounded page or expose an iterator. |
| `existingKeys.get(key)!` | `!` removes a type warning; it does not handle a missing key at runtime. | Return an empty result for an unknown key. |
| Optional `offset`, required callee argument | An omitted value has no defined behavior. | Default it to `0n` and validate it. |
| Outer getter stores `result` but never returns it | The caller always receives `undefined`. | Return the result. |
| Append does not return the assigned ID | The explicit append API contract is unmet. | Capture the allocated ID and return it after publication. |
| No global index, node collection, or movement logic | Grouping by key alone is not the complete partitioned log. | Add node ownership and a global read index after the key read works. |

A type named `Event` can also be confused with the browser's DOM `Event`; `LogEvent` makes the intended record clearer. Your empty array initialization itself was fine. Calling a resetting `init()` later would erase that bucket, so constructor initialization is safer.

## Why avoiding filter or slice needs a more precise answer

Let **m** be this key's history and **r** the returned page length.

| Read strategy | Seek and read work | Extra result storage |
| --- | --- | --- |
| Filter by ID, then limit | O(m), even for a tiny page | Up to O(m) references before limiting |
| Loop from the beginning, stop at the limit | O(skipped prefix + r) | O(r) |
| Binary search, then bounded loop | O(log(m + 1) + r) | O(r) |
| Continue an already positioned cursor | O(r + 1) | O(r) for a page, O(1) temporary output for event-at-a-time iteration |

Replacing `.filter` with a loop does not eliminate the old-prefix scan. A generator that begins at index zero has the same seek cost; it mainly changes when work runs and how results are allocated.

`.slice` is not inherently a bad algorithm. After finding a valid local position, `slice(start, start + limit)` copies only the page. `slice(offset)` both misinterprets a global offset and can copy a huge suffix. The authored implementations use explicit bounded loops so this distinction is visible.

Binary search finds a lower bound, not necessarily an exact match. For IDs `[0, 2, 9]`, offset `3` starts at `9`. Sorted insertion is unnecessary: the coordinator already appends monotonically increasing IDs. Python's `bisect_left` is a standard alternative to the small binary-search helper in these examples; concurrent mutation still requires coordination. [Python bisect documentation](https://docs.python.org/3/library/bisect.html).

A hash map from ID to position can help with exact matches, but an offset may be absent from this key. It does not by itself answer “what is the first ID at least this offset?” Scanning global IDs until this user appears can also examine many other users' events. The ordered per-key index supports that successor query directly.

## Three approaches and when to choose them

The walkthrough contains complete TypeScript and Python implementations for all three. Let **B** be block size, **P** node count, **Kd** key count on the busiest node, and **N** total events. Bounds below treat IDs and keys as bounded-size and map access as expected constant time; arbitrary-precision arithmetic adds bit-length costs.

| Approach | First per-key page | Continuing cursor | Main tradeoff |
| --- | --- | --- | --- |
| Indexed arrays | O(log(m + 1) + r) | O(r + 1) | Simplest interview implementation; growing arrays retain all history. |
| Linked chains with sparse anchors | O(log(ceil(m/B) + 1) + B + r) | O(r + 1) | Direct next links, but extra objects, pointers and weaker locality. |
| Segmented log | O(log(ceil(m/B) + 1) + log(B + 1) + r) | O(r + 1) | Bounded blocks ease allocation and future retention; more boundary logic. |

All three use a global ID index for O(r + 1) global reads. All retain O(N + keys + nodes) metadata plus payload bytes. Arrays and lists use references to the same event objects; the global index does not clone the payload.

### Recipe 1: indexed arrays

1. Implement append and return the allocated global ID. Trace interleaved users.
2. Write lower-bound search over stored IDs. Test exact, missing, empty and beyond-tail offsets.
3. Walk from that position to the limit. Avoid copying the entire suffix.
4. Put the physical position in a cursor closure. Reuse it across pages; keep one cursor per consumer.
5. Add node ownership and migration only after reads work. This is the recommended first interview solution.

### Recipe 2: linked chains with sparse anchors

1. Give each key a head and tail; append one link without traversing the list.
2. Save a link every B events. Binary-search the preceding anchor when opening a cursor.
3. Walk from that anchor to the requested ID, then follow `next` for each returned event.
4. Retain the last visited link at the tail so a later append is reachable. An empty reader must also detect its first event.
5. Test anchor boundaries and distinguish traversal speed from allocation cost. Do not claim a bare linked list provides fast arbitrary seeks.

### Recipe 3: segmented logs

1. Append into blocks with at most B event references.
2. Search increasing block-end IDs, then search the selected block.
3. Keep `(block, slot)` in each cursor. Advance across a boundary only when a following block exists.
4. Test a cursor opened beyond the tail of a partial block. Later appends may enter that same block.
5. Use bigint block IDs and small numeric slots in the TS global directory. Discuss whole-block retention as an extension; the supplied implementation does not evict data.

## Where currentIndex belongs

There are at least three different positions:

| State | Owner | Meaning |
| --- | --- | --- |
| `nextId` | Log coordinator | ID of the next successful append. |
| Physical cursor position | One consumer cursor | Array index, link, or block/slot used for a quick next read. |
| `nextOffset` | One consumer cursor/checkpoint | Inclusive global ID from which this reader may resume. |

After returning IDs `[2, 9]`, `nextOffset` becomes `10`, not `2`. Two readers have two positions even when reading the same key. An empty page keeps the requested offset; a far-future cursor must not return intervening smaller IDs when they arrive.

For a restart-safe token, store `(consumerId, key, nextGlobalId)` and reopen via a seek. The token helps only if the log survives or can be restored; these examples lose events on process exit. A physical pointer is valid only in its current process/storage generation. Retention needs an explicit expired-offset result or agreed clamp policy; silently skipping deleted history would hide data loss.

The supplied cursors advance **fetched** progress. Successful processing is a different event. Persist acknowledged progress only after the intended processing succeeds. Replaying after a crash can repeat effects, so consumers may need idempotency or a transaction coupling the effect and checkpoint. These extensions are not implemented by the in-memory cursor.

## Concurrency: make the guarantee specific

The TypeScript examples publish synchronously without `await` or callbacks into caller code. In one JavaScript agent, another queued job cannot interleave with that synchronous operation. This serializes many callers; it does not turn a `Map` into shared multi-worker storage. [JavaScript execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model).

The Python examples use an `RLock` around ID allocation, both indexes, node counts, reads and movement. A page is collected under the lock and processed by the caller after release. This protects the compound invariant in one process; do not rely on the GIL for it. [Python threading](https://docs.python.org/3/library/threading.html).

Across processes, choose an owner/coordinator queue or a shared transactional mechanism. An atomic ID counter alone is insufficient: one worker could reserve ID 10 and pause while 11 publishes, leaving a global-read gap. You need a committed visibility boundary, recovery rules and coordination for index publication. The examples exclude process crashes and allocation failures; they are not transactions resilient to out-of-memory exceptions.

## Adding nodes and handling millions of events

A directory maps each key to one node. New keys go to a least-loaded node by event count. `addNode` chooses the busiest node and moves its largest eligible key whose count is at most half that node's load. This simple heuristic moves at most one key and can leave a new node empty. It is not optimal bin packing.

Selection costs O(P + Kd); moving the selected bucket reference is O(1) in this shared heap. Existing cursors keep the same bucket object. A real transfer costs at least the bytes moved and needs ownership versions, synchronization with writes, copying and a safe routing cutover. Merely changing `hash(key) % nodeCount` would change routes without moving old records. Consistent or rendezvous hashing can reduce routing changes, but still needs a migration protocol.

Optional automatic growth checks a node's count threshold, waits a configured number of appended events between checks, and caps automatic node additions. Checking can cost O(P + Kd), so ordinary append is only amortized O(1) when excluding those checks; assigning a new key scans P nodes. Production signals should include bytes, write rate, latency and headroom. These thresholds are policy, not correctness proofs.

All simulated nodes share the process's RAM, so adding one does not add physical capacity.

One user with millions of events is an indivisible hot key under the stated contract. Extra nodes can hold other users, but cannot spread that user's events without changing the requirement. A dedicated owner, retention/archival, compression, or a negotiated compound key may be needed.

For scale, estimate memory before discussing syntax: 3 million payloads at an assumed 200 bytes each already occupy **600 million payload bytes**, before objects, indexes and allocator overhead. This is an arithmetic example, not a measured runtime footprint. Add bounded requests and backpressure. A page loop avoids copying history; it does not make unbounded retention viable.

## Interview finish

Demonstrate these cases: `[0, 1, 2]` globally; `[0, 2]` for one key; offset `1` returning `[2]`; two readers at different speeds; an empty read followed by append; a partial-block boundary; movement with an open cursor; and one unsplittable hot key.

Then state what you built: ordered, bounded reads and whole-key ownership inside one process. Discuss durability, retention, retry deduplication and distributed publication as separate next steps.

[Start the guided solutions](/interviews/real-world/partitioned-event-log?path=partitioned-event-log) · [Take the eight-question checkpoint](/practice/system-design/partitioned-event-log-questionnaire?path=partitioned-event-log) · [Open scrolling review](/paths/partitioned-event-log/flashcards)
