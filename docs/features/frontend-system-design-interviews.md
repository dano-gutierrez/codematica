# Frontend System Design Interviews

## Snapshot

- Status: `in_progress` (implemented in this branch; not deployed)
- Last updated: `2026-10-08`
- Owner thread: frontend system design interview preparation
- Current state: a local-content path with the full architecture guide, a rehearsal guide, six attributed briefs, six guided labs, and six embedded Mermaid diagrams (the board sequence appears in both its example and exercise).
- Target outcome: learners can discover, rehearse, and self-review all six topics without remote content or credentials.
- Code touchpoints: `content/knowledge/frontend/system-design-*.md`, `content/exercises/frontend/system-design-*-lab.json`, `content/learning-paths/frontend-system-design-interviews.json`, `content/sources/frontend-system-design-{guide,interviews}.json`.
- Primary tests: `packages/core/src/content/frontend-system-design.test.ts`, `apps/web/e2e/specs/frontend-system-design.regression.spec.ts`.

## One-Minute Brief

This path starts with the full frontend system design guide: requirements, components/state, APIs, caching, rendering, quality, and three illustrated examples. It then turns six public candidate accounts into concise whiteboard exercises: Amazon’s learning game, Atlassian’s Kanban board, Wayfair’s storefront, Adobe’s file-system prompt, Salesforce’s messaging client, and Uber’s calendar. The source attributions are reports, not independently verified interviews or current company question banks. Practice additions are labeled explicitly.

The existing path, Markdown, source-reference, and guided-lab components render everything. Each rehearsal uses 45 minutes for design, 10 for follow-ups, and 5 for self-review. No coding, automatic architecture grading, or built-in timer is added.

## Outcome / Contract

- `/paths/frontend-system-design-interviews` starts with the architecture guide, then the shared rehearsal schedule/rubric, then alternates each brief and its guided lab. The calendar lab is terminal: 14 nodes total.
- `/docs/frontend/system-design-interview-guide` preserves the original guide’s technical content, 60-minute interview schedule, and search/feed/board diagrams. Its 14 technical references are distinct from the six candidate reports. The guide and labs explicitly use different illustrative schedules.
- The path appears in the Paths catalog and Learn search; briefs appear in Browse and labs in Practice.
- All six briefs and labs retain candidate-report caveats and source links. Known report/interview dates stay distinct from the October 8, 2026 source-check date. Amazon/Uber publication dates remain unverified.
- Adobe’s detailed browser scope and Uber’s frontend scope are adaptations. Constraints, follow-ups, starting diagrams, and the rubric are authored practice additions.
- Predictions and evidence checks gate lab completion. Completion records participation, not correctness or hiring readiness.
- Existing coding interview collections and the seven-topic Frontend Interview Practice path remain unchanged.

## Current State

Authored content and generated index are implemented. The initial eight content regressions failed before authoring; a ninth reproduced an incomplete standalone briefing. The guide follow-up adds a tenth case and first-node assertion, both of which failed while the full guide was absent. Validation results and remaining gaps are recorded below; a PR does not establish deployment or installed-device acceptance.

## Scope

### In Scope

- A second technical-edit pass over the six supplied exercises, retaining their facts, caveats, links, dates, numeric constraints, diagrams, and self-review questions.
- The original full interview guide, with a separate technical-edit pass, all three example diagrams preserved verbatim, and current primary technical references rechecked.
- A shared rehearsal guide and six existing-format guided labs with scenario-specific evidence checks.
- Search, path navigation, source attribution, rendering, and completion verification.

### Out Of Scope

- New UI components, content schemas, dependencies, APIs, migrations, timers, drawing tools, or automatic architecture grading.
- Company endorsement, interview-frequency claims, and guaranteed hiring outcomes.

### Assumptions

Learners use their own timer and drawing surface. Candidate accounts are evidence of what was reported, not proof of a company’s current process. External reports can change or become unavailable; the local exercises remain usable.

## Detailed Behavior

### UI / UX

Each brief presents provenance, a prompt, modeling/drawing tasks, follow-ups, and self-review. Learning game, Kanban, and file manager include starting diagrams. The technical-edit pass preserved the Mermaid fences. A separate rendering correction replaces the game transition’s semicolon with a comma because Mermaid parsed it as stray states; all transitions and label meaning remain intact. Labs link to their owning briefs through the existing practice route.

### Data Model And Persistence

Markdown and JSON remain canonical; `npm run content:index` generates the local artifact. The existing source catalog stores six first-person reports with explicit attribution. Guided labs persist only coarse completion; reflection text is transient. There are no schema or database changes.

### Business Logic

Use `sourcePolicy: "required"` and source every internal node. Candidate reports are primary evidence of the authors’ own accounts, not authoritative technical specifications. All seven evidence items and a prediction are required by the existing guided-lab implementation. The six-dimension 0–2 rubric is self-assessed and does not change app scoring.

### Failure And Edge Handling

Source caveats must survive direct entry into a lab. Each scenario retains its unique failure cases, including duplicate progress, conflicting moves, cart merging, 100,000-file folders, lost acknowledgments, and recurrence/time-zone changes. Reload preserves route/path context but not transient reflection text. Existing completion retry behavior is reused.

