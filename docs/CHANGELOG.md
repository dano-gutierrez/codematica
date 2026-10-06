# Product And Engineering Changelog

This changelog dates durable product and architecture changes and links to their authoritative feature contracts.

## 2026-10-05 — Native search label association

Linked all four shared native search fields to their visible labels with stable, distinct IDs, preserving iOS names, query values and clearing. This addresses an empty Learn input announcing only its shortened placeholder in TalkBack. Added Android/iOS and duplicate-screen regressions; installed verification is recorded in the app-wide design audit.

## 2026-10-03 — Continuous campaign landscape

- Created four connected original paintings and a transparent foliage kit with retained built-in imagegen prompts. Assembled terrain before cutting twelve tiles with pixel-identical edge guards.
- Added mist, amber motes and foreground foliage at three bounded depths on web and native, behind ordinary level controls. Reduced motion freezes parallax; offscreen scenery is culled.
- Reserved fifty art positions with twelve authored playable levels and a compact ascending list. Fixed centering-induced blank strips, smeared chapter blends, dangling route marks, and obsolete map scroll offsets.
- Recorded the improve-game-ux create/review/fix/review cycle and visual evidence. New installed-device art/FPS checks remain pending. See [Restore the Signal](features/restore-the-signal.md) and the [map review](../assets/game/previews/continuous-map/review.md).

## 2026-10-03 — App-wide design pass (in progress)
- Include short visible metadata in native Learn/resume and editorial collection accessible names; preserve compact visuals and full-catalog summary hints. Add duplicate-title editorial selection and discovery/resume name regressions.
- Reserve Android keyboard space in shared forms and campaign code editors without replacing input drafts. Rebuild native map/list terrain measurements on each switch and reject obsolete callbacks; preserve toolbar, progress and painted art. Add native keyboard-event and delayed-layout regressions.
- Group native editorial creation/refresh, collapse optional filters with an active count, and return collection/editor/create transitions to the top without interrupting typing or failed saves. Add an opt-in installed account/editorial journey using an isolated local test project; keep publishing disabled and approvals human-only.
- Add stable native email/password selectors and align questionnaire, skill-review and writing-match reset controls with the shared warning tone.
- Confirm guided-lab completion only after progress acknowledgment on web and native. Keep private notes and choices through failures, offer retry and restart, and return focus/scroll to the beginning. Add storage-fault, responsive and installed source-to-lab journeys without changing the learning criteria or progress payload.
- Wait for native skill-rating storage acknowledgment, expose save/reload recovery and retry the same recall without another attempt. Serialize mastery writes and preserve conflicting/unreadable local data.
- Add installed cloze/checkpoint, passive/word/deck, missing-page and skill-save/restart journeys; document actual passive/deck actions and approval-gated audio.
- Make Learn curated, search and resume cards compact with titles and labels; retain searchable summaries and detailed full-catalog cards.
- Keep five native Learn section shortcuts, omitting its self-link, and reserve 48 dp header/sidebar home targets without resizing the brand artwork.
- Wrap native Learn shortcuts at enlarged text sizes and shorten its search placeholder to keep labels readable.
- Stack native Learn section headings above View all at narrow enlarged-text widths, preserving readable titles and every catalog destination.
- Preserve the active Android route and transient input across system font-size changes; refresh responsive dimensions through the existing native module. Add an idempotent Expo prebuild hook and shared AdaptiveText for live text remeasurement; keep Markdown refresh separate from diagram state. Add configuration/state regressions and installed-validation requirements.
- Coalesce native Learn and Browse lookup with a shared typing-pause helper, announce pending work and hide obsolete results. Defer Browse filters while typing and wait before showing its empty message. Retain the shared search universe and ranking; add timing/cancellation and installed large-text regressions.
- Keep native campaign code/caret stable through typing, reseed on explicit reset/scenario changes, ignore replaced-field events, and run the latest session text.
- Describe SQL deadlines as local runner timeouts and keep the existing two-second cap, including initialization. Settle each sandbox once and release its worker/blob URL on result, error or deadline; ignore queued callbacks. Add deadline/cleanup and browser retry regressions.

