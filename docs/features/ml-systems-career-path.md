# ML Systems Career Path

## Snapshot

- Status: `shipped`
- Last updated: `2026-08-07`
- Owner thread: `n/a`
- Current state: `/paths/ml-systems-engineer` maps the complete Harvard CS249r student curriculum and ships enriched companions through Volume I Data Engineering.
- Target outcome: Learners can move from prerequisites to career-ready ML systems practice while every adapted lesson and lab keeps its authoritative Harvard source visible.
- Code touchpoints:
  - `content/learning-paths/ml-systems-engineer.json`
  - `content/sources/harvard-ml-systems.json`
  - `content/knowledge/ml-systems/`
  - `content/exercises/ml-systems/`
  - `packages/core/src/content/schema.ts`
  - `apps/web/src/components/LearningPathMap.tsx`
  - `packages/ui/src/screens.tsx`
- Primary tests:
  - `packages/core/src/content/schema-v8.test.ts`
  - `packages/core/src/content/build-index.test.ts`
  - `packages/core/src/practice/questionnaire.test.ts`
  - `packages/core/src/progress/progression.test.ts`

## One-Minute Brief

This is a source-linked companion to Harvard's CS249r repository, [Volume I](https://mlsysbook.ai/vol1/), and [Volume II](https://mlsysbook.ai/vol2/). Harvard remains authoritative. Codematica supplies prerequisites, concise study guides, guided evidence capture, checkpoints, progress metadata, and a career-stage map. The roadmap covers the books, 34 interactive labs, 20 TinyTorch modules, MLSys·im, optional hardware kits, and StaffML. The first locally enriched slice ends after Volume I Data Engineering; later stages open the exact upstream collections while their Codematica companions remain explicitly planned.

## Outcome / Contract

- Every ML companion document and exercise declares `sourceRefs`, and web/native pages render those primary sources before the companion content.
- Source nodes open a published local companion when one exists; otherwise they open the authoritative upstream URL.
- Volume I is recorded as published v0.7.1; Volume II and ecosystem components retain their upstream preview maturity.
- Published career stages require local nodes, a questionnaire checkpoint, a pass threshold, and per-skill outcomes. Planned stages never award a stamp.
- Guided labs require a committed prediction and completed evidence checklist. Raw reflections remain transient; progress stores only coarse counts/booleans.
- Checkpoints calculate overall and per-skill scores. Individual answers and full attempt history are not persisted.
- Hardware work is optional. Learners without a kit may use the MLSys·im branch and must state simulation limitations.
- All nodes remain open. `required` affects milestone calculation, not access.

## Current State

Published companions cover Python/NumPy, quantitative foundations, engineering measurement, the Volume I introduction, ML Systems, ML Workflow, and Data Engineering. Three guided labs and three scored checkpoints support the published stages Scientific Computing Apprentice, ML Foundations Analyst, and ML Systems Explorer. Framework Builder through ML Systems Portfolio are planned companion stages with live primary-source links.

The full roadmap includes every Volume I and Volume II chapter. Student ecosystem collections are represented by their authoritative indexes, which enumerate all 34 labs, all 20 TinyTorch modules, MLSys·im tutorials, hardware-kit activities, and StaffML practice. Instructor-only, translation, CI, and repository-maintenance surfaces are intentionally excluded from the learner path.

## Scope

### In Scope

- source catalog and source-reference validation
- generic career progression shared with the Japanese progression infrastructure
- full Harvard student roadmap
- authored prerequisites and Volume I Foundations companions
- guided lab, questionnaire skill scoring, web/native parity

### Out Of Scope

- copying the Harvard books or notebooks into Codematica
- claiming Harvard affiliation, course credit, or official assessment status
- executing upstream notebooks inside Codematica
- durable raw answers, reflections, notebook output, or hardware telemetry
- locally enriched companions for the planned stages in this release

### Assumptions

- Upstream sources can change, so each catalog entry records a verification date and optional version/commit.
- `dev` commit `5964e31a24f5823fdfcce4e60cf896c26a7aca9f` is the audited repository snapshot for this release.
- A source catalog refresh must verify URLs, versions, maturity, license statements, and curriculum inventory before regeneration.

## Detailed Behavior

### UI / UX

- Career stages show level, publication status, outcomes, estimated time, and a checkpoint only when authored.
- Planned nodes remain useful because their card opens the primary source.
- Source-backed companion nodes are labeled `Source + document` or `Source + exercise`.
- Guided labs follow briefing → prediction → steps → evidence → reflection → extension.
- Web and Expo render the same roadmap, source references, guided-lab state, and checkpoint scores.

### Data Model And Persistence

- `content/sources/*.json` is canonical source metadata; schema v9 serializes `sources` into the local index.
- `kind: "source"` path nodes declare `sourceRef`, `activity`, and `companionKind` with a stable companion slug.
- Generic progression uses `framework`, `roadmapLabel`, stable skill IDs/categories, stage `level`/`status`, and outcomes linked by `skillId`.
- `guided-lab` exercises define objectives, prediction options, ordered steps, evidence checklist, reflection prompts, extension, and time.
- Questionnaire questions may declare `skillIds`; completion payloads contain aggregate `score` and `skillScores` only.

### Failure And Edge Handling

- Index generation fails for unknown source refs, duplicate source IDs, missing required source metadata, unknown skill IDs, or a published source stage without its local published companion.
- If an upstream source exists but no companion exists, the node opens externally and the stage must remain planned.
- If external opening is unavailable on native, the node stays visible and no false completion is recorded.

## Test Plan

- Unit: schema v9 source nodes/catalogs, generic progression, planned-stage stamp denial, questionnaire skill scores.
- Integration: repository content rebuild, source/reference checks, stable companion/external route selection.
- E2E: add a mobile-Chromium regression for ML path → source-backed companion → guided lab → checkpoint when the browser lane is expanded.
- Regression classification: `@regression`; published ML path discovery is part of the general path smoke contract.
- Coverage impact: core, web components, and shared native UI; no threshold changes or exclusions.
- Required local commands: `npm run content:check`, `npm test`, `npm run test:mobile`, `npm run typecheck`, `npm run lint`, `npm run build`, and relevant Playwright smoke/regression lanes.

## Open Questions

- Which planned stage should receive the next local companion tranche: TinyTorch Build or Volume I Optimize?
- Should future hardware evidence distinguish simulated, emulated, and measured-on-device badges?

## Decision Log

- `2026-08-07`: Use a source-linked companion model instead of copying or translating the upstream text.
- `2026-08-07`: Publish prerequisites through Volume I Data Engineering and expose the rest as live-source planned stages.
- `2026-08-07`: Treat hardware as optional with MLSys·im as a valid alternative, while preserving the distinction in learner evidence.
- `2026-08-07`: Generalize the Japanese progression schema rather than build a second progression system.

## Documentation Updates

- `docs/README.md`: adds this feature and the source catalog authoring surface.
- Nested READMEs: updates learning paths/exercises and adds `content/sources/README.md`.
- `docs/engineering-overview.md`: adds sources, source nodes, guided labs, generic career progression, and ML Systems to the architecture.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/ml-systems-career-path.md first. Verify the pinned Harvard source inventory, then extend only planned stages with source-linked companions, tests, web/native parity, and updated source metadata.`

