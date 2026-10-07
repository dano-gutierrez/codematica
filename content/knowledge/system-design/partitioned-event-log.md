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

Your `Map` groups events by key, and the global counter assigns IDs across users. Both are sound starting points. The missing distinction is between **an event’s global ID** and **a reader’s position within one key’s history**.

The questions about filtering and `currentIndex` may be asking for an indexed seek followed by a sequential cursor. We cannot infer the interviewer’s intended answer. Clarify whether reads must support arbitrary offsets, repeated forward pages, streaming without result arrays, or all three.

A good first answer is:

> I will keep each key's events ordered by global ID. For an arbitrary offset, I will binary-search the first qualifying event, then read forward up to the requested limit. A continuing consumer gets its own cursor, so it does not search the old prefix again. The writer's next ID is separate from every reader's position.

[Open the three guided TypeScript/Python solutions](/interviews/real-world/partitioned-event-log?path=partitioned-event-log). The TypeScript projects run in the existing playground. Each Python companion is a complete program you can copy to `solution.py` and run with `python3 solution.py`.

## Agree on the contract before coding

The prompt requires concurrent callers, multiple in-memory nodes, all events for one key on one node, global IDs, offset reads, and node addition. Automatic growth is desirable. This lesson uses these explicit practice assumptions:

- One coordinator owns all simulated nodes in one process. A multi-machine Kafka implementation is outside this exercise.
- IDs start at zero and increase globally. Every successful append publishes one event and returns its ID.
- `fromOffset` / `from_offset` is an **inclusive global ID**, including for a per-key read.
- Missing keys and offsets beyond the tail return empty pages. Negative offsets and invalid page limits fail.
- Pages default to 100 events and allow 0–10,000. This bounds the result allocation. It does not bound every scan: a cursor waiting for a future offset may skip many new events while holding the Python lock.
- Storage is append-only. Deletion, retention, persistence, retry deduplication and network failures are discussion extensions.
- Payloads are caller-owned references. Frozen event metadata does not freeze a nested payload. A service that promises immutable messages needs copying or serialization, with its cost included.
- An optional count threshold triggers automatic node growth, subject to a cooldown and cap. Counts approximate load for this exercise; they do not measure byte capacity.

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

The pasted snippet is unfinished and contains formatting artifacts. The review below treats it as work in progress.

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

A type named `Event` can be confused with the browser’s DOM `Event`; `LogEvent` makes the record clearer. The empty array initialization was fine. Initialize the bucket in its constructor: a later resetting `init()` would erase its events.

## Why avoiding filter or slice needs a more precise answer

Let **m** be this key's history and **r** the returned page length.

| Read strategy | Seek and read work | Extra result storage |
| --- | --- | --- |
| Filter by ID, then limit | O(m), even for a tiny page | Up to O(m) references before limiting |
| Loop from the beginning, stop at the limit | O(skipped prefix + r) | O(r) |
| Binary search, then bounded loop | O(log(m + 1) + r) | O(r) |
| Continue a cursor after reaching its offset | O(r + 1) | O(r) for a page, O(1) temporary output for event-at-a-time iteration |

Replacing `.filter` with a loop or generator starting at index zero still scans the old prefix. The generator mainly changes when work runs and how results are allocated.

After a correct seek, `slice(start, start + limit)` copies only the page and can be reasonable. `slice(offset)` treats a global ID as a local position and can copy a huge suffix. The solutions use bounded loops to make the work explicit. Avoiding `.slice` alone does not improve complexity.

Binary search finds a lower bound, not necessarily an exact match. For IDs `[0, 2, 9]`, offset `3` starts at `9`. Sorted insertion is unnecessary: the coordinator already appends monotonically increasing IDs. Python's `bisect_left` is a standard alternative to the small binary-search helper in these examples; concurrent mutation still requires coordination. [Python bisect documentation](https://docs.python.org/3/library/bisect.html).

An ID-to-position hash map finds exact matches. It cannot by itself find the first ID at or above an offset that is absent from the key. Scanning global IDs can examine many other users’ events. The ordered per-key index answers this successor query directly.

## Three approaches and when to choose them

The walkthrough includes complete TypeScript and Python implementations for all three approaches. Let **B** be block size, **P** node count, **Kd** key count on the busiest node, and **N** total events. The bounds assume bounded-size IDs and keys and expected constant-time map access. Arbitrary-precision arithmetic adds costs as IDs grow.

| Approach | First per-key page | Continuing cursor | Main tradeoff |
| --- | --- | --- | --- |
| Indexed arrays | O(log(m + 1) + r) | O(r + 1) | Simplest interview implementation; growing arrays retain all history. |
| Linked chains with sparse anchors | O(log(ceil(m/B) + 1) + B + r) | O(r + 1) | Direct next links, but extra objects, pointers and weaker locality. |
| Segmented log | O(log(ceil(m/B) + 1) + log(B + 1) + r) | O(r + 1) | Bounded blocks ease allocation and future retention; more boundary logic. |

