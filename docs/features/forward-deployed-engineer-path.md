# Forward Deployed Engineer Career Path

## Snapshot

- Status: `shipped`
- Last updated: `2026-10-09`
- Owner thread: `n/a`
- Current state: `/paths/forward-deployed-engineer` provides an authored FDE transition curriculum through existing local-first readers and practice surfaces; production deployment is separate.
- Target outcome: Engineers can practice customer discovery, delivery, adoption and interview skills with concrete evidence and honest assessment limits.
- Code touchpoints: `content/learning-paths/forward-deployed-engineer.json`, `content/knowledge/fde/`, `content/exercises/fde/`, `content/sources/forward-deployed-engineer.json`, `content/flashcard-feeds/forward-deployed-engineer.json`.
- Primary tests: `packages/core/src/content/fde-path.test.ts`, `apps/web/e2e/specs/fde-path.regression.spec.ts`.

## One-Minute Brief

Engineers moving into FDE roles need a bridge from their existing specialty to customer-facing technical delivery. This role path covers discovery, scope, data, integrations, security, AI, evaluation, production, incidents, adoption, communication, case studies, portfolio work, interviews and the first ninety days. It uses the existing Markdown, questionnaire, guided-lab, progression and passive-review contracts on web and native. No UI, schema, service, dependency or persistence changes are introduced.

## Outcome / Contract

- Sixteen published units each contain an original lesson and a four-question scenario checkpoint: 64 questions total.
- Four units place a guided lab between lesson and checkpoint: discovery, integrations, portfolio capstone and interview practice.
- All internal nodes have verified primary-source references. Eleven catalog entries record a 2026-10-07 verification date and the relevant source scope; no redistribution license is inferred.
- Existing progression records sixteen curriculum stages with path-qualified skills and 75% checkpoint/per-skill thresholds. These are learning milestones, not certification, verified delivery competence or hiring predictions.
- The final career-launch checkpoint continues to the 32-card review feed. The feed is outside the ordered nodes.
- All nodes remain open, including the capstone and mock. Required-node flags affect existing progress calculations only.
- Labs use self-reported evidence checklists. The app does not execute learner code, audit security, grade portfolio quality or verify customer research.
- Public case outcomes remain attributed vendor reports. Original failure scenarios, workload assumptions, numerical examples and interview prompts remain explicitly fictional or authored practice.

## Current State

The path provides separate transition guidance for backend, frontend/mobile, data, ML, SRE/platform, QA, embedded and solutions backgrounds. An example twelve-week schedule complements unit-level practice; it is not a completion-time or hiring guarantee. A 16–23 hour synthetic Northstar capstone connects the full delivery workflow, and a 90-minute mock uses six dimensions with a clearly labeled practice rubric.

Three reported success studies cover Morgan Stanley, Intercom and Airbus/easyJet. They distinguish adoption from accuracy, averages from maxima, and historical ambitions from completed outcomes. Two fictional failures cover low adoption and duplicate remote effects. They do not assert that specific FDEs performed the reported deployments.

The original SQL join and Python receipt examples run outside the app in the content regression test. SQL verification uses disposable in-memory SQLite; the reading anchors join semantics to PostgreSQL 17 without claiming a live PostgreSQL integration test. The Python reducer is a sequential in-memory model, explicitly not a durable or concurrent connector.

## Scope

### In Scope

- Original role-transition curriculum, checkpoints, guided labs and review cards.
- Source provenance, scenario calculations, worked examples and reusable portfolio deliverables.
- Existing web/native content delivery and generic career progression.

### Out Of Scope

- New runtime components, migrations, paid model calls, external writes or customer-data access.
- Employer-specific private interview reports, official hiring thresholds or certification.
- Independent audits of vendor outcomes, real production deployment or portfolio auto-grading.

### Assumptions

- Learners know basic programming, Git and HTTP; deeper prerequisite study is linked through existing paths.
- Role expectations change and should be checked with each hiring team. The catalog's role descriptions are dated examples.
- Learners perform labs in isolated environments with synthetic data and fake adapters.

## Detailed Behavior

### UI / UX

The role path appears in the existing path catalog. Lessons use existing source panels, tables, code rendering and one Mermaid architecture diagram. Guided labs require the standard prediction/evidence steps. Checkpoints score choices through the shared questionnaire engine, and the terminal route opens the passive feed. No new reusable component is needed.

### Data Model And Persistence

Canonical files remain Markdown and JSON. Regenerate `packages/core/src/generated/content-index.json` with `npm run content:index`; never edit it manually. Existing anonymous/signed-in coarse progress applies. Raw customer records, application artifacts and interview recordings are not stored by this content addition.

