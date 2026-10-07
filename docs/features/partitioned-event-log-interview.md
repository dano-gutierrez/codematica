# Partitioned Event Log Interview

## Snapshot

- Status: `in_progress`
- Last updated: `2026-10-07`
- Owner thread: n/a
- Current state: implemented and locally verified; PR #50 is under review. Installed-device verification remains pending.
- Target outcome: explain global offsets, efficient reads and independent cursors while stating concurrency and scale limits.
- Code touchpoints: `content/interviews/real-world.json`, `content/knowledge/system-design/partitioned-event-log.md`, and the path/exercise/feed JSON files named `partitioned-event-log`.
- Primary tests: `packages/core/src/content/event-log-interview.test.ts`, `scripts/content/verify-event-log.py`, `apps/web/e2e/specs/event-log.regression.spec.ts`.

## One-Minute Brief

The lesson reviews a supplied Map-and-counter attempt and explains global IDs, local positions and consumer cursors. It compares indexed arrays, linked chains with sparse anchors, and segmented logs, each with complete TypeScript and Python code. It uses the existing guided reader, playground, questionnaire and scrolling feed.

## Outcome / Contract

- `/paths/partitioned-event-log` connects the lesson, `/interviews/real-world/partitioned-event-log`, eight questions, then fourteen review cards.
- Each of three approaches has five recipe steps, reasoning, costs, pain points and language guidance.
- Offset reads are inclusive and bounded to 0–10,000 events, default 100. IDs remain global even for per-key reads.
- Cursors belong to consumers and retain their position through same-process ownership movement and later appends.
- Source-company/interviewer identity stays anonymous. The attempt review explains compile-time omissions and design tradeoffs without claiming to know the interviewer's intent.

## Current State

`kind: web` selects the existing project renderer for these vanilla TypeScript exercises about systems and data structures. Code lives in interview JSON, concepts in Markdown, and the index is generated. Native uses the existing code reader; execution remains web-only. No shared runtime or schema changes are needed.

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

Every track contains its complete program. Global indexes reference the same event objects held by one owning key store. No app/user data migration is introduced. Responses allocate only the requested page. A fetched offset records what was read; a durable acknowledged checkpoint records what was successfully processed. Durable checkpoints are discussion material.

### Business Logic

Seek to the requested global ID, then scan the page. Global reads use dense IDs. Selecting a bucket to move from the busiest node costs O(P + Kd); transferring its reference costs O(1). Automatic growth has a cooldown and node cap. A single hot key stays indivisible.

A cursor waiting for a future offset scans newly arrived events below that offset once each. Its work is O(s + r + 1), where s is the skipped count and r the returned count. A page limit bounds results, not skipped work or Python lock duration.

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

- Core: every offset against an independent filter/slice oracle; global/key ordering; defaults and 0/10,000/10,001 page boundaries; all request validators; unknown keys; independent cursors; future offsets; partial blocks; exact donor/recipient keys and counts; threshold/cooldown/cap boundaries; and quiz options checked against an independent answer key.
- Complexity regression: count stored-ID inspections when seeking near a 10,000-entry tail; fewer than 100 comparisons for the chosen block size catches a full-prefix scan without wall-clock timing assertions.
- Python: the same oracle and boundary cases, eight concurrent thread callers with interleaved reads, and shared snapshot parity with TypeScript. The million-event traversal verifies every returned ID, key and value against a calculated sequence.
- Python scale command: an explicit count below 100 fails, including zero. CLI regression tests check 0, 99 and 100, and require all three approaches to run at the accepted boundary.
- Web component: all three recipes, TS file selection and complete Python code.
- Native: Jest exercises both languages/all approaches and checkpoint navigation. Maestro selects an answer, checks feedback for each question, and asserts review card 12 after scrolling. A saved flow is not device execution evidence.
- Browser: `event-log.regression.spec.ts` is tagged `@regression @playground` to run on mobile/desktop Chromium and mobile WebKit. It executes all projects, moves ownership with a live cursor, grades the quiz and scrolls beyond the initial review window.
- Mutation checks remove cooldown, node cap, donor count updates, page bounds, inclusive seeking, sparse anchors and partial-tail handling. Run each applicable mutation against each language/approach. The original tests missed cooldown removal; the new boundary assertions reject it.
- Coverage floors and exclusions stay unchanged.

