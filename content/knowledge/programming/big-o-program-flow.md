---
title: Big O Program Flow
slug: programming/big-o-program-flow
summary: Animated program-flow walkthroughs that show how the same practical lookup work changes between O(n), O(1), O(n^2), and O(log n).
track: Programming
topic: Algorithms
difficulty: foundation
tags:
  - algorithms
  - complexity
  - big-o
  - data-structures
prerequisites:
  - Big O notation foundations
  - Arrays and maps
diagramRefs:
  - programming/big-o-code-shapes
status: published
---

## Program Flow First

The fastest way to understand Big O is to watch the program move. Do not start by memorizing labels. Start with the control flow:

1. Does the code do a fixed amount of work?
2. Does it walk every item?
3. Does it walk every item for every other item?
4. Does each step remove a large part of the remaining search space?

The same product task can have very different complexity depending on the data structure and when setup work happens.

```complexity-flow
{
  "id": "membership-lookup-comparison",
  "title": "Membership Lookup Tradeoff",
  "scenario": "Compare a repeated permission check implemented as a list scan, a prebuilt set lookup, a nested comparison, and a sorted binary search.",
  "variants": [
    {
      "id": "list-scan",
      "label": "List scan",
      "complexity": "O(n)",
      "summary": "A list scan is simple, but a miss or late match may inspect every stored value.",
      "operationCounts": [1, 2, 3],
      "code": {
        "language": "typescript",
        "label": "Linear lookup",
        "source": "export function canUseFeature(permissions: string[], required: string) {\n  return permissions.includes(required);\n}"
      },
      "nodes": [
        {
          "id": "request",
          "label": "Request",
          "kind": "input",
          "description": "A request asks whether one permission is present.",
          "position": { "x": 0, "y": 80 }
        },
        {
          "id": "scan",
          "label": "Scan permissions",
          "kind": "operation",
          "description": "The program compares the required value with each stored value.",
          "position": { "x": 230, "y": 80 }
        },
        {
          "id": "answer",
          "label": "Answer",
          "kind": "result",
          "description": "Return true on a match or false after the list is exhausted.",
          "position": { "x": 460, "y": 80 }
        }
      ],
      "edges": [
        { "id": "request-scan", "source": "request", "target": "scan", "label": "start" },
        { "id": "scan-answer", "source": "scan", "target": "answer", "label": "done" }
      ],
      "steps": [
        {
          "id": "read-request",
          "title": "Read the requested permission",
          "description": "The input is one permission name, but the stored permission list can be any length.",
          "activeNodeIds": ["request"],
          "activeEdgeIds": []
        },
        {
          "id": "compare-items",
          "title": "Compare permissions one by one",
          "description": "Every miss adds one more comparison, so larger lists create more work.",
          "activeNodeIds": ["request", "scan"],
          "activeEdgeIds": ["request-scan"]
        },
        {
          "id": "finish-linear",
          "title": "Return after match or exhaustion",
          "description": "The worst case reaches the end of the list, which is why the query is linear.",
          "activeNodeIds": ["scan", "answer"],
          "activeEdgeIds": ["scan-answer"]
        }
      ]
    },
    {
      "id": "set-lookup",
      "label": "Prebuilt set",
      "complexity": "O(1) per query after O(n) build",
      "summary": "A set moves work to setup time so repeated membership checks stay flat per query.",
      "operationCounts": [1, 1],
      "code": {
        "language": "typescript",
        "label": "Hash lookup",
        "source": "const permissionSet = new Set(permissions);\n\nexport function canUseFeature(required: string) {\n  return permissionSet.has(required);\n}"
      },
      "nodes": [
        {
          "id": "build-set",
          "label": "Build set",
          "kind": "data",
          "description": "Create a hash-backed index from the permission list.",
          "position": { "x": 0, "y": 80 }
        },
        {
          "id": "hash-lookup",
          "label": "Hash lookup",
          "kind": "operation",
          "description": "Jump to the bucket for the requested permission.",
          "position": { "x": 230, "y": 80 }
        },
        {
          "id": "return-answer",
          "label": "Answer",
          "kind": "result",
          "description": "Return the membership result without scanning every value.",
          "position": { "x": 460, "y": 80 }
        }
      ],
      "edges": [
        { "id": "build-lookup", "source": "build-set", "target": "hash-lookup", "label": "index" },
        { "id": "lookup-answer", "source": "hash-lookup", "target": "return-answer", "label": "result" }
      ],
      "steps": [
        {
          "id": "prepare-index",
          "title": "Build the set once",
          "description": "The setup still costs O(n), so it is most useful when many queries reuse the same data.",
          "activeNodeIds": ["build-set", "hash-lookup"],
          "activeEdgeIds": ["build-lookup"]
        },
        {
          "id": "return-membership",
          "title": "Return the membership result",
          "description": "Each later permission check uses the index instead of walking the whole list again.",
          "activeNodeIds": ["hash-lookup", "return-answer"],
          "activeEdgeIds": ["lookup-answer"]
        }
      ]
    },
    {
      "id": "nested-scan",
      "label": "Nested scan",
      "complexity": "O(n^2)",
      "summary": "Pairwise comparison is easy to write, but the number of checks grows for every item against every other item.",
      "operationCounts": [1, 4, 9],
      "code": {
        "language": "typescript",
        "label": "Pair comparison",
        "source": "export function hasDuplicate(values: string[]) {\n  for (let i = 0; i < values.length; i += 1) {\n    for (let j = i + 1; j < values.length; j += 1) {\n      if (values[i] === values[j]) return true;\n    }\n  }\n  return false;\n}"
      },
      "nodes": [
        {
          "id": "values",
          "label": "Values",
          "kind": "input",
          "description": "A list of values that might contain duplicates.",
          "position": { "x": 0, "y": 80 }
        },
        {
          "id": "outer-loop",
          "label": "Outer loop",
          "kind": "operation",
          "description": "Pick one candidate value.",
          "position": { "x": 220, "y": 40 }
        },
        {
          "id": "inner-loop",
          "label": "Inner loop",
          "kind": "operation",
          "description": "Compare that candidate with many later values.",
          "position": { "x": 220, "y": 170 }
        },
        {
          "id": "duplicate-answer",
          "label": "Answer",
          "kind": "result",
          "description": "Return when a duplicate appears or every pair is checked.",
          "position": { "x": 460, "y": 105 }
        }
      ],
      "edges": [
        { "id": "values-outer", "source": "values", "target": "outer-loop", "label": "pick" },
        { "id": "outer-inner", "source": "outer-loop", "target": "inner-loop", "label": "compare" },
        { "id": "inner-answer", "source": "inner-loop", "target": "duplicate-answer", "label": "done" }
      ],
      "steps": [
        {
          "id": "pick-candidate",
          "title": "Pick a candidate value",
          "description": "The outer loop can run once per input item.",
          "activeNodeIds": ["values", "outer-loop"],
          "activeEdgeIds": ["values-outer"]
        },
        {
          "id": "compare-candidate",
          "title": "Compare against later values",
          "description": "For each outer item, the inner loop may scan many remaining items.",
          "activeNodeIds": ["outer-loop", "inner-loop"],
          "activeEdgeIds": ["outer-inner"]
        },
        {
          "id": "finish-pairs",
          "title": "Finish pairwise work",
          "description": "As input grows, pair checks grow much faster than the list length.",
          "activeNodeIds": ["inner-loop", "duplicate-answer"],
          "activeEdgeIds": ["inner-answer"]
        }
      ]
    },
    {
      "id": "binary-search",
      "label": "Binary search",
      "complexity": "O(log n)",
      "summary": "When data is sorted, each comparison can discard about half of the remaining search space.",
      "operationCounts": [1, 2, 3],
      "code": {
        "language": "typescript",
        "label": "Binary search",
        "source": "export function hasSku(sortedSkus: string[], target: string) {\n  let left = 0;\n  let right = sortedSkus.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (sortedSkus[mid] === target) return true;\n    if (sortedSkus[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return false;\n}"
      },
      "nodes": [
        {
          "id": "sorted-input",
          "label": "Sorted values",
          "kind": "data",
          "description": "The input must already be sorted or indexed.",
          "position": { "x": 0, "y": 80 }
        },
        {
          "id": "middle-check",
          "label": "Middle check",
          "kind": "decision",
          "description": "Compare the target with the middle value.",
          "position": { "x": 230, "y": 80 }
        },
        {
          "id": "discard-half",
          "label": "Discard half",
          "kind": "operation",
          "description": "Remove the half that cannot contain the target.",
          "position": { "x": 460, "y": 80 }
        }
      ],
      "edges": [
        { "id": "sorted-middle", "source": "sorted-input", "target": "middle-check", "label": "check" },
        { "id": "middle-discard", "source": "middle-check", "target": "discard-half", "label": "halve" }
      ],
      "steps": [
        {
          "id": "start-sorted",
          "title": "Start with sorted data",
          "description": "Binary search only works when ordering lets the program reason about halves.",
          "activeNodeIds": ["sorted-input"],
          "activeEdgeIds": []
        },
        {
          "id": "check-middle",
          "title": "Check the middle value",
          "description": "One comparison decides which half can still contain the target.",
          "activeNodeIds": ["sorted-input", "middle-check"],
          "activeEdgeIds": ["sorted-middle"]
        },
        {
          "id": "halve-space",
          "title": "Discard half the search space",
          "description": "The remaining work shrinks quickly, so very large arrays need only a small number of checks.",
          "activeNodeIds": ["middle-check", "discard-half"],
          "activeEdgeIds": ["middle-discard"]
        }
      ]
    }
  ]
}
```

