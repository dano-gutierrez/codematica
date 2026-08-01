# Mermaid Diagram Authoring Learning Path

## Snapshot

- Status: `shipped`
- Last updated: `2026-07-21`
- Owner thread: `n/a`
- Current state: A three-unit skill path teaches Mermaid syntax, software diagram families, planning/data diagrams, debugging, and readability through rendered source examples, choice-only questionnaires, and scrolling review.
- Target outcome: Learners can read Mermaid source, select the right diagram grammar, write maintainable diagrams from easy to advanced, and explain why alternative syntax or diagram families are incorrect.
- Code touchpoints:
  - `content/learning-paths/mermaid-diagram-authoring.json`
  - `content/knowledge/programming/mermaid-*.md`
  - `content/exercises/programming/mermaid-*.json`
  - `content/flashcard-feeds/mermaid-diagram-authoring.json`
  - `apps/web/src/components/MermaidBlock.tsx`
- Primary tests:
  - `packages/core/src/content/index.test.ts`
  - `apps/web/e2e/specs/mermaid-authoring.regression.spec.ts`

## One-Minute Brief

The module teaches diagrams as maintainable text rather than static pictures. Learners compare source with rendered output, progressing from flowchart declarations and node relationships to sequence, class, state, ER, Gantt, journey, pie, mindmap, timeline, and Git graph diagrams. The module reuses the existing Markdown, Mermaid, questionnaire, code-block, path, and passive-feed components; no feature-specific UI was introduced.

## Outcome / Contract

- `/paths/mermaid-diagram-authoring` presents three ordered units: syntax fundamentals, software structure/behavior, and planning/data/advanced authoring.
- Lessons contain 13 embedded Mermaid blocks across 11 diagram families, ordered from easy to more complex.
- Every rendered example exposes its Mermaid source through the shared `MermaidBlock` source disclosure.
- The three questionnaires contain 24 `choice` questions only.
- Every choice question has exactly one correct option.
- Every explanation identifies the correct rule and explicitly explains why each distractor is wrong using an `Incorrect options:` section.
- `/paths/mermaid-diagram-authoring/flashcards` provides an 18-card passive review feed with concept, practical, snippet, and interview card types.
- Experimental or version-sensitive syntax is labeled as such and must be verified against the app's installed Mermaid version.
- Auth, a visual drag-and-drop editor, AI diagram generation, and executable authoring are not required.

## Current State

The path, three lessons, 13 browser-rendered diagrams, three eight-question questionnaires, passive feed, generated index entries, integration assertions, mobile E2E rendering coverage, and documentation are shipped. The lessons are aligned with Mermaid's official syntax documentation and are rendered by the repository's installed Mermaid 11 dependency.

## Scope

### In Scope

- flowchart declarations, directions, IDs, labels, shapes, edges, subgraphs, comments, and debugging
- sequence, class, state, and entity-relationship diagrams
- Gantt, user journey, pie, mindmap, timeline, and Git graph diagrams
- recognition of additional Mermaid diagram families and version sensitivity
- diagram selection, progressive authoring, readability, and maintenance guidance
- single-correct-choice recall with detailed distractor explanations

### Out Of Scope

- an in-app visual or text Mermaid editor
- arbitrary user-authored diagram persistence
- AI diagram generation or correction
- exhaustive syntax coverage for every experimental Mermaid grammar
- treating illustrative schedule, journey, or chart values as measured product data

### Assumptions

- Learners understand basic Markdown fenced code blocks.
- Mermaid source is canonical and rendered output is a view, not a separately edited artifact.
- Diagram support depends on the installed Mermaid version and host configuration.

## Detailed Behavior

### UI / UX

- Embedded `mermaid` fences render through the shared `MermaidBlock` component.
- Each rendered block retains loading, SVG, error, and source-fallback states.
- Wide SVGs remain horizontally scrollable on mobile.
- Questionnaires use the shared one-question-at-a-time session with immediate feedback.
- Passive review uses the existing full-viewport scrolling feed and does not introduce reveal or scoring controls.

