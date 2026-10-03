# Japanese writing notebooks (planas)

## Snapshot

- Status: `in_progress` — implementation exists; installed-device and physical Pencil validation remain outstanding.
- Last updated: `2026-10-02`
- Owner thread: n/a
- Current state: web and native notebook sheets share shape grading, schedules, cell cursors and local saving; iOS has a local PencilKit Expo module.
- Target outcome: fill generous notebook pages with recognizable handwriting, with saved ink and progressive repetition.
- Code touchpoints: `packages/core/src/language-writing/{notebook,shape}.ts`, `packages/ui/src/notebook-session.ts`, web `JapaneseWritingPractice`, native `JapaneseNotebookPractice`, and `apps/mobile/modules/codematica-handwriting/`.
- Primary tests: core `notebook.test.ts`, web/native writing and storage tests, `japanese-writing.regression.spec.ts`, and database `writing-notebooks.test.sql`.

## One-Minute Brief

A plana repeats the same Japanese character, word or short expression across notebook rows. Each sheet has 24 complete repetitions. A two-character prompt needs both characters for one repetition. Learners can write anywhere on the visible paper, including over previous rows; accepted handwriting is scaled into the next cell. The learner's own curves and available pressure samples remain on the device.

## Outcome / Contract

- `/languages/japanese/notebooks` offers curated notebooks, custom text and saved custom notebooks on web and native. Existing lesson and dictionary routes still open writing practice.
- Custom text is NFC-normalized, stripped of whitespace and validated against published stroke models before starting. Use 1–5 supported characters. Unsupported glyphs are named inline.
- Curated sheets have eight Trace, eight Copy and eight Recall repetitions. Restricted authored writing modes still limit the available guidance. Custom notebooks have three sheets: 8/8/8; 12 Copy + 12 Recall; then 24 Recall. The expression notebook includes おはよう, ありがとう and こんにちは; existing starter words remain available.
- Sheet completion unlocks the next sheet and enables **Next sheet** without automatically advancing. Prior unlocked sheets remain available. Restart and Undo preserve earned progress/unlocks while changing current ink.
- Input follows actual mouse, touch and stylus contacts automatically, including hybrid devices; there are no Draw, Pen or Scroll controls. One contact writes. Web wheel/trackpad, scrollbar and keyboard scrolling remain available. Native paper exposes labeled screen-reader scroll actions. Both clients pass remaining gesture distance to the outer page at paper boundaries, including when the whole sheet fits. Two fingers pan the paper on touch screens, Android SVG and installed iOS; the remaining finger cannot resume drawing until the gesture ends. A pen preempts a live finger stroke and suppresses palms during its contact and for 800ms after pen-up, then finger writing resumes. Completed pending strokes survive scrolling; only the cancelled live stroke is discarded. Checking/error timers pause during touch scrolling and resume after all contacts lift. Completed sheets can still scroll. Automatic row movement happens only after accepting a character. Drawing and feedback do not move the outer page.
- Auto-check evaluates the accumulated character 400 ms after pen-up. Correct characters save immediately; incomplete/incorrect characters receive an additional 800ms grace period before error text or motion appears, for 1.2 seconds total since pen-up. Another stroke cancels both checking and pending error feedback. There is no manual submit button. Undo, cancelled contacts, finished scroll gestures and difficulty changes recheck remaining ink automatically. Once an error appears, ink allows 1.2 seconds for correction, fades over 250 ms, then disappears. Starting another stroke, Undo or Clear cancels the fade; accepted ink and earned progress are preserved.
- Handwriting difficulty offers **Easy** (default), **Balanced** and **Precise**, saved locally for each notebook. Easy gives uneven mouse/finger shapes more room; every setting still requires the major character features.
- Compare full character shapes after translation and uniform scale alignment. Stroke order, direction and extra lifts do not matter. Require coverage of major features, reasonable length and sufficient span to reject taps, missing strokes and scribbles. This is deterministic shape comparison, not OCR or proof of mastery.
- Accepted ink advances the cursor exactly once and preserves proportions. It is never replaced by the guide model.
- Required character sheets determine existing lesson completion. Supplemental vocabulary and matching remain separate from that completion rule.

## Current State

The implementation and automated regressions cover web, shared native screens, local saving and database rules. The iOS bridge is discovered by Expo autolinking and Swift syntax is checked. These checks do not establish an installed-app build or physical Apple Pencil behavior. Xcode 26.3 on this host is below Expo SDK 57's documented 26.4+ requirement. Expo Doctor passes all 20 checks on the current dependency versions. Native release requires a supported toolchain and actual Android/iOS Maestro runs, plus physical iPad Safari and installed-app QA.

