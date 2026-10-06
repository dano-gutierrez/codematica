# Partitioned Event Log Interview

## Snapshot

- Status: `shipped`
- Last updated: `2026-10-05`
- Owner thread: n/a
- Current state: the lesson, three executable TS/Python pairs, checkpoint and review feed are implemented and locally verified; no deployment or installed-device verification is implied.
- Target outcome: explain global offsets, efficient reads and independent cursors while stating concurrency and scale limits.
- Code touchpoints: `content/interviews/real-world.json`, `content/knowledge/system-design/partitioned-event-log.md`, and the path/exercise/feed JSON files named `partitioned-event-log`.
- Primary tests: `packages/core/src/content/event-log-interview.test.ts`, `scripts/content/verify-event-log.py`, `apps/web/e2e/specs/event-log.regression.spec.ts`.

## One-Minute Brief

The lesson reviews a user-supplied Map-and-counter attempt and distinguishes global IDs from local positions. Three approaches use indexed arrays, linked chains with sparse anchors, and segmented logs. All have complete TypeScript projects and Python companions. The existing guided reader, playground, questionnaire and scrolling feed own the experience.

## Outcome / Contract

- `/paths/partitioned-event-log` connects the lesson, `/interviews/real-world/partitioned-event-log`, eight questions, then fourteen review cards.
- Each of three approaches has five recipe steps, reasoning, costs, pain points and language guidance.
- Offset reads are inclusive and bounded to 0–10,000 events, default 100. IDs remain global even for per-key reads.
- Cursors belong to consumers and retain their position through same-process ownership movement and later appends.
- Source-company/interviewer identity stays anonymous. The attempt review explains compile-time omissions and design tradeoffs without claiming to know the interviewer's intent.

## Current State

No shared runtime/schema behavior changes are needed. `kind: web` selects the existing runnable project renderer; the project runtime is vanilla TypeScript, and its subject is systems/data structures. Canonical code remains in interview JSON, explanation in Markdown, and the index is generated. Native uses the existing code reader; execution remains web-only.

## Scope

### In Scope

Original teaching content, bounded reads, global indexing, consumer cursors, whole-key ownership, a limited automatic-growth policy, and exact-code verification.

### Out Of Scope

Distributed durability, retention, deduplicated writes, cross-process locks, actual node transfer, hosted deployment and installed-device release verification.

### Assumptions

One process/coordinator, append-only storage, stable bucket objects, caller-owned payload references and no recovery from allocation failure. TS publication is synchronous in one agent; Python protects compound operations with an RLock. A count-based growth threshold is an explicitly limited heuristic.

## Detailed Behavior

### UI / UX

Reuse `WebInterviewQuestionSession`, `WebPlayground`, native interview screens and path navigation. The demo provides named keyboard controls for append, global/key reads, continued cursor reads, cursor reset and node addition. All three projects start with the same interleaved IDs.

### Data Model And Persistence

Every track contains its complete program. Global indexes reference the same event objects held by one owning key store. No app/user data migration is introduced. Responses allocate only the requested page. A consumer's fetched offset is distinct from a durable acknowledged checkpoint; the latter is discussion material.

### Business Logic

Seek then scan, rather than repeatedly filtering a historical prefix. Global reads use dense IDs. Node movement transfers one eligible bucket from the busiest node; selection costs O(P + Kd), not O(1). Automatic growth has a cooldown and node cap. A single hot key stays indivisible.

### Failure And Edge Handling

Reject negative offsets, empty keys and invalid limits without consuming an ID. Unknown keys, zero limits and offsets beyond the tail return empty pages. A cursor opened beyond a partially filled last segment must still see later appends to that segment. Bigint IDs are stringified in the demo's JSON output.

## Code Touchpoints

- `content/interviews/real-world.json`: three projects and Python programs.
- `content/knowledge/system-design/partitioned-event-log.md`: candidate review and systems explanation.
- `content/sources/event-log-interview.json`: verified primary references.
- `scripts/content/verify-event-log.py`: canonical Python execution, threads, metered seeks and optional million-event exercise.
- `package.json`: includes the verifier in the existing Python CI gate.
- `apps/mobile/.maestro/event-log-interview.yaml`: installed-app journey definition.

