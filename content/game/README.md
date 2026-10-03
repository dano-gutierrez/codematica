# Game campaign content

`restore-the-signal.json` is the canonical twelve-level campaign, with three scenarios per level. Run `npm run content:index` after editing. The schema-v11 generated index is an output, not an authoring surface.

Each scenario must include an objective, three progressive hints, a concrete explanation, a stable seed, authored fixtures/constraints, and a known solution for regression verification. Main scenario IDs are `main`; replay IDs are `mastery-1` and `mastery-2`. Level order is consecutive. Lesson/path, district, landmark, graph, and data references must resolve.

A mastery variation must change reasoning: predicate semantics, layout constraints, event destinations, workload, distribution, reuse, freshness, budget, or failures. Merely changing colors/names is insufficient. Author a plausible failing answer along with each new class of constraint and verify valid alternative solutions.

See [the feature contract](../../docs/features/restore-the-signal.md). Teaching capacities are assumptions. Do not prescribe load balancing or caching solely from zombie population.
