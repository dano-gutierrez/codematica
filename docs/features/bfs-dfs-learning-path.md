# Breadth-First Search And Depth-First Search Learning Path

## Snapshot

- Status: `shipped`
- Last updated: `2026-07-21`
- Owner thread: `n/a`
- Current state: A local-first Programming skill path teaches BFS and DFS fundamentals, interview selection, questionnaires, scrolling review, and linked guided Google practice.
- Target outcome: Learners can implement readable BFS and DFS in Python and TypeScript, explain their invariants and tradeoffs, and select the correct traversal for common interview graph shapes.
- Code touchpoints:
  - `content/learning-paths/breadth-first-and-depth-first-search.json`
  - `content/knowledge/programming/bfs-dfs-*.md`
  - `content/exercises/programming/bfs-dfs-*.json`
  - `content/flashcard-feeds/breadth-first-and-depth-first-search.json`
  - `content/interviews/google.json`
- Primary tests:
  - `packages/core/src/content/index.test.ts`
  - `apps/web/e2e/specs/bfs-dfs.regression.spec.ts`

## One-Minute Brief

This path turns graph traversal from a memorized queue-versus-stack rule into a reusable problem-solving model. Learners first identify nodes, edges, visited timing, and the traversal invariant. They then practice connected components, unweighted shortest paths, and dependency cycles with Python and TypeScript examples. Existing path, Markdown, questionnaire, passive-feed, code-block, and interview-session components render the feature; no BFS/DFS-specific UI was added.

## Outcome / Contract

- `/paths/breadth-first-and-depth-first-search` presents two ordered units: fundamentals, then interview patterns.
- Each unit pairs one searchable Markdown lesson with one questionnaire.
- `/paths/breadth-first-and-depth-first-search/flashcards` provides scroll-only concept, practical, snippet, and interview cards.
- Lessons show readable Python and TypeScript BFS and DFS implementations and explain visited timing, `O(V + E)` behavior, memory shape, recursion risk, and selection rules.
- Number Of Islands contains distinct BFS and DFS solution tracks and compares performance, readability, frontier memory, and call-stack risk.
- Shortest Path In A Binary Matrix demonstrates shortest unweighted path selection; Course Schedule compares DFS coloring with BFS Kahn processing.
- Auth, scoring, code execution, and remote content are not required.

## Current State

The path, lessons, two six-question questionnaires, sixteen-card passive feed, three guided Google prompts, generated index entries, integration coverage, and a mobile Playwright journey are shipped. The generic shared renderers already support all required UI.

## Scope

### In Scope

- adjacency-list graph traversal fundamentals
- queue-based BFS and recursive/iterative DFS
- connected-component, unweighted shortest-path, and directed-cycle interview patterns
- Python and TypeScript lesson code
- Python, TypeScript, and Java guided interview code required by the interview catalog schema
- transient questionnaires and passive vertical review

### Out Of Scope

- an executable code editor or automatic solution grading
- weighted shortest paths beyond explaining why plain BFS is insufficient
- persisted quiz answers, mastery scores, or spaced repetition

### Assumptions

- Learners understand arrays, sets, queues, stacks, and basic function calls.
- Grid inputs use explicit adjacency rules; orthogonal and eight-direction movement are not interchangeable.

## Detailed Behavior

### UI / UX

- The standard learning-path map, document reader, questionnaire session, and passive flashcard feed render the learning sequence.
- Shared `CodeBlock` rendering provides language labels and highlighting for lesson and interview code.
- The interview session selects one solution track per attempt and retains its existing restart and language-switch behavior.

### Data Model And Persistence

- Markdown remains canonical for lessons; structured JSON remains canonical for path order, questionnaires, passive cards, and interview prompts.
- The generated content index is regenerated after any BFS/DFS content change.
- Questionnaire answers and passive feed order remain transient; coarse optional progress uses the existing progress contract.

### Business Logic

- BFS is presented as shortest-path-safe only when all edges have equal cost.
- Both BFS and DFS are presented as `O(V + E)` for adjacency-list traversal with correct visited tracking.
- Number Of Islands treats BFS and DFS as asymptotically equivalent while distinguishing practical memory and recursion behavior.
- Course Schedule presents DFS coloring and Kahn's BFS as two linear-time cycle-detection views.

### Failure And Edge Handling

- Traversal examples guard bounds and repeated discovery before adding neighbors.
- Recursive DFS explicitly calls out stack overflow on deep or untrusted inputs.
- Index validation fails when lesson, exercise, feed, path, or interview references become invalid.

## Code Touchpoints

- `content/knowledge/programming/bfs-dfs-fundamentals.md`: shared traversal model and base implementations.
- `content/knowledge/programming/bfs-dfs-interview-patterns.md`: side-by-side applications and tradeoff analysis.
- `content/exercises/programming/bfs-dfs-*.json`: interactive recall and selection checks.
- `content/flashcard-feeds/breadth-first-and-depth-first-search.json`: mobile scrolling review.
- `content/interviews/google.json`: Number Of Islands, Shortest Path In A Binary Matrix, and Course Schedule guided solutions.
- `packages/core/src/generated/content-index.json`: generated local runtime artifact.

## Test Plan

- Unit/integration: generated-index lookups resolve the path, ordered nodes, lesson code, questionnaires, feed types, and expected interview solution-track IDs.
- E2E: a mobile learner opens the path, reads highlighted code, enters the passive feed, and opens the dual BFS/DFS Number Of Islands prompt.
- Content validation: run `npm run content:check` after every authored-content change.

## Open Questions

- Whether a future executable challenge should validate learner-authored traversal code against deterministic graph fixtures.
- Whether graph visualizations should become interactive once the visualization roadmap defines a durable authoring contract.

## Decision Log

- `2026-07-21`: Ship BFS/DFS as a standalone Programming skill path using existing study components.
- `2026-07-21`: Use Number Of Islands for the direct BFS-versus-DFS comparison and add shortest-path and dependency-cycle prompts for selection practice.
- `2026-07-21`: Keep code examples executable-looking but non-executable until a future coding challenge contract ships.

## Documentation Updates

- `docs/README.md`: Adds this feature doc to the reading map.
- Nested READMEs: Updates learning-path, exercise, passive-feed, and interview authoring guidance.
- `docs/engineering-overview.md`: Adds the BFS/DFS content slice and test coverage to the shared architecture description.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/bfs-dfs-learning-path.md first. Compare the documented path against content/learning-paths/breadth-first-and-depth-first-search.json, content/knowledge/programming/bfs-dfs-*.md, content/exercises/programming/bfs-dfs-*.json, content/flashcard-feeds/breadth-first-and-depth-first-search.json, content/interviews/google.json, and packages/core/src/content/index.test.ts, then update content, tests, generated index, and docs together.`