- Keep interview questions and recipe controls ahead of long explanations. Share native supporting-detail disclosures with the editorial screen; retain full rubrics and keyboard/expanded-state coverage.
- Place matching feedback before its choices and preserve empty native notebook pages after Undo/restart by skipping the storage SDK's rejected empty batch. Keep saved-progress milestones and write-failure recovery intact.
- Pause native campaign art outside measured viewports and on covered routes. Share visibility logic without rerendering on every scroll event; preserve visible artwork, animation poses and scoring.
- Apply the shared action, form, filter, disclosure and reading styles across discovery, catalogs, paths, practice, Japanese study, interviews and account flows. Preserve the painted campaign identity and learning/editorial rules.
- Add native account/sign-out presentation, explicit PKCE callback handoff and progress-sync recovery. Keep anonymous local learning optional.
- Add responsive/keyboard/axe browser matrices and native control regressions. Keep [the full route/platform audit](features/app-wide-design-audit.md) open until all flows and installed checks have current evidence. No release readiness, push or deployment is implied.

## 2026-10-03 — Touch And Accessible Editorial Review

- Keep one design system with visible touch labels, 48 px/dp targets, content-width tablet panes, growing text and normal-flow action bars.
- Preserve keyboard context through draft/create transitions; make desktop tooltips hoverable and Escape-dismissible.
- Align native editorial controls, keyboard-aware scrolling and explicit discard before leaving unsaved edits.
- Add Chromium/iPhone WebKit phone/tablet/desktop, 200% text and landscape regressions; retain native coverage and update the disposable-data Maestro journey. Installed native VoiceOver/TalkBack and software keyboard checks remain unverified.
- Keep publishing permissions and coverage floors unchanged. The local visual pass was reviewed before the user requested a pull request.
- Review fixes: invalidate stale copy feedback, provide manual clipboard recovery, wrap long proposal links and restore Search focus when filters remove the open draft. Pin comment/fact discard, normalized account names and each phone menu link with regression coverage.
- Limit WebKit to one CI worker after two Linux game return-to-map failures; retain all browser projects, assertions and timeouts. Local repeated runs pass; CI validation remains separately recorded on the PR.
- Validation against `main` at `dec1c2d`: 576 Vitest tests with both coverage gates, 147 native tests with coverage, Expo Doctor 20/20, 31 editorial/account browser cases and 15 public smoke cases pass. Twelve behavior mutants are caught. Content freshness, lint, typechecks, production build and pruned-artifact startup pass.

Owning contracts: `docs/features/design-system.md`, `docs/features/adaptive-ui.md` and `docs/features/linkedin-editorial.md`.

## 2026-10-02 — Editorial UI And Design System (Local Review)

- Add shared named action buttons with consistent geometry, semantic colors, and icon tooltips.
- Simplify LinkedIn review with compact filters, a framed composer, explicit approval, and expandable supporting material.
- Preserve creation, formatting, analysis, and exact-revision approval. Protect unsaved draft/comment edits and offer explicit discard.
- Document spacing, borders, alignment, typography, reuse, and accessibility. Coverage gates remain unchanged.
- The first visual pass was reviewed locally; the user requested a pull request on 2026-10-03. No production deployment is included.
- Follow-up (2026-10-03): include the previously local Admin sidebar group, LinkedIn icon, signed-in account footer, and shared Sign out disclosure in the design checkout and preview. Add account navigation to the existing isolated browser gate.

Owning contracts: `docs/features/design-system.md` and `docs/features/linkedin-editorial.md`.

## 2026-10-03 — Campaign integration review

