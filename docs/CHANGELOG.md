# Product And Engineering Changelog

This changelog records durable, user-visible and architectural changes. Feature documents remain the authoritative contracts; this file explains when a group of related changes landed and points readers to the owning documentation.

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
