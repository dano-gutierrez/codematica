---
title: Progressive State — Preserve History When Entities Merge
slug: software-engineering/progressive-state-history
summary: Extend an original in-memory credit toy through transfers, historical queries and merges, preserving rejection and retirement contracts.
track: Software Engineering
topic: State And History
difficulty: practitioner
tags: [state, history, invariants, progressive-practice]
prerequisites: [programming/python-runtime-model]
diagramRefs: []
status: published
---

## Extend one contract at a time

Build four stages: create and credit accounts; transfer between active accounts; query historical balances; merge one active account into another. These are original fictional-credit requirements, not an employer's assessment or a real payment service. Keep every earlier stage's checks when adding the next. An interview anecdote, score or company name does not verify assessment rules or hiring outcomes.

## Make time and rejection explicit

Use nonblank string IDs, preserved exactly and case-sensitively. Credit and transfer amounts are positive built-in integers; booleans are rejected. Successful operations have strictly increasing nonnegative integer timestamps. A failed operation does not advance time or record history. Reject missing or identical transfer/merge participants and insufficient credits before changing state. Transfers conserve the sum across active accounts; credit operations intentionally increase it.

Historical queries accept times from zero through the latest successful timestamp. Return `None` before creation, for an unknown ID, or from retirement onward. Zero is an existing empty balance, not absence. Reject future, negative, boolean or noninteger query times. This explicit toy chooses permanent retirement: retired IDs cannot be reused.

## Merge current state without rewriting history

At the merge timestamp, add the source's current balance to the target and retire the source. The earlier target history is not rewritten. If A has 7 and B has 5 at time 4, a merge at time 5 gives A 12 at time 5; A at time 4 remains 7, B at time 4 remains 5, and B at time 5 is `None`. A later merge must preserve each earlier identity's history too.

The reference stores per-ID balance events, including a retirement marker. Its slower oracle stores whole active-state snapshots. Historical reads inspect the latest event/snapshot at or before the requested time. Validate against this independently represented history rather than checking only the final combined balance.

## Run the original reference

Run with Python 3.13. This single-process, sequential fixture uses memory only, with no network, file or model operations. History storage grows with accepted changes; historical scans grow with the selected account's events. It is not durable or safe against concurrent/crashing operations. Authentication, request idempotency, real money and persistence need separate contracts and tests.