## Reading The Animation

The operation counter is not a benchmark. It is a shape hint. In the list scan, each missed permission adds another comparison. In the set lookup, the query stays flat after setup. In the nested scan, adding more items creates many more pair checks. In binary search, each decision removes a large fraction of the remaining work.

That is the core skill: connect the data movement to the complexity label.

## Same Problem, Different Budget

Imagine a permissions service:

- One admin page checks a single permission for one user. A list scan is probably fine.
- Every API request checks several permissions against the same role. A set is usually worth the setup cost.
- A migration compares every permission with every other permission to detect duplicates. A nested scan may be acceptable offline and unacceptable in a request path.
- A catalog service searches sorted SKU ranges. Binary search or an index can keep lookup work small.

Big O is not about choosing the fanciest data structure. It is about matching the data shape and repeat count to the product budget.

## Code Shape Checklist

When reviewing code, mark the loops and data-structure operations before naming Big O:

```typescript
for (const user of users) {
  for (const permission of permissions) {
    grantIfNeeded(user, permission);
  }
}
```

If `users` and `permissions` are independent inputs, the work is `O(u * p)`. If they are both the same input size, people often simplify the shape to `O(n^2)`.

```typescript
const bySku = new Map(products.map((product) => [product.sku, product]));

for (const line of cartLines) {
  bySku.get(line.sku);
}
```

This is `O(p + c)`: one pass to build the map, one pass over cart lines. If the same map serves many carts, the setup cost can be reused.

## Review Standard

Do not stop at "this is O(n)." Explain why:

- What is the input size?
- Which loop or data-structure operation dominates?
- Does setup work happen once or on every request?
- What space is allocated to reduce time?

Strong Big O explanations sound like program flow, not flashcards.