The cursor bounds above apply after seeking, once the requested offset has been reached. A pending future-offset cursor also scans **s** newly arrived events below its offset, for O(s + r + 1) work per call; each skipped event is visited once. The page limit bounds returned events, not this skipped work.

All three use a global ID index for O(r + 1) global reads and retain O(N + keys + nodes) metadata plus payload bytes. The global and per-key indexes reference the same event objects without cloning payloads.

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

Keep three positions separate:

| State | Owner | Meaning |
| --- | --- | --- |
| `nextId` | Log coordinator | ID of the next successful append. |
| Physical cursor position | One consumer cursor | Array index, link, or block/slot used for a quick next read. |
| `nextOffset` | One consumer cursor/checkpoint | Inclusive global ID from which this reader may resume. |

After returning IDs `[2, 9]`, `nextOffset` becomes `10`, not `2`. Two readers have two positions even when reading the same key. An empty page keeps the requested offset; a far-future cursor must not return intervening smaller IDs when they arrive.

For a restart-safe token, store `(consumerId, key, nextGlobalId)` and reopen via a seek. The token helps only if the log survives or can be restored; these examples lose events on process exit. A physical pointer is valid only in its current process/storage generation. Retention needs an explicit expired-offset result or agreed clamp policy; silently skipping deleted history would hide data loss.

These cursors advance **fetched** progress. Persist acknowledged progress only after processing succeeds. Crash recovery may replay an effect, so consumers may need idempotency or a transaction that commits the effect and checkpoint together. The in-memory cursor does not implement these extensions.

## Concurrency: make the guarantee specific

The TypeScript examples publish synchronously without `await` or callbacks into caller code. In one JavaScript agent, another queued job cannot interleave with that synchronous operation. This serializes many callers; it does not turn a `Map` into shared multi-worker storage. [JavaScript execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model).

The Python examples hold an `RLock` while allocating IDs, updating both indexes and node counts, reading pages, and moving keys. Callers process pages after the lock is released. The lock protects these related operations within one process; do not rely on the GIL for this guarantee. [Python threading](https://docs.python.org/3/library/threading.html).

Across processes, use an owner/coordinator queue or shared transactions. An atomic counter alone cannot ensure publication order: a worker could reserve ID 10 and pause while another publishes 11. Define which IDs are fully committed and visible, coordinate index publication, and provide recovery rules. These examples exclude process crashes and allocation failures, including out-of-memory exceptions.

## Adding nodes and handling millions of events

A directory maps each key to one node. New keys go to a least-loaded node by event count. `addNode` chooses the busiest node and moves its largest eligible key whose count is at most half that node's load. This heuristic moves at most one key and may leave the new node empty; it does not find an optimal distribution.

Selecting a bucket costs O(P + Kd). Transferring its reference costs O(1) in this shared heap, and existing cursors keep the same object. A real transfer must copy the data, track ownership versions, coordinate writes, and switch routing safely. Merely changing `hash(key) % nodeCount` would change routes without moving old records. Consistent or rendezvous hashing can reduce routing changes, but still needs a migration protocol.

Optional automatic growth uses a node’s event-count threshold, a configured number of appends between checks, and a cap on automatic additions. A check costs O(P + Kd); assigning a new key scans P nodes. Existing-key append is amortized O(1) only when these checks are excluded. Production policies should also consider bytes, write rate, latency and headroom. Thresholds do not prove correctness.

All simulated nodes share the process's RAM, so adding one does not add physical capacity.

One user with millions of events is an indivisible hot key under the stated contract. Extra nodes can hold other users, but cannot spread that user's events without changing the requirement. A dedicated owner, retention/archival, compression, or a negotiated compound key may be needed.

Estimate memory before debating syntax: 3 million payloads at an assumed 200 bytes each already occupy **600 million payload bytes**, before objects, indexes and allocator overhead. This is an arithmetic example, not a measured runtime footprint. Bound requests and apply backpressure. Avoiding history copies does not make unlimited retention viable.

## Interview finish

Demonstrate these cases: `[0, 1, 2]` globally; `[0, 2]` for one key; offset `1` returning `[2]`; two readers at different speeds; an empty read followed by append; a partial-block boundary; movement with an open cursor; and one unsplittable hot key.

Then state what you built: ordered, bounded reads and whole-key ownership inside one process. Discuss durability, retention, retry deduplication and distributed publication as separate next steps.

[Start the guided solutions](/interviews/real-world/partitioned-event-log?path=partitioned-event-log) · [Take the eight-question checkpoint](/practice/system-design/partitioned-event-log-questionnaire?path=partitioned-event-log) · [Open scrolling review](/paths/partitioned-event-log/flashcards)
