# Automated Testing And Release Regression

## Snapshot

- Status: `shipped`
- Last updated: `2026-10-03`
- Owner thread: `n/a`
- Current state: Codematica has enforced Vitest and Jest coverage, transactional pgTAP checks, multi-project Playwright suites, Maestro native flows, fast PR gates, nightly regression, and `v*` release-candidate workflows.
- Target outcome: Every shipped feature has a reliable test at the lowest useful layer, critical journeys are exercised on browser and installed native targets, and a release cannot be promoted without reproducible evidence.
- Code touchpoints:
  - `vitest.config.ts`
  - `vitest.per-file.config.ts`
  - `apps/web/e2e/`
  - `apps/mobile/.maestro/`
  - `supabase/tests/`
  - `.github/workflows/`
- Primary tests:
  - `packages/core/src/**/*.test.ts`
  - `apps/web/src/**/*.{test,spec}.{ts,tsx}`
  - `apps/mobile/src/__tests__/*.test.{ts,tsx}`
  - `supabase/tests/*.test.sql`

## One-Minute Brief

Vitest tests shared rules, server helpers, content tooling, API handlers, and web components. Jest exercises mobile adapters and shared React Native screens. pgTAP replays and checks the disposable local Supabase database. Playwright verifies browser journeys and responsive accessibility. Maestro runs the built Android and iOS applications.

Pull requests get five parallel, fast checks. Nightly runs expand browser and database regression coverage. A `v*` tag triggers complete GitHub release regression plus parallel EAS Android/iOS builds and Maestro runs. These workflows create evidence but never submit builds or publish a release.

## Outcome / Contract

- Fixes begin with a failing regression test at the lowest reliable layer; new behavior follows red-green-refactor.
- Shared logic is tested in `packages/core`, not duplicated across platform suites.
- Important user-visible changes have both a lower-layer rule test and an E2E journey.
- `npm run e2e:web:smoke` runs only tests tagged `@smoke`; deeper cases are tagged `@regression`.
- Browser automation uses role queries or stable `data-testid` values, and native automation uses stable `testID` values. Fixed sleeps and CSS selectors are forbidden.
- Anonymous/local-first behavior never depends on hosted Supabase in unit, integration, or browser tests.
- Database tests use only the disposable local Supabase stack and may not read hosted projects, production data, or credentials.
- E2E build profiles are credential-free Android APK and iOS simulator builds.
- Coverage thresholds may increase but may not decrease. A new exclusion or lower threshold requires an explicit feature-doc and changelog justification.
- PR checks are named `quality`, `unit-integration-coverage`, `mobile-jest`, `database`, and `web-smoke` so branch protection can require stable names.
- A release candidate is promotable only after GitHub release regression and both EAS native release jobs pass.

## Current State

The repository instruments production core logic, content scripts, web services/API/Auth helpers, web components, mobile libraries, and shared native screens. Generated artifacts, type-only barrels/design tokens, and thin route or CLI composition are excluded with comments in the owning configuration or source.

Coverage output includes terminal summaries, HTML, LCOV, JSON, and CI JUnit where the runner supports it. A second Vitest pass enforces per-file floors separately from aggregate thresholds.

The EAS workflow definitions match the current Expo Maestro job schema, including `build_id`, `flow_path`, `include_tags`, `maestro_version`, JUnit output, retries, and screen recording. EAS currently labels built-in Maestro jobs alpha, so the workflow definitions must be revalidated when Expo changes that contract.

Configure branch protection in the account: after the five PR jobs have completed successfully at least once on GitHub, require those exact checks on `main` without changing review or administrator policies.

## Scope

### In Scope

- Shipped and currently implemented core, content, web, mobile, Auth/progress, Supabase, interview, Japanese, practice, renderer, and routing behavior.
- Coverage enforcement and regression evidence.
- PR, nightly, tag, and manually dispatched validation workflows.

### Out Of Scope

- Proposed subscriptions and other roadmap-only product behavior.
- Hosted Supabase integration or production-data tests.
- Automatic store submission, release publication, or branch-protection mutation.

### Assumptions

- CI runs Node 22 and installs dependencies from `package-lock.json`.
- Database validation has Docker and the Supabase CLI available.
- EAS workflows require a linked Expo project and authenticated EAS/GitHub integration when executed remotely.

## Detailed Behavior

### Coverage Gates

| Scope | Lines / statements / functions | Branches |
|---|---:|---:|
| Core | 90% | 85% |
| Web services, API, and content scripts | 85% | 80% |
| Web components | 75% | 70% |
| Mobile libraries | 80% | 70% |
| Shared native UI | 70% | 60% |
| Every instrumented file | 60% | 50% |

`npm run test:coverage` first enforces scope totals and then runs `vitest.per-file.config.ts`. `npm run test:mobile:coverage` enforces the mobile-library and shared-screen totals.

