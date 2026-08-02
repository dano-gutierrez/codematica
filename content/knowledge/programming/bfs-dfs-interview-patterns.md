---
title: BFS And DFS Interview Patterns
slug: programming/bfs-dfs-interview-patterns
summary: Apply BFS and DFS to grid components, unweighted shortest paths, dependency cycles, and interview tradeoffs with side-by-side Python and TypeScript solutions.
track: Programming
topic: Algorithms
difficulty: practitioner
tags:
  - algorithms
  - interviews
  - graphs
  - bfs
  - dfs
prerequisites:
  - Breadth-First Search And Depth-First Search Fundamentals
diagramRefs: []
status: published
---

## Recognize The Hidden Graph

Interview prompts rarely say “run graph traversal.” Instead, they describe relationships:

- A grid cell connects to its up, down, left, and right neighbors.
- A word connects to every valid one-letter transformation.
- A course connects to the courses that depend on it.
- A tree node connects to its children and sometimes its parent.

Before coding, name the node, name the edge, and decide when a node becomes visited. That short translation prevents most traversal bugs.

## Pattern One: Count Connected Components

In **Number Of Islands**, each land cell is a node and an edge joins orthogonally adjacent land. Scan every cell. When an unvisited land cell appears, a new component has been found; traverse from it to mark the entire island.

### BFS Version

```python
from collections import deque

def count_islands_bfs(grid: list[list[str]]) -> int:
    if not grid or not grid[0]:
        return 0

    rows, cols = len(grid), len(grid[0])
    visited: set[tuple[int, int]] = set()
    islands = 0

    for row in range(rows):
        for col in range(cols):
            if grid[row][col] != "1" or (row, col) in visited:
                continue

            islands += 1
            visited.add((row, col))
            queue = deque([(row, col)])

            while queue:
                current_row, current_col = queue.popleft()
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    next_row = current_row + dr
                    next_col = current_col + dc
                    if not (0 <= next_row < rows and 0 <= next_col < cols):
                        continue
                    if grid[next_row][next_col] != "1":
                        continue
                    if (next_row, next_col) in visited:
                        continue
                    visited.add((next_row, next_col))
                    queue.append((next_row, next_col))

    return islands
```

```typescript
export function countIslandsBfs(grid: string[][]): number {
  if (grid.length === 0 || grid[0].length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  const visited = new Set<string>();
  const key = (row: number, col: number) => `${row},${col}`;
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let islands = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (grid[row][col] !== "1" || visited.has(key(row, col))) continue;
      islands += 1;
      const queue: Array<[number, number]> = [[row, col]];
      visited.add(key(row, col));

      for (let head = 0; head < queue.length; head += 1) {
        const [currentRow, currentCol] = queue[head];
        for (const [dr, dc] of directions) {
          const nextRow = currentRow + dr;
          const nextCol = currentCol + dc;
          const inBounds = nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols;
          if (!inBounds || grid[nextRow][nextCol] !== "1" || visited.has(key(nextRow, nextCol))) continue;
          visited.add(key(nextRow, nextCol));
          queue.push([nextRow, nextCol]);
        }
      }
    }
  }

  return islands;
}
```

### DFS Version

```python
def count_islands_dfs(grid: list[list[str]]) -> int:
    if not grid or not grid[0]:
        return 0

    rows, cols = len(grid), len(grid[0])
    visited = set()

    def visit(row: int, col: int) -> None:
        if not (0 <= row < rows and 0 <= col < cols):
            return
        if grid[row][col] != "1" or (row, col) in visited:
            return
        visited.add((row, col))
        visit(row + 1, col)
        visit(row - 1, col)
        visit(row, col + 1)
        visit(row, col - 1)

    islands = 0
    for row in range(rows):
        for col in range(cols):
            if grid[row][col] == "1" and (row, col) not in visited:
                islands += 1
                visit(row, col)
    return islands
```

```typescript
export function countIslandsDfs(grid: string[][]): number {
  if (grid.length === 0 || grid[0].length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  const visited = new Set<string>();
  const key = (row: number, col: number) => `${row},${col}`;

  function visit(row: number, col: number): void {
    const inBounds = row >= 0 && row < rows && col >= 0 && col < cols;
    if (!inBounds || grid[row][col] !== "1" || visited.has(key(row, col))) return;
    visited.add(key(row, col));
    visit(row + 1, col);
    visit(row - 1, col);
    visit(row, col + 1);
    visit(row, col - 1);
  }

  let islands = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (grid[row][col] === "1" && !visited.has(key(row, col))) {
        islands += 1;
        visit(row, col);
      }
    }
  }
  return islands;
}
```

## BFS Versus DFS For The Same Problem

Both island solutions run in `O(rows * cols)` time and use `O(rows * cols)` worst-case auxiliary space. Neither has an asymptotic advantage here because the problem asks for components, not a shortest path.

The practical differences are more interesting:

| Concern | BFS | DFS |
| --- | --- | --- |
| Core invariant | Queue holds the discovered frontier | One call fully explores one connected branch |
| Readability | More explicit state and loop structure | Recursive version closely matches the definition of a component |
| Memory shape | Can hold a wide frontier | Can hold a deep recursion chain |
| Runtime risk | No call-stack overflow | Large solid grids can exceed recursion limits |
| Best interview use | When you want an iterative, depth-safe implementation | When constraints make recursion safe and brevity helps explanation |

For this prompt, choose the version you can implement and explain reliably. If input dimensions are large, iterative BFS or iterative DFS is safer than recursive DFS.

## Pattern Two: Shortest Unweighted Path

For a shortest path in a binary matrix, BFS has a correctness shortcut: the first time the destination leaves the queue, no shorter path can still be waiting. DFS does not have this guarantee. A DFS solution must enumerate possible simple paths or add more complex pruning, so it is usually less readable and can take exponential time.

The interview signal is the word **shortest** combined with equal-cost moves. That points to BFS.

## Pattern Three: Dependency Cycles

Course scheduling turns prerequisites into a directed graph. Two classic answers expose different viewpoints:

- DFS colors nodes as unseen, visiting, or complete. Reaching a visiting node finds a back edge and therefore a cycle.
- Kahn's algorithm uses BFS over nodes with zero incoming edges. If fewer than all courses can be removed, a cycle prevented the remaining nodes from becoming ready.

Both run in `O(V + E)` time. DFS is often compact for “does a cycle exist?” Kahn's algorithm is often easier when the next requirement is to return a valid course order.

## Interview Questions To Practice

The guided interview catalog includes:

1. **Number Of Islands** — compare BFS and DFS flood fill directly.
2. **Shortest Path In A Binary Matrix** — explain why BFS provides the optimal unweighted path.
3. **Course Schedule** — compare DFS cycle coloring with BFS topological processing.
4. **Word Ladder** — model words as nodes and one-letter changes as equal-cost edges.

For every solution, state the graph model, traversal invariant, visited timing, and complexity before writing code. Those four points make the implementation easier to review and debug.

## Reference Anchors

- [Python deque](https://docs.python.org/3/library/collections.html#collections.deque)
- [JavaScript Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
