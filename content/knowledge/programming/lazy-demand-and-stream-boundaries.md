---
title: Lazy Demand And Stream Boundaries
slug: programming/lazy-demand-and-stream-boundaries
summary: Trace consumption and cleanup through lazy transforms, then separate stream pressure, scheduling and resumable-upload acknowledgements.
track: Programming
topic: Iteration
difficulty: practitioner
tags: [javascript, generators, transducers, streams, backpressure, retry]
prerequisites: [programming/javascript-value-contracts]
diagramRefs: []
sourceRefs: [demand-mdn-iteration, demand-mdn-forof, demand-node-stream, demand-node-loop, demand-tus-offset]
status: published
---

## Name the demand contract

Original task: from a finite sequence, square odd values and return the first two results. Eager `filter().map().slice()` processes the finite collection before slicing. A lazy iterator can stop when the second qualifying result is produced. It still must inspect intervening rejected values; “two outputs” does not mean “two inputs.” Laziness alone does not reduce the work of consuming every value, and retained closures can still hold large objects.

[Iterators and generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators) distinguishes an iterator's evolving state from an iterable that can supply iterators. Reusing an exhausted generator does not restart it. A factory can create a fresh generator; a reusable iterable and a single shared iterator have different ownership contracts.

## Propagate stopping and cleanup

In the original fixture, `takeMapped` validates its limit before reading anything and returns immediately for zero demand. It pulls until the requested number of qualifying values arrives, then breaks. [for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of) calls an available iterator `return()` on early exit. A generator's `finally` can therefore release the resource it owns. This does not mean every iterator has cleanup, or that every unopened resource is disposed automatically.

A transducer transforms a reducing step instead of building an intermediate collection. The small `filterStep(mapStep(append))` below filters each input, then maps accepted inputs, then appends. Swapping that composition changes the question asked by the predicate. The reducer example intentionally processes the full finite input; it does not implement a complete transducer protocol with termination, completion and asynchronous cancellation. The lazy `takeMapped` example separately demonstrates early stopping and cleanup.

## Run the original demand fixture

Save as `demand_lab.mjs` and run `node demand_lab.mjs` with Node 22+. The generator uses a synthetic ownership log, not a file handle or network connection. No asynchronous timer or stream service is started.

```javascript
import assert from 'node:assert/strict';

function* source(values, log) {
  log.push('opened');
  try {
    for (const value of values) {
      log.push(value);
      yield value;
    }
  } finally { log.push('closed'); }
}
function takeMapped(iterable, limit, predicate, transform) {
  if (!Number.isInteger(limit) || limit < 0 || limit > 16) throw new RangeError('limit');
  const result = [];
  if (limit === 0) return result;
  for (const value of iterable) {
    if (!predicate(value)) continue;
    result.push(transform(value));
    if (result.length === limit) break;
  }
  return result;
}
const odd = value => value % 2 !== 0;
const square = value => value * value;
const values = [2, 3, 4, 5, 7];
const log = [];
const iterator = source(values, log);
assert.deepEqual(takeMapped(iterator, 2, odd, square), [9, 25]);
assert.deepEqual(log, ['opened', 2, 3, 4, 5, 'closed']);
assert.deepEqual([...iterator], []);
const zeroLog = [];
assert.deepEqual(takeMapped(source(values, zeroLog), 0, odd, square), []);
assert.deepEqual(zeroLog, []);
for (const invalid of [-1, 17, 1.5, NaN, '2', null]) {
  const invalidLog = [];
  assert.throws(() => takeMapped(source(values, invalidLog), invalid, odd, square), RangeError);
  assert.deepEqual(invalidLog, []);
}
const failingLog = [];
assert.throws(() => takeMapped(source(values, failingLog), 2, odd, () => { throw new Error('transform'); }), /transform/);
assert.deepEqual(failingLog, ['opened', 2, 3, 'closed']);
for (let length = 0; length <= 12; length++) {
  const input = Array.from({ length }, (_, index) => index - 4);
  for (let limit = 0; limit <= 16; limit++) {
    const trace = [];
    const expected = input.filter(odd).map(square).slice(0, limit);
    assert.deepEqual(takeMapped(source(input, trace), limit, odd, square), expected);
    if (limit === 0) assert.deepEqual(trace, []);
    else assert.equal(trace.at(-1), 'closed');
  }
}
const mapStep = transform => step => (state, value) => step(state, transform(value));
const filterStep = predicate => step => (state, value) => predicate(value) ? step(state, value) : state;
const append = (state, value) => { state.push(value); return state; };
const composed = filterStep(odd)(mapStep(square)(append));
assert.deepEqual(values.reduce(composed, []), [9, 25, 49]);
// Predicate domain changes if mapping precedes filtering.
const plusOne = value => value + 1;
assert.deepEqual([1, 2, 3].reduce(filterStep(odd)(mapStep(plusOne)(append)), []), [2, 4]);
assert.deepEqual([1, 2, 3].reduce(mapStep(plusOne)(filterStep(odd)(append)), []), [3]);
assert.deepEqual(values, [2, 3, 4, 5, 7]);
console.log('lazy-demand-and-stream-boundaries: passed');
```

## Separate pressure from acknowledgement

[Node stream documentation](https://nodejs.org/api/stream.html) specifies that `write()` returning false asks the producer to wait for `drain`. The high-water mark is a pressure threshold, not a strict total-memory cap. Successful admission to a local buffer does not establish durable receipt by the remote application. Cancellation, errors, finalization and bounded queues require their own policies; collecting all chunks before sending can negate a streaming interface's memory benefit.

Original paper trace: a twelve-byte file uses four-byte chunks. The server accepts bytes 0–3 but its reply is lost. A retry must verify upload-session and file identity, query the accepted offset (4), and create a fresh body for bytes 4–7. Replaying from the client's assumed offset (0) can conflict; silently applying it twice can corrupt the result. [tus 1.0.0 offset rules](https://tus.io/protocols/resumable-upload) require an offset mismatch to return 409 without changing the upload. A consumed request body is not a reusable retry plan. This trace implements neither tus nor browser storage/authentication, and claims no universal file-size or memory guarantee.

## Record the host and evidence boundary

[Node event-loop guidance](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick) documents Node's phases and the libuv 1.45 / Node 20 change to timer processing after poll. A timer is a scheduling threshold, not an exact deadline; synchronous callbacks can delay progress. Promise jobs, next-tick work, module evaluation, workers and browser scheduling need the stated host/context. A memorized top-level ordering is not a portable proof.

Audit server entrypoints as well as the task function: an import can initialize a dependency before a later execution flag is checked. Declare runtime packages directly and verify a production-only artifact rather than relying on a development install. This lesson adds no worker, import-time SDK or upload endpoint. Bounded value checks and synthetic cleanup traces do not measure full-service latency, memory or network reliability. Complete the [checkpoint](/practice/programming/lazy-demand-and-stream-boundaries-checkpoint).