## Code Touchpoints

- `content/knowledge/frontend/system-design-interview-rehearsal.md`: schedule, source limits, six exercise links, and shared rubric.
- `content/knowledge/frontend/system-design-interview-guide.md`: full interview strategy, architecture decisions, and three worked examples.
- `content/knowledge/frontend/system-design-*.md`: source-attributed exercise briefs and diagrams.
- `content/exercises/frontend/system-design-*-lab.json`: six timed scripts, predictions, evidence checks, and reflection prompts.
- `content/learning-paths/frontend-system-design-interviews.json`: ordered discovery and navigation.
- `content/sources/frontend-system-design-interviews.json`: report identities, URLs, authors, known dates, and evidence limits.
- `content/sources/frontend-system-design-guide.json`: twelve technical references; reuse existing MDN AbortController/WebSocket records for fourteen guide references total.
- `packages/core/src/generated/content-index.json`: generated web/native local content.
- Existing consumers: `LearningPathMap.tsx`, `MarkdownRenderer.tsx`, `SourceReferences.tsx`, `PracticeCard.tsx`, and shared native `screens.tsx`.

## Test Plan

- Core integration: all 14 ordered nodes, every continuation/terminal route, full-guide sections/examples/sources, each report URL/date/caveat, the six 60-minute labs, shared rubric, and search discovery. This is the lowest layer proving content wiring; no new runtime logic is introduced.
- E2E: seven `@regression` cases in `frontend-system-design.regression.spec.ts` cover full-guide discovery and continuation, its 14 technical references, every brief/source disclosure, all six embedded Mermaid diagrams, the complete game failure label, keyboard diagram scrolling, path context after reload, narrow-viewport overflow, completion gates, continuation, and terminal restart.
- Coverage: preserve all existing floors and exclusions. Run aggregate/per-file Vitest coverage and native Jest coverage because both clients consume the generated index.
- Commands: `npx vitest run packages/core/src/content/frontend-system-design.test.ts`, `npm run content:check`, `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run test:mobile:coverage`, `npm run build`, `npx playwright test --config=apps/web/e2e/playwright.config.ts --project=mobile-chromium frontend-system-design.regression.spec.ts`, `npm run e2e:smoke`.
- No database, production dependency, entrypoint, module-wiring, or packaging change; database replay and a new artifact smoke implementation are not applicable.

### Validation

- Content generation/check, lint, workspace type checks, and the production build passed.
- Aggregate and per-file Vitest coverage each passed after the full-guide addition: 134 files, 973 tests. Native Jest coverage passed: 31 suites, 315 tests. Coverage floors and exclusions are unchanged.
- Browser verification passed after the full-guide addition: seven mobile Chromium journeys and all 15 smoke cases across mobile Chromium, desktop Chromium, and mobile WebKit. All six embedded diagrams rendered and supported keyboard horizontal scrolling without page overflow. The guide’s 14 technical references and continuation into the rehearsal were verified.
- Four temporary content mutations were rejected during the exercise pass: a swapped report URL, reordered path, missing scenario evidence, and removed standalone scope caveat. Canonical files were restored and the index regenerated. All ten integration cases now pass, including the added guide regression.
- Comparison against the entire original guide confirmed all three Mermaid fences verbatim, inline technical literals, external links, and numeric values. Primary technical references were rechecked October 8, 2026; TanStack’s optimistic-update guidance was verified against its maintainer repository when the docs fetch failed.
- Visual review found Mermaid splitting a semicolon label into stray states. A failing browser assertion reproduced it; the comma correction and expanded browser checks passed. The editorial comparison retained report dates, evidence limits, requirements, and diagram semantics.
- No production deployment or installed Android/iOS acceptance was performed. Logs, coverage, and browser artifacts remain in the local worktree; hosted CI results belong to the PR.

## Open Questions

- Candidate reports remain independently unverified; no current employer question-bank claim is made.
- Installed Android/iOS rendering is not established by shared-index or Jest checks. Native release acceptance remains separate.

## Decision Log

- 2026-10-08: Use the existing guided-lab path rather than the coding interview schema, which requires executable solution tracks. Keep the six topics separate from the existing frontend coding path.
- 2026-10-08: Preserve source uncertainty and all supplied rehearsal requirements during technical-edit. Keep company attribution visible and label authored extensions.
- 2026-10-08: Add the full original interview guide ahead of the rehearsal guide, preserving the separate purpose and timing of each. Recheck the 14 original technical references and retain all diagrams/technical literals during editing.

## Documentation Updates

- `docs/README.md`, `docs/codex-context.md`, and `docs/engineering-overview.md`: add the path to the reading map; runtime architecture and existing diagrams are unchanged.
- `content/README.md`, `content/exercises/README.md`, `content/learning-paths/README.md`, and `content/sources/README.md`: document ownership and evidence boundaries.
- `docs/CHANGELOG.md`: record the content addition and validation scope.

## Thread Handoff Prompt

Read `docs/codex-context.md` and this file. Preserve all six report attributions and the Adobe/Uber adaptation caveats. Edit canonical content, regenerate the index, and verify path/search/diagram/lab behavior. Keep self-review distinct from automatic grading, and report deployment/device gaps explicitly.
