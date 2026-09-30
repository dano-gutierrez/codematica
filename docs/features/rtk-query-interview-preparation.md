# RTK Query Interview Preparation

## Snapshot

- Status: `shipped` (implemented locally; deployment is separate)
- Last updated: `2026-09-09`
- Owner thread: `n/a`
- Current state: Seven sourced lessons, seven six-question checkpoints, and 21 passive briefs use the existing study components.
- Target outcome: React/TypeScript engineers can explain RTK Query mechanics, review flawed code, diagnose lifecycle incidents, and defend modern API choices in an interview.
- Code touchpoints: `content/knowledge/frontend/rtk-query-*.md`, `content/learning-paths/rtk-query-interview-preparation.json`, `content/exercises/frontend/rtk-query-*-questionnaire.json`, `content/sources/rtk-query.json`, `content/flashcard-feeds/rtk-query-interview-preparation.json`.
- Primary tests: `packages/core/src/content/rtk-query.test.ts`, `apps/web/e2e/specs/rtk-query.regression.spec.ts`.

## One-Minute Brief

The Front-End Development path teaches RTK Query through request ownership, caching, mutations, a persisted-pending production case, newer APIs, architecture, and a mock interview. Readers get good/bad examples and scenario feedback without a new UI or runtime dependency. Source-linked lessons remain locally available for anonymous web/native browsing.

## Outcome / Contract

- `/paths/rtk-query-interview-preparation` exposes seven ordered document/checkpoint pairs; all nodes remain open.
- Forty-two choice questions have exactly one correct answer and explain the correct rule and both distractors.
- The feed at `/paths/rtk-query-interview-preparation/flashcards` offers 21 review cards linking back to the lessons.
- The required source policy covers every lesson/checkpoint and path; official documentation and pinned release/source refs support version claims.
- The baseline is RTK 2.12.0 verified on 2026-09-09; the PR case describes RTK 2.2.8 separately.
- PR #12666 is inspiration and attributed evidence of a reported failure/proposed fix, never evidence of deployment or confirmed recovery. Learners need no private-repository access to follow the lesson.
- Dedicated `extractRehydrationInfo` filtering and generic raw Redux restoration are distinct. Pending mutations are never described as safely replayable commands.

## Current State

Content is authored in canonical Markdown/JSON and bundled through the generated index. Shared renderer, code blocks, embedded Mermaid, source panels, path next-node links, quizzes, and passive feed supply the presentation. Code blocks are reference examples; scratch exercises and the mock interview are not executed or automatically scored by Codematica. Only checkpoint answers receive existing deterministic grading.

## Scope

### In Scope

- Foundations, scoped cache identity, retention/freshness, list tags, delayed invalidation, optimistic races, errors, refresh coordination, persistence migration, offline policy, infinite queries, schemas, architecture, and interview rehearsal.
- Existing web and shared native content routes; no new component implementation.

### Out Of Scope

- Changes to Flash, posting PR feedback, production recovery, deploying this path, adding Redux to Codematica, and an executable RTK playground.
- A universal persistence adapter or a backend idempotency implementation.

### Assumptions

- Learners know React hooks, TypeScript, promises, and HTTP. Standalone snippets run in a separate scratch project with the stated packages.
- Native execution, old production storage formats, and external server behavior require application-specific validation.

## Detailed Behavior

### UI / UX

The existing path catalog, Markdown reader, `CodeBlock`, `MermaidBlock`, `SourceReferences`, `QuestionnaireSession`, and `PassiveFlashcardFeed` own presentation. Mobile horizontal code scrolling must remain contained within the reader. Quiz choices shuffle using existing behavior; explanations and aggregate completion follow the existing practice contract. Global lesson search discovers the new content without manual home curation.

### Data Model And Persistence

No schema or app persistence changes. The path declares `sourcePolicy: "required"`; documents/exercises use catalog `sourceRefs`. Answers remain transient and optional progress remains coarse. The lesson's fictional APIs, persistence adapter, and server scenarios are explanatory examples only.

### Business Logic

Seven units pair one document with its checkpoint. Next-node routes preserve the path query. The final workshop checkpoint has no next lesson. The feed stays outside the ordered units and contains three sourced briefs per lesson.

### Failure And Edge Handling

The private inspiration URL may require authentication, but the full generalized case is local. Official links may evolve; update verification dates only after an actual audit. Source tests guard references, grading, searchability, and traversal, not RTK's internal implementation. Preserve the distinction between sample adapter validation and end-to-end persistence recovery.

## Code Touchpoints