## Scope

### In Scope

Notebook practice for published Japanese character models, curated/custom pages, local vector ink, coarse optional account sync, adaptive language navigation and native PencilKit.

### Out Of Scope

Spanish course content, uploaded ink, handwriting OCR, new unsupported character geometry and store publishing.

### Assumptions

The UI uses the app's existing English labels. Canonical exercise/catalog JSON remains authoritative; the generated index stays an artifact. Optional Supabase configuration must not be required for anonymous practice.

## Detailed Behavior

### UI / UX

Warm paper has subtle blue cells, generous row spacing, in-paper examples and dotted guides. Controls and reserved feedback sit outside the ink surface. Recall hides the example until requested. Cells begin at x=48, safely beyond the red margin at x=30; the 12px right gutter and 44px minimum cell size remain available at 280px paper width for five-character prompts. The next cell has a subtle focus outline; live ink overlays all rows.

An unrecognized character briefly warms the focused cell and bounces it over 220 ms without affecting layout, then fades only the temporary ink. iOS fades its native PencilKit layer and clears its drawing generation on expiry; Android fades its SVG overlay. Web honors `prefers-reduced-motion`; native honors the system Reduce Motion setting. Reduced motion keeps the error color and timed clearing while omitting the bounce and animated fade. Difficulty controls sit outside the paper and retain pending ink when changed.

Undo removes the last pending stroke, or the last accepted cell when there is no pending ink. Clear current character removes pending ink. The footer keeps **Next sheet** at its content width alongside a 44px restart icon, labeled **Clear and restart sheet** for assistive technology; web also provides a title and visible focus outline. Restart removes current filled cells but preserves best progress. Switching sheets/activity discards unfinished ink. Pressure is retained in vectors; web ink is rendered as smooth cubic curves, with per-stroke weight on accepted cells. PencilKit renders live iOS ink natively. Its two-touch UIKit pan recognizer sends `onPan` phases and vertical deltas through the Expo bridge to the shared viewport, moving the ruled paper and native ink together. A generation guard suppresses cancelled/stale tool callbacks; native drawing is disabled on completed sheets while scrolling remains enabled. The SVG fallback uses responder touch centroids. `NotebookScrollContext` passes unconsumed pan distance to the enclosing `AppScreen` scroll view while its normal one-finger scroll stays locked during writing. Web uses Pointer Events with `touch-action: none` on the ink surface and explicit two-contact panning; its scrollable viewport remains available for wheel, trackpad, scrollbar and keyboard input.

### Data Model And Persistence

`WritingNotebook` has versioned notebook IDs and stable sheet IDs (authored prompt IDs, otherwise glyph sequence plus kind). `NotebookSheet` contains ordered character models and 24 guidance phases. `NotebookSnapshot` stores active sheet, ordered cell ink, best count, replay status and optional difficulty. Older snapshots default to Easy. Difficulty is a device preference and is excluded from remote progress. Replays do not acquire remote placeholder cells over a restarted local page.

Web IndexedDB uses an atomic snapshot/definition store partitioned by authenticated owner or guest. Native AsyncStorage uses separate definition, sheet-manifest and immutable cell records; the manifest commits only after cell writes succeed. Both retain normalized vectors and available pressure information. Reload restores the current page. Saving failures retain current ink and show Retry; failed restoration blocks writing so saved data cannot be replaced silently.

Optional `user_writing_notebook_progress` stores owner, notebook/sheet IDs, prompt, bounded best count and timestamps. It contains no ink. `/api/progress/writing-notebooks` supports GET/POST; native uses the same core validation with an anon-safe authenticated Supabase client. Requests have at most 20 rows. RLS enforces ownership; a trigger preserves maximum earned progress and completion even after restart/stale writes. The additive migration is `202610020001_create_writing_notebook_progress.sql`.

Remote progress merges by maximum count. Cells without local ink show completion marks and offer practice again through restart. Custom notebook definitions can be reconstructed from their remote prompt, so another device can open a completed custom notebook without any uploaded handwriting. Anonymous progress stays local; signing into a different account does not expose another account's local records.

### Business Logic

The shared grader aligns the ink and model at uniform scale, samples curve geometry, measures expected and actual coverage, verifies evidence for each major stroke and bounds relative path length. Model stroke groups are used to check feature coverage, not user stroke order. Closed regions in looped models also require comparable ink regions; small gaps may join, while a V-shaped replacement or oversized scribble fails. Alignment never stretches the saved handwriting or substitutes the model. Acceptance tokens make repeat submission a no-op. A pair requires 48 accepted cells; five characters require 120.