### Business Logic

Preserve the sixteen ordered unit slugs and document → optional lab → checkpoint sequence. Keep skill IDs prefixed with `fde-`. Every published stage requires all its local nodes, its checkpoint and the existing 75% curriculum threshold. A checked lab completion is self-attestation, not evidence that the code was independently validated.

### Failure And Edge Handling

Source references and published destinations are validated by the index builder. External source unavailability does not remove local lessons or make anonymous reading depend on an external service. Unknown source freshness, denied access and uncertain remote effects are taught explicitly rather than replaced with invented success.

## Code Touchpoints

- `content/knowledge/fde/`: sixteen original lessons, worked fixtures, practice and review criteria.
- `content/exercises/fde/`: sixteen checkpoints and four guided labs.
- `content/learning-paths/forward-deployed-engineer.json`: order, required nodes, skills and progression.
- `content/sources/forward-deployed-engineer.json`: eleven inspected primary references.
- `content/flashcard-feeds/forward-deployed-engineer.json`: 32 recall cards tied to lessons.
- `packages/core/src/content/fde-path.test.ts`: generated-content and fixture verification.
- `apps/web/e2e/specs/fde-path.regression.spec.ts`: mobile web discovery, grading, lab and completion navigation.

## Test Plan

- First failing test: `fde-path.test.ts` failed on the absent path, lessons and checkpoints before authoring content.
- Unit/integration: build validation, published/source-backed nodes, ordered units, terminal route, all 64 answer keys and every distractor, local reading destinations, card coverage and source dates.
- Worked fixtures: exact SQL row identities, the unsafe join's five rows and inner join's missing row; Python receipt assertions plus mutations that remove tenant scoping or conflict detection. Tests execute only these two known original fences and require local Python 3 with standard-library SQLite.
- E2E: `@regression` mobile Chromium covers path discovery → first lesson → scored checkpoint → next lesson; discovery lab evidence gating and continuation; reported cases with the shared source disclosure expanded, and final checkpoint → review feed.
- Existing rendering/runtime behavior is reused. No native source changes or new installed-app workflow; native aggregate coverage checks the shared index consumers, while device release validation remains the repository's separate release gate.
- Coverage thresholds and exclusions remain unchanged.
- Required local commands: `npx vitest run packages/core/src/content/fde-path.test.ts`, `npm run content:check`, `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run test:mobile:coverage`, `npm run build`, targeted FDE Playwright regression and `npm run e2e:smoke`.
- Tests and a successful build do not establish a deployment or customer recovery. This content-only change adds no runtime imports, entrypoint wiring or packaging changes requiring a new production-artifact smoke implementation.

### Local validation on 2026-10-07

Content/index checks, lint, typecheck and the production build passed. Both aggregate and per-file Vitest coverage runs passed all 853 tests in 127 files; native coverage passed 162 tests in twenty suites. The combined Playwright selection `--grep '@smoke|@regression.*FDE'` passed all eighteen tests: three new mobile Chromium journeys and fifteen existing smoke checks across mobile Chromium, desktop Chromium and mobile WebKit. Final copy edits were followed by index regeneration, content validation and the four targeted curriculum/fixture tests. No production deployment or installed-device FDE-specific run is claimed.

### PR validation on 2026-10-09

Rebased the FDE addition onto main at `47e2d1f`, retaining the existing curricula and shared design updates. The browser source-link check now opens the shared source disclosure. Content validation, lint, typecheck and the production build passed. Aggregate and per-file coverage each passed 977 Vitest tests in 135 files; native coverage passed 315 tests in 31 suites. The same combined Playwright selection passed eighteen tests. No source verification dates were changed and no runtime or dependency changes were added.

## Open Questions

- Future additions may provide role-specific capstones or richer learner artifact review; neither is required for the current authored path.

## Decision Log

- `2026-10-07`: Interpret FDE as Forward Deployed Engineer and cover both general customer software delivery and the applied-AI specialization.
- `2026-10-07`: Reuse existing content/practice components; distinguish self-assessment and vendor-reported outcomes from independently measured evidence.

## Documentation Updates

- `docs/README.md` and `docs/CHANGELOG.md`: discoverability and delivery entry.
- `content/README.md`, path/exercise/source/feed READMEs: ownership and authoring boundaries.
- `docs/codex-context.md` and `docs/engineering-overview.md`: add the curriculum to the content map; system boundaries and architecture diagrams remain accurate.

## Thread Handoff Prompt

Read `docs/codex-context.md` and this feature doc, inspect the canonical FDE files, preserve reported-versus-original evidence labels and ordered navigation, regenerate the index, and rerun the curriculum and browser checks when editing the path.
