# Real System Case Studies

## Snapshot

- Status: `shipped`
- Last updated: `2026-06-03`
- Owner thread: `n/a`
- Current state: Netflix, Uber, and Spotify system-design case studies are published as Markdown articles with external Mermaid diagrams, local React Flow walkthrough JSON, and a home-screen "Real cases" shortcut.
- Target outcome: Users can study real production data feedback loops through sourced articles, diagrams, and interactive architecture walkthroughs without Supabase.
- Code touchpoints:
  - `content/knowledge/system-design/*.md`
  - `content/case-studies/**/*.json`
  - `src/lib/content/schema.ts`
  - `src/lib/content/build-index.ts`
  - `src/components/CaseStudyFlow.tsx`
  - `src/app/docs/[...slug]/page.tsx`
- Primary tests:
  - `src/lib/content/build-index.test.ts`
  - `src/lib/content/index.test.ts`
  - `src/components/CaseStudyFlow.test.tsx`
  - `e2e/specs/real-system-case-studies.regression.spec.ts`

## One-Minute Brief

This feature adds real-world system-design study material. Markdown remains the explanation source of truth; Mermaid diagrams provide static architecture views; `content/case-studies/**/*.json` provides deterministic interactive React Flow walkthroughs for selected documents.

## Outcome / Contract

- Case-study articles are normal knowledge documents and remain searchable in `/browse`.
- `/` exposes an explicit `Real cases` entry point that links to `/paths/system-design-fundamentals#real-production-data-platforms`.
- Articles can opt into one interactive walkthrough through `caseStudyFlowRef`.
- Flow JSON is local-first content and is included in `src/generated/content-index.json` as `caseStudyFlows`.
- Flow nodes use fixed positions so mobile and desktop layouts are deterministic.
- Flow edges and steps must reference existing nodes and edges.
- React Flow is read-only: users can pan/zoom but cannot edit, connect, drag, or persist state.
- Supabase sync does not include case-study flows in this milestone.

## Current State

The shipped case studies cover Netflix, Uber, and Spotify data/ML feedback-loop architecture. The first release focuses on data movement, real-time analytics, durable warehouse/lakehouse paths, and product feedback loops rather than full video playback, ride dispatch, or audio streaming architecture.

## Scope

### In Scope

- sourced Markdown case studies
- external Mermaid diagrams
- shared streaming-feedback blueprint
- React Flow architecture walkthroughs
- System Design Fundamentals path unit
- local schema/index validation

### Out Of Scope

- hosted case-study flow sync
- user-authored diagrams or flows
- persisted walkthrough progress
- full product architecture for each company
- unsupported claims without primary sources

### Assumptions

- Public official engineering sources define the factual boundary.
- If a prompt claim lacks primary support, article language is softened or omitted.
- The article remains useful without JavaScript because Markdown and Mermaid carry the explanation.

## Detailed Behavior

### UI / UX

- `/docs/[...slug]` renders `CaseStudyFlow` below the Markdown body when the document has `caseStudyFlowRef`.
- The home screen includes a `Real cases` shortcut to the `real-production-data-platforms` unit in System Design Fundamentals.
- The walkthrough shows current step text, previous/next/reset controls, and a play/pause control.
- Playback is disabled when `prefers-reduced-motion` is enabled.
- Active nodes are visually emphasized and active edges animate unless reduced motion is requested.

### Data Model And Persistence

- `content/case-studies/**/*.json` stores `slug`, `title`, `summary`, fixed-position `nodes`, `edges`, and `steps`.
- `KnowledgeDocument.caseStudyFlowRef` points to one flow slug.
- Generated flow fields include `id`, `route`, `sourcePath`, and `contentHash`.
- No user state is persisted.

### Failure And Edge Handling

- Index generation fails on duplicate case-study flow slugs.
- Index generation fails when a document references a missing case-study flow.
- Index generation fails when flow edges or steps reference unknown nodes or edges.
- Missing JavaScript does not remove the article body or Mermaid source.

## Code Touchpoints

- `src/lib/content/schema.ts`: flow schemas, `caseStudyFlowRef`, and schema version 7.
- `src/lib/content/build-index.ts`: flow collection, route binding, and reference validation.
- `src/components/CaseStudyFlow.tsx`: read-only React Flow renderer and stepper.
- `src/components/LearningPathMap.tsx`: home shortcut and path-unit anchors.
- `src/app/docs/[...slug]/page.tsx`: document-level flow rendering.
- `content/learning-paths/system-design-fundamentals.json`: case-study unit.

## Test Plan

- Unit: flow schema, missing refs, duplicate slugs, unknown edge/node references.
- Integration: generated index loads the three articles, three flows, diagrams, and path unit.
- Component: step controls update active nodes and animated edges.
- E2E: mobile user opens `Real cases` from home, opens Netflix, sees references, Mermaid, and advances the walkthrough.

## Open Questions

- Should future case studies get practice prompts or flashcards in the same unit?
- Should hosted search eventually index flow node and step text?

## Decision Log

- `2026-06-03`: Ship rich case studies as Markdown plus local flow JSON instead of MDX or executable Markdown.
- `2026-06-03`: Use `@xyflow/react` for deterministic read-only architecture walkthroughs.
- `2026-06-03`: Keep flow JSON out of Supabase sync until a hosted case-study feature needs it.
- `2026-06-03`: Add an explicit home-screen `Real cases` shortcut that anchors into the System Design Fundamentals case-study unit.

## Documentation Updates

- `docs/README.md`: Adds the feature doc and case-study content surface.
- Nested READMEs: Adds `content/case-studies/README.md` and updates `content/learning-paths/README.md`.
- `docs/engineering-overview.md`: Updates stack, content flow, content model, and testing model.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/real-system-case-studies.md first. Compare the documented case-study contract against content/knowledge/system-design, content/case-studies, src/lib/content/schema.ts, src/lib/content/build-index.ts, src/components/CaseStudyFlow.tsx, and src/app/docs/[...slug]/page.tsx, then update tests and docs with any behavior changes.`