| Difficulty | Distance tolerance (normalized units) | Model coverage | Ink coverage | Each feature | Relative length |
| --- | --- | --- | --- | --- | --- |
| Easy | 19 | 80% | 70% | 60% | 0.50–2.70 |
| Balanced | 16 | 86% | 75% | 62% | 0.52–2.55 |
| Precise | 13 | 92% | 80% | 65% | 0.55–2.40 |

The whole character fits within an 80-unit span centered on a 100-unit canvas. All settings reject tiny marks, absent major parts and excessive ink. Automatic checking waits for a pause between strokes, rather than accepting each stroke individually.

### Failure And Edge Handling

Local write queues preserve ordering across quick acceptance, Undo and restart. Sync failures leave local ink intact and offer Retry. Restoration does not overwrite inaccessible/corrupt saved pages. No background cleanup deletes user notebooks. Unsupported authored prompts or duplicate prompt IDs fail content indexing.

## Code Touchpoints

- `packages/core/src/language-writing/notebook.ts`: definitions, schedules, validation, geometry, cursors, unlocks and merge.
- `packages/core/src/language-writing/shape.ts`: order-independent whole-character grader.
- `packages/core/src/progress/notebooks.ts`: bounded owner-authenticated sync.
- `packages/ui/src/notebook-session.ts`: shared restoration, ordered saving and completion hooks; web imports only this React-only package subpath.
- `apps/web/src/components/JapaneseWritingPractice.tsx`: Pointer Events, coalesced samples, curved SVG paper and tools.
- `apps/web/src/components/JapaneseNotebookCatalog.tsx`: curated/custom/saved notebook entry point.
- `apps/web/src/lib/notebooks/storage.ts`: IndexedDB and API adapter.
- `packages/ui/src/JapaneseNotebookPractice.tsx`: native notebook and Android SVG responder.
- `packages/ui/src/JapaneseNotebookCatalogScreen.tsx`: native notebook catalog.
- `apps/mobile/src/lib/{notebook-storage,handwriting-canvas}.ts*`: AsyncStorage and native bridge.
- `apps/mobile/modules/codematica-handwriting/`: local PencilKit view and Expo module.

## Test Plan

Regression-first core tests reproduce rough あ, arbitrary placement/scale, widened mouse shapes, reordered/reversed strokes, extra lifts, taps/scribbles, missing features at every difficulty, old triangular geometry and duplicate acceptance. Every published guide passes Easy, including sparsely sampled curves; sparse polygon guides retain essential corners. Unit tests cover all 24 repetitions, pairs, Unicode limits, custom schedules, locked pages, merge and restart.

Web/native integration tests cover correction, timer cancellation, rejection expiry/repeated submission/unmount, accepted-ink preservation, native completed samples, coalesced release samples, retained local pressure, save/restore failures, recall hints, matching independence, navigation and completion. Error feedback must stay hidden until 1.2 seconds after pen-up; 900ms gaps between mouse strokes must still produce one accepted character with no stale error. The shared hook covers cancellation of pending feedback and unmount before the grace period ends. Cancelled contacts and two-finger scroll gestures must preserve pending strokes and resume automatic checks without accidental ink. Verify automatic mouse/finger/Pencil switching, pen preemption, one-finger remainder suppression, scroll bounds, completed-page scrolling and absence of mode buttons. Difficulty selection rechecks pending ink and survives local restoration/restart; the manual submit control is absent. Core geometry tests require every cell to clear the red gutter at phone/tablet widths. Browser regressions use mouse, touch and pen input across 320px phone, iPad portrait/landscape and 507px Split View; assert compact footer sizes, accessible restart labeling, no layout shifts, rejection bounce/fade, reduced motion, restored ink, all 72 custom repetitions and serious/critical accessibility violations. Transactional pgTAP tests cover RLS, bounded counts, immutable prompt and preserved unlocks; replay all migrations against a separate disposable database, never reset the shared local database.

The native 24-pair progression test submits all 48 characters through the completed-stroke canvas callback and runs the real grader. It checks the repetition count and locked navigation after each incomplete pair, then verifies explicit navigation and preserved unlocks after restart. Separate responder tests retain pointer sampling, cancellation and SVG coverage. This keeps the full progression test within the suite's 30-second timeout under CI coverage without replaying every pointer movement 48 times.

