# React And TypeScript Playground

## Snapshot

- Status: `shipped`
- Last updated: `2026-07-31`
- Owner thread: `n/a`
- Current state: Web interview exercises can provide editable multi-file React/TypeScript, vanilla TypeScript, or static projects and run them beside their explanations.
- Target outcome: Any validated Codematica content surface can reuse one project contract and one isolated web player without introducing backend code execution.
- Code touchpoints:
  - `packages/core/src/content/schema.ts`
  - `apps/web/src/components/WebPlayground.tsx`
  - `apps/web/src/components/WebInterviewQuestionSession.tsx`
- Primary tests:
  - `packages/core/src/content/build-index.test.ts`
  - `apps/web/src/components/WebPlayground.test.tsx`
  - `apps/web/src/components/WebInterviewQuestionSession.test.tsx`
  - `apps/web/e2e/specs/interview-catalog.regression.spec.ts`

## One-Minute Brief

`WebExerciseProject` is the reusable authored-project boundary. It selects a Sandpack runtime, supplies an absolute safe file map, identifies visible and active files, and optionally declares an entry file and npm dependencies. The web component renders CodeMirror, an adjacent preview, Run, refresh, Reset, errors, and console output. Projects run in Sandpack's cross-origin iframe; Codematica never sends auth state, secrets, progress data, or backend authority into the project.

## Outcome / Contract

- Supported runtimes are `react-ts`, `vanilla-ts`, and `static`.
- Project paths must be absolute, may not contain dot segments, and every active, visible, or entry path must exist in `files`.
- The initial authored project runs automatically. Subsequent edits wait for explicit Run; Reset restores the authored files.
- Switching solutions remounts only the selected project and discards transient edits.
- The CodeSandbox export/new-tab action is disabled. Runtime errors stay inside the preview overlay and console.
- If the hosted runtime cannot initialize, the page retains explanations and source files with a retry action.
- The hosted bundler is the only remote dependency. Catalog content and read-only source remain local-first.
- Expo deliberately renders source read-only and does not host a WebView runner.

## Known Gaps

- Projects are not graded, saved, shared, or executed on a Codematica backend.
- There is no offline web bundler or self-hosted Sandpack deployment.
- Package dependencies are authored content; learners cannot change package metadata from the current UI.

## Test Plan

- Schema tests reject unsafe paths and missing active, visible, or entry files.
- Component tests verify file/dependency mapping plus Run and Reset behavior.
- Interview-session tests prove all authored projects are reachable.
- Playwright verifies a real React/TS project renders inside the hosted preview.

## Thread Handoff Prompt

`Read docs/features/react-typescript-playground.md and docs/features/interview-coding-catalog.md. Keep WebExerciseProject content-authored and platform-neutral, execute only inside the cross-origin Sandpack preview, preserve the read-only native fallback, and add lower-level tests before extending grading or persistence.`
