# Big O Notation Skill

## Snapshot

- Status: `shipped`
- Last updated: `2026-06-03`
- Owner thread: `n/a`
- Current state: Big O ships as a local-first Programming skill path with Markdown lessons, Mermaid diagrams, React Flow complexity animations, practice JSON, passive flashcards, and reused interview nodes.
- Target outcome: Users can learn Big O from foundations through production tradeoffs without Supabase, auth, or a compiler.
- Code touchpoints:
  - `src/lib/content/schema.ts`
  - `src/lib/content/parse-markdown.ts`
  - `src/components/ComplexityFlowBlock.tsx`
  - `src/components/MarkdownRenderer.tsx`
  - `content/learning-paths/algorithmic-complexity-big-o.json`
- Primary tests:
  - `src/lib/content/parse-markdown.test.ts`
  - `src/components/ComplexityFlowBlock.test.tsx`
  - `src/components/MarkdownRenderer.test.tsx`
  - `src/lib/content/index.test.ts`
  - `e2e/specs/big-o-skill.regression.spec.ts`

## One-Minute Brief

This feature teaches algorithmic complexity as program flow instead of rote notation. Markdown remains the durable authoring surface; a validated ````complexity-flow` JSON fence embeds read-only React Flow animations inside articles.

## Outcome / Contract

- `/paths/algorithmic-complexity-big-o` renders a published skill path.
- The path includes foundation docs, diagrams, cloze practice, a questionnaire, a code-review exercise, production guidance, and existing interview nodes.
- ````complexity-flow` blocks must parse as JSON and pass the Zod complexity-flow schema during content indexing.
- Complexity-flow JSON is stored in `KnowledgeDocument.complexityFlowBlocks` and rendered by `ComplexityFlowBlock`.
- Complexity-flow JSON does not pollute `plainText`; searchable text comes from the title, scenario, variant labels, complexity labels, summaries, and step text.
- Supabase remains optional; document sync includes `complexity_flow_blocks` for future hosted search parity.

## Current State

The shipped Big O path includes three Markdown articles, two Mermaid diagrams, three exercises, one passive flashcard feed, and seven reused interview problems. The React Flow renderer is read-only and transient; it stores no user progress.

## Scope

### In Scope

- Big O learning path and content.
- Embedded complexity-flow animations in Markdown.
- Local content validation and generated-index serialization.
- Additive Supabase column for synced document rows.

### Out Of Scope

- Scored challenges, persisted progress, auth, or remote runtime search.
- A code compiler or benchmark runner.
- User-authored diagrams or editable React Flow canvases.

### Assumptions

- Big O content targets foundation learners first, then practical interviews and senior production reviews.
- React Flow animations explain execution shape; they are not precise benchmarks.
- Existing interview catalog problems are reused instead of duplicating challenge content.

## Detailed Behavior

### UI / UX

- `ComplexityFlowBlock` shows variant buttons, step controls, operation counters, growth bars, code snippets, and a read-only React Flow canvas.
- The component respects reduced-motion preferences by disabling autoplay animation.
- The article remains useful through Markdown, code snippets, and Mermaid diagrams even before the user interacts with the flow.

### Data Model And Persistence

- `KnowledgeDocument.complexityFlowBlocks` stores validated embedded flow blocks.
- A flow block has `id`, `title`, `scenario`, and two to four variants.
- Each variant has fixed-position `nodes`, `edges`, `steps`, `operationCounts`, a `complexity` label, and optional code.
- `src/generated/content-index.json` uses `schemaVersion: 8`.
- Supabase migration `202606030001_add_complexity_flow_blocks.sql` adds `kb_documents.complexity_flow_blocks`.

### Failure And Edge Handling

- Invalid complexity-flow JSON fails parsing with an explicit `Invalid complexity-flow JSON` error.
- Duplicate flow, variant, node, edge, or step IDs fail content indexing.
- Edges and active step references must point at known nodes or edges.
- `operationCounts.length` must equal `steps.length`.

## Code Touchpoints

- `src/lib/content/schema.ts`: complexity-flow schemas, generated document field, and schema version.
- `src/lib/content/parse-markdown.ts`: extracts validated complexity-flow blocks and search text.
- `src/components/ComplexityFlowBlock.tsx`: read-only React Flow playback UI.
- `src/components/MarkdownRenderer.tsx`: routes `complexity-flow` fences to the renderer.
- `scripts/content/sync-supabase.ts`: maps complexity-flow blocks to Supabase rows.

## Test Plan

- Unit: parser validation, bad JSON, duplicate IDs, bad references, operation-count mismatches, and search text.
- Component: renderer integration, variant switching, step advancement, counters, and existing code/Mermaid behavior.
- Integration: generated index loads Big O documents, path nodes, diagrams, exercises, flashcards, and next-node routes.
- E2E: mobile user opens the Big O path, interacts with animation, completes cloze practice, and continues into an existing interview problem.

## Open Questions

- Which future progress events should count as Big O mastery once auth exists?
- Should complexity-flow blocks become reusable external JSON like case-study flows, or remain embedded Markdown content?

## Decision Log

- `2026-06-03`: Use embedded ````complexity-flow` JSON for article-specific animations.
- `2026-06-03`: Reuse existing interview problems for applied practice instead of creating a new challenge engine.
- `2026-06-03`: Bump generated index to schema version 8 because case-study flows already used version 7.

## Documentation Updates

- `docs/README.md`: Adds this feature doc to the feature index.
- Nested READMEs: Updates learning path, exercise, and flashcard feed guidance for the Big O path.
- `docs/engineering-overview.md`: Adds complexity-flow blocks to the content model, Supabase sync shape, and testing model.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/big-o-notation-skill.md first. Compare the documented Big O path and complexity-flow contract against src/lib/content/schema.ts, src/lib/content/parse-markdown.ts, src/components/ComplexityFlowBlock.tsx, src/components/MarkdownRenderer.tsx, content/learning-paths/algorithmic-complexity-big-o.json, and e2e/specs/big-o-skill.regression.spec.ts, then update tests and docs with any behavior changes.`