Native Jest explicitly maps the public `@codematica/ui/game` export to its declared screen entry. The map route-focus test loads the real route and verifies focus/blur propagation and navigation; screen tests separately verify measured animation visibility, reflow and scroll-update behavior.

### Browser Matrix

- `mobile-chromium`: complete smoke and regression suite.
- `desktop-chromium`: smoke journeys, `@playground`, `@notebook-catalog` and `@design` regressions.
- `mobile-webkit`: smoke journeys, `@playground`, `@notebook-catalog` and other design journeys. Public foundations, Japanese and campaign matrices have separate `mobile-webkit-design-*` projects per feature/width plus one interaction project. Catalog coverage protects Safari's ruby annotation layout when romaji is hidden.
- Each WebKit project uses one worker. Responsive groups bound worker reuse after the full audit observed stalls roughly every 47 cases; the before/after test listing retains exactly the same cases with no duplicates. Use `--project='mobile-webkit*' --workers=1` for the complete serial WebKit lane. Other projects retain normal concurrency. Timeouts, assertions, tags and retained failure evidence are unchanged.
- The dedicated synthetic editorial lane exercises admin/account journeys and accessibility on all three projects. Public lanes clear Supabase configuration and skip those cases; the separate lane intercepts all hosted requests.
- Playground regressions exercise a real hosted runtime and a controlled connection failure, including automatic startup, edit/run/reset, and recovery with drafts intact.
- Editor fixtures select all using CodeMirror's emulated platform, then assert complete replacement before execution; iPhone WebKit uses Meta on Linux runners. Eight primary-route accessibility audits run independently with unchanged serious/critical checks and default per-test budgets.
- Trace, screenshot, and video are retained only for failures. HTML/JUnit reports and failure evidence are uploaded by CI.

### Native Matrix

- PRs labeled `mobile-e2e` create a credential-free Android APK and run Maestro flows tagged `smoke`.
- `v*` tags build Android and iOS in parallel and run every checked-in Maestro flow on each platform.
- Maestro is pinned to `2.8.0`; EAS retains the build, JUnit test output, and failure recording.

### CI And Release Flow

```mermaid
flowchart LR
  PR["Pull request"] --> Fast["Five parallel PR checks"]
  Fast --> Protect["Required main checks"]
  Night["03:00 UTC nightly"] --> WebDB["Full web + database regression"]
  Tag["v* release candidate"] --> GH["GitHub quality, coverage, DB, web"]
  Tag --> Android["EAS Android build + Maestro"]
  Tag --> IOS["EAS iOS build + Maestro"]
  GH --> Promote{"All release gates green?"}
  Android --> Promote
  IOS --> Promote
  Promote -->|yes| Manual["Manual promotion/submission"]
```

### Failure And Edge Handling

- Scope component role queries to the section being tested when a page renders a large catalog. Keep visibility, destination, and grouping assertions; do not remove assertions to reduce runtime.
- Tests that compile complete authored TypeScript projects have a 30-second timeout to accommodate instrumented CI runs. Other tests retain Vitest's default timeout; coverage thresholds and exclusions are unchanged.
- A failed database run must leave production untouched; CI stops and discards the local stack.
- Playwright and Maestro failures retain reports and visual evidence rather than relying on a rerun to diagnose the regression.
- GitHub release artifact names use the commit SHA and run attempt; slash-containing branch dispatches remain valid and reruns retain previous evidence.
- If EAS validation cannot authenticate, validate YAML locally, keep the workflow unexecuted, and report the missing account-side verification explicitly.
- A flaky test is fixed or quarantined with a documented owner and reason; it is not silently retagged or removed from the release lane.

## Code Touchpoints

- `package.json`: stable local and CI command interface.
- `vitest.config.ts`: aggregate instrumentation, reporters, exclusions, and scope thresholds.
- `vitest.per-file.config.ts`: file-level minimum coverage gate.
- `apps/mobile/jest.config.cjs`: mobile/shared-native instrumentation and thresholds.
- `apps/web/e2e/playwright.config.ts`: projects, reports, test server, and failure evidence.
- `supabase/config.toml`: disposable local project configuration.
- `supabase/tests/`: schema, RLS, trigger, isolation, and search pgTAP assertions.
- `.github/workflows/ci.yml`: five fast PR gates.
- `.github/workflows/nightly-regression.yml`: scheduled full web/database regression.
- `.github/workflows/release-regression.yml`: GitHub `v*` release-candidate gate.
- `apps/mobile/.eas/workflows/`: EAS Android PR and Android/iOS release regression.
- `apps/mobile/.maestro/`: installed-app regression flows.
- `apps/mobile/e2e/code-layout.mjs`: local agent-device regression for actual code scrolling, page containment, and fixed prose/navigation geometry on Android/iOS. See its README for retained evidence.