- Merged the current learning features and Expo patches while preserving Play/Learn navigation, notebook access, and the private admin destination. The combined content index is version 12; the game migration has a unique version after the editorial migrations.
- Cancelled stale web runner requests and native WebView callbacks after reset or navigation. Only the focused native level advances the shared defense clock.
- Serialized anonymous-progress claims and guarded deferred account checks so stale requests cannot merge or upload another account’s awards. Unavailable map scroll storage no longer interrupts play.
- Made the SQL zone mastery fixture require a different predicate from the story. Strengthened exact drag-coordinate, independent budget/latency, save-prompt, and async-race regressions; retained all coverage floors.
- Made opaque brand icon exports byte-identical on macOS ARM and Linux x64. Reduced CI browser concurrency and changed the native progression test to completed-ink events while retaining all 48 characters, exact lock boundaries, and a real persistence restart.
- Current validation and remaining installed-iOS, Maestro, and physical-device performance requirements are recorded in the [campaign contract](features/restore-the-signal.md).

## 2026-10-02 — Approved Patch app identity

- Removed the two thin lines above Patch's left eyebrow in the large and medium icons and regenerated their exports; retained the eyebrow, lettering and tiny favicon.
- Installed the approved simple Patch head and slab wordmark in web and native identity controls.
- Added transparent 16/32/48px favicons, multi-resolution ICO, Apple touch/manifest icons, native launcher icons and ivory splash artwork.
- Preserved original concepts and imagegen extraction prompts; added reproducible exports, alpha/safe-area checks and a visual preview. Header copies are sized for high-density screens.
- Added browser asset/home-navigation coverage, native sidebar home-button coverage, and exact asset checks in the production-only artifact smoke. Coverage floors remain unchanged. See [brand identity](features/brand-identity.md) for verification and platform limits.

## 2026-09-30 — In-level character miniatures

- Reworked the actual Patch and zombie game figures with chibi proportions, stronger faces and short limbs; added transparent full-body exports at 48/64/96/128px.
- Shared scene geometry between Pixi and Skia, corrected character scale and native container measurement, and added contact shadows.
- Fixed initial paused rendering and redraw after resizing or changing reduced motion. Added all-level browser captures, shared geometry checks and native transform coverage.
- Kept the earlier portrait icons as a separate asset kit. See the [miniature sheet](../assets/game/previews/miniatures-v3.png) and [feature contract](features/restore-the-signal.md).

## 2026-09-29 — Mascot and enemy art refinement

- Refined Patch from the original concept sheet and gave Shambler, Runner and Armored matching material, face and clothing treatments.
- Updated editable game parts, six robot expressions, enemy sprites and cosmetic attachments; retained the animation timelines and learning rules.
- Added four painted portrait masters and reproducible PNG/WebP thumbnails at 64, 128, 256 and 512 pixels, with an identity/alt-text manifest and character-kit preview.
- Added atlas/portrait export regression coverage and thumbnail checks against the pruned production app. The [asset guide](../assets/game/README.md) records the visual contract and full generation prompts.
- Verified the refined characters in production web and installed Android builds; coverage passes 360 core/web and 73 native tests. Expo Doctor reports three newer SDK patch recommendations, tracked in the feature contract.

## 2026-09-29 — Restore the Signal campaign

- Added the twelve-level chapter with 36 CSS Grid, SQLite, directed-flow, and system-design configurations; levels 8 and 12 offer live or assisted defense.
- Moved discovery to `/learn` and made Play the home, while keeping lessons and paths independently accessible.
- Added Patch, original painted districts, editable SVG parts/timelines, shared atlas exports, PixiJS/Skia renderers, local workers, and offline native assets.
- Added unique game awards, timezone-based streaks, cosmetics, account-scoped local caches, optional RLS-protected union sync, and new introductory lessons.
- Aligned the Expo SDK 57 patch dependencies and added a Gradle input hook so shared code edits invalidate cached Android bundles.
- Added core/browser/native/database coverage and retained existing coverage floors. Generated worker/asset files are artifacts; no authored game source is excluded from coverage.
- Release verification and current toolchain limits are tracked in [the feature contract](features/restore-the-signal.md); source and bundle success do not imply installed-iOS or deployment readiness.