## Test Plan

The first TDD run failed all six initial core tests because the new exercise and verifier did not exist. Tests execute canonical source rather than duplicate implementations. The TS host strictly typechecks all authored files, then executes the log in a VM; Python compiles the canonical companion directly.

- Core: every offset against an independent filter/slice oracle, global/key ordering, limits, unknown keys, independent cursors, future offsets, partial blocks, whole-key movement, counts, bounded automatic growth and all quiz options/path transitions.
- Complexity regression: count stored-ID inspections when seeking near a 10,000-entry tail; fewer than 100 comparisons for the chosen block size catches a full-prefix scan without wall-clock timing assertions.
- Python: the same oracle, eight concurrent thread callers with interleaved reads, validation and million-event traversal; shared snapshot parity with TypeScript.
- Web component: all three recipes, TS file selection and complete Python code.
- Native: Jest exercises both languages/all approaches and checkpoint navigation. Maestro covers the installed journey through scrolling review; a saved flow is not device execution evidence.
- Browser: `event-log.regression.spec.ts` is tagged `@regression @playground` to run on mobile/desktop Chromium and mobile WebKit. It executes all projects, moves ownership with a live cursor, grades the quiz and scrolls beyond the initial review window.
- Coverage floors and exclusions stay unchanged.

Commands: `npm run content:check`, `npm run test:interview:python`, `python3 scripts/content/verify-event-log.py --scale 1000003`, targeted Vitest, `npm run test:coverage`, `npm run test:mobile:coverage`, `npm run lint`, `npm run typecheck`, `npm run mobile:doctor`, `npm run build`, and Playwright's event-log regression/smoke lane. Existing CI already installs Python and runs `test:interview:python`; missing Python fails that gate.

## Open Questions

Installed Android/iOS Maestro execution remains a separate device check. The material does not infer production latency or capacity from local correctness/scale runs.

## Decision Log

- `2026-10-05`: Reuse the real-world vanilla-TS project format to provide runnable systems exercises without adding a new schema or code-rendering surface.
- `2026-10-05`: Prefer indexed arrays for an interview baseline; present linked and segmented designs with their actual costs. Keep unique source code only in interview JSON.

## Documentation Updates

Docs hub, engineering overview, interview catalog feature doc, content-area READMEs, mobile/web E2E READMEs, core README and changelog describe the new study path and verification command. Shared navigation and persistence architecture remain unchanged.

## Thread Handoff Prompt

Read this feature, the canonical lesson and real-world interview JSON. Run exact-code tests before changing the implementations; preserve global offset semantics and consumer independence. Keep local scale evidence distinct from production or installed-device claims.

## Local validation — 2026-10-05

The targeted core/component checks pass. Both aggregate and per-file Vitest coverage pass 550 tests in 92 files. Native Jest coverage passes 148 tests in 18 suites, including all event-log approaches/languages. Lint, content freshness, the complete Python verification command, production build and Mobile Doctor (20/20) pass.

All six authored programs were exercised with 1,000,003 events for a hot key plus interleaved events for another key, then bounded seeking, complete cursor traversal and node movement. The TypeScript check also compared each returned ID/value against its independently calculated position. This establishes local correctness at that fixture size; it does not establish a production memory/latency target. The Python command is repeatable above. Logs are retained under `/tmp/codematica-event-log-*.log`. Installed-device Maestro has not been run.

All four workspace typechecks pass. All fifteen existing smoke checks and the complete event-log journey on desktop Chromium, mobile Chromium and mobile WebKit pass. Browser evidence is retained in `test-results/event-log-browser-20261005/` and `test-results/event-log-browser-rerun-20261005/`. The first new browser test reloaded before navigation finished; it now asserts the destination URL before reloading. A component-test query also used a Playwright-only option that workspace typechecking caught; it was corrected and the targeted ten tests/typechecks passed again. These were test-authoring defects; shared product runtime code was unchanged.