Commands: `npm run content:check`, `npm run test:interview:python`, `python3 scripts/content/verify-event-log.py --scale 1000003`, targeted Vitest, `npm run test:coverage`, `npm run test:mobile:coverage`, `npm run lint`, `npm run typecheck`, `npm run mobile:doctor`, `npm run build`, and Playwright's event-log regression/smoke lane. Existing CI already installs Python and runs `test:interview:python`; missing Python fails that gate.

## Open Questions

Installed Android/iOS Maestro execution remains a separate device check. The material does not infer production latency or capacity from local correctness/scale runs.

## Content Review Corrections

- The offset-1 example returns [2, 9]. Skipping one item happens to work for that example; filtering by local index > 1 returns only [9]. The quiz and first review card now distinguish these cases.
- The lesson now includes the future-offset scan cost already noted in the solution tracks. It no longer implies that a page limit bounds Python lock duration.
- Complexity notes count block/anchor metadata across all keys. Segmented arrays grow on append; block size is a cap, not preallocated capacity.
- Prose edits preserve all six authored programs and every project file verbatim.
- An explicit `--scale 0` previously exited successfully without running the scale fixture. It now fails with the same minimum-count error as other counts below 100.

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

All four workspace typechecks pass. All fifteen existing smoke checks and the complete event-log journey on desktop Chromium, mobile Chromium and mobile WebKit pass. Browser evidence is retained in `test-results/event-log-browser-20261005/` and `test-results/event-log-browser-rerun-20261005/`. The first browser test reloaded before navigation completed; it now checks the URL first. Typechecking also caught a Playwright-only option in a component query. Both test defects were corrected, then the ten targeted tests and typechecks passed. Shared product runtime code was unchanged.


## Review validation — 2026-10-05

After the prose corrections and stronger tests, both Vitest coverage passes run 553 tests in 92 files; native Jest passes 148 tests in 18 suites. All 30 targeted mutations are rejected across the applicable TS/Python approaches. The three Python programs pass the strengthened 1,000,003-event oracle. All six authored programs and their playground files are byte-for-byte unchanged from the initial PR head.

Content validation, lint, all workspace typechecks, Mobile Doctor (20/20), and the web production build pass. The event-log journey and knowledge-browser smoke test pass on desktop Chromium, mobile Chromium and mobile WebKit (six runs). Local evidence is in `/tmp/codematica-pr50-polish/` and `test-results/pr50-polish-browser/`. The Maestro YAML parses, but installed Android/iOS execution remains unverified.

## Review validation — 2026-10-07

Integrated main `82fc14d` and resolved documentation, verification-command and generated-index conflicts. Every existing content entry and verification command is retained; all six authored programs are unchanged. A new failing CLI regression reproduced the zero-count skip, and the fix passes counts 0, 99 and 100.

Both Vitest coverage passes now run 849 tests in 126 files. Native coverage passes 162 tests in 20 suites. All interview verification commands, the three Python million-event fixtures, lint, all typechecks, content freshness, Mobile Doctor (20/20) and the production build pass. The event-log journey and reader smoke pass on all three browser projects. The isolated production-only install reaches HTTP readiness; packaged game, brand and SQLite smoke checks also pass.

Evidence is retained in `/tmp/codematica-pr50-oct7-*.log` and `test-results/pr50-oct7-browser/`. The DEV-6436 review retains the prior 30 rejected mutations for unchanged solution code and adds the zero-count regression. No CodeRabbit or human review findings were present. Installed Android/iOS Maestro execution remains unverified.