## 2026-09-29 — PR Check Reliability

- Aligned Expo SDK 57 dependencies and root overrides with Expo 57.0.26 and React Native 0.86.3. Added the required `expo-asset` native peer, pinned compatible animation packages, and regenerated stale nested workspace resolutions in the lockfile.
- Scoped Japanese hub test queries to their sections while strengthening character-group and reuse-label assertions. Complete authored TypeScript compiler tests now have a 30-second timeout; other timeouts, coverage floors, and exclusions are unchanged.
- A clean install, full dependency-tree check, Expo Doctor (20/20), content freshness, lint, typechecking, 358 Vitest tests with both coverage gates, 50 native tests with coverage, 13 Python tests, Android/iOS bundle exports, production web build, and nine browser smoke journeys passed locally.
- The copied production web build also reached readiness and returned HTTP 200 for home, browse, login, and a lesson after `npm ci --omit=dev` in a disposable directory.
- Installed-device startup, native binary compatibility, and store readiness remain unverified by these checks.

Owning contracts: `docs/features/automated-testing-and-release-regression.md` and `docs/features/native-mobile-deployment.md`.

## 2026-09-29 — Technical Editing Skill And Clearer Copy

- Added the repo-local technical editing skill to shorten prose while preserving technical details, code, conditions, warnings, and uncertainty.
- Reviewed all 123 Markdown files, 142 app source files, and 160 authored content files. Simplified documentation, lessons, exercises, flashcards, interview explanations, and web/native UI copy where needed. Practice labels now include Next activity, Practice complete, Quick review, and Choose your prediction.
- Kept commands, code examples, technical values, Japanese examples, translations, and source metadata intact. Flagged conflicting schema/stage descriptions instead of silently changing them.
- Fixed a literal pipe splitting a Japanese vocabulary definition across table columns. Generator and mobile browser regressions verify the full definition remains in one cell.
- Coverage thresholds and exclusions are unchanged.
- Validation passed: content freshness, lint, typechecking, production build, 358 Vitest tests with aggregate and per-file coverage, 50 native tests with coverage, 13 Python tests, and all 49 browser journeys across the full run and targeted rerun. The first browser run exposed two outdated text assertions; both were updated and their four related journeys passed. Failure evidence was retained.
- Expo Doctor passed 19/20 checks and reported 10 existing package-version mismatches. Installed-device validation remains open: no Android device or booted iOS simulator was available, and Maestro was not installed. No deployment was performed.

Owning contracts: `docs/README.md#technical-editing-skill`, `docs/features/learning-paths-and-practice.md`, and `docs/features/japanese-language-learning.md`.

## 2026-09-29 — Native Code Scrolling

- Reuse the native code renderer for fenced and indented Markdown, preserving indentation and blank lines while scrolling long lines horizontally inside the code surface.
- Keep language labels and surrounding prose/navigation fixed; remove the height cap that could hide the end of long code. System font scaling remains enabled. Phone tab labels fit on one line to avoid mid-word wrapping at larger text sizes.
- Add regression-first Jest coverage, a Maestro lesson journey, and an agent-device runner that asserts real source movement and unchanged surrounding bounds on Android/iOS, with retained screenshots and native trees.
- Review follow-up (2026-09-30): strengthen regression assertions for stationary language labels, padded/blank fence metadata, inner height clipping, and tablet label wrapping. All four deliberate defects passed the previous tests and fail the strengthened suite. Merge current `main` while preserving its admin navigation tests and Expo dependency alignment.

Owning contract: `docs/features/markdown-knowledge-browser.md`. Device setup and regression command: `apps/mobile/e2e/README.md`.

## 2026-10-02 — Saved Japanese writing notebooks

- Removed Draw/Pen/Scroll controls. Input detection follows mouse, finger and Pencil contacts automatically; wheel/trackpad scrolling and two-finger paper scrolling preserve completed ink. Installed iOS bridges UIKit pan gestures to the shared notebook viewport.