- `content/knowledge/frontend/rtk-query-persistence-and-recovery.md`: self-contained PR case, bounded adapter, restart regression matrix.
- `content/knowledge/frontend/rtk-query-modern-apis.md`: dated versions, infinite query and schema examples.
- `content/knowledge/frontend/rtk-query-interview-workshop.md`: timed interview, specific answers, flawed code, scenario variants, and self-assessment.
- `content/learning-paths/rtk-query-interview-preparation.json`: ordered learning journey.
- `content/exercises/frontend/rtk-query-*-questionnaire.json`: 42 scenario choices with explanations.
- `content/sources/rtk-query.json`: official reference metadata with pinned releases/source versions.
- `content/flashcard-feeds/rtk-query-interview-preparation.json`: 21 passive review prompts.
- `packages/core/src/generated/content-index.json`: generated output; regenerate, never edit manually.

## Test Plan

- First failing regression: the four new curriculum integration tests failed against the prior generated index because the path, checkpoints, searchable case, and feed were absent; they passed after authored content and index generation.
- Unit/integration: source resolution, complete ordered pairs, traversal including final-node behavior, scenario answer/distractor grading via shared logic, searchability, version/source anchors, and review links.
- E2E: discover the path, open the case and source panel, render Mermaid, follow the path-scoped checkpoint, submit an incorrect answer and read feedback, complete the checkpoint, continue into modern examples, verify contained mobile width, search, and open review.
- Regression classification: `@regression` in `rtk-query.regression.spec.ts`, mobile Chromium. Existing critical smoke suite covers shared surfaces across configured browsers.
- Coverage impact: no production logic or thresholds/exclusions changed. Run existing aggregate coverage against the expanded content index.
- Required local commands: `npx vitest run packages/core/src/content/rtk-query.test.ts`, `npm run content:check`, `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run build`, `npx playwright test --config=apps/web/e2e/playwright.config.ts --project=mobile-chromium apps/web/e2e/specs/rtk-query.regression.spec.ts`, and `npm run e2e:smoke`.
- Additional example QA: compile standalone snippets against isolated RTK 2.12.0/TypeScript/Zod dependencies outside the repository; exercise synthetic pending-state initiation against 2.2.8 and 2.12.0 with inert I/O. These are editorial checks, not native/production Flash validation.

### Validation Results — 2026-09-09

- Content freshness, lint, all workspace TypeScript checks, and `git diff --check` passed.
- Both Vitest coverage passes: 55 files / 298 tests; all configured aggregate and per-file floors passed. Mobile coverage: 8 suites / 45 tests passed.
- Playwright production build and nine existing smoke journeys passed across mobile Chromium, desktop Chromium, and mobile WebKit. Both new mobile Chromium RTK journeys passed after fixing a semicolon in a Mermaid note that the deployed renderer treated as a statement separator.
- Initial browser failure evidence is retained in ignored `test-results/rtk-first-run/`; the rerun has its own Playwright artifacts. The regression continues to assert successful rendering rather than weakening the check.
- Thirteen extracted example files compiled under isolated RTK 2.12.0, React Redux 9.2.0, TypeScript 5.9.3, and Zod 4.2.1. The schema converter preserves its `CUSTOM_ERROR` literal type.
- Inert store checks on isolated 2.2.8 and 2.12.0 reproduced blocked initiation from raw pending state, successful initiation after targeted filtering, and filtering via the dedicated rehydration path. Adapter checks covered pending queries/mutations, settled entries, malformed shapes, input preservation, and unrelated drafts.
- All 31 catalog URLs responded successfully. No Flash production I/O, deployment, or installed-device incident recovery was performed.

## Open Questions

- A future executable playground may host the scratch exercises; this delivery does not add an execution contract.

## Decision Log

- `2026-09-09`: Use seven short units instead of one oversized article so mechanics, version changes, and practice remain navigable.
- `2026-09-09`: Reuse current components and source metadata; add no RTK runtime dependency to Codematica.
- `2026-09-09`: Keep customer identifiers out of the generalized incident; retain the inspiration PR URL and reviewed commit.

## Documentation Updates

- `docs/README.md`, `docs/codex-context.md`, and `docs/features/README.md`: link the owning contract.
- `content/learning-paths/README.md`, `content/exercises/README.md`, `content/flashcard-feeds/README.md`, `content/sources/README.md`: RTK authoring/refresh expectations.
- `docs/engineering-overview.md`: catalog the new frontend content slice. Existing content-flow Mermaid and architecture stay accurate because execution boundaries did not change.
- `docs/CHANGELOG.md`: dated curriculum summary.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/rtk-query-interview-preparation.md first. Compare canonical RTK content with its pinned official references, preserve the distinction between raw restoration and extractRehydrationInfo, update scenario explanations and version metadata together, regenerate the index, and run the documented checks. Do not infer deployment or incident recovery from content validation.`

## 2026-09-27 Audit

Reviewed all seven guides, 42 questions and 21 briefs. Confirmed dated release milestones against official Redux Toolkit notes and cache/schema/infinite-query documentation. No answer-key correction was needed. The 2.12.0 example baseline remains explicitly dated; the private persistence incident is an attributed report rather than newly observed recovery. Existing core content tests and the RTK browser journey remain required.