Required commands: `npm run content:check`, `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run test:mobile:coverage`, `npm run mobile:doctor`, `npm run build`, `npm run test:production:smoke`, the two Japanese Playwright regressions and `npm run e2e:smoke`. Run native `.maestro/japanese-writing.yaml` on Android and iOS. Coverage includes the new core, web, native components, hook and storage files; no floor is lowered or new exclusion added.

Physical iPad checks must cover finger drawing, automatic Pencil palm rejection and returning to finger drawing, pressure, uninterrupted curves, responsiveness, background/foreground restore, rotation, Split View, VoiceOver and larger text in Safari and the installed app. Emulator input is not evidence for these physical properties.

### PR Validation — 2026-10-02

Validation runs against the latest `main` in an isolated worktree with a clean dependency install. Content freshness, lint and all workspace typechecks pass. Both Vitest coverage lanes pass with 454 tests in 75 files; native Jest coverage passes with 94 tests in 14 suites. Coverage floors and exclusions are unchanged. Expo Doctor passes 20/20 checks. The clean migration replay and all 130 transactional pgTAP assertions pass in a separate disposable database, including 14 notebook assertions; the shared database is not reset.

All 21 production-build browser journeys pass: the two Japanese regressions and all nine smoke runs across mobile Chromium, desktop Chromium and mobile WebKit. These cover all 72 custom repetitions, saved pages, error motion/clearing, automatic input, real wheel/two-finger scrolling and phone/iPad/Split View layouts. Tests use the production build on an isolated port to preserve the existing development preview.

The production web build passes. A copied artifact reaches HTTP readiness and serves public/admin shells, the notebook catalog and existing writing routes after a separate `npm ci --omit=dev` install. Artifact install/startup evidence is retained at `/var/folders/wc/pn_8ys1106d3dmrwlb1vqb_m0000gn/T/codematica-production-WFJ6yL/`; the shared workspace dependencies are never pruned.

Expo autolinking discovers the local module. Swift syntax parsing and isolated PencilKit/UIKit API typechecking pass, including the two-touch recognizer. These checks do not establish an installed Expo build. A new native binary is required for the pan bridge; this host has Xcode 26.3 and requires the supported 26.4+ toolchain before native build validation. Maestro is unavailable locally and no physical iPad is connected. Android/iOS installed-app journeys and physical Safari/PencilKit input, palm rejection, pressure and responsiveness remain release gates.

Earlier development browser failures remain preserved in the original checkout under `test-results/notebook-*-failure-20261002*/`; the PR worktree retains its own validation logs and failure reports. Regression-first coverage includes all 24 repetitions, custom sheet progression, slow mouse strokes, correction/fade timing, local restoration and the automatic input/scrolling contract.

## Open Questions

- Physical-device calibration may identify additional independent handwriting examples for the deterministic grader. Preserve negative coverage regressions when adjusting tolerance.

## Decision Log

- `2026-10-02`: Implement the approved 24-repetition notebook plan. Retain actual learner ink locally; sync only furthest coarse progress. Use PencilKit for installed iOS and shared SVG for Android.
- `2026-10-02`: Follow-up feedback requests delayed automatic clearing of rejected handwriting, gentle error motion, and a wider left gutter. Replace indefinite rejected-ink retention with cancellable 1.6-second correction time and a 500ms fade.
- `2026-10-02`: Make whole-character grading configurable with an easier default; save the preference per notebook. Remove the manual Check character fallback and preserve automatic rechecks after Undo/tool/difficulty changes. Shorten error motion to 220 ms and rejection cleanup to 1.2 seconds plus a 250ms fade.
- `2026-10-02`: Remove mode buttons; automatically detect mouse, finger and Pencil contacts, keep regular web scrolling and add two-finger paper scrolling with pending-ink retention and native pan bridging.
- `2026-10-02`: Keep sheet controls compact and make restart an accessible icon. Retain 400ms successful acceptance while delaying error feedback until 1.2 seconds after pen-up so multi-stroke mouse writing has more time.

## Documentation Updates

Japanese learning, adaptive navigation, auth/progress and native deployment docs; engineering overview and context; docs hub and owning core/UI/mobile/content/Supabase READMEs; local module and web storage READMEs.

## Thread Handoff Prompt

`Read docs/features/japanese-writing-notebooks.md and docs/codex-context.md. Preserve learner ink and earned unlocks. Complete supported native builds, Android/iOS Maestro and physical iPad Safari/PencilKit QA before claiming native release readiness.`