## Test Plan

Playwright uses two concurrent workers in CI and four locally. This bounds canvas/browser load after a Linux WebKit smoke run became unresponsive during map re-entry; keep all three smoke projects and the existing timeouts and assertions.

- Unit: pure schemas, parsing/indexing, route mapping, search, practice, progress, interview boundaries, environment detection, adapters, and content-audio/sync helpers.
- Integration: generated index relationships, renderers/components, API/Auth handlers, native screen matrix, and mocked Supabase boundaries.
- Database: clean migration replay plus transactional schema, index, constraint, trigger, RLS, isolation, published-search, ranking, and limit assertions. Protected content assertions accept either an explicit table-privilege denial or an RLS-filtered empty result, since Supabase database images can enforce the same no-read contract at different layers.
- Authored SQL: `npm run test:reservation:sql` executes canonical room-date fences in a separate pinned PostgreSQL 17 container, with no network, host ports or persistent mounts. CI and release database lanes explicitly pull the image; the verifier rejects remote Docker contexts and checks cleanup. It tests overlap/adjacency, lifecycle, invalid dates, expiry guards and observed two-session commit/rollback. It never uses Supabase connection configuration or production data.
- E2E: representative documents, diagrams, catalogs, practice types, interviews, Japanese, Auth-disabled behavior, local progress, recovery/404, responsive layout, and accessibility.
- Regression classification: fast critical paths are `@smoke`; feature and edge coverage is `@regression`; installed-app critical paths are Maestro flows.
- Coverage impact: all production logic in the listed scopes is instrumented; exclusions are annotated and thresholds are non-decreasing.
- Required local commands: `npm run test:coverage`, `npm run test:mobile:coverage`, `npm run test:db`, `npm run e2e:web:smoke`, and, before release, `npm run test:release` plus the EAS release workflow.

Must not regress: local anonymous operation, Auth-disabled recovery, stale progress rejection, database per-user isolation, completion/mastery preservation, published-only search, deterministic generated registries, every practice renderer, cross-platform route navigation, and failure artifact production.

## Open Questions

- When should native Maestro graduate from EAS's alpha job type to a stable provider contract?
- How long should artifacts be retained once repository history shows triage needs and storage costs?

## Decision Log

- `2026-08-05`: Adopt Vitest/Jest V8 coverage with aggregate and per-file gates.
- `2026-08-05`: Use pgTAP against disposable local Supabase instead of hosted integration tests.
- `2026-08-05`: Run the complete Playwright suite on mobile Chromium and smoke on desktop Chromium/mobile WebKit.
- `2026-08-05`: Pin Maestro 2.8.0 and require Android plus iOS for release candidates without automatic submission.
- `2026-08-08`: Keep Expo SDK 57 patch packages aligned with Expo Doctor and make the protected-content pgTAP assertion portable across Supabase images that deny reads through privileges or default-deny RLS.

## Documentation Updates

- `docs/README.md`: adds this testing/release contract to the docs map.
- Nested READMEs: `apps/mobile/README.md` documents coverage and Maestro/EAS lanes.
- `docs/engineering-overview.md`: includes the enforced test topology and release-gate flow.

## Thread Handoff Prompt

`Read docs/codex-context.md and docs/features/automated-testing-and-release-regression.md first. Preserve the coverage floors and stable check names, start behavior changes with the narrowest failing test, update the owning feature-doc test plan, run every affected local lane, and report any CI/EAS validation that still requires account-side execution.`

## LinkedIn editorial validation

The optional editorial workflow adds an isolated `npm run e2e:linkedin` lane (fake public Supabase configuration plus intercepted RPCs), transactional `linkedin*.test.sql`, and `npm run test:linkedin:local` against disposable local Auth/REST. Run the CLI smoke after a clean reset; it refuses remote APIs and never contacts Buffer. `npm run test:production:smoke` validates the built Next artifact with a fresh production-only dependency install. CI retains its logs alongside separate public/editorial Playwright reports. Existing coverage floors stay unchanged. See `linkedin-editorial.md` for the local worker's subprocess integration boundary and native installed-device gap.

## Authored Interview Solutions (2026-09-27)

`npm run test:interview:python` is a required CI/release gate with Python 3.13 setup; missing Python fails. It executes canonical frontend companions and prior-content regression fixtures with mocked I/O, plus the original neural-gradient and temporary-SQLite retry labs through `verify-durable-labs.py`. Those labs use an isolated interpreter, no inherited credentials and a bounded timeout. `FrontendInterviewExamples.test.tsx` compiles/executes all 21 TS projects and cross-checks Python outcomes. `interview-audit.test.ts` protects verified legacy fixes. No threshold or exclusion was lowered. The new browser and Maestro frontend-interview journeys cover the shared study flow.