```python
from copy import deepcopy
from itertools import product


class ToyWallet:
    def __init__(self):
        self._clock = -1
        self._active = {}
        self._history = {}

    def _time(self, at):
        if type(at) is not int or at < 0 or at <= self._clock:
            raise ValueError("operation time must increase")

    def _id(self, name):
        if type(name) is not str or not name.strip():
            raise ValueError("nonblank string ID required")

    def _participant(self, name):
        self._id(name)
        if name not in self._active:
            raise ValueError("active ID required")

    def _amount(self, amount):
        if type(amount) is not int or amount <= 0:
            raise ValueError("positive built-in integer required")

    def _commit(self, at, changes):
        for name, balance in changes.items():
            self._history.setdefault(name, []).append((at, balance))
            if balance is None:
                del self._active[name]
            else:
                self._active[name] = balance
        self._clock = at

    def create(self, at, name):
        self._time(at)
        self._id(name)
        if name in self._history:
            raise ValueError("ID has already existed")
        self._commit(at, {name: 0})

    def credit(self, at, name, amount):
        self._time(at)
        self._participant(name)
        self._amount(amount)
        self._commit(at, {name: self._active[name] + amount})

    def transfer(self, at, source, target, amount):
        self._time(at)
        self._participant(source)
        self._participant(target)
        self._amount(amount)
        if source == target or self._active[source] < amount:
            raise ValueError("distinct participants and enough credits required")
        self._commit(at, {source: self._active[source] - amount,
                          target: self._active[target] + amount})

    def merge(self, at, target, source):
        self._time(at)
        self._participant(target)
        self._participant(source)
        if source == target:
            raise ValueError("distinct participants required")
        self._commit(at, {target: self._active[target] + self._active[source],
                          source: None})

    def balance_at(self, name, at):
        self._id(name)
        if type(at) is not int or at < 0 or at > self._clock:
            raise ValueError("query time outside known history")
        for timestamp, balance in reversed(self._history.get(name, [])):
            if timestamp <= at:
                return balance
        return None


def rejected_without_change(wallet, method, *args):
    before = deepcopy(wallet.__dict__)
    try:
        getattr(wallet, method)(*args)
    except ValueError:
        pass
    else:
        raise AssertionError((method, args))
    assert wallet.__dict__ == before


w = ToyWallet()
w.create(1, "A")
w.create(2, "B")
w.credit(3, "A", 7)
w.credit(4, "B", 5)
rejected_without_change(w, "transfer", 5, "A", "B", 8)
w.merge(5, "A", "B")
assert [w.balance_at("A", t) for t in (0, 4, 5)] == [None, 7, 12]
assert [w.balance_at("B", t) for t in (1, 3, 4, 5)] == [None, 0, 5, None]
rejected_without_change(w, "create", 6, "B")
w.credit(6, "A", 2)
w.create(7, "C")
w.transfer(8, "A", "C", 4)
assert sum(w._active.values()) == 14
w.merge(9, "A", "C")
assert w.balance_at("A", 8) == 10
assert w.balance_at("C", 8) == 4
assert w.balance_at("A", 9) == 14
assert w.balance_at("C", 9) is None
for method, args in [("create", (10, "")), ("create", (10, "  ")),
                     ("create", (True, "D")), ("create", (-1, "D")),
                     ("create", (9, "D")), ("create", (10, None)),
                     ("credit", (10, "A", 0)), ("credit", (10, "A", -1)),
                     ("credit", (10, "A", True)), ("credit", (10, "A", 1.0)),
                     ("credit", (10, "B", 1)), ("credit", (10, "unknown", 1)),
                     ("transfer", (10, "A", "A", 1)),
                     ("merge", (10, "A", "A")), ("merge", (10, "A", "B")),
                     ("balance_at", ("A", 10)), ("balance_at", ("A", -1)),
                     ("balance_at", ("A", True)), ("balance_at", ("A", 1.0))]:
    rejected_without_change(w, method, *args)
assert w.balance_at("unknown", 9) is None
w.create(10, "D")
assert w.balance_at("D", 10) == 0
for amount in (0, -1, True, 1.0):
    rejected_without_change(w, "transfer", 11, "A", "D", amount)
rejected_without_change(w, "transfer", 11, "unknown", "D", 1)
rejected_without_change(w, "transfer", 11, "A", "unknown", 1)
rejected_without_change(w, "create", 10.5, "E")
w.transfer(11, "A", "D", 1)
assert w.balance_at("A", 11) == 13
assert w.balance_at("D", 11) == 1
fresh = ToyWallet()
rejected_without_change(fresh, "create", True, "A")
fresh.create(0, "A")
assert fresh.balance_at("A", 0) == 0
fresh.create(1, " A ")
fresh.create(2, "a")
fresh.credit(3, " A ", 1)
assert fresh.balance_at("A", 3) == 0
assert fresh.balance_at(" A ", 3) == 1
assert fresh.balance_at("a", 3) == 0


actions = [("create", "A"), ("create", "B"), ("credit", "A", 2),
           ("credit", "B", 3), ("transfer", "A", "B", 1),
           ("transfer", "B", "A", 1), ("merge", "A", "B"),
           ("merge", "B", "A")]


def snapshot_oracle(trace):
    active, seen, states, accepted = {}, set(), [(-1, {})], []
    for at, action in enumerate(trace, 1):
        kind, *args = action
        next_state = dict(active)
        if kind == "create":
            name = args[0]
            allowed = name not in seen
            if allowed:
                next_state[name] = 0
                seen.add(name)
        elif kind == "credit":
            name, amount = args
            allowed = name in active
            if allowed:
                next_state[name] += amount
        elif kind == "transfer":
            source, target, amount = args
            allowed = source in active and target in active and active[source] >= amount
            if allowed:
                next_state[source] -= amount
                next_state[target] += amount
        else:
            target, source = args
            allowed = target in active and source in active
            if allowed:
                next_state[target] += next_state.pop(source)
        accepted.append(allowed)
        if allowed:
            active = next_state
            states.append((at, dict(active)))
    return accepted, states


trace_count = 0
successful_transfers, positive_merges = 0, 0
for length in range(5):
    for trace in product(actions, repeat=length):
        wallet = ToyWallet()
        accepted, states = snapshot_oracle(trace)
        for at, (action, allowed) in enumerate(zip(trace, accepted), 1):
            method, *args = action
            if allowed:
                if method == "transfer":
                    successful_transfers += 1
                if method == "merge":
                    prior = next(state for timestamp, state in reversed(states) if timestamp < at)
                    positive_merges += prior[args[1]] > 0
                getattr(wallet, method)(at, *args)
            else:
                rejected_without_change(wallet, method, at, *args)
        assert wallet._active == states[-1][1]
        assert wallet._clock == states[-1][0]
        for at in range(wallet._clock + 1):
            state = next(state for timestamp, state in reversed(states) if timestamp <= at)
            for name in ("A", "B"):
                assert wallet.balance_at(name, at) == state.get(name)
        trace_count += 1
assert trace_count == 4681
assert successful_transfers > 0
assert positive_merges > 0
print("time, rejected state, conserved transfers, retirement and bounded replay: passed")
```

## Challenge the state model

The 4,681 bounded action traces compare final state, accepted time and every query time for A/B against full snapshots. The explicit example adds chained merges, invalid inputs, zero versus absence and a successful operation using a previously rejected timestamp. These bounded replay checks are not a general proof. The oracle action set uses distinct participants and positive fixed amounts; separate checks cover those invalid partitions.

Predict failures if validation advances time, if a merge rewrites old target events, if a retired ID is recreated, or if a source remains active. Retain failed traces. A production design would need atomic persistence, concurrent ownership, authorized operations and recovery; the toy's successful sequential mutations provide none of that evidence.

Complete the [Progressive State Checkpoint](/practice/software-engineering/progressive-state-checkpoint). Explain which old contract each new stage might break before adding another feature.
