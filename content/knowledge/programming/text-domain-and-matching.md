---
title: Text Domains And Matching — Keep The Contract Visible
slug: programming/text-domain-and-matching
summary: Reverse only ASCII letters with an independent position oracle, then review whole-input matching, escapes and regex diagrams.
track: Programming
topic: Text Processing
difficulty: practitioner
tags: [javascript, regular-expressions, two-pointers, input-validation, reference-oracle]
prerequisites: [programming/javascript-value-contracts]
diagramRefs: []
sourceRefs: [text-mdn-regex, text-mdn-forof, text-regex-vis]
status: published
---

## Choose the character domain

Original task: reverse ASCII letters while preserving every other accepted ASCII character at its original index. Accept a primitive string of zero to 64 ASCII characters; reject boxed strings, non-ASCII text and longer input. Thus `a-B!c` becomes `c-B!a`, while `12-!` remains unchanged. Uppercase and lowercase both count as letters, but their case travels with the moved letter.

This policy is deliberate. [JavaScript string iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of) uses Unicode code points; indexing and user-perceived grapheme boundaries are separate concerns. Accents, combining sequences, emoji, normalization and locale rules need another contract. A programming lesson's ASCII bound does not create a human-language curriculum or define universal “alphabetic” text.

## Make pointer progress explicit

Hold a left and right index. A nonletter is fixed: advance past it without moving its value. When both positions hold letters, swap them and move both pointers. Every loop iteration must advance at least one pointer. At termination, the nonletter positions equal the input and the letter subsequence equals the original letter subsequence reversed.

Use a separate oracle that gathers letter positions and rewrites only those slots. It must not repeat the two-pointer loop. Tiny exhaustive inputs expose empty strings, one-sided punctuation, repeated letters, mixed case and adjacent fixed positions; none of these require a copied interview solution.

## Run the original text fixture

Save as `text_lab.mjs` and run `node text_lab.mjs` with Node 22+. The 3,906 generated strings use the five-symbol alphabet through length five. Each check also tests reversal twice and unchanged fixed positions. The regex cases use this engine only; no external visualizer receives inputs.

```javascript
import assert from 'node:assert/strict';

const letter = char => (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
function reverseLetters(text) {
  if (typeof text !== 'string' || text.length > 64 || [...text].some(char => char.codePointAt(0) > 127)) throw new RangeError('ASCII string of at most 64 characters');
  const chars = [...text];
  let left = 0, right = chars.length - 1;
  while (left < right) {
    if (!letter(chars[left])) { left++; continue; }
    if (!letter(chars[right])) { right--; continue; }
    [chars[left], chars[right]] = [chars[right], chars[left]];
    left++; right--;
  }
  return chars.join('');
}
function positionOracle(text) {
  const letters = [...text].filter(char => /[A-Za-z]/u.test(char)).reverse();
  let index = 0;
  return [...text].map(char => /[A-Za-z]/u.test(char) ? letters[index++] : char).join('');
}
assert.equal(reverseLetters('a-B!c'), 'c-B!a');
assert.equal(reverseLetters('12-!'), '12-!');
assert.equal(reverseLetters('a'.repeat(64)), 'a'.repeat(64));
for (const invalid of [null, 12, new String('ab'), 'é', '🙂', 'a'.repeat(65)]) assert.throws(() => reverseLetters(invalid), RangeError);
let fixtures = [''], checked = 0;
for (let length = 0; length <= 5; length++) {
  for (const text of fixtures) {
    const actual = reverseLetters(text);
    assert.equal(actual, positionOracle(text));
    assert.equal(reverseLetters(actual), text);
    for (let index = 0; index < text.length; index++) if (!/[A-Za-z]/u.test(text[index])) assert.equal(actual[index], text[index]);
    checked++;
  }
  fixtures = fixtures.flatMap(prefix => ['a', 'B', 'z', '-', '1'].map(char => prefix + char));
}
assert.equal(checked, 3906);
const wholeToken = /^[A-Za-z]{2,4}$/u;
function acceptsToken(text) {
  if (typeof text !== 'string') return false;
  const match = wholeToken.exec(text);
  return match !== null && match[0].length === text.length;
}
for (const text of ['ab', 'AbZ', 'abcd']) assert.equal(acceptsToken(text), true);
for (const text of ['', 'a', 'abcde', 'éa', 'ab\n', ' ab', 'ab!', null, undefined, new String('ab')]) assert.equal(acceptsToken(text), false);
assert.equal(/\d+/u.test('id42x'), true);
assert.equal(new RegExp('\\d+', 'u').test('id42x'), true);
assert.equal(new RegExp('\d+', 'u').test('42'), false);
console.log('text-domain-and-matching: passed');
```

## Separate pattern syntax from acceptance

[MDN regular-expression guidance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions) describes assertions, character classes, quantifiers and flags. A successful substring match is not necessarily whole-input validation. State the dialect, flags and matching API, then check accepted and rejected boundaries. A constructor string adds JavaScript's string-escape layer before the regex parser; a literal has different syntax.

Original validator: a token has two to four ASCII letters and nothing else. Keep a newline and a trailing punctuation rejection case alongside length checks. Explicitly checking that the matched text covers the whole input avoids treating a dialect-specific end assertion as a universal full-match API. Reusing stateful `g`/`y` expressions needs an additional `lastIndex` policy; this validator uses neither flag.

## Use diagrams as review aids

The author-maintained [regex-vis repository](https://github.com/Bowen7/regex-vis) presents a visualizer and editor. A diagram can expose grouping and repetition to a reader, but it does not establish identical semantics across engines or a runtime bound on adversarial input. Use synthetic examples in an external tool; private source text needs an authorized destination. No tool was installed or given private data for this lesson.

The two-pointer routine uses linear scans and a new character buffer under the ASCII bound. The small regex fixture does not benchmark arbitrary patterns or prove resistance to expensive backtracking. Parser choice, Unicode segmentation and security validation remain separate engineering decisions. Complete the [checkpoint](/practice/programming/text-domain-and-matching-checkpoint).
