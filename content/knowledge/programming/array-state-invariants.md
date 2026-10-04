---
title: Array State Reviews — Define The Invariant Before The Pattern
slug: programming/array-state-invariants
summary: Test nonempty segment sums, validated cyclic placement and strict next-greater indices with original Python references and independent bounded oracles.
track: Programming
topic: Algorithms
difficulty: practitioner
tags: [arrays, invariants, kadane, cyclic-placement, monotonic-stack]
prerequisites: [programming/python-runtime-model]
diagramRefs: []
status: published
---

## Choose the state contract

A pattern name leaves important behavior undecided. These original exercises accept lists or tuples of built-in integers, reject booleans and preserve the caller's input. They return positions where that clarifies the result. The examples are not company interview questions, a complete algorithm syllabus or performance measurements.

## Retain the best nonempty segment

For the Kadane-style exercise, empty input is rejected. Return `(sum, start, end)` with an exclusive end. On equal sums choose the earliest start, then earliest exclusive end. For `[-5, -2, -4]`, return `(-2, 1, 2)`; initializing the answer to zero would invent an empty winning segment. For `[0, 0]`, return `(0, 0, 1)`.

At each position, retain the best sum ending there and its earliest start. A negative prior sum cannot help the next segment, so restart; a zero prior sum stays to preserve the earlier start. Separately retain the best completed segment. Strict improvement preserves the stated tie rule. This is one narrow dynamic-programming example, not comprehensive DP coverage.

## Place only values with a valid slot

The cyclic-placement exercise receives `n` unique values from `0..n`, so exactly one is absent. Value `n` has no slot in the length-`n` array. Duplicates, negative values and larger values are invalid; duplicates are rejected before swapping. For `[3, 0, 1]`, return missing value `2`. Empty input returns `0`.

Place a value below `n` into its matching slot, then recheck the displaced value. With the validated unique domain, each swap fixes a slot without displacing a previously fixed value. Scan for the unmatched slot afterward. The copied array and validation set protect caller data; this version does not promise constant auxiliary space.

## Wait for a strictly greater value

Return the index of the first strictly greater value to the right, or `None`. For `[2, 2, 3]`, return `[2, 2, None]`. Equal values do not resolve a pending index. Keep pending indices with nonincreasing values; a larger new value resolves the smaller pending suffix. Every index is pushed once and popped at most once. Keeping indices preserves duplicate positions and the requested output meaning.

## Run the original reference

The three algorithms perform O(n) array operations; copies and validation use O(n) extra storage. Integer bit size adds arithmetic/comparison cost. The slower oracles below serve only bounded verification. Run with Python 3.13; this code performs no network, file or model operations.

```python
from itertools import permutations, product


def integer_copy(values):
    if not isinstance(values, (list, tuple)):
        raise ValueError("expected a list or tuple")
    if any(type(value) is not int for value in values):
        raise ValueError("expected built-in integers, excluding booleans")
    return list(values)


def best_segment(values):
    a = integer_copy(values)
    if not a:
        raise ValueError("nonempty segment required")
    start, total = 0, a[0]
    best = (total, 0, 1)
    for end in range(1, len(a)):
        if total < 0:
            start, total = end, a[end]
        else:
            total += a[end]
        if total > best[0]:
            best = (total, start, end + 1)
    return best


def missing_slot(values):
    a = integer_copy(values)
    n = len(a)
    if any(value < 0 or value > n for value in a) or len(set(a)) != n:
        raise ValueError("unique values in 0..n required")
    for index in range(n):
        while a[index] < n and a[index] != index:
            target = a[index]
            a[index], a[target] = a[target], a[index]
    return next((index for index in range(n) if a[index] != index), n)


def next_greater_indices(values):
    a = integer_copy(values)
    result, pending = [None] * len(a), []
    for index, value in enumerate(a):
        while pending and a[pending[-1]] < value:
            result[pending.pop()] = index
        pending.append(index)
    return result


def segment_oracle(a):
    candidates = [(sum(a[start:end]), start, end)
                  for start in range(len(a))
                  for end in range(start + 1, len(a) + 1)]
    return min(candidates, key=lambda row: (-row[0], row[1], row[2]))


def greater_oracle(a):
    return [next((j for j in range(i + 1, len(a)) if a[j] > a[i]), None)
            for i in range(len(a))]


assert best_segment([-5, -2, -4]) == (-2, 1, 2)
assert best_segment([0, 0]) == (0, 0, 1)
assert missing_slot([3, 0, 1]) == 2
assert missing_slot([]) == 0
assert next_greater_indices([2, 2, 3]) == [2, 2, None]
assert next_greater_indices([]) == []
assert best_segment((-5, -2, -4)) == (-2, 1, 2)
assert missing_slot((3, 0, 1)) == 2
assert next_greater_indices((2, 2, 3)) == [2, 2, None]

segment_cases = 0
for length in range(1, 7):
    for values in product(range(-2, 3), repeat=length):
        before = list(values)
        assert best_segment(before) == segment_oracle(values)
        assert before == list(values)
        segment_cases += 1
assert segment_cases == 19530

slot_cases = 0
for length in range(6):
    for values in permutations(range(length + 1), length):
        before = list(values)
        expected = next(value for value in range(length + 1) if value not in values)
        assert missing_slot(before) == expected
        assert before == list(values)
        slot_cases += 1
assert slot_cases == 873

greater_cases = 0
for length in range(7):
    for values in product(range(-1, 2), repeat=length):
        before = list(values)
        assert next_greater_indices(before) == greater_oracle(values)
        assert before == list(values)
        greater_cases += 1
assert greater_cases == 1093

for function, bad in [(best_segment, []), (missing_slot, [1, 1]),
                      (missing_slot, [-1]), (missing_slot, [2]),
                      (best_segment, [True]), (missing_slot, [False]),
                      (next_greater_indices, [True]), (best_segment, [1.0]),
                      (missing_slot, "0"), (next_greater_indices, None)]:
    try:
        function(bad)
    except ValueError:
        pass
    else:
        raise AssertionError((function.__name__, bad))

print("nonempty/ties, unique slots, strict greater, input preservation and bounded oracles: passed")
```

## Review the evidence

The reference checks 19,530 segment arrays, 873 unique-domain permutations and 1,093 successor arrays, plus explicit invalid inputs and caller preservation. These bounded oracle checks are not a general proof. Explain the retained state and termination argument independently; change a comparison or remove a precondition and predict which case fails. Runtime, large integers, memory pressure and integration need separate measurements.

Complete the [Array State Checkpoint](/practice/programming/array-state-checkpoint). Earlier coding-path questions still supply window, prefix-count, lookup, interval and ordered-search practice; this review adds the three distinct missing state contracts.