### Data Model And Persistence

- Lessons remain canonical Markdown under `content/knowledge/programming/`.
- Path order, questionnaires, and passive cards remain canonical JSON.
- Parsed Mermaid blocks are stored in the generated local content index with each document.
- Questionnaire answers and feed ordering remain transient; optional progress stores only the existing coarse milestones.

### Business Logic

- Diagram selection begins with the question being answered, not the desired visual appearance.
- Source examples move from the smallest valid declaration to boundaries, alternatives, composite state, cardinality, scheduling, and specialized grammars.
- Choice validation enforces one correct option at index-build time; integration coverage additionally asserts the authored questionnaires remain choice-only.
- Explanation text is part of the teaching contract and must cover every wrong answer, not only restate the correct one.

### Failure And Edge Handling

- Invalid Mermaid source renders the shared error state while preserving the source.
- E2E coverage loads all 13 examples with the deployed browser renderer and asserts no Mermaid error state appears.
- New or experimental diagram types must be checked against the exact installed Mermaid package and application configuration.
- Parser-sensitive words, indentation, and balanced block endings are explained in the lessons.

## Code Touchpoints

- `content/knowledge/programming/mermaid-syntax-fundamentals.md`: flowchart and source-reading foundation.
- `content/knowledge/programming/mermaid-software-diagrams.md`: sequence, class, state, and ER examples.
- `content/knowledge/programming/mermaid-planning-and-data-diagrams.md`: Gantt, journey, pie, mindmap, timeline, Git graph, selection, and debugging.
- `content/exercises/programming/mermaid-*.json`: choice-only checks and distractor explanations.
- `content/flashcard-feeds/mermaid-diagram-authoring.json`: mobile scrolling review.
- `apps/web/src/components/MermaidBlock.tsx`: browser rendering and source/error disclosure.
- `packages/core/src/generated/content-index.json`: generated shared runtime artifact.

## Test Plan

- Unit/integration: generated-index lookup resolves the path, ordered nodes, lesson block counts, diagram declarations, choice-only questionnaires, exactly one correct option, detailed explanation marker, and passive feed types.
- E2E: mobile browser renders all 13 diagrams without errors, exposes source, answers a deterministic single-correct choice, shows detailed feedback, and opens the scrolling feed.
- Content validation: `npm run content:check` validates references and questionnaire structure.

## Open Questions

- Whether a future safe editor should provide local preview without persisting arbitrary source.
- Whether diagram source linting should become a build-time browser-backed validation lane for all authored Mermaid blocks.
- Which additional version-sensitive families deserve dedicated lessons after the installed Mermaid version advances.

## Decision Log

- `2026-07-21`: Create a standalone Mermaid authoring path instead of adding syntax instruction to an unrelated system-design path.
- `2026-07-21`: Reuse embedded Mermaid rendering so every example pairs output with inspectable source.
- `2026-07-21`: Require choice-only questionnaires with one correct option and explicit explanations for all distractors.
- `2026-07-21`: Render-test every lesson diagram in Playwright because Mermaid parsing depends on browser DOM and host configuration.

## Documentation Updates

- `docs/README.md`: Adds the Mermaid authoring feature contract to the reading map.
- Nested READMEs: Updates learning-path, exercise, and passive-feed authoring conventions.
- `docs/engineering-overview.md`: Adds the Mermaid learning slice without changing application architecture.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/mermaid-diagram-authoring.md first. Compare the contract against content/learning-paths/mermaid-diagram-authoring.json, content/knowledge/programming/mermaid-*.md, content/exercises/programming/mermaid-*.json, content/flashcard-feeds/mermaid-diagram-authoring.json, packages/core/src/content/index.test.ts, and apps/web/e2e/specs/mermaid-authoring.regression.spec.ts, then update authored content, generated index, tests, and docs together.`
