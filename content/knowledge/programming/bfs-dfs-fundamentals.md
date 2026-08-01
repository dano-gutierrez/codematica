---
title: Breadth-First Search And Depth-First Search Fundamentals
slug: programming/bfs-dfs-fundamentals
summary: Learn the shared graph traversal model, queue-based BFS, recursive and iterative DFS, complexity, correctness, and practical selection rules with readable Python and TypeScript.
track: Programming
topic: Algorithms
difficulty: foundation
tags:
  - algorithms
  - graphs
  - trees
  - bfs
  - dfs
prerequisites:
  - Arrays and sets
  - Queues and stacks
diagramRefs: []
status: published
---

## The Shared Traversal Idea

A graph is a set of **vertices** (or nodes) connected by **edges**. Trees, dependency maps, social networks, maps, and two-dimensional grids can all be treated as graphs. Breadth-first search (BFS) and depth-first search (DFS) differ in the order in which they explore that graph, but both follow the same safe skeleton:

1. Choose a starting node.
2. Remember which nodes have already been discovered.
3. Repeatedly take one discovered node, inspect it, and discover its unvisited neighbors.
4. Stop when the target is found or no reachable node remains.

The visited set is part of the algorithm, not an optional optimization. A general graph may contain cycles. Without visited tracking, an edge such as `A -> B -> A` can make traversal repeat forever.

## Breadth-First Search

BFS explores in layers: first distance zero from the start, then distance one, then distance two, and so on. A **queue** provides exactly this first-in, first-out order. The first node discovered is also the first one expanded.

This layer guarantee makes BFS the standard choice for the shortest number of edges in an **unweighted** graph. It does not automatically solve weighted shortest paths; different edge costs require an algorithm such as Dijkstra's.

```python
from collections import deque

def bfs(graph: dict[str, list[str]], start: str) -> list[str]:
    order: list[str] = []
    queue = deque([start])
    visited = {start}

    while queue:
        node = queue.popleft()
        order.append(node)

        for neighbor in graph.get(node, []):
            if neighbor in visited:
                continue
            visited.add(neighbor)  # mark when enqueued
            queue.append(neighbor)

    return order
```

Mark a node visited when it enters the queue. Marking it only when removed allows several parents to enqueue the same node, wasting memory and work.

```typescript
export function bfs(
  graph: Map<string, string[]>,
  start: string,
): string[] {
  const order: string[] = [];
  const queue: string[] = [start];
  const visited = new Set<string>([start]);

  for (let head = 0; head < queue.length; head += 1) {
    const node = queue[head];
    order.push(node);

    for (const neighbor of graph.get(node) ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push(neighbor);
    }
  }

  return order;
}
```

The TypeScript example uses a moving `head` instead of `shift()`. Removing the first array item repeatedly can require reindexing the remaining items; advancing an index keeps queue operations simple and efficient.

## Depth-First Search

DFS follows one route as far as it can, then backtracks to the most recent branch with unexplored neighbors. Recursion expresses that idea directly because the call stack remembers the route.

```python
def dfs(graph: dict[str, list[str]], start: str) -> list[str]:
    order: list[str] = []
    visited: set[str] = set()

    def visit(node: str) -> None:
        if node in visited:
            return
        visited.add(node)
        order.append(node)

        for neighbor in graph.get(node, []):
            visit(neighbor)

    visit(start)
    return order
```

```typescript
export function dfs(
  graph: Map<string, string[]>,
  start: string,
): string[] {
  const order: string[] = [];
  const visited = new Set<string>();

  function visit(node: string): void {
    if (visited.has(node)) return;
    visited.add(node);
    order.push(node);

    for (const neighbor of graph.get(node) ?? []) {
      visit(neighbor);
    }
  }

  visit(start);
  return order;
}
```

Recursive DFS is compact and readable when the maximum depth is safely bounded. A very deep chain can exceed the language runtime's call-stack limit. Use an explicit stack when input depth is large or untrusted:

```python
def dfs_iterative(graph: dict[str, list[str]], start: str) -> list[str]:
    order = []
    stack = [start]
    visited = set()

    while stack:
        node = stack.pop()
        if node in visited:
            continue
        visited.add(node)
        order.append(node)

        # Reverse so the first neighbor is processed first.
        stack.extend(reversed(graph.get(node, [])))

    return order
```

## Complexity

With an adjacency list, BFS and DFS both take `O(V + E)` time: every reachable vertex is processed once and every outgoing edge is inspected once. Both need `O(V)` visited storage in the worst case.

Their temporary memory shapes differ:

- BFS holds a frontier. On a wide tree, that queue can contain many nodes at once.
- DFS holds a path plus pending branches. On a deep tree, the stack can grow to the tree height.

Big-O describes the worst case, but the graph's shape decides which memory profile matters in practice.

## Choose By The Question

Choose BFS when the question asks for the nearest target, minimum number of unweighted steps, level order, or all nodes at a given distance. Choose DFS when the question asks whether a route exists, needs backtracking, naturally processes a whole component, or depends on entry/exit ordering such as cycle detection and topological reasoning.

If either traversal is correct, prefer the version whose invariant is easiest to explain. “The queue contains the next distance layer” and “the recursive call completely processes one subtree” are both strong interview explanations.

## Common Mistakes

- Forgetting visited state in a cyclic graph.
- Marking BFS nodes too late and enqueuing duplicates.
- Using DFS for an unweighted shortest path without exploring every possible route.
- Using recursive DFS on an input whose depth can overflow the call stack.
- Assuming traversal order is unique when neighbor order is not specified.
- Mutating the input grid without stating that the caller permits it.

## Reference Anchors

- [Python deque](https://docs.python.org/3/library/collections.html#collections.deque)
- [JavaScript Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
