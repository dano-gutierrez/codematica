---
title: Traffic Rate Contracts — Test The Window Before Choosing A Store
slug: system-design/traffic-rate-contracts
summary: Compare exact rolling limits, calendar boundaries and token bursts with a deterministic local trace; keep simultaneous work and distributed admission separate.
track: System Design
topic: Admission Contracts
difficulty: practitioner
tags: [rate-limiting, overload, admission, api]
prerequisites: [system-design/scaling-decision-worksheet]
diagramRefs: []
sourceRefs: [redis-rate-limiting-guide, rfc-6585-status-codes]
status: published
---

## Write the admission promise

“Three requests per minute” needs a precise interval, identity and counted event. Are these attempted requests, admitted operations or completed operations? Does a retry spend another token? Which tenant, route and cost class share the allowance? Admission does not authorize the operation or make its effect idempotent.

[Redis's tutorial](https://redis.io/tutorials/howtos/ratelimiting/) compares fixed windows, exact timestamp logs, approximate weighted counters, token buckets and leaky-bucket variants. Fixed windows admit boundary bursts; token capacity permits deliberate bursts. A weighted counter is an approximation, not a strict rolling log. Its atomic-script discussion explains why concurrent check-then-write commands can over-admit. The following code is an original sequential experiment, not that Redis implementation.

## Run a boundary trace

The fixture counts **admitted unit-cost attempts** under a trusted `(tenant, route)` key. Times are nonnegative integer seconds and must not move backward for that key. The rolling interval is `(now - period, now]`: a request exactly one period old has expired. Identical timestamps remain distinct attempts. Token refill uses exact fractions so a denied attempt does not lose fractional credit.

Predict the result of three attempts at second 59 and three at second 61. Then test an idle token bucket, a clock reversal and another tenant:

```python
from collections import deque
from fractions import Fraction


def positive_int(value):
    return type(value) is int and value > 0


class Admission:
    def __init__(self, limit, period):
        if not positive_int(limit) or not positive_int(period):
            raise ValueError("positive integer limit and period required")
        self.limit, self.period = limit, period
        self.clocks = {}

    def check(self, key, now):
        if (not isinstance(key, tuple) or len(key) != 2
                or any(not isinstance(part, str) or not part.strip() for part in key)
                or type(now) is not int or now < 0):
            raise ValueError("invalid scope or clock")
        if now < self.clocks.get(key, 0):
            raise ValueError("clock moved backward")
        self.clocks[key] = now


class Fixed(Admission):
    def __init__(self, limit, period):
        super().__init__(limit, period)
        self.windows = {}

    def attempt(self, key, now):
        self.check(key, now)
        bucket = now // self.period
        old_bucket, count = self.windows.get(key, (bucket, 0))
        if old_bucket != bucket:
            count = 0
        allowed = count < self.limit
        self.windows[key] = (bucket, count + int(allowed))
        return allowed


class Rolling(Admission):
    def __init__(self, limit, period):
        super().__init__(limit, period)
        self.accepted = {}

    def attempt(self, key, now):
        self.check(key, now)
        log = self.accepted.setdefault(key, deque())
        while log and log[0] <= now - self.period:
            log.popleft()
        if len(log) >= self.limit:
            return False
        log.append(now)
        return True


class Bucket(Admission):
    def __init__(self, limit, period):
        super().__init__(limit, period)
        self.tokens = {}

    def attempt(self, key, now):
        self.check(key, now)
        credit, previous = self.tokens.get(key, (Fraction(self.limit), now))
        credit = min(self.limit, credit + Fraction((now - previous) * self.limit, self.period))
        allowed = credit >= 1
        self.tokens[key] = (credit - int(allowed), now)
        return allowed


a, b, c = ("tenant-a", "read"), ("tenant-b", "read"), ("tenant-a", "write")
for cls, expected in ((Fixed, 6), (Rolling, 3)):
    limiter = cls(3, 60)
    assert sum(limiter.attempt(a, t) for t in (59, 59, 59, 61, 61, 61)) == expected
    assert limiter.attempt(b, 61)
    assert limiter.attempt(c, 61)
fixed = Fixed(3, 60)
assert [fixed.attempt(a, t) for t in (10, 11, 12, 13, 59, 60)] == [True, True, True, False, False, True]
rolling = Rolling(3, 60)
assert all(rolling.attempt(a, 59) for _ in range(3))
assert not rolling.attempt(a, 118)
assert rolling.attempt(a, 119)
assert list(rolling.accepted[a]) == [119]
bucket = Bucket(3, 90)
assert all(bucket.attempt(a, 0) for _ in range(3))
assert not bucket.attempt(a, 0)
assert not bucket.attempt(a, 29)
assert bucket.attempt(a, 30)
assert not bucket.attempt(a, 30)
assert sum(bucket.attempt(a, 1_000) for _ in range(4)) == 3
assert bucket.attempt(b, 1_000)
assert bucket.attempt(c, 1_000)
for cls in (Fixed, Rolling, Bucket):
    for bad in (0, -1, True, 1.5, "3", None):
        for args in ((bad, 60), (3, bad)):
            try:
                cls(*args)
            except ValueError:
                pass
            else:
                raise AssertionError("invalid policy accepted")
    limiter = cls(3, 60)
    assert limiter.attempt(a, 10)
    for key, now in ((a, 9), (a, -1), (a, True), (a, 1.5), (a, "10"), (a, None),
                     (None, 10), ("tenant-a", 10), (("tenant-a",), 10),
                     (("tenant-a", "read", "extra"), 10), (("", "read"), 10),
                     ((1, "read"), 10), (("tenant-a", " "), 10)):
        before = limiter.clocks.copy()
        try:
            limiter.attempt(key, now)
        except ValueError:
            pass
        else:
            raise AssertionError("invalid scope or clock accepted")
        assert limiter.clocks == before
print("fixed/rolling boundaries, token refill/cap, scopes and invalid clocks: passed")
```

The token bucket's capacity is three and its refill is three per 90 seconds. A full bucket can admit three immediately and another after 30 seconds; it does **not** promise at most three in every rolling 90-second interval. The exact rolling log above stores at most the allowed accepted attempts per active key, but neither it nor the other fixtures retires inactive keys. Their key cardinality is unbounded. Define retention, eviction and reset semantics before turning a toy into a service.

## Separate rate from simultaneous work

A steady ten admissions per second can still accumulate many slow operations. A concurrency gate counts work currently holding a slot, with bounded waiting, deadlines and release on every completion/cancellation/failure path. A rate counter measures a different quantity. Pooling, downstream work and global cost limits need their own capacity evidence; use the existing [scaling worksheet](/docs/system-design/scaling-decision-worksheet) and [connection-pool lesson](/docs/databases/postgres-connection-pooling).

This experiment has no simultaneous callers, Redis, eviction, distributed clock or outage. For multiple instances, trace the complete atomic prune/check/admit transition and its clock authority. Test equal-time arrivals, same-key races, tenant/route scope, storage expiry, malformed policy, restart and unavailable storage. Choose a documented fail-open, fail-closed or bounded-local fallback by the protected operation's risk; a fallback may weaken a global quota. Do not equate a per-IP key with one person.

## Return a useful rejection

[RFC 6585 section 4](https://www.rfc-editor.org/rfc/rfc6585.html#section-4) defines `429`, recommends explaining the condition and permits `Retry-After`; it leaves identity and counting policy unspecified. A `429` response must not be cached. The status is optional, and answering every attack request can itself consume capacity. A retry hint is not a reservation: other callers may spend capacity before the retry arrives. Keep client backoff bounded and avoid amplifying an outage.

Write a review receipt: counted event/cost, trusted scope, precise interval or bucket capacity/refill, clock, atomic owner, concurrency budget, retention, rejection and storage-failure behavior. Pair it with the [Traffic Rate Checkpoint](/practice/system-design/traffic-rate-checkpoint). No benchmark, denial-of-service protection or distributed correctness claim follows from the sequential fixture.