- Kept Next sheet compact and replaced the full-width restart button with an accessible icon. Delayed error feedback until 1.2 seconds after pen-up to allow more time between mouse strokes; correct characters still save after 400ms.
- Added Easy (default), Balanced and Precise handwriting difficulty, saved locally per notebook. Relaxed mouse/finger shape checks while retaining missing-feature and scribble rejection. Removed the manual Check character fallback; correction and tool/difficulty changes recheck automatically. Shortened error bounce and fade timings.
- Added cancellable rejection feedback: a gentle focused-cell bounce, a short correction window and a fade that clears temporary ink. Widened the left gutter so character cells clear the red notebook line. Web/native honor reduced-motion settings.
- Added warm ruled notebook pages with 24 complete prompt repetitions, curated character pairs/words/expressions, and custom 1–5-character notebooks with three progressively less guided sheets.
- Accepted recognizable complete characters anywhere on the paper, independent of stroke order and extra lifts; retained the learner's ink, pressure samples, correction controls and earned sheet unlocks.
- Added explicit Japanese/Notebook navigation, IndexedDB and per-cell AsyncStorage saving, optional owner-protected completion sync, and a local iOS PencilKit module with Android SVG fallback.
- Passed core/web/native coverage, Japanese and navigation browser journeys, clean migration replay, transactional database tests and HTTP readiness with a clean production-only install. Installed-device Maestro and physical iPad Pencil validation remain outstanding; Xcode 26.3 is below Expo SDK 57's supported baseline and installed-device verification remains pending. Expo Doctor passes 20/20 on the current dependencies.

Owning contract: [Japanese writing notebooks](features/japanese-writing-notebooks.md).

## 2026-10-02 — Fluid kana guides and easier handwriting

