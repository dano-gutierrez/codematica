---
title: Tree Shapes And Cost Models — State The Property You Test
slug: programming/tree-shapes-and-cost-models
summary: Separate full, complete, perfect and ordered trees; validate ancestor bounds and count one algorithm's comparisons under explicit assumptions.
track: Programming
topic: Algorithm Analysis
difficulty: practitioner
tags: [binary-trees, complexity, invariants, representation, reference-oracle]
prerequisites: [programming/bfs-dfs-fundamentals]
diagramRefs: []
sourceRefs: [shape-opendsa-binary, shape-opendsa-bst, cost-opendsa-selection, cost-oxford-b16]
status: published
---

## Separate shape from ordering

This lesson uses explicit definitions. Full means every occupied node has zero or two occupied children. Complete means levels fill from left to right with no missing breadth-first slot before an occupied slot. Perfect means every internal node has two children and every leaf has the same depth. [OpenDSA's binary-tree definitions](https://opendsax.cs.vt.edu/OpenDSA/Books/Everything/html/BinaryTree.html) distinguishes full from complete and notes that names vary between texts. State the definition rather than guessing from a picture.

Original counterexamples: a root with only a left child is complete but not full; a root with only a right child is neither. A root with two children, whose right child has two children, is full but has a left-side gap, so is not complete. None of these shape statements establishes ordered keys. Height balance is another property; a height-balanced shape with misplaced values is not a valid AVL search tree.

## Carry the ancestor constraint

[OpenDSA's BST chapter](https://opendsax.cs.vt.edu/OpenDSA/Books/Everything/html/BST.html) defines ordering over entire subtrees and discusses duplicate policy and height-dependent operations. This original validator uses strictly smaller left values and strictly larger right values, so duplicates are rejected. That intentionally differs from the chapter's duplicate-on-left example.

If root 10 has left child 5 and that child's right child is 12, the local 5-to-12 comparison passes but 12 violates root 10's upper bound. Carry both ancestor bounds through recursion. A valid plain BST can still be a chain: logarithmic search requires a height guarantee, not the name “binary search tree.” The fixture checks balance, but performs no AVL rotations or updates.

## Count the operation before naming the class

[Oxford B16 notes](https://www.robots.ox.ac.uk/~vedaldi/assets/teach/2024/b16/b16-notes.pdf) separates asymptotic upper bounds from tight bounds. Specify input size, representation, primitive operation and case. A linear cost is also bounded above by a quadratic function; `O(n²)` is not a synonym for exponential growth or necessarily the most informative bound. Worst-case, expected cost under a distribution and amortized cost across a sequence answer different questions.

The authored selection scan below compares every remaining candidate to the current minimum. Its comparison count is `(n-1)+(n-2)+...+1 = n(n-1)/2`, even when already sorted; output correctness and comparison cost are separate checks. [OpenDSA selection sort](https://opendsa.cs.vt.edu/ODSA/Books/CS3/html/SelectionSort.html) explains scanning the remaining portion and limiting swaps. This original minimum-first code copies no upstream implementation. Constant-time comparisons are an assumption; sorting long strings or copying large outputs changes the cost model.

## Run the original bounded references

Save as `tree_cost_lab.py` and run `python3 tree_cost_lab.py` with Python 3.13+. A tree is `None` or a built-in `(integer, left, right)` tuple, with values between -100 and 100, at most fifteen occupied positions and depth at most seven (root depth zero). Shared immutable tuple values denote separate positions, not shared graph nodes. Reject malformed shapes before computing properties. Empty trees are full, complete, perfect, balanced and strictly ordered by this fixture's stated convention.

```python
from itertools import product

def inspect_tree(tree):
    positions, leaves, ordered = [], [], []
    def walk(node, slot, depth, low, high):
        if node is None:
            return 0, True, True
        if type(node) is not tuple or len(node) != 3 or type(node[0]) is not int or not -100 <= node[0] <= 100 or depth > 7:
            raise ValueError('bounded tuple tree')
        positions.append(slot)
        if len(positions) > 15:
            raise ValueError('too many positions')
        value, left, right = node
        lh, lf, lb = walk(left, 2 * slot + 1, depth + 1, low, min(high, value))
        ordered.append(low < value < high)
        rh, rf, rb = walk(right, 2 * slot + 2, depth + 1, max(low, value), high)
        if left is None and right is None:
            leaves.append(depth)
        full = lf and rf and ((left is None) == (right is None))
        return 1 + max(lh, rh), full, lb and rb and abs(lh - rh) <= 1
    height, full, balanced = walk(tree, 0, 0, -101, 101)
    complete = not positions or max(positions) == len(positions) - 1
    perfect = full and len(set(leaves)) <= 1
    return full, complete, perfect, balanced, all(ordered), height

def inorder(tree):
    if tree is None:
        return []
    return inorder(tree[1]) + [tree[0]] + inorder(tree[2])

def breadth_slots(tree):
    queue, seen_gap, complete = [tree], False, True
    while queue:
        node = queue.pop(0)
        if node is None:
            seen_gap = True
        else:
            if seen_gap:
                complete = False
            queue.extend([node[1], node[2]])
    return complete

def shapes(size):
    if size == 0:
        return [None]
    return [(0, left, right) for left_size in range(size)
            for left in shapes(left_size) for right in shapes(size - 1 - left_size)]

def label(shape, numbers):
    if shape is None:
        return None
    # Inorder labeling deliberately differs from inspect_tree's ancestor bounds.
    left = label(shape[1], numbers)
    value = next(numbers)
    right = label(shape[2], numbers)
    return value, left, right

leaf = (1, None, None)
assert inspect_tree(None) == (True, True, True, True, True, 0)
assert inspect_tree((-100, None, (100, None, None)))[4] is True
perfect15 = (0, (0, (0, leaf, leaf), (0, leaf, leaf)), (0, (0, leaf, leaf), (0, leaf, leaf)))
assert inspect_tree(perfect15)[:4] == (True, True, True, True)
accepted_chain = None
for value in range(8):
    accepted_chain = (value, accepted_chain, None)
assert inspect_tree(accepted_chain)[5] == 8
assert inspect_tree((2, leaf, None)) == (False, True, False, True, True, 2)
assert inspect_tree((0, None, leaf)) == (False, False, False, True, True, 2)
assert inspect_tree((10, (5, None, (12, None, None)), None))[4] is False
assert inspect_tree((2, (2, None, None), None))[4] is False
assert inspect_tree((0, None, (1, None, (2, None, None))))[3] is False
assert inspect_tree((4, (2, None, None), (6, (5, None, None), (7, None, None))))[:3] == (True, False, False)
checked = 0
for size in range(6):
    for shape in shapes(size):
        for values in [list(range(size)), list(reversed(range(size))), [0] * size]:
            tree = label(shape, iter(values))
            full, complete, perfect, balanced, strict_bst, height = inspect_tree(tree)
            ordered_values = inorder(tree)
            assert strict_bst == all(a < b for a, b in zip(ordered_values, ordered_values[1:]))
            assert complete == breadth_slots(tree)
            assert perfect == (size == 2 ** height - 1)
            checked += 1
assert checked == 195
class TupleSubclass(tuple):
    pass
chain = None
for value in range(9):
    chain = (value, chain, None)
too_many = (0, (0, (0, leaf, leaf), (0, leaf, leaf)), (0, (0, leaf, leaf), (0, leaf, (0, leaf, leaf))))
for bad in [[1, None, None], (True, None, None), (1.0, None, None), ('1', None, None), (101, None, None), (-101, None, None), (1,), (1, None, None, None), (1, [], None), (0, (1, None, None), []), TupleSubclass((1, None, None)), chain, too_many]:
    try:
        inspect_tree(bad)
    except ValueError:
        pass
    else:
        raise AssertionError('invalid tree accepted')

def selection_count(values):
    if type(values) is not list or len(values) > 16 or any(type(v) is not int or not -100 <= v <= 100 for v in values):
        raise ValueError('bounded integer list')
    output, comparisons = list(values), 0
    for index in range(len(output) - 1):
        minimum = index
        for candidate in range(index + 1, len(output)):
            comparisons += 1
            if output[candidate] < output[minimum]:
                minimum = candidate
        output[index], output[minimum] = output[minimum], output[index]
    return output, comparisons

sort_checked = 0
for length in range(6):
    for fixture in product([-1, 0, 1], repeat=length):
        values = list(fixture)
        result, comparisons = selection_count(values)
        assert result == sorted(fixture)
        assert comparisons == length * (length - 1) // 2
        assert values == list(fixture)
        sort_checked += 1
assert sort_checked == 364
assert selection_count(list(range(16)))[1] == 120
assert selection_count([-100, 100]) == ([-100, 100], 1)
for bad in [(1, 2), [True], [1.0], [101], [-101], [0] * 17]:
    try:
        selection_count(bad)
    except ValueError:
        pass
    else:
        raise AssertionError('invalid sort input accepted')
print('shape, ancestor bounds, comparison counts and independent fixtures: passed')
```

## Preserve assumptions beyond the fixture

The independent breadth-first gap check and strict inorder sequence check use different representations of the properties. The finite cases do not prove arbitrary graphs, unbounded recursion or runtime speed. The shape walker must visit the entire accepted tree to validate it; short-circuiting on an ordering failure would hide a malformed later branch.

Recursion is a control mechanism, not a complexity class: one decreasing branch and two decreasing branches have different recurrences. Hash lookup needs collision and implementation assumptions; preprocessing and output size still count. A substring-search algorithm's bound depends on its exact variant and preprocessing, while a sieve's cost is not the cost of testing one number. Avoid assigning a single label to an entire family from a cheat sheet. Extend the independent cost/representation model for the actual operation before claiming a bound. Complete the [checkpoint](/practice/programming/tree-shapes-and-cost-models-checkpoint).
