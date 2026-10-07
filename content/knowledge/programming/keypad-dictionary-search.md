---
title: Keypad Dictionary Search — Bound The Branch And Preserve The Word
slug: programming/keypad-dictionary-search
summary: Compare a closed-dictionary scan with bounded trie backtracking; distinguish prefixes, complete words, branch state and input validation.
track: Programming
topic: Backtracking
difficulty: practitioner
tags: [backtracking, trie, invariants, input-validation, reference-oracle]
prerequisites: [programming/python-runtime-model, programming/bfs-dfs-interview-patterns]
diagramRefs: []
sourceRefs: [keypad-python313-mappings, keypad-python313-product]
status: published
---

## Define the closed dictionary

This original exercise uses the fixed letter groups `2=abc`, `3=def`, `4=ghi`, `5=jkl`, `6=mno`, `7=pqrs`, `8=tuv`, `9=wxyz`. It searches a supplied finite collection, not a natural-language service. For digits `23` and words `ad, ae, be, cf, dg`, return `ad, ae, be, cf`. Generating all nine letter pairs would include candidates outside this dictionary.

Accept a built-in string of zero to eight digits from `2` through `9` and a built-in list or tuple of at most 128 words. Each word has one to eight ASCII lowercase letters. Reject other types, spaces, uppercase, unsupported digits and oversized inputs with `ValueError`; validate the whole dictionary before searching. Duplicate words are allowed, but results are unique and alphabetical. Valid empty digits return an empty list. The empty Cartesian product's identity is not this API's empty-query result.

The bounds are exercise policy, not a universal keypad standard. This is programming practice; it adds no human-language course, phone interface, external dictionary or employer question bank.

## Separate a prefix from a word

A trie records one character per edge and a separate terminal marker for each complete word: a prefix is not a completed word. After consuming every digit, emit a result only when that node is terminal. If both `ad` and `adg` are stored, query `23` returns only `ad`; storing a longer word must not turn its unfinished prefix into a word. Missing prefix edges prune branches that cannot reach any stored result.

