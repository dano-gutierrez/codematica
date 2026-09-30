# Product Engineering Interview Preparation

## Snapshot

- Status: `shipped` (implementation; deployment is separate)
- Last updated: `2026-09-10`
- Owner thread: `n/a`
- Current state: Four source-linked lessons, three six-question checkpoints, a 75-minute guided mock, and twelve passive review cards reuse existing web/native study surfaces.
- Target outcome: Prepare for coding/architecture discussions with plain JavaScript reasoning, evidence-aware research, and production ownership examples.
- Code touchpoints: `content/knowledge/software-engineering/product-interview-*.md`, `content/exercises/software-engineering/product-interview-*.json`, `content/learning-paths/product-engineering-interview.json`, `content/sources/product-engineering-interview.json`, `content/flashcard-feeds/product-engineering-interview.json`.
- Primary tests: `packages/core/src/content/product-interview.test.ts`, `apps/web/e2e/specs/product-engineering-interview.regression.spec.ts`.

## One-Minute Brief

This company-neutral pack combines a research brief, a coding drill that keeps previews aligned with the latest input, and a durable paid-export architecture exercise. A guided mock supplies timing, evidence checks, story rehearsal, and reflection. It is original preparation, not a reported company question bank.

## Outcome / Contract

- `/paths/product-engineering-interview` contains four open units: research, JavaScript, architecture, and mock interview.
- The research unit is one document. Coding/architecture each pair a document with a six-question checkpoint. The final unit orders document → guided lab → final six-question checkpoint.
- `/practice/software-engineering/product-interview-mock-interview-lab` is a 75-minute self-directed rehearsal. The learner supplies a timer, scratch file, and diagram surface.
- Eighteen choice questions use existing deterministic grading. Twelve passive cards link back to published lessons.
- The entire pack uses neutral titles, routes, tags, filenames, source IDs, and links. It contains no target employer identity, recruiting links, named interviewers, or identifiable product announcements.
- Primary-source references cover general technical concepts. Job signals, anecdotes, and provider-integration questions are hypothetical or methodological, not claims about a specific company.
- Existing generic study routes remain the entry points; there is no company interview collection or employer-specific redirect.

## Current State

Content is bundled into the local generated index and discoverable through paths, browse, global search, and practice. Existing Markdown, Mermaid, source panels, questionnaires, guided-lab evidence/reflection controls, and passive feeds present the content. No new UI, runtime import, dependency, schema, backend, or database change is introduced.

## Scope

### In Scope

- Research method, source metadata, a tested plain JavaScript reference, architecture invariants, hypothetical failure injections, rubric, and ownership-story patterns.
- Seven reference/curriculum tests and two mobile browser regression journeys.

### Out Of Scope

- In-app scratch-code execution/grading, native execution, automatic timers, actual GPU generation, contacting recruiters, or authenticated candidate forums.
- Claims that personal employment metrics, an actual interview process, or production recovery were independently verified.

### Assumptions

- Learners know JavaScript promises and basic HTTP/database transactions. Practice can use local Node 22 and inert manually resolved promises.
- The exact invitation and current role description remain authoritative for a learner's real interview.

## Detailed Behavior

### UI / UX

Reuses `LearningPathMap`, `MarkdownRenderer`, `CodeBlock`, `MermaidBlock`, `SourceReferences`, `QuestionnaireSession`, guided-lab rendering inside `PracticeCard`, `PassiveFlashcardFeed`, and existing native screens. The lab gates coarse completion on a prediction and all evidence checks. Code/design quality and the six-dimension rubric remain self-assessed; 18/24 is an authored practice heuristic.

### Data Model And Persistence

Canonical Markdown/JSON only; `sourcePolicy: "required"`. Existing optional progress semantics apply. Prediction/evidence state and reflection text follow the generic guided-lab contract; raw reflections are transient. All links and generated-index references use neutral slugs. This pack was renamed before its first repository commit, so it requires no persisted-data migration or compatibility alias.

### Business Logic

The authored reference keeps one active operation and one pending latest input, guards success/error by revision, releases the slot after failure, and prevents callbacks after disposal. Inputs are immutable strings and observers must not throw. Normal supersession waits for the active operation; only disposal requests abort. Eventual adapter settlement is required for liveness. A timeout alone does not establish remote cancellation or a remote concurrency bound.

