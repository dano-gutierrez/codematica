---
title: Fair Admission And Reservations — Separate Policy From Ownership
slug: system-design/fair-admission-and-reservations
summary: Define a waiting-room policy, claim inventory atomically and trace expiry against a late payment result without selling another buyer's reservation.
track: System Design
topic: Concurrency And Reservations
difficulty: practitioner
tags: [reservations, concurrency, admission-control, idempotency, postgres]
prerequisites: [software-engineering/product-interview-durable-generation-architecture, system-design/scaling-decision-worksheet]
diagramRefs: []
sourceRefs: [postgresql-17-locking, postgresql-17-select]
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

Read [durable generation and revenue safety](/docs/software-engineering/product-interview-durable-generation-architecture) for scoped retry identity and uncertain external outcomes. An event's delivery guarantee cannot enforce this inventory invariant by itself. Hotel date ranges need an additional no-overlap constraint; locking one existing row does not establish that missing or overlapping intervals are protected.

Complete the [Reservation Boundary Checkpoint](/practice/system-design/reservation-boundary-checkpoint). Keep the policy receipt, returned rows and final states together when reviewing a design.