Each child is a distinct dictionary. [Python 3.13 mutable sequences and mappings](https://docs.python.org/3.13/library/stdtypes.html) describes `dict.get`, `setdefault`, list append/pop and shared mutable references. Do not initialize every child with one shared mutable object. The trie and query buffer here belong to one function call; they are not a synchronized shared index.

## Restore the branch state

At depth `i`, the buffer contains exactly `i` letters whose encoding equals the first `i` digits, and the current node represents that same prefix. Choose a letter, append it, explore its child, then restore the buffer before exploring a sibling. For `22` with `aa, ab, ba`, both uses of `a` are legal: a global visited-letter set would incorrectly forbid repeated letters at different positions.

Snapshot each result as a string. Appending the mutable buffer itself would make saved results change as later branches pop or append. Inputs remain unchanged, and a later query builds its own state. Exceptions abort this synchronous call; it returns no partial report or reusable shared index.

## Run the original reference

Save this standard-library Python 3.13+ block as `keypad_lab.py` and run `python3 keypad_lab.py` in an isolated directory. It opens no files, sockets or external service. Its independent dictionary-scan oracle encodes stored words directly instead of following the trie. [Python 3.13 Cartesian products](https://docs.python.org/3.13/library/itertools.html#itertools.product) documents finite input pools; the small products below generate test fixtures, not the production search space.

```python
from itertools import product

KEYS = dict(zip('23456789', ('abc', 'def', 'ghi', 'jkl', 'mno', 'pqrs', 'tuv', 'wxyz')))

def find_words(digits, words):
    if type(digits) is not str or len(digits) > 8 or any(d not in KEYS for d in digits):
        raise ValueError('digits must contain zero to eight keys from 2 through 9')
    if type(words) not in (list, tuple) or len(words) > 128:
        raise ValueError('dictionary must be a list or tuple of at most 128 words')
    for word in words:
        if type(word) is not str or not 1 <= len(word) <= 8 or any(c < 'a' or c > 'z' for c in word):
            raise ValueError('words must contain one to eight ASCII lowercase letters')
    if not digits:
        return []
    root = {}
    for word in words:
        node = root
        for letter in word:
            node = node.setdefault(letter, {})
        node[None] = True
    result, buffer = [], []
    def visit(node, index):
        if index == len(digits):
            if None in node:
                result.append(''.join(buffer))
            return
        for letter in KEYS[digits[index]]:
            child = node.get(letter)
            if child is None:
                continue
            buffer.append(letter)
            visit(child, index + 1)
            buffer.pop()
    visit(root, 0)
    return result

# Independent literal encoding: it does not reuse KEYS or trie traversal.
ENCODE = str.maketrans('abcdefghijklmnopqrstuvwxyz', '22233344455566677778889999')
def scan(digits, words):
    return sorted({word for word in words if word.translate(ENCODE) == digits}) if digits else []

assert find_words('23', ['ad', 'ae', 'be', 'cf', 'dg']) == ['ad', 'ae', 'be', 'cf']
assert find_words('23', ['adg']) == []
assert find_words('23', ['ad', 'adg']) == ['ad']
assert find_words('22', ['aa', 'ab', 'ba']) == ['aa', 'ab', 'ba']
assert find_words('23', ['cf', 'ad', 'cf', 'ae']) == ['ad', 'ae', 'cf']
assert find_words('', ['ad']) == []
assert find_words('26', ['ad', 'be']) == []
assert find_words('23', []) == []
assert find_words('22', ['aa'] * 128) == ['aa']
assert find_words('9' * 8, ('z' * 8, 'w' * 8)) == ['w' * 8, 'z' * 8]
alphabet = list('abcdefghijklmnopqrstuvwxyz')
for digit in '23456789':
    assert find_words(digit, alphabet) == scan(digit, alphabet)
pool = [''.join(chars) for length in range(1, 4) for chars in product('adpw', repeat=length)]
pool += pool[:2]
before = list(pool)
checked = 0
for length in range(1, 5):
    for pattern in product('2379', repeat=length):
        digits = ''.join(pattern)
        assert find_words(digits, pool) == scan(digits, pool)
        checked += 1
assert checked == 340 and pool == before
class StringSubclass(str):
    pass
class ListSubclass(list):
    pass

for digits, words in [('0', ['ad']), ('1', []), ('2 ', []), ('２', []), (None, []),
                      ('2' * 9, []), ('', ['']), ('26', ['UP']), ('23', ['é']),
                      ('23', ['a1']), ('23', ['a ']), ('23', [None]),
                      ('', ['a' * 9]), ('', ['aa'] * 129), ('23', 'ad'), ('', iter(['ad'])),
                      ('23', None), ('23', {'ad'}), ('23', b'ad'),
                      (StringSubclass('23'), ['ad']), ('23', ListSubclass(['ad'])),
                      ('23', [StringSubclass('ad')])]:
    try:
        find_words(digits, words)
    except ValueError:
        pass
    else:
        raise AssertionError('invalid input was accepted')
assert find_words('23', ['be']) == ['be']
print('closed dictionary, prefix terminals, branch rollback, validation and independent scan: passed')
```

Predict the outputs before running. Remove the terminal check, skip the buffer pop, retain the buffer instead of joining it, or return early before dictionary validation: a different independent case must fail for each mistake. Keep the original fixture while changing one rule at a time.

## Choose the cost and evidence boundary

A direct scan costs work proportional to the supplied words and can be the simpler choice for one query. This implementation rebuilds the trie for every call. Its construction uses space proportional to stored prefixes, at most 1024 letter edges under the input bounds, plus terminal markers and container overhead. Recursion depth is at most eight; results contain at most 128 distinct words. No byte-memory or throughput benchmark was run.

The trie visits matching stored prefixes rather than every possible keypad string. This does not establish a universal speed advantage; measure repeated-query costs, construction, output copying and update ownership under the same valid input contract before preferring a retained index. A shared mutable index needs a separate version and concurrency policy.

These bounded checks are not a complete backtracking syllabus or proof for arbitrary dictionaries. Unicode normalization, wildcard search, word segmentation, dictionary ranking, streaming results and a full T9 product remain separate contracts. Complete the [Keypad Search Checkpoint](/practice/programming/keypad-search-checkpoint) and preserve the input, prediction, result and counterexample in your learning notes.
