# Product And Engineering Changelog

This changelog dates durable product and architecture changes and links to their authoritative feature contracts.

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