- Replaced 109 crude published kana models with attributed, pinned KanjiVG curve geometry, including あ's full third-stroke loop.
- Added shared cubic rendering, preserved learner ink after assisted acceptance, retained slow/coalesced samples, and relaxed placement/size grading while rejecting missing, reversed, or tiny strokes.
- Added core/content, web, native, and browser regressions. See [Japanese planas](features/japanese-language-learning.md#handwriting-practice-sheets-planas) and [data attribution](../THIRD_PARTY_NOTICES.md).

## 2026-09-30 — Japanese planas and writing space

- Added repeatable character-pair and kana word sheets with trace, copy, recall, and matching activities on web/native.
- Enlarged and rounded the web writing surface, reserved feedback space, and fixed native tablet coordinate scaling/release/cancellation handling.
- Added regression coverage for sequence/completion, finger/pen input, phone/iPad layout stability, native matching, and a Maestro writing-sheet journey. Physical Pencil and installed-device validation remains required before native release.

## 2026-09-28 — Readable Lesson Code Blocks

- Fixed a prose CSS rule that replaced highlighted blocks' dark background with a pale surface while retaining light syntax colors.
- Kept inline-code styling separate and added rendered contrast checks at phone and desktop widths. The regression reproduced 1.21:1 body-text contrast before the fix and requires at least 4.5:1 for every code text node.
- Audited all web/native code surfaces. Converted playground failure source to the shared dark renderer, aligned plain prose fallbacks and native indented Markdown, and fixed low-contrast inherited playground syntax colors. Added fallback recovery, native style, and cross-surface browser regressions. Theme selection remains deferred; coverage gates are unchanged.

Owning contract: `docs/features/markdown-knowledge-browser.md`.

## 2026-09-28 — React State Snapshots Lesson

- Added a supplementary lesson explaining stale state in timers and promise callbacks, functional updates by ID, reducers/ref tradeoffs, and late-result cleanup.
- Added complete broken/fixed React examples with exact-source execution tests and six quiz questions. Linked the lesson from the board and async-matrix guides and made it searchable through the generated index.
- Reused the Markdown reader and questionnaire; no schema, runtime dependency, or coverage gate changes.

Owning contract: `docs/features/frontend-interview-practice.md#supplementary-react-state-lesson`.

## 2026-09-28 — Playground Connection Recovery

- Start a single preview when a solution is revealed; the console observes the same runtime instead of executing a hidden copy.
- Show startup and connection status. Retry preserves edits and opens a fresh connection; Reset restores and executes the authored files.
- Add component coverage and Chromium/WebKit regressions for automatic startup, editing, console output, Reset, and blocked-runtime recovery. Exclude generated nested Playwright reports from lint while retaining failure evidence. Coverage thresholds and exclusions are unchanged.

Owning contract: `docs/features/react-typescript-playground.md`. A hosted-runtime connection is still required.

## 2026-09-27 — Frontend Interview Practice and Content Audit

- Added seven anonymous guided challenges, 21 React/TypeScript projects, 21 Python companions, 56 quiz questions, and 42 review cards.
- Connected lesson → recipe → quiz → next lesson/final feed on web and native. Added explicit snippet languages and lesson links.
- Added index v11 contracts, exact authored-code verification, a required Python CI gate, component/browser/native coverage, and a Maestro journey. Coverage thresholds/exclusions are unchanged.
- Corrected existing interview API omissions, algorithm/complexity mismatches, Unicode/arithmetic boundaries, and unsupported acceptance guarantees. See the audit table in the interview catalog contract.
- Native release validation remains open: local Mobile Doctor flags existing Expo patch mismatches; the new installed-device flow has not been run locally.

Owning contract: `docs/features/frontend-interview-practice.md`.

## 2026-09-30 — Manual LinkedIn Drafts

- Added admin Create flows on web/native that save manual drafts and queue analysis together.
- Added selection-based Unicode bold/italic, bullets and plain text to creation and review editors.
- Enforced analysis/adoption before manual-post approval, safe request retries and UTF-16 limits on new revisions; text edits require reanalysis.
- Added database, shared, web/native and browser regressions without new runtime dependencies or coverage exclusions.

Owning contract: `docs/features/linkedin-editorial.md`.

## 2026-09-10 — Product Engineering Interview Preparation

- Added a company-neutral interview research guide, role-fit questions, and general technical references. Names, recruiting links, routes, tags, and metadata reveal no target employer.
- Added four lessons, a tested plain JavaScript preview drill, durable export architecture diagrams, eighteen scenario questions, a 75-minute guided mock, and twelve passive briefs.
- Reused existing local-first web/native study surfaces; no runtime dependencies, schema changes, or coverage threshold changes.

Owning contract: `docs/features/product-engineering-interview-preparation.md`.

## 2026-09-09 — RTK Query Interview Preparation

- Added seven source-linked RTK Query lessons, 42 scenario questions, and 21 passive briefs using existing study components.
- Added good/bad TypeScript examples, a generalized PR #12666 persistence case, versioned 2.6–2.12 APIs, and a timed mock interview.
- Added curriculum integration and mobile browser regression coverage; no runtime dependencies, schema changes, or coverage threshold changes.

Owning contract: `docs/features/rtk-query-interview-preparation.md`.

## 2026-09-05 — Adaptive UI Redesign

- Added persistent phone navigation and desktop/iPad sidebars around existing routes.
- Simplified catalog headings and home discovery; refreshed existing cards, buttons, inputs, readers, and native tokens.
- Added component, responsive browser, and native navigation regression coverage without lowering coverage gates.
- Kept feature logic and authored content unchanged. Installed native verification remains blocked by existing Expo/Xcode environment issues.

Owning contract: `docs/features/adaptive-ui.md`.

## 2026-08-08 — Japanese Review Rating Feedback

- Made Again, Hard, Good, and Easy visually distinct and kept the chosen rating visibly pressed with matching web/native accessibility state and a saved announcement.
- Limited each recall to one rating so repeated taps cannot silently advance mastery or attempt counts; `Practice again` explicitly opens a new attempt.
- Protected in-session ratings from delayed authenticated progress snapshots and added web, native, and browser regression coverage.

Owning contract: `docs/features/japanese-language-learning.md`.

## 2026-08-08 — CI Compatibility Maintenance

- Aligned Expo SDK 57, Expo Router, and their pinned Expo patch dependencies with the versions required by Expo Doctor.
- Made the protected-content pgTAP assertion portable across Supabase images that enforce the same no-read contract through table privileges or default-deny RLS.

Owning contract: `docs/features/automated-testing-and-release-regression.md`.

## 2026-08-07 — Harvard ML Systems Career Path

- Added a source-linked ML Systems Engineer path covering both Harvard CS249r books, all 34 labs, 20 TinyTorch modules, MLSys·im, optional hardware kits, and StaffML.
- Published prerequisite and Volume I Foundations companions through Data Engineering, with three guided labs and three scored career checkpoints across web and Expo.
- Advanced the local content index to schema version 9 with validated primary-source metadata, source nodes, generic career/language progression, planned-stage semantics, and aggregate per-skill questionnaire scores.
- Kept Harvard material authoritative and external: companions summarize and enrich, planned stages open upstream sources, and source metadata records verification, maturity, version, and a pinned repository audit commit.

Owning contracts: `docs/features/ml-systems-career-path.md` and `docs/features/learning-paths-and-practice.md`.

## 2026-08-05 — Automated Testing And Release Regression

- Added scope and per-file V8 coverage gates for core, web services/API/content scripts, web components, mobile libraries, and shared native UI, with HTML, LCOV, JSON, text-summary, and CI JUnit evidence.
- Expanded unit/integration coverage across content generation/sync, progress/Auth APIs, Supabase clients, catalogs, renderers, practice, interviews, Japanese, mobile adapters, offline failure handling, and shared screens.
- Added local Supabase configuration and transactional pgTAP coverage for migration replay, schema/index/constraint contracts, RLS isolation, preservation triggers, and published search behavior.
- Expanded Playwright to a full mobile-Chromium suite plus desktop-Chromium/mobile-WebKit smoke, with catalog/recovery and accessibility regression coverage and failure-only visual evidence.
- Added credential-free Android APK/iOS simulator E2E profiles, Maestro 2.8.0 flows, a `mobile-e2e` PR-label workflow, and parallel Android/iOS `v*` release jobs.
- Added five parallel PR gates, a 03:00 UTC nightly web/database workflow, and a `v*` release-candidate workflow. Branch protection remains an account-side follow-up after the check names have completed successfully once.
- Coverage thresholds are non-decreasing. Future exclusions or reductions require an explicit feature-doc and changelog justification.

Owning contract: `docs/features/automated-testing-and-release-regression.md`.

## 2026-08-04 — Japanese Foundations Pre-A1 To A1

Commit: `9e7834c` (`Build Japanese Pre-A1 to A1 roadmap`)

### Learning experience

- Reframed Japanese Foundations as an open JF/CEFR roadmap with Kana Explorer (`Pre-A1`), First Connections (`A1`), and Everyday Navigator (`A1`). Lessons, checkpoints, flashcards, dictionary profiles, handwriting, and resources remain directly accessible instead of being locked behind milestones.
- Added original First Connections and Everyday Navigator lessons, short beginner readers, and three original readiness checkpoints. JLPT/JFT-inspired formats are labeled as practice rather than official exam content.
- Added persistent Learn, Review, Dictionary, and Resources destinations on web and Expo.
- Added a trusted external-resource shelf for JF Standard, Irodori, Marugoto, Minato, Erin’s Challenge, MEXT guidance, JLPT/JFT material, and Tadoku. Public availability does not imply redistribution rights; current third-party entries are link-only.

### Language data

- Advanced the generated content index to schema version 8.
- Added proficiency, skill-strand, Can-do, stage, checkpoint, audio, and resource-rights contracts with reference and uniqueness validation.
- Preserved all 46 basic hiragana and all 46 basic katakana in deterministic gojūon order.
- Declared the exact 100-kanji target: the 80 Grade-1 educational kanji plus the 20 practical additions defined by the curriculum. Twenty-five profiles with authored strokes remain published; 75 are explicitly `planned` until original stroke paths and contextual exercises are ready.
- Added audio-manifest validation and `npm run content:audio`, which prepares browser URLs and static Expo `require` registries. The manifest remains empty until released native-speaker recordings are supplied.

### Review and progress

- Added deterministic six-box review scheduling with Again, Hard, Good, and Easy transitions and box 4+ mastery.
- Added immediate anonymous persistence on web and Expo, authenticated remote loading, deterministic local/remote merging, and bounded 20-row uploads.
- Added the RLS-protected `user_skill_progress` table without changing or deleting `user_progress_items`.
- Continued the privacy boundary: no individual answers, raw handwriting coordinates, recordings, or complete attempt histories are persisted.

### iPad and accessibility

- Changed Expo orientation from portrait-only to adaptive while retaining tablet support.
- Made native handwriting canvases responsive for phones, Split View, and portrait/landscape iPads, using the same responder path for finger, mouse, and Pencil-compatible pointer input.
- Added self-hosted Noto Sans JP, Japanese language semantics, larger learning typography, wrapping/reflow fixes, visible focus behavior, reduced-motion handling, and accessibility regression coverage.
- Expo Doctor passes all 20 checks. The local iPad native compile must be rerun after upgrading from Xcode 26.3 to Expo SDK 57’s supported Xcode baseline.

### Verification at delivery

- Content index generation and `content:check` passed.
- TypeScript, ESLint, the production Next.js build, 190 Vitest tests, and 10 native Jest tests passed.
- The Japanese Playwright regression, accessibility regression, and 15-test smoke run passed.
- Expo Doctor passed 20/20 checks.

Owning contracts: `docs/features/japanese-language-learning.md`, `docs/features/auth-and-progress.md`, `docs/features/learning-paths-and-practice.md`, and `docs/features/native-mobile-deployment.md`.

## 2026-08-03 — Beginner Alphabet Expansion

- Expanded Japanese Foundations around alphabet-first study, complete basic kana ordering, row-grouped writing drills, and always-available flashcards.
- Kept alphabet practice local-first and shared between the web and Expo experiences.

## 2026-07-11 — Romaji, IME, And Character Practice

- Added the beginner distinction between learner-facing romanization and Japanese IME keystrokes, including particle spellings such as `こんばんは`: learner romaji `konbanwa`, IME input `konbanha`.
- Added structured examples, vocabulary breakdowns, IME-aware Japanese search, character detail profiles, and reusable assisted/free handwriting practice.
- Preserved transient raw strokes while allowing coarse practice completion to use the existing progress system.

## 2026-09-29 — Private LinkedIn editorial workflow

Added admin web/native review, immutable Supabase revisions, approval-bound Buffer jobs, fixed refinement prompt and manual local worker contract. Seeded 100 unapproved private drafts; no drafts entered the public content index. Added pgTAP, shared/web/native tests, isolated editorial E2E and production artifact smoke. Existing coverage floors are preserved; CLI orchestration uses local subprocess integration coverage instead of unit instrumentation. See `features/linkedin-editorial.md` for onboarding and device-release gaps.

### LinkedIn worker switched to manual execution

Removed the recurring Codex automation at the user’s request. Web/native copy and operating instructions now explain that requests wait for an explicit manual run. Queue, approval, and publication behavior is unchanged.

- 2026-10-04: Native Learn/Browse share an offline local search runtime and concise retry feedback. Prepared-row/core-result parity, owned replies, bounded failures and bundle freshness are tested. The credential-free Android artifact passes the existing Learn/Browse journeys at normal and enlarged text; fresh installed iOS and complete accessibility acceptance remain open.
