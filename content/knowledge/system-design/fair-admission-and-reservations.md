---
title: Fair Admission And Reservations — Separate Policy From Ownership
slug: system-design/fair-admission-and-reservations
summary: Define admission policy, claim inventory atomically, exclude overlapping room dates and trace expiry without selling another buyer's reservation.
track: System Design
topic: Concurrency And Reservations
difficulty: practitioner
tags: [reservations, concurrency, admission-control, idempotency, postgres]
prerequisites: [software-engineering/product-interview-durable-generation-architecture, system-design/scaling-decision-worksheet]
diagramRefs: []
sourceRefs: [postgresql-17-locking, postgresql-17-select, shopify-inventory-reservations-2026, postgresql-17-ranges, postgresql-17-btree-gist, postgresql-17-exclusion, postgresql-17-date-functions]
status: published
---

## Write the policy before choosing a queue

In this original scenario, 200 eligible accounts compete for 10 units. Choose a policy: randomize accounts present before the opening deadline, then append later arrivals. State how eligibility, one active place per account, quantity limits, accessibility and appeals work. Audit allocation outcomes under that policy.

An account is not proof of one human. Signed, short-lived, buyer-bound admission tokens protect a particular session; they do not solve identity fraud or guarantee equal opportunity. Queue order is a product decision. Inventory ownership and checkout capacity are separate correctness and load constraints.

Admit work within a measured capacity budget and bound queue age. A queue that grows forever cannot preserve a promised checkout deadline. Use the [scaling worksheet](/docs/system-design/scaling-decision-worksheet) to compare admission rate with the actual downstream constraint.

## Give one owner authority over a transition

For an individual inventory unit, define `available → held → sold`, with `held → available` on expiry. An accepted hold records the buyer, an opaque hold ID, an expiry and a version. A transaction must claim an available unit and persist the hold together. Check the actual returned rows; a prior availability read is not an allocation.

Completion and expiry must conditionally update the current state, hold identity and version. Completion also checks the authenticated buyer and the chosen expiry policy. Every accepted transition advances the version. This prevents an old timer or payment callback from overwriting a newer reservation.

