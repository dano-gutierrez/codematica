---
title: JavaScript Value Contracts — Binding, Ownership And Calls
slug: programming/javascript-value-contracts
summary: Predict small JavaScript programs by separating bindings, shared values, own properties, conversion rules and call receivers.
track: Programming
topic: JavaScript
difficulty: practitioner
tags: [javascript, ownership, coercion, prototypes, invariants]
prerequisites: [programming/typescript-boundaries]
diagramRefs: []
sourceRefs: [js-contract-const, js-contract-freeze, js-contract-objects, js-contract-equality, js-contract-this, js-contract-splice, js-contract-sort, js-contract-substr]
status: published
---

## Separate binding from value ownership

A fixed binding can point at mutable state. [MDN's const reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const) distinguishes assignment to a variable from changing its object. A shallow copy creates a new outer object while keeping nested references. [Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) restricts that object's own property descriptors; it does not recursively freeze nested objects or turn every internal slot into immutable state.

Original case: a lesson preview and its saved draft both reference the same `stats` object. Changing `preview.stats.views` also changes `draft.stats.views`, even if the preview's outer object is frozen. First state who owns nested mutation. Copy the appropriate boundary, or share it deliberately; neither spread syntax nor `const` substitutes for that decision.

## Distinguish lookup from membership

[Working with objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects) separates own properties from inherited lookup and enumeration. `Object.keys` returns enumerable own string keys; it omits symbols, non-enumerable keys and inherited keys. Reading `obj.name` can still find an inherited value. Do not interpret a successful lookup as proof that a field was authored on this object.

[splice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice) mutates its receiver and interprets a negative start relative to the end. An unsuccessful `indexOf` returns `-1`; passing that directly to `splice` removes the final item. An absent delete target should leave the collection unchanged. A copy such as `slice` creates a separate array but still shares its element objects. [sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) mutates the array; its default comparison uses string ordering. Supply a lawful numeric comparator when numeric order is the contract.

## Predict conversion and call context

[Loose equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Equality) applies conversion rules. In the original table below, `5 == true` is false: converting true to 1 does not make 5 equal to 1. `[] == false` is true under these rules, while `[] === false` is false. That observation is not permission to treat unrelated object shapes as equivalent resources. Choose the intended comparison contract explicitly.

[this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) depends on invocation for ordinary functions. A strict-mode detached call has an undefined receiver; an arrow captures lexical `this`. Reattaching the same ordinary function to another object changes its receiver, while calling the captured arrow with another receiver does not. A prototype supplies lookup behavior; it does not copy a method into each instance or select a receiver independently of the call.

## Run the original value fixture

Save this original block as `value_lab.mjs` and run `node value_lab.mjs` with Node 22+. ES modules use strict mode. All cases are local values; no file, socket or service is opened. Predict each result first, then retain the case that falsifies your assumption.

```javascript
import assert from 'node:assert/strict';

const draft = { stats: { views: 2 }, title: 'Queue' };
const preview = Object.freeze({ ...draft });
preview.stats.views = 7;
assert.equal(draft.stats.views, 7);
assert.notEqual(preview, draft);
assert.equal(preview.stats, draft.stats);
assert.throws(() => { preview.title = 'Changed'; }, TypeError);
assert.throws(() => { draft = {}; }, TypeError);

function removePresent(items, target) {
  const index = items.indexOf(target);
  if (index !== -1) items.splice(index, 1);
  return items;
}
for (const input of [[], ['a'], ['a', 'b'], ['a', 'a', 'b'], ['a', 'b', 'a']]) {
  for (const target of ['a', 'b', 'missing']) {
    const before = input.slice();
    const expected = before.slice();
    const index = expected.findIndex(value => value === target);
    if (index >= 0) expected.splice(index, 1);
    const actual = before.slice();
    assert.equal(removePresent(actual, target), actual);
    assert.deepEqual(actual, expected);
    assert.deepEqual(input, before);
  }
}
const wrong = ['a', 'b'];
wrong.splice(wrong.indexOf('missing'), 1);
assert.deepEqual(wrong, ['a']);
const values = [3, 12, 2];
assert.deepEqual(values.slice().sort(), [12, 2, 3]);
assert.deepEqual(values.slice().sort((a, b) => a - b), [2, 3, 12]);
assert.deepEqual(values, [3, 12, 2]);
const nested = [{ score: 1 }];
const shallow = nested.slice();
shallow[0].score = 4;
assert.equal(nested[0].score, 4);

const inherited = { inherited: 9 };
const record = Object.create(inherited);
record.visible = 1;
record[Symbol('marker')] = 2;
Object.defineProperty(record, 'hidden', { value: 3 });
assert.deepEqual(Object.keys(record), ['visible']);
assert.equal(record.inherited, 9);
assert.equal(Object.hasOwn(record, 'inherited'), false);
assert.equal(Object.hasOwn(record, 'hidden'), true);
const enumerated = [];
for (const key in record) enumerated.push(key);
assert.deepEqual(enumerated, ['visible', 'inherited']);

const equality = [
  [5 == true, false], [1 == true, true], [0 == false, true],
  [[] == false, true], [[] === false, false], ['5' == 5, true],
  ['5' === 5, false], [null == undefined, true], [null === undefined, false],
];
for (const [actual, expected] of equality) assert.equal(actual, expected);
const same = {};
assert.equal(same === same, true);
assert.equal(same === {}, false);

const origin = {
  name: 'origin',
  read() { return this.name; },
  capture() { return () => this.name; },
};
const receiver = { name: 'receiver', read: origin.read };
assert.equal(receiver.read(), 'receiver');
const detached = origin.read;
assert.throws(() => detached(), TypeError);
assert.equal(detached.call(receiver), 'receiver');
const captured = origin.capture();
assert.equal(captured.call(receiver), 'origin');
const children = [];
for (let i = 0; i < 3; i++) children.push(() => i);
assert.deepEqual(children.map(read => read()), [0, 1, 2]);
console.log('javascript-value-contracts: passed');
```

## Preserve scope when reviewing a cheat sheet

The fixture checks selected semantics on the recorded runtime, not every browser, proxy object, accessor or cross-realm value. Changing assertions to match the implementation removes the counterexample. Keep the expected table independent of the code being changed.

[substr](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substr) is a legacy Annex B feature; `slice`, `substring` and `substr` have different argument rules, so a mechanical rename is unsafe. For dates, distinguish mutation, UTC versus local time, invalid values and month rollover before choosing an API; this fixture contains no time-zone test. Async scheduling belongs in [Lazy Demand And Stream Boundaries](/docs/programming/lazy-demand-and-stream-boundaries), while application state snapshots belong in the existing React lesson. These selected contracts do not reproduce an external question bank or certify its entire syllabus. Complete the [checkpoint](/practice/programming/javascript-value-contracts-checkpoint).