The proposed export architecture uses tenant-scoped idempotency, atomic acceptance/reservation/outbox, fenced workers, provider reconciliation, and a guarded success/ledger commit. These are original hypothetical design choices. It distinguishes convergence, authorization, billing, and notification delivery.

### Failure And Edge Handling

The research brief teaches how to verify employer identity and evaluate candidate accounts without retaining identifying examples. Provider documentation questions identify what to check; they do not establish defects. The pack retains only general MDN, Google Cloud, Google SRE, and OpenTelemetry references. Source verification dates remain the dates of actual checks; anonymization does not count as re-verification.

## Code Touchpoints

- `content/knowledge/software-engineering/product-interview-research-brief.md`: research method, role signals, and follow-up questions.
- `content/knowledge/software-engineering/product-interview-javascript-preview-coordinator.md`: prompt, contract, original reference, and inert scratch harness.
- `content/knowledge/software-engineering/product-interview-durable-generation-architecture.md`: architecture/state diagrams, failure boundaries, telemetry, and API contract questions.
- `content/knowledge/software-engineering/product-interview-mock-interview.md`: interview script, rubric, story prompts, and variants.
- `packages/core/src/content/product-interview.test.ts`: neutral title/source checks, curriculum resolution/grading, and execution of the reviewed reference snippet in a VM with inert adapters. No user-authored or remotely fetched code is executed.

## Test Plan

- Regression-first: the renamed content tests failed before changing content because the neutral path and reference were absent. A dedicated test requires a neutral path title and approved general technical-source hosts across lesson links and every node's source references.
- Unit: controlled promises prove coalescing, stale result/error suppression, current error recovery, ignored abort after disposal, repeated disposal, and synchronous adapter failure.
- Integration: source-backed published documents, path traversal, questionnaire answers/distractors, source-document review links, and generic interview search results.
- E2E: `@regression` mobile Chromium journeys cover discovery, neutral attribution, both Mermaid diagrams, code/layout containment, wrong-answer feedback, checkpoint completion, guided-lab evidence gating, next routes/reload, and passive review.
- Copy regression: the research brief states that the pack contains no reported company questions. Keep that attribution caveat visible and asserted when editing the prose.
- Native: existing generic content rendering is reused; no native library or UI implementation changes. Mobile aggregate coverage validates the shared index. Installed-device pack-specific execution is not newly claimed.
- Coverage impact: no new instrumented production code; no floors lowered or exclusions added. The reference is tested as authored content, not shipped application code.
- Required local commands: targeted Vitest, `npm run content:check`, `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run test:mobile:coverage`, and `npx playwright test --config=apps/web/e2e/playwright.config.ts apps/web/e2e/specs/product-engineering-interview.regression.spec.ts`. Run the smoke lane; Playwright builds and serves the production Next artifact.
- Local validation on `2026-09-10`: content check, lint, typecheck, both Vitest coverage passes (305 tests), mobile coverage (45 tests), and production-build Playwright checks (two pack regressions plus nine smoke cases) passed. The generated index and canonical content were also checked for residual identifying text. Hosted deployment and pack-specific installed-device execution are separate checks.

## Open Questions

- Each learner should confirm interview duration, participants, tool/library policy, and the actual role scope.

## Decision Log

- `2026-09-09`: Reuse existing content/path/lab components for the preparation pack.
- `2026-09-10`: Publish the pack without employer names or identifying source links. Generalize the research brief and provider questions while retaining the technical exercises and supporting references.

## Documentation Updates

- `docs/README.md`, `docs/codex-context.md`, and `docs/engineering-overview.md`: neutral preparation surface in the reading map; runtime architecture and its diagrams remain unchanged.
- Owning content READMEs document the pack and self-assessment boundary. `docs/CHANGELOG.md` records the addition.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/product-engineering-interview-preparation.md first. Compare the documented path and anonymity contract against the content, tests, and general technical references. Preserve original prompt provenance, rerun the inert JavaScript and mobile browser checks, and update docs with any contract change.`

## 2026-09-27 Audit

Reviewed all four lessons, 18 questions, mock lab and 12 briefs for ownership boundaries, concurrency, units, retry guarantees, assumptions, and misleading answers. No factual answer-key correction was needed. Existing exact coordinator tests and the Product Engineering browser regression remain the verification baseline. See the interview catalog audit for the full scope.