Keep transactions short. [PostgreSQL row locks](https://www.postgresql.org/docs/17/explicit-locking.html) last until the transaction ends and can block competing writers. Do not hold one open while a person fills a form or a payment service responds. Persist the hold, commit, then coordinate the external operation through durable identity and reconciliation.

## Observe what SKIP LOCKED actually promises

Use only a disposable PostgreSQL database for this lab. The table and fixed buyer/hold strings are illustrative; they are not a production schema or secure tokens. Integer expiry values are simulated clock ticks, not wall-clock timestamps.

Create the fixture once:

```sql
CREATE TABLE lab_inventory (
  item_id integer PRIMARY KEY,
  state text NOT NULL CHECK (state IN ('available', 'held', 'sold')),
  hold_id text, buyer text, expires_at integer,
  version bigint NOT NULL DEFAULT 0
);
INSERT INTO lab_inventory (item_id, state)
VALUES (1, 'available'), (2, 'available');
```

In session A, run `BEGIN;`, then lock item 1 and leave the transaction open:

```sql
SELECT item_id FROM lab_inventory WHERE item_id = 1 FOR UPDATE;
```

In session B with autocommit enabled, execute this claim:

```sql
WITH chosen AS (
  SELECT item_id FROM lab_inventory WHERE state = 'available'
  ORDER BY item_id FOR UPDATE SKIP LOCKED LIMIT 1
)
UPDATE lab_inventory AS inventory
SET state = 'held', hold_id = 'hold-b', buyer = 'b', expires_at = 180,
    version = inventory.version + 1
FROM chosen WHERE inventory.item_id = chosen.item_id
RETURNING inventory.item_id;
```

Expected: B claims item 2 without waiting for A. Repeat the claim while A still holds its lock: B returns no row. That means no matching row could be acquired by this statement, not that the inventory is sold out. Roll back A, then B can read item 1 as available.

[PostgreSQL's SELECT contract](https://www.postgresql.org/docs/17/sql-select.html) permits skipping locked rows for queue-like consumers and warns that this produces an inconsistent view. The row lock belongs inside the selection CTE. `ORDER BY` gives a selection order among eligible rows; skipping a busy row does not enforce strict FIFO or the waiting-room fairness policy.

## Compare a bounded pool with the ledger

[Shopify's May 2026 engineering report](https://shopify.engineering/scaling-inventory-reservations) describes a MySQL reservation pool capped at 1,000 available rows **per item/location combination**. The inventory ledger supplies replenishment. An empty pool can trigger serialized inline replenishment and waiting; `SKIP LOCKED` is not a guarantee that the complete request never waits. Their investigation also attributed connection pressure to other checkout work holding connections.

For an original design review, draw the authoritative inventory balance, currently available pool rows, active holds and committed sales separately. State which transaction prevents replenishment from representing the same capacity twice. A pool's empty result cannot establish physical stock exhaustion by itself.

Read the [connection-pooling lesson](/docs/databases/postgres-connection-pooling) to budget the whole workload. Inspect the exact engine, isolation level, indexes and lock order before adapting SQL. Our PostgreSQL fixture measures its own boundaries; it neither reproduces Shopify's MySQL implementation nor validates their reported throughput.

## Trace expiry against a late result

Continue the original fixture on item 2:

| Step | Required predicate and observed transition |
| --- | --- |
| At tick 180, expire B | Item 2 is held by `hold-b`, version 1, with `expires_at <= 180`; release it and advance to version 2 |
| Reserve it for A | State is available; write `hold-a`, buyer `a`, expiry 360 and version 3 |
| B's payment result arrives at tick 181 | B's old hold/version cannot change A's current reservation; return no updated row |
| A completes at tick 200 | Current `hold-a`, buyer `a`, version 3 and expiry strictly greater than 200; sell and advance to version 4 |
| An old expiry task arrives at tick 400 | State is sold and version has changed; it cannot release the unit |

Use the same atomic guard for B's late completion; do not check and then write in separate transactions:

```sql
UPDATE lab_inventory SET state = 'sold', version = version + 1
WHERE item_id = 2 AND state = 'held'
  AND hold_id = 'hold-b' AND buyer = 'b' AND version = 1
  AND expires_at > 181
RETURNING item_id;
```

Under this chosen policy, completion at the exact expiry tick fails and expiry is eligible. Another policy is possible, but it needs one authoritative rule and race tests. A zero-row completion does not undo an external charge: record that result and reconcile through the provider's supported cancellation, refund or manual-review path. Never quietly sell A's unit to B.

Read [durable generation and revenue safety](/docs/software-engineering/product-interview-durable-generation-architecture) for scoped retry identity and uncertain external outcomes. An event's delivery guarantee cannot enforce this inventory invariant by itself.

## Protect room dates with an overlap constraint

Two guests request room 7 for October 10–12 and October 11–13. Locking a previously found booking cannot protect an empty search result. Define check-out as exclusive: a stay ending October 12 may precede one starting that day.

In a fresh disposable PostgreSQL 17 database, create this original fixture. The fixed hold IDs and simulated expiry ticks are lab inputs, not an authentication or payment schema.

```sql
CREATE EXTENSION btree_gist;
CREATE TABLE lab_room_holds (
  hold_id text PRIMARY KEY,
  room_id integer NOT NULL,
  stay daterange NOT NULL CHECK (
    NOT isempty(stay) AND NOT lower_inf(stay) AND NOT upper_inf(stay)
    AND isfinite(lower(stay)) AND isfinite(upper(stay))
  ),
  state text NOT NULL CHECK (state IN ('held', 'confirmed', 'expired')),
  expires_tick integer NOT NULL,
  version integer NOT NULL DEFAULT 0,
  EXCLUDE USING gist (room_id WITH =, stay WITH &&)
    WHERE (state IN ('held', 'confirmed'))
);
```

[Range overlap](https://www.postgresql.org/docs/17/rangetypes.html) differs from equality: `UNIQUE (room_id, stay)` would permit unequal but overlapping stays. [btree_gist](https://www.postgresql.org/docs/17/btree-gist.html) supplies the integer operator class. The [partial exclusion](https://www.postgresql.org/docs/17/sql-createtable.html#SQL-CREATETABLE-EXCLUDE) checks held and confirmed rows. Range checks reject empty, unbounded and [non-finite dates](https://www.postgresql.org/docs/17/functions-datetime.html). `daterange` normalizes to `[)`; this lab uses calendar dates, not timestamp/time-zone scheduling.

In session A, run `BEGIN;`, then the following insert and leave the transaction open:

```sql
INSERT INTO lab_room_holds (hold_id, room_id, stay, state, expires_tick)
VALUES ('range-a', 7, daterange('2026-10-10', '2026-10-12', '[)'), 'held', 100)
RETURNING hold_id;
```

In session B, use autocommit and insert `range-b`, room 7, October 11–13 with state `held` and expiry 200. B may wait for A. Commit A: B fails with exclusion violation `23P01`. Start again from an empty fixture and roll back A instead: B succeeds. The committed database outcome decides ownership; browser click order and an availability preview do not.

Also try an adjacent stay, the same dates in a different room, and an overlapping `confirmed` row. The first two may coexist; the third must conflict. Keep returned rows, SQLSTATE and final contents as evidence.

For the expiry experiment, reset the fixture and commit A's insert. Advancing the simulated clock to 100 changes no stored row. An overlapping hold still fails until this guarded transition commits:

```sql
UPDATE lab_room_holds SET state = 'expired', version = version + 1
WHERE hold_id = 'range-a' AND state = 'held' AND version = 0
  AND expires_tick <= 100
RETURNING hold_id;
```

Now B can acquire the interval. Trying to reactivate A while B owns overlapping dates must fail the same constraint. In a service, expiry/completion also needs authenticated ownership and current-version checks from the earlier section. Never remove a newer hold after a stale timer or payment result.

Run `npm run test:reservation:sql` in the repository after following `scripts/content/README.md`; it verifies these canonical SQL fences in an isolated container. This proves the fixture's database boundaries, not an entire booking service. Payment capture, compensation, eligibility, capacity and fairness still need separate contracts and tests.

Complete the [Reservation Boundary Checkpoint](/practice/system-design/reservation-boundary-checkpoint). Keep the policy receipt, returned rows and final states together when reviewing a design.
